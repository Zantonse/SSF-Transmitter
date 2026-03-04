import { RiskLevel } from './providers';

export interface TransmissionRecord {
  id: string;
  timestamp: number;
  provider: string;
  providerId: string;
  eventType: string;
  eventId: string;
  userEmail: string;
  riskLevel: RiskLevel;
  status: 'success' | 'error';
  payload: Record<string, unknown>;
  response?: {
    status: number;
    error?: string;
    errorDescription?: string;
  };
}

export interface TransmissionHistoryState {
  records: TransmissionRecord[];
}
