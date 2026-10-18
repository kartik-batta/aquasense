import { Zone, Scenario, PolicyResult, VoiCandidate, SimulationOutput } from '../types';

/**
 * Standard normal random variable using Box-Muller transform
 */
export function normalRandom(mean: number, std: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(10, mean + num * std);
}

/**
 * Normal PDF calculation for expected value integration
 */
function normalPdf(x: number, mean: number, std: number): number {
  if (std <= 0) return x === mean ? 1 : 0;
  const exp = -0.5 * Math.pow((x - mean) / std, 2);
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exp);
}

/**
 * Evaluates the ground truth impact of an allocation vector x against hidden true need tau
 * 1. Crop-stress loss proxy: sum( w_i * max(0, tau_i - x_i)^2 )
 * 2. Jain's Fairness Index: (sum(y_i))^2 / (N * sum(y_i^2)), where y_i = min(1.0, x_i / tau_i)
 */
export function evaluateImpact(
  zones: Zone[],
  allocations: Record<string, number>,
  totalBudget: number
): {
  loss: number;
  jainFairness: number;
  satisfactions: Record<string, number>;
  stressByZone: Record<string, number>;
  totalAllocated: number;
  budgetCompliancePct: number;
} {
  let totalAllocated = 0;
  let totalLoss = 0;
  const satisfactions: Record<string, number> = {};
  const stressByZone: Record<string, number> = {};
  const yValues: number[] = [];

  for (const zone of zones) {
    const x_i = allocations[zone.id] || 0;
    totalAllocated += x_i;
    const tau_i = Math.max(1.0, zone.hidden_ground_truth_need);

    const deficit = Math.max(0, tau_i - x_i);
    // Quadratic loss proxy weighted by crop vulnerability
    const zoneLoss = zone.crop_risk_weight * Math.pow(deficit, 2);
    totalLoss += zoneLoss;
    stressByZone[zone.id] = zoneLoss;

    const satisfaction = Math.min(1.0, x_i / tau_i);
    satisfactions[zone.id] = satisfaction;
    yValues.push(satisfaction);
  }

  // Jain's Fairness Index
  const sumY = yValues.reduce((acc, val) => acc + val, 0);
  const sumYsq = yValues.reduce((acc, val) => acc + Math.pow(val, 2), 0);
  const n = zones.length;
  const jain = sumYsq > 0 ? Math.pow(sumY, 2) / (n * sumYsq) : 1.0;

  // Budget compliance: strictly enforces zero overdraft
  const budgetCompliancePct = totalAllocated <= totalBudget + 0.001 ? 100.0 : 0.0;

  return {
    loss: Number(totalLoss.toFixed(2)),
    jainFairness: Number(Math.min(1.0, Math.max(0, jain)).toFixed(3)),
    satisfactions,
    stressByZone,
    totalAllocated: Number(totalAllocated.toFixed(1)),
    budgetCompliancePct,
  };
}

/**
 * Convex Resource Allocation Optimizer
 * Solves: min sum_i w_i * E[(tau_i - x_i)_+^2] s.t. sum x_i <= W_total, x_i >= 0
 * Uses water-filling / projected subgradient optimization with exact budget projection.
 */
