import { Zone, Scenario, PolicyResult, VoiCandidate, SimulationOutput } from '../types';

/** Sensor observation shrinks a zone's belief std to this fraction (90% reduction). */
const SENSOR_STD_RETENTION = 0.1;

/** Monte Carlo draws per VOI candidate. Shared across candidates (common random numbers). */
export const VOI_SAMPLES = 400;

/** Lower bound on any sampled water need, in kL. */
const MIN_SAMPLED_NEED = 10;

type Rng = () => number;

interface Belief {
  id: string;
  mean: number;
  std: number;
  weight: number;
}

/**
 * Mulberry32: small, fast, seedable PRNG returning floats in [0, 1).
 */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a hash of the decision-relevant scenario inputs, so identical scenarios
 * always produce identical simulation results.
 */
export function scenarioSeed(scenario: Scenario): number {
  const key = [
    scenario.id,
    scenario.totalWaterBudget,
    scenario.sensorBudget,
    ...scenario.zones.map(
      z => `${z.id}:${z.estimated_water_need_mean}:${z.estimated_water_need_std}:${z.crop_risk_weight}`
    ),
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Standard normal variate via the Box-Muller transform
 */
function standardNormal(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Normal random variable N(mean, std^2), floored at MIN_SAMPLED_NEED
 */
export function normalRandom(mean: number, std: number, rng: Rng = Math.random): number {
  return Math.max(MIN_SAMPLED_NEED, mean + standardNormal(rng) * std);
}

/**
 * Crop-stress loss proxy of an allocation against a vector of realized needs:
 * sum( w_i * max(0, need_i - x_i)^2 )
 */
function systemLoss(zones: Zone[], allocations: Record<string, number>, needs: number[]): number {
  let loss = 0;
  zones.forEach((zone, j) => {
    const deficit = Math.max(0, needs[j] - (allocations[zone.id] || 0));
    loss += zone.crop_risk_weight * deficit * deficit;
  });
  return loss;
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
 * Solves: min sum_i w_i * (target_i - x_i)^2 s.t. sum x_i <= W_total, x_i >= 0
 * Uses water-filling (bisection on the Lagrange multiplier) with exact budget projection.
 */
export function solveOptimalAllocation(
  effectiveBeliefs: Belief[],
  totalBudget: number
): Record<string, number> {
  const allocations: Record<string, number> = {};

  if (effectiveBeliefs.length === 0 || totalBudget <= 0) return allocations;

  // Target demand per zone incorporates mean plus risk-adjusted buffer based on remaining uncertainty
  const rawTargets = effectiveBeliefs.map(b => {
    const riskFactor = Math.min(1.2, 0.4 + (b.weight / 5));
    const target = Math.max(0, b.mean + (riskFactor * b.std));
    return { id: b.id, target, weight: b.weight };
  });

  const totalTarget = rawTargets.reduce((sum, item) => sum + item.target, 0);

  if (totalTarget <= totalBudget) {
    // Abundant budget: give each unit its full target, distribute the remainder by risk weight
    const extra = totalBudget - totalTarget;
    const totalWeight = rawTargets.reduce((sum, item) => sum + item.weight, 0);
    rawTargets.forEach(t => {
      allocations[t.id] = Number((t.target + extra * (t.weight / totalWeight)).toFixed(1));
    });
    return allocations;
  }

  // Scarcity: KKT condition 2 * w_i * (target_i - x_i) = lambda for every active zone
  const allocationAt = (lambda: number, item: (typeof rawTargets)[number]) =>
    Math.max(0, item.target - lambda / (2 * item.weight));

  let low = 0;
  let high = 1e6;
  const tolerance = 1e-4;

  for (let iter = 0; iter < 60 && high - low >= tolerance; iter++) {
    const mid = (low + high) / 2;
    const currentSum = rawTargets.reduce((sum, item) => sum + allocationAt(mid, item), 0);
    if (currentSum > totalBudget) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const optimalLambda = (low + high) / 2;
  let allocatedSum = 0;

  for (const item of rawTargets) {
    allocations[item.id] = Number(allocationAt(optimalLambda, item).toFixed(1));
    allocatedSum += allocations[item.id];
  }

  // Exact budget preservation: assign the rounding remainder to the highest-weight zone
  const diff = Number((totalBudget - allocatedSum).toFixed(1));
  if (diff !== 0) {
    const topZoneId = effectiveBeliefs.reduce((top, b) => (b.weight > top.weight ? b : top)).id;
    allocations[topZoneId] = Number(Math.max(0, allocations[topZoneId] + diff).toFixed(1));
  }

  return allocations;
}

/**
 * Splits the budget proportionally to per-zone scores; any rounding remainder goes to the first zone.
 */
function allocateProportionally(
  scenario: Scenario,
  scoreOf: (zone: Zone) => number
): Record<string, number> {
  const scores = scenario.zones.map(scoreOf);
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const allocations: Record<string, number> = {};
  let totalAllocated = 0;

  scenario.zones.forEach((zone, i) => {
    const fraction = totalScore > 0 ? scores[i] / totalScore : 1 / scenario.zones.length;
    allocations[zone.id] = Number((scenario.totalWaterBudget * fraction).toFixed(1));
    totalAllocated += allocations[zone.id];
  });

  const diff = scenario.totalWaterBudget - totalAllocated;
  const firstId = scenario.zones[0]?.id;
  if (diff !== 0 && firstId) {
    allocations[firstId] = Number((allocations[firstId] + diff).toFixed(1));
  }

  return allocations;
}

/**
 * Prior beliefs for every zone, with measured zones collapsed onto an observed need value.
 */
function beliefsAfterMeasurement(
  zones: Zone[],
  observed: Record<string, number>
): Belief[] {
  return zones.map(z => {
    const isMeasured = z.id in observed;
    return {
      id: z.id,
      mean: isMeasured ? observed[z.id] : z.estimated_water_need_mean,
      std: isMeasured ? z.estimated_water_need_std * SENSOR_STD_RETENTION : z.estimated_water_need_std,
      weight: z.crop_risk_weight,
    };
  });
}

/**
 * Measures the given zones (sensor reveals their ground truth), re-optimizes, and scores the result.
 */
function runSensingPolicy(
  scenario: Scenario,
  measuredZoneIds: string[],
  policyId: PolicyResult['policyId'],
  policyName: string
): PolicyResult {
  const observed: Record<string, number> = {};
  for (const z of scenario.zones) {
    if (measuredZoneIds.includes(z.id)) observed[z.id] = z.hidden_ground_truth_need;
  }

  const allocations = solveOptimalAllocation(
    beliefsAfterMeasurement(scenario.zones, observed),
    scenario.totalWaterBudget
  );
  const impact = evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget);

  return { policyId, policyName, allocations, measuredZones: measuredZoneIds, ...impact };
}

function zonesByDescendingStd(zones: Zone[]): Zone[] {
  return [...zones].sort((a, b) => b.estimated_water_need_std - a.estimated_water_need_std);
}

/**
 * Policy 1: Demand-Proportional Allocation (Baseline - No sensing)
 * x_i = W_total * (mu_i / sum mu_j)
 */
export function runDemandProportional(scenario: Scenario): PolicyResult {
  const allocations = allocateProportionally(scenario, z => z.estimated_water_need_mean);
  return {
    policyId: 'demand_proportional',
    policyName: 'Demand-Proportional Allocation',
    allocations,
    measuredZones: [],
    ...evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget),
  };
}

/**
 * Policy 2: Uncertainty-Weighted Allocation (Baseline - No sensing)
 * Allocates based on risk-hedged demand: score_i = w_i * (mu_i + 0.6 * sigma_i)
 */
export function runUncertaintyWeighted(scenario: Scenario): PolicyResult {
  const allocations = allocateProportionally(
    scenario,
    z => z.crop_risk_weight * (z.estimated_water_need_mean + 0.6 * z.estimated_water_need_std)
  );
  return {
    policyId: 'uncertainty_weighted',
    policyName: 'Uncertainty-Weighted Allocation',
    allocations,
    measuredZones: [],
    ...evaluateImpact(scenario.zones, allocations, scenario.totalWaterBudget),
  };
}

/**
 * Policy 3: Max-Uncertainty Sensing Heuristic
 * Greedily measures the K zones with the largest standard deviation sigma_i,
 * then runs the optimal constrained water allocation.
 */
export function runMaxUncertaintySensing(scenario: Scenario): PolicyResult {
  const measuredZoneIds = zonesByDescendingStd(scenario.zones)
    .slice(0, scenario.sensorBudget)
    .map(z => z.id);
  return runSensingPolicy(
    scenario,
    measuredZoneIds,
    'max_uncertainty_sensing',
    'Max-Uncertainty Sensing (Greedy Heuristic)'
  );
}

/**
 * Policy 4: AquaSense Decision-Aware Value of Information (VOI) Engine
 *
 * Preposterior analysis: for each candidate zone k, VOI_k is the expected reduction in
 * basin-wide crop-stress loss from re-optimizing the allocation after observing zone k:
 *   VOI_k = E_tau[ L(x_prior, tau) - L(x*(tau_k), tau) ]
 * where tau ~ prior over ALL zones, so water shifted to or from other zones is accounted for.
 * Uses only prior beliefs; the hidden ground truth is never consulted when ranking.
 */
export function computeVoiCandidates(scenario: Scenario): VoiCandidate[] {
  const { zones, totalWaterBudget } = scenario;
  const rng = createSeededRng(scenarioSeed(scenario));

  const priorAlloc = solveOptimalAllocation(beliefsAfterMeasurement(zones, {}), totalWaterBudget);

  // Common random numbers: every candidate is evaluated on the same sampled worlds,
  // so ranking differences reflect decision value rather than sampling noise.
  const sampledNeeds = Array.from({ length: VOI_SAMPLES }, () =>
    zones.map(z => normalRandom(z.estimated_water_need_mean, z.estimated_water_need_std, rng))
  );
  const priorLosses = sampledNeeds.map(needs => systemLoss(zones, priorAlloc, needs));

  const candidates: VoiCandidate[] = zones.map((candidateZone, k) => {
    let totalLossReduction = 0;
    const candidateAllocations: number[] = [];

    sampledNeeds.forEach((needs, s) => {
      const updatedAlloc = solveOptimalAllocation(
        beliefsAfterMeasurement(zones, { [candidateZone.id]: needs[k] }),
        totalWaterBudget
      );
      candidateAllocations.push(updatedAlloc[candidateZone.id]);
      totalLossReduction += priorLosses[s] - systemLoss(zones, updatedAlloc, needs);
    });

    const meanAlloc = candidateAllocations.reduce((a, b) => a + b, 0) / VOI_SAMPLES;
    const allocVariance =
      candidateAllocations.reduce((a, b) => a + Math.pow(b - meanAlloc, 2), 0) / VOI_SAMPLES;
    const expectedLossRed = Math.max(0, totalLossReduction / VOI_SAMPLES);

    // Marginal sensitivity: does the allocation actually change when belief updates?
    const marginalSens = Math.sqrt(allocVariance) / (candidateZone.estimated_water_need_std || 1);
    const isTipping = marginalSens > 0.45 && candidateZone.crop_risk_weight >= 2.0;

    let reason: string;
    if (marginalSens < 0.2) {
      reason = 'Inelastic Allocation Boundary: Water quota remains fixed regardless of realization; near-zero decision value.';
    } else if (isTipping) {
      reason = 'Critical Allocation Threshold: High marginal elasticity. Measuring here fundamentally shifts water across the basin.';
    } else {
      reason = 'Moderate Decision Impact: Measuring shifts allocation, producing moderate quadratic risk reduction.';
    }

    return {
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
    };
  });

  // Sort descending by expected loss reduction (VOI)
  candidates.sort((a, b) => b.expectedLossReduction - a.expectedLossReduction);
  return candidates;
}

/**
 * How much a zone's own optimal allocation moves if a sensor reports its need at
 * mean + sigmaMultiple * std (relative to the unmeasured prior allocation), in kL.
 */
export function allocationShift(scenario: Scenario, zoneId: string, sigmaMultiple: number): number {
  const zone = scenario.zones.find(z => z.id === zoneId);
  if (!zone) return 0;
  const prior = solveOptimalAllocation(beliefsAfterMeasurement(scenario.zones, {}), scenario.totalWaterBudget);
  const observedNeed = Math.max(
    MIN_SAMPLED_NEED,
    zone.estimated_water_need_mean + sigmaMultiple * zone.estimated_water_need_std
  );
  const updated = solveOptimalAllocation(
    beliefsAfterMeasurement(scenario.zones, { [zoneId]: observedNeed }),
    scenario.totalWaterBudget
  );
  return Number(((updated[zoneId] ?? 0) - (prior[zoneId] ?? 0)).toFixed(1));
}

/**
 * Runs the complete AquaSense VOI sensing policy on the top-K VOI candidates
 */
export function runAquaSenseVoiSensing(
  scenario: Scenario,
  candidateVois: VoiCandidate[]
): PolicyResult {
  const topCandidateIds = candidateVois.slice(0, scenario.sensorBudget).map(c => c.zoneId);
  return runSensingPolicy(
    scenario,
    topCandidateIds,
    'voi_sensing',
    'AquaSense Decision-Aware VOI Sensing'
  );
}

/**
 * Complete Simulation Engine Pipeline:
 * Executes all 4 policies on the exact same scenario and ground truth.
 * Deterministic: identical scenarios always produce identical results.
 */
export function runCompleteSimulation(scenario: Scenario): SimulationOutput {
  const demandProportional = runDemandProportional(scenario);
  const uncertaintyWeighted = runUncertaintyWeighted(scenario);
  const maxUncertaintySensing = runMaxUncertaintySensing(scenario);

  const candidateVois = computeVoiCandidates(scenario);
  const voiSensing = runAquaSenseVoiSensing(scenario, candidateVois);

  const fallbackZoneId = scenario.zones[0]?.id || '';
  const selectedMaxVarZoneId = zonesByDescendingStd(scenario.zones)[0]?.id || fallbackZoneId;
  const selectedVoiZoneId = candidateVois[0]?.zoneId || fallbackZoneId;

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
