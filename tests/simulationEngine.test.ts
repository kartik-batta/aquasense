import { describe, it, expect } from 'vitest';
import { PRESET_SCENARIOS } from '../src/utils/scenarios';
import {
  allocationShift,
  computeVoiCandidates,
  createSeededRng,
  evaluateImpact,
  runCompleteSimulation,
  runDemandProportional,
  runMaxUncertaintySensing,
  runUncertaintyWeighted,
  scenarioSeed,
  solveOptimalAllocation,
} from '../src/utils/simulationEngine';
import type { Scenario, Zone } from '../src/types';

const sum = (rec: Record<string, number>) => Object.values(rec).reduce((a, b) => a + b, 0);

function zone(id: string, overrides: Partial<Zone> = {}): Zone {
  return {
    id,
    name: `Zone ${id}`,
    crop_type: 'Test',
    crop_icon: '🌱',
    area_ha: 100,
    estimated_water_need_mean: 500,
    estimated_water_need_std: 50,
    crop_risk_weight: 2,
    soil_type: 'Loam',
    telemetry_status: 'online',
    battery_pct: 90,
    ndvi_current: 0.6,
    ndvi_baseline: 0.65,
    grid_position: { col: 0, row: 0 },
    hidden_ground_truth_need: 500,
    ...overrides,
  };
}

describe('createSeededRng', () => {
  it('is reproducible for a given seed and stays in [0, 1)', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(createSeededRng(1)()).not.toBe(createSeededRng(2)());
  });
});

describe('scenarioSeed', () => {
  it('changes when a decision-relevant input changes', () => {
    const base = PRESET_SCENARIOS[0];
    expect(scenarioSeed(base)).toBe(scenarioSeed({ ...base }));
    expect(scenarioSeed(base)).not.toBe(scenarioSeed({ ...base, totalWaterBudget: base.totalWaterBudget + 1 }));
  });
});

describe('evaluateImpact', () => {
  const zones = [zone('a', { hidden_ground_truth_need: 100, crop_risk_weight: 2 }), zone('b', { hidden_ground_truth_need: 200, crop_risk_weight: 1 })];

  it('computes weighted quadratic deficit loss', () => {
    const impact = evaluateImpact(zones, { a: 90, b: 200 }, 300);
    expect(impact.loss).toBe(2 * 10 * 10);
    expect(impact.stressByZone).toEqual({ a: 200, b: 0 });
  });

  it('gives Jain fairness of 1 when every zone is equally satisfied', () => {
    expect(evaluateImpact(zones, { a: 50, b: 100 }, 300).jainFairness).toBe(1);
  });

  it('flags overdraft as non-compliant', () => {
    expect(evaluateImpact(zones, { a: 100, b: 200 }, 300).budgetCompliancePct).toBe(100);
    expect(evaluateImpact(zones, { a: 150, b: 200 }, 300).budgetCompliancePct).toBe(0);
  });
});

describe('solveOptimalAllocation', () => {
  const beliefs = [
    { id: 'a', mean: 500, std: 50, weight: 1 },
    { id: 'b', mean: 500, std: 50, weight: 4 },
  ];

  it('never exceeds the budget and never allocates negative water under scarcity', () => {
    const alloc = solveOptimalAllocation(beliefs, 600);
    expect(sum(alloc)).toBeCloseTo(600, 1);
    Object.values(alloc).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
  });

  it('favours higher-risk zones when water is scarce', () => {
    const alloc = solveOptimalAllocation(beliefs, 600);
    expect(alloc.b).toBeGreaterThan(alloc.a);
  });

  it('distributes the full budget when water is abundant', () => {
    expect(sum(solveOptimalAllocation(beliefs, 5000))).toBeCloseTo(5000, 0);
  });

  it('handles empty input and zero budget', () => {
    expect(solveOptimalAllocation([], 100)).toEqual({});
    expect(solveOptimalAllocation(beliefs, 0)).toEqual({});
  });
});