export function solveOptimalAllocation(
  effectiveBeliefs: { id: string; mean: number; std: number; weight: number }[],
  totalBudget: number
): Record<string, number> {
  const allocations: Record<string, number> = {};
  const n = effectiveBeliefs.length;

  if (n === 0 || totalBudget <= 0) return allocations;

  // Target demand per zone incorporates mean plus risk-adjusted buffer based on remaining uncertainty
  const rawTargets = effectiveBeliefs.map(b => {
    // Risk-hedged target: mean + beta * std * (w_i / 2)
    const riskFactor = Math.min(1.2, 0.4 + (b.weight / 5));
    const target = Math.max(0, b.mean + (riskFactor * b.std));
    return { id: b.id, target, weight: b.weight };
  });

  const totalTarget = rawTargets.reduce((sum, item) => sum + item.target, 0);

  if (totalTarget <= totalBudget) {
    // Abundant budget scenario: give each unit their full target, allocate remainder proportionally
    const extra = totalBudget - totalTarget;
    rawTargets.forEach(t => {
      allocations[t.id] = Number((t.target + (extra * (t.weight / rawTargets.reduce((s, r) => s + r.weight, 0)))).toFixed(1));
    });
    return allocations;
  }

  // Scarcity scenario: iterative water-filling with quadratic penalty marginal utility
  // Marginal utility of water allocated to i: 2 * w_i * (target_i - x_i)
  // Optimal condition: w_i * (target_i - x_i) = lambda for active allocations
  let low = 0;
  let high = 1e6;
  const tolerance = 1e-4;

  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    let currentSum = 0;

    for (const item of rawTargets) {
      // x_i = max(0, target_i - (mid / (2 * item.weight)))
      const x_i = Math.max(0, item.target - (mid / (2 * item.weight)));
      currentSum += x_i;
    }

    if (currentSum > totalBudget) {
      low = mid;
    } else {
      high = mid;
    }

    if (Math.abs(high - low) < tolerance) break;
  }

  const optimalLambda = (low + high) / 2;
  let allocatedSum = 0;

  for (const item of rawTargets) {
    const x_i = Math.max(0, item.target - (optimalLambda / (2 * item.weight)));
    allocations[item.id] = Number(x_i.toFixed(1));
    allocatedSum += allocations[item.id];
  }

  // Exact budget preservation: distribute tiny rounding remainder to highest weight zone
  const diff = Number((totalBudget - allocatedSum).toFixed(1));
  if (diff !== 0 && effectiveBeliefs[0]) {
    const topZoneId = effectiveBeliefs.slice().sort((a, b) => b.weight - a.weight)[0].id;
    allocations[topZoneId] = Number(Math.max(0, allocations[topZoneId] + diff).toFixed(1));
  }

  return allocations;
}

/**
 * Policy 1: Demand-Proportional Allocation (Baseline - No sensing)
 * x_i = W_total * (mu_i / sum mu_j)
 */
export function runDemandProportional(scenario: Scenario): PolicyResult {
  const sumMean = scenario.zones.reduce((acc, z) => acc + z.estimated_water_need_mean, 0);
  const allocations: Record<string, number> = {};
  let totalAllocated = 0;

  for (const zone of scenario.zones) {
    const fraction = sumMean > 0 ? zone.estimated_water_need_mean / sumMean : 1 / scenario.zones.length;
    const x_i = Number((scenario.totalWaterBudget * fraction).toFixed(1));
    allocations[zone.id] = x_i;
    totalAllocated += x_i;
  }

  // Rounding adjustment to guarantee exact sum <= totalWaterBudget
  const diff = scenario.totalWaterBudget - totalAllocated;
  if (Math.abs(diff) > 0 && scenario.zones[0]) {
    allocations[scenario.zones[0].id] = Number((allocations[scenario.zones[0].id] + diff).toFixed(1));
  }

  const impact = evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget);

  return {
    policyId: 'demand_proportional',
    policyName: 'Demand-Proportional Allocation',
    allocations,
    measuredZones: [],
    ...impact,
  };
}

/**
 * Policy 2: Uncertainty-Weighted Allocation (Baseline - No sensing)
 * Allocates based on risk-hedged demand: score_i = w_i * (mu_i + 0.6 * sigma_i)
 */
export function runUncertaintyWeighted(scenario: Scenario): PolicyResult {
  const scores = scenario.zones.map(z => ({
    id: z.id,
    score: z.crop_risk_weight * (z.estimated_water_need_mean + 0.6 * z.estimated_water_need_std),
  }));

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const allocations: Record<string, number> = {};
  let totalAllocated = 0;

  for (const item of scores) {
    const frac = totalScore > 0 ? item.score / totalScore : 1 / scores.length;
    const x_i = Number((scenario.totalWaterBudget * frac).toFixed(1));
    allocations[item.id] = x_i;
    totalAllocated += x_i;
  }

  const diff = scenario.totalWaterBudget - totalAllocated;
  if (Math.abs(diff) > 0 && scenario.zones[0]) {
    allocations[scenario.zones[0].id] = Number((allocations[scenario.zones[0].id] + diff).toFixed(1));
  }

  const impact = evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget);

  return {
    policyId: 'uncertainty_weighted',
    policyName: 'Uncertainty-Weighted Allocation',
    allocations,
    measuredZones: [],
    ...impact,
  };
}

