import { SecurityProvider } from '../types/providers';

const OKTA_RISK_SCHEMA = 'https://schemas.okta.com/secevent/okta/event-type/user-risk-change';

function buildRiskPayload(
  email: string,
  timestamp: number,
  entity: string,
  reasonText: string,
  currentLevel: 'medium' | 'high' = 'high',
  previousLevel: 'low' | 'medium' = 'low'
): Record<string, unknown> {
  return {
    [OKTA_RISK_SCHEMA]: {
      event_timestamp: timestamp,
      current_level: currentLevel,
      previous_level: previousLevel,
      initiating_entity: entity,
      reason_admin: { en: reasonText },
      subject: {
        user: {
          format: 'email',
          email: email,
        },
      },
    },
  };
}

export const PROVIDERS: Record<string, SecurityProvider> = {
  crowdstrike: {
    id: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    defaultIssuer: 'https://falcon.crowdstrike.com',
    description: 'Endpoint detection and response platform',
    color: 'bg-red-600',
    events: [
      {
        id: 'malware-detected',
        label: 'Malware Detected',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Malware identified on user endpoint',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Malware detected on user endpoint by CrowdStrike Falcon'),
      },
      {
        id: 'suspicious-process',
        label: 'Suspicious Process',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Suspicious process execution detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Suspicious process execution detected on endpoint', 'medium'),
      },
      {
        id: 'ioc-match',
        label: 'IOC Match',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Indicator of compromise matched threat intelligence',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Indicator of compromise matched known threat intelligence'),
      },
      {
        id: 'credential-theft',
        label: 'Credential Theft Attempt',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Credential theft attempt detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Credential theft attempt detected by CrowdStrike Falcon'),
      },
    ],
  },
  zscaler: {
    id: 'zscaler',
    name: 'Zscaler ZIA',
    defaultIssuer: 'https://zsapi.zscaler.net',
    description: 'Cloud security and web gateway',
    color: 'bg-blue-600',
    events: [
      {
        id: 'dlp-violation',
        label: 'DLP Policy Violation',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Data loss prevention policy violation detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'DLP policy violation: sensitive data exfiltration attempted'),
      },
      {
        id: 'malware-blocked',
        label: 'Malware Download Blocked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Attempted malware download was blocked',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Malware download attempt blocked by Zscaler ZIA', 'medium'),
      },
      {
        id: 'suspicious-cloud',
        label: 'Suspicious Cloud Activity',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Suspicious cloud application activity detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Suspicious cloud application activity detected', 'medium'),
      },
    ],
  },
  paloalto: {
    id: 'paloalto',
    name: 'Palo Alto Cortex XDR',
    defaultIssuer: 'https://api.xdr.paloaltonetworks.com',
    description: 'Extended detection and response platform',
    color: 'bg-orange-600',
    events: [
      {
        id: 'c2-communication',
        label: 'C2 Communication Detected',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Command and control communication detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Command and control (C2) communication detected'),
      },
      {
        id: 'lateral-movement',
        label: 'Lateral Movement',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Lateral movement behavior detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Lateral movement detected in network by Cortex XDR'),
      },
      {
        id: 'ransomware-behavior',
        label: 'Ransomware Behavior',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Ransomware-like behavior detected',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'Ransomware behavior detected: mass file encryption attempt'),
      },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    defaultIssuer: 'https://my-local-transmitter.com',
    description: 'Generic SSF events for testing',
    color: 'bg-gray-600',
    events: [
      {
        id: 'generic-risk',
        label: 'Generic Risk Event',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Generic high-risk event for testing ITP',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'External provider reported account compromise'),
      },
      {
        id: 'session-revoked',
        label: 'Session Revoked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'User session terminated due to security concern',
        buildPayload: (email, timestamp, entity) =>
          buildRiskPayload(email, timestamp, entity, 'User session revoked due to security policy', 'medium'),
      },
    ],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);