describe('baseline policies', () => {
  const scenario = PRESET_SCENARIOS[0];

  it.each([runDemandProportional, runUncertaintyWeighted, runMaxUncertaintySensing])(
    '%o allocates exactly the water budget',
    policy => {
      const result = policy(scenario);
      expect(sum(result.allocations)).toBeCloseTo(scenario.totalWaterBudget, 0);
      expect(result.budgetCompliancePct).toBe(100);
    }
  );

  it('max-uncertainty measures the K highest-σ zones', () => {
    const result = runMaxUncertaintySensing(scenario);
    const topStd = [...scenario.zones]
      .sort((a, b) => b.estimated_water_need_std - a.estimated_water_need_std)
      .slice(0, scenario.sensorBudget)
      .map(z => z.id);
    expect(result.measuredZones).toEqual(topStd);
  });
});

describe('computeVoiCandidates', () => {
  it('returns one candidate per zone sorted by expected loss reduction', () => {
    const scenario = PRESET_SCENARIOS[1];
    const candidates = computeVoiCandidates(scenario);
    expect(candidates).toHaveLength(scenario.zones.length);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].expectedLossReduction).toBeGreaterThanOrEqual(candidates[i].expectedLossReduction);
    }
    candidates.forEach(c => expect(c.expectedLossReduction).toBeGreaterThanOrEqual(0));
  });

  it('never consults the hidden ground truth when ranking', () => {
    const scenario = PRESET_SCENARIOS[0];
    const perturbed: Scenario = {
      ...scenario,
      zones: scenario.zones.map(z => ({ ...z, hidden_ground_truth_need: z.hidden_ground_truth_need * 3 })),
    };
    expect(computeVoiCandidates(perturbed)).toEqual(computeVoiCandidates(scenario));
  });

  it('assigns zero value to a zone whose uncertainty is already resolved', () => {
    const scenario: Scenario = {
      id: 't',
      name: 't',
      basin: 't',
      description: 't',
      totalWaterBudget: 900,
      sensorBudget: 1,
      zones: [zone('certain', { estimated_water_need_std: 0 }), zone('uncertain', { estimated_water_need_std: 120 })],
    };
    const [best, worst] = computeVoiCandidates(scenario);
    expect(best.zoneId).toBe('uncertain');
    expect(worst.zoneId).toBe('certain');
    expect(worst.expectedLossReduction).toBe(0);
  });
});

describe('runCompleteSimulation', () => {
  it.each(PRESET_SCENARIOS.map(s => [s.id, s] as const))('is deterministic for %s', (_id, scenario) => {
    const a = runCompleteSimulation(scenario);
    const b = runCompleteSimulation(scenario);
    expect({ ...a, timestamp: '' }).toEqual({ ...b, timestamp: '' });
  });

  it.each(PRESET_SCENARIOS.map(s => [s.id, s] as const))(
    'respects the water and sensor budgets for %s',
    (_id, scenario) => {
      const sim = runCompleteSimulation(scenario);
      for (const policy of [sim.demandProportional, sim.uncertaintyWeighted, sim.maxUncertaintySensing, sim.voiSensing]) {
        expect(policy.totalAllocated).toBeLessThanOrEqual(scenario.totalWaterBudget + 0.001);
        expect(policy.measuredZones.length).toBeLessThanOrEqual(scenario.sensorBudget);
      }
    }
  );

  it('picks the tipping-point zone over the highest-variance zone in the Indus-Ganges preset', () => {
    const sim = runCompleteSimulation(PRESET_SCENARIOS[0]);
    expect(sim.selectedMaxVarZoneId).toBe('zone_a');
    expect(sim.selectedVoiZoneId).toBe('zone_d');
    expect(sim.voiSensing.loss).toBeLessThan(sim.maxUncertaintySensing.loss);
    expect(sim.voiDeltaPct).toBeGreaterThan(0);
  });

  it('VOI sensing never does worse than the no-sensing demand-proportional baseline on presets', () => {
    for (const scenario of PRESET_SCENARIOS) {
      const sim = runCompleteSimulation(scenario);
      expect(sim.voiSensing.loss).toBeLessThanOrEqual(sim.demandProportional.loss);
    }
  });
});

describe('allocationShift', () => {
  it('raises a zone allocation when its measured need is higher than expected', () => {
    const scenario = PRESET_SCENARIOS[0];
    expect(allocationShift(scenario, 'zone_d', 1)).toBeGreaterThan(allocationShift(scenario, 'zone_d', -1));
  });

  it('returns 0 for an unknown zone', () => {
    expect(allocationShift(PRESET_SCENARIOS[0], 'nope', 1)).toBe(0);
  });
});