/**
 * Policy 3: Max-Uncertainty Sensing Heuristic
 * Greedily selects K zones with the largest standard deviation sigma_i.
 * Simulates high-precision sensor observation on those K zones (sigma drops by 90%),
 * then runs the optimal constrained water allocation.
 */
export function runMaxUncertaintySensing(scenario: Scenario): PolicyResult {
  const sortedByVar = [...scenario.zones].sort(
    (a, b) => b.estimated_water_need_std - a.estimated_water_need_std
  );
  const measuredZoneIds = sortedByVar.slice(0, scenario.sensorBudget).map(z => z.id);

  const updatedBeliefs = scenario.zones.map(z => {
    const isMeasured = measuredZoneIds.includes(z.id);
    if (isMeasured) {
      // Belief updated with sensor ground truth measurement
      return {
        id: z.id,
        mean: z.hidden_ground_truth_need,
        std: z.estimated_water_need_std * 0.1, // 90% variance reduction
        weight: z.crop_risk_weight,
      };
    }
    return {
      id: z.id,
      mean: z.estimated_water_need_mean,
      std: z.estimated_water_need_std,
      weight: z.crop_risk_weight,
    };
  });

  const allocations = solveOptimalAllocation(updatedBeliefs, scenario.totalWaterBudget);
  const impact = evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget);

  return {
    policyId: 'max_uncertainty_sensing',
    policyName: 'Max-Uncertainty Sensing (Greedy Heuristic)',
    allocations,
    measuredZones: measuredZoneIds,
    ...impact,
  };
}

/**
 * Policy 4: AquaSense Decision-Aware Value of Information (VOI) Engine
 * Mathematical Core:
 * Evaluates the downstream expected loss reduction for measuring candidate zones.
 * Selects the K measurements that maximize expected decision impact under constrained W_total.
 */
export function computeVoiCandidates(scenario: Scenario): VoiCandidate[] {
  // Baseline prior allocation without any sensor measurements
  const priorBeliefs = scenario.zones.map(z => ({
    id: z.id,
    mean: z.estimated_water_need_mean,
    std: z.estimated_water_need_std,
    weight: z.crop_risk_weight,
  }));
  const priorAlloc = solveOptimalAllocation(priorBeliefs, scenario.totalWaterBudget);

  // Compute prior expected loss (Monte Carlo approximation over prior distributions)
  const numSamples = 25;
  const candidates: VoiCandidate[] = [];

  for (const candidateZone of scenario.zones) {
    let expectedLossWithoutMeasurement = 0;
    let expectedLossWithMeasurement = 0;
    let allocationVarianceAcrossRealizations = 0;
    const testAllocations: number[] = [];

    // Monte Carlo simulation of candidate measurement outcomes drawn from prior N(mu_k, sigma_k^2)
    for (let s = 0; s < numSamples; s++) {
      // Simulated realization of candidate zone's true need
      const simulatedRealization = normalRandom(
        candidateZone.estimated_water_need_mean,
        candidateZone.estimated_water_need_std
      );

      // What would the optimal allocation be if we measured this realization?
      const hypotheticalBeliefs = priorBeliefs.map(b => {
        if (b.id === candidateZone.id) {
          return {
            ...b,
            mean: simulatedRealization,
            std: candidateZone.estimated_water_need_std * 0.1,
          };
        }
        return b;
      });

      const updatedAlloc = solveOptimalAllocation(hypotheticalBeliefs, scenario.totalWaterBudget);
      testAllocations.push(updatedAlloc[candidateZone.id]);

      // Downstream loss under updated decision vs prior un-updated decision
      // Quadratic loss on the realized sample
      const lossPrior = candidateZone.crop_risk_weight * Math.pow(Math.max(0, simulatedRealization - priorAlloc[candidateZone.id]), 2);
      const lossUpdated = candidateZone.crop_risk_weight * Math.pow(Math.max(0, simulatedRealization - updatedAlloc[candidateZone.id]), 2);

      expectedLossWithoutMeasurement += lossPrior;
      expectedLossWithMeasurement += lossUpdated;
    }

    const meanAlloc = testAllocations.reduce((a, b) => a + b, 0) / numSamples;
    const allocVariance = testAllocations.reduce((a, b) => a + Math.pow(b - meanAlloc, 2), 0) / numSamples;
    const expectedLossRed = Math.max(0, (expectedLossWithoutMeasurement - expectedLossWithMeasurement) / numSamples);

    // Marginal sensitivity: does the allocation actually change when belief updates?
    const marginalSens = Math.sqrt(allocVariance) / (candidateZone.estimated_water_need_std || 1);

    // Decision-Aware rationale
    let reason = '';
    const isTipping = marginalSens > 0.45 && candidateZone.crop_risk_weight >= 2.0;

    if (marginalSens < 0.2) {
      reason = 'Inelastic Allocation Boundary: Water quota remains fixed regardless of realization; near-zero decision value.';
    } else if (isTipping) {
      reason = 'Critical Allocation Threshold: High marginal elasticity. Measuring here fundamentally shifts water across the basin.';
    } else {
      reason = 'Moderate Decision Impact: Measuring shifts allocation, producing moderate quadratic risk reduction.';
    }

    candidates.push({
      zoneId: candidateZone.id,
      zoneName: candidateZone.name,
      cropType: candidateZone.crop_type,
      priorStd: candidateZone.estimated_water_need_std,
      priorMean: candidateZone.estimated_water_need_mean,
      riskWeight: candidateZone.crop_risk_weight,
      expectedLossReduction: Number(expectedLossRed.toFixed(2)),
      isTippingPoint: isTipping,
      marginalSensitivity: Number(marginalSens.toFixed(3)),
      decisionImpactReason: reason,
    });
  }

  // Sort descending by expected loss reduction (VOI)
  candidates.sort((a, b) => b.expectedLossReduction - a.expectedLossReduction);
  return candidates;
}

