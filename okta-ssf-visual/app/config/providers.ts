import { SecurityProvider } from '../types/providers';

const OKTA_RISK_SCHEMA = 'https://schemas.okta.com/secevent/okta/event-type/user-risk-change';

function buildRiskPayload(
  email: string,
  timestamp: number,
  reasonAdmin: string,
  reasonUser: string,
  currentLevel: 'medium' | 'high' = 'high',
  previousLevel: 'low' | 'medium' = 'low'
): Record<string, unknown> {
  return {
    [OKTA_RISK_SCHEMA]: {
      event_timestamp: timestamp,
      current_level: currentLevel,
      previous_level: previousLevel,
      initiating_entity: 'policy',
      reason_admin: { en: reasonAdmin },
      reason_user: { en: reasonUser },
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
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malware detected on user endpoint by CrowdStrike Falcon',
            'Security software detected a threat on your device'
          ),
      },
      {
        id: 'suspicious-process',
        label: 'Suspicious Process',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Suspicious process execution detected',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Suspicious process execution detected on endpoint',
            'Unusual activity was detected on your device',
            'medium'
          ),
      },
      {
        id: 'ioc-match',
        label: 'IOC Match',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Indicator of compromise matched threat intelligence',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Indicator of compromise matched known threat intelligence',
            'A security threat was identified on your device'
          ),
      },
      {
        id: 'credential-theft',
        label: 'Credential Theft Attempt',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Credential theft attempt detected',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Credential theft attempt detected by CrowdStrike Falcon',
            'An attempt to steal your credentials was blocked'
          ),
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
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'DLP policy violation: sensitive data exfiltration attempted',
            'A data security policy was violated'
          ),
      },
      {
        id: 'malware-blocked',
        label: 'Malware Download Blocked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Attempted malware download was blocked',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malware download attempt blocked by Zscaler ZIA',
            'A potentially harmful download was blocked',
            'medium'
          ),
      },
      {
        id: 'suspicious-cloud',
        label: 'Suspicious Cloud Activity',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'Suspicious cloud application activity detected',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Suspicious cloud application activity detected',
            'Unusual cloud activity was detected from your account',
            'medium'
          ),
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
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Command and control (C2) communication detected',
            'Suspicious network communication was detected from your device'
          ),
      },
      {
        id: 'lateral-movement',
        label: 'Lateral Movement',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Lateral movement behavior detected',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Lateral movement detected in network by Cortex XDR',
            'Suspicious network activity was detected from your account'
          ),
      },
      {
        id: 'ransomware-behavior',
        label: 'Ransomware Behavior',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        description: 'Ransomware-like behavior detected',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'Ransomware behavior detected: mass file encryption attempt',
            'Potentially harmful file activity was detected on your device'
          ),
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
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'External provider reported account compromise',
            'Your account may have been compromised'
          ),
      },
      {
        id: 'session-revoked',
        label: 'Session Revoked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        description: 'User session terminated due to security concern',
        buildPayload: (email, timestamp) =>
          buildRiskPayload(
            email,
            timestamp,
            'User session revoked due to security policy',
            'Your session was ended for security reasons',
            'medium'
          ),
      },
    ],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);
