import { RiskLevel } from './providers';

export interface ScenarioStep {
  providerId: string;
  eventId: string;
  riskLevel: RiskLevel;
  delayAfterMs: number; // delay after this step (0 for last step)
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
}

export interface ScenarioExecutionState {
  scenarioId: string;
  currentStep: number;
  stepStatuses: ('pending' | 'sending' | 'success' | 'error')[];
  running: boolean;
}