/**
 * Runs the complete AquaSense VOI sensing policy and gathers comparison metrics
 */
export function runAquaSenseVoiSensing(
  scenario: Scenario,
  candidateVois: VoiCandidate[]
): PolicyResult {
  const topCandidateIds = candidateVois.slice(0, scenario.sensorBudget).map(c => c.zoneId);

  const updatedBeliefs = scenario.zones.map(z => {
    const isMeasured = topCandidateIds.includes(z.id);
    if (isMeasured) {
      return {
        id: z.id,
        mean: z.hidden_ground_truth_need,
        std: z.estimated_water_need_std * 0.1,
        weight: z.crop_risk_weight,
      };
    }
    return {
      id: z.id,
      mean: z.estimated_water_need_mean,
      std: z.estimated_water_need_std,
      weight: z.crop_risk_weight,
    };
  });

  const allocations = solveOptimalAllocation(updatedBeliefs, scenario.totalWaterBudget);
  const impact = evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget);

  return {
    policyId: 'voi_sensing',
    policyName: 'AquaSense Decision-Aware VOI Sensing',
    allocations,
    measuredZones: topCandidateIds,
    ...impact,
  };
}

/**
 * Complete Simulation Engine Pipeline:
 * Executes all 4 policies simultaneously on the exact same scenario and ground truth
 */
export function runCompleteSimulation(scenario: Scenario): SimulationOutput {
  const demandProportional = runDemandProportional(scenario);
  const uncertaintyWeighted = runUncertaintyWeighted(scenario);
  const maxUncertaintySensing = runMaxUncertaintySensing(scenario);

  const candidateVois = computeVoiCandidates(scenario);
  const voiSensing = runAquaSenseVoiSensing(scenario, candidateVois);

  const sortedByVar = [...scenario.zones].sort(
    (a, b) => b.estimated_water_need_std - a.estimated_water_need_std
  );
  const selectedMaxVarZoneId = sortedByVar[0]?.id || scenario.zones[0]?.id || '';
  const selectedVoiZoneId = candidateVois[0]?.zoneId || scenario.zones[0]?.id || '';

  const voiDeltaLoss = Number((maxUncertaintySensing.loss - voiSensing.loss).toFixed(2));
  const voiDeltaPct = maxUncertaintySensing.loss > 0 
    ? Number(((voiDeltaLoss / maxUncertaintySensing.loss) * 100).toFixed(1))
    : 0;

  return {
    demandProportional,
    uncertaintyWeighted,
    maxUncertaintySensing,
    voiSensing,
    candidateVois,
    selectedVoiZoneId,
    selectedMaxVarZoneId,
    voiDeltaLoss,
    voiDeltaPct,
    timestamp: new Date().toISOString(),
  };
}
