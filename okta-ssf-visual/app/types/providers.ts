export type RiskLevel = 'low' | 'medium' | 'high';

export interface SecurityEvent {
  id: string;
  label: string;
  schema: string;
  severity: RiskLevel;
  description: string;
  buildPayload: (email: string, timestamp: number, entity: string) => Record<string, unknown>;
}

export interface SecurityProvider {
  id: string;
  name: string;
  defaultIssuer: string;
  description: string;
  color: string;
  events: SecurityEvent[];
}
