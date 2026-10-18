import { PRESET_SCENARIOS } from '../src/utils/scenarios';
import { runCompleteSimulation } from '../src/utils/simulationEngine';

/** Builds a request body exactly as the browser's CopilotDrawer sends it. */
export function buildCopilotBody(scenarioIndex = 0, overrides: Record<string, unknown> = {}) {
  const scenario = PRESET_SCENARIOS[scenarioIndex];
  const sim = runCompleteSimulation(scenario);
  return {
    prompt: 'Why was this zone measured?',
    persona: 'executive',
    language: 'en',
    currentScenario: scenario,
    simulationResults: {
      voiSensing: sim.voiSensing,
      maxUncertaintySensing: sim.maxUncertaintySensing,
      demandProportional: sim.demandProportional,
      uncertaintyWeighted: sim.uncertaintyWeighted,
    },
    candidateVoi: sim.candidateVois,
    ...overrides,
  };
}
