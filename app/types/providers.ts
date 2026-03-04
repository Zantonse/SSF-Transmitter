export type RiskLevel = 'low' | 'medium' | 'high';
export type EventCategory = 'risk' | 'lifecycle';

export interface SecurityEvent {
  id: string;
  label: string;
  schema: string;
  severity: RiskLevel;
  description: string;
  category: EventCategory;
  buildPayload: (email: string, timestamp: number, riskLevel: RiskLevel) => Record<string, unknown>;
}

export interface SecurityProvider {
  id: string;
  name: string;
  defaultIssuer: string;
  description: string;
  color: string;
  events: SecurityEvent[];
}
