export type Persona = 'executive' | 'agronomist' | 'farmer_coop';

export type Language = 'en' | 'hi' | 'es' | 'sw';

export interface Zone {
  id: string;
  name: string;
  crop_type: string;
  crop_icon: string;
  area_ha: number;
  estimated_water_need_mean: number; // mu_i in kL (thousands of liters)
  estimated_water_need_std: number;  // sigma_i in kL
  crop_risk_weight: number;          // w_i (economic & food security vulnerability, 1.0 to 4.5)
  soil_type: string;
  telemetry_status: 'online' | 'intermittent' | 'offline';
  battery_pct: number;
  ndvi_current: number;
  ndvi_baseline: number;
  grid_position: { col: number; row: number };
  hidden_ground_truth_need: number;  // tau_i in kL: reserved solely for post-decision impact evaluation!
}

export interface Scenario {
  id: string;
  name: string;
  basin: string;
  description: string;
  totalWaterBudget: number; // W_total in kL
  sensorBudget: number;      // K (number of allowed observations)
  zones: Zone[];
}

export interface PolicyResult {
  policyId: 'demand_proportional' | 'uncertainty_weighted' | 'max_uncertainty_sensing' | 'voi_sensing';
  policyName: string;
  allocations: Record<string, number>; // zoneId -> allocated kL
  measuredZones: string[];             // zoneIds measured by sensor
  totalAllocated: number;
  budgetCompliancePct: number;        // always 100% (zero violation)
  loss: number;                       // Crop-stress loss proxy: sum(w_i * max(0, True_i - x_i)^2)
  jainFairness: number;               // Jain's Fairness Index in [0, 1]
  satisfactions: Record<string, number>; // zoneId -> min(1.0, x_i / True_i)
  stressByZone: Record<string, number>;  // zoneId -> quadratic deficit loss
}

export interface VoiCandidate {
  zoneId: string;
  zoneName: string;
  cropType: string;
  priorStd: number;
  priorMean: number;
  riskWeight: number;
  expectedLossReduction: number; // Value of Information score
  isTippingPoint: boolean;
  marginalSensitivity: number;   // Derivative of allocation w.r.t mean shift
  decisionImpactReason: string;
}

export interface SimulationOutput {
  demandProportional: PolicyResult;
  uncertaintyWeighted: PolicyResult;
  maxUncertaintySensing: PolicyResult;
  voiSensing: PolicyResult;
  candidateVois: VoiCandidate[];
  selectedVoiZoneId: string;
  selectedMaxVarZoneId: string;
  voiDeltaLoss: number;
  voiDeltaPct: number;
  timestamp: string;
}
