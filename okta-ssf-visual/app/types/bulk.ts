import { RiskLevel } from './providers';

export interface QueuedEvent {
  id: string;
  providerId: string;
  providerName: string;
  eventId: string;
  eventLabel: string;
  riskLevel: RiskLevel;
  status: 'pending' | 'sending' | 'success' | 'error';
  error?: string;
}

export interface BulkSendResult {
  total: number;
  success: number;
  failed: number;
}
