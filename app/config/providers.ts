import { SecurityProvider, RiskLevel } from '../types/providers';

// Event schemas
const OKTA_RISK_SCHEMA = 'https://schemas.okta.com/secevent/okta/event-type/user-risk-change';
const RISC_SESSION_REVOKED = 'https://schemas.openid.net/secevent/risc/event-type/session-revoked';
const RISC_CREDENTIAL_CHANGE = 'https://schemas.openid.net/secevent/risc/event-type/credential-change-required';
const RISC_ACCOUNT_DISABLED = 'https://schemas.openid.net/secevent/risc/event-type/account-disabled';
const RISC_ACCOUNT_CREDENTIAL_CHANGE = 'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required';

// Map to determine previous level based on current level
const PREVIOUS_LEVEL_MAP: Record<RiskLevel, RiskLevel> = {
  high: 'low',
  medium: 'low',
  low: 'low', // When setting to low, we still use low as previous (no change scenario)
};

function buildRiskPayload(
  email: string,
  timestamp: number,
  reasonAdmin: string,
  reasonUser: string,
  currentLevel: RiskLevel = 'high'
): Record<string, unknown> {
  const previousLevel = PREVIOUS_LEVEL_MAP[currentLevel];
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

function buildLifecyclePayload(
  email: string,
  timestamp: number,
  schema: string
): Record<string, unknown> {
  return {
    [schema]: {
      subject: {
        subject_type: 'email',
        email: email,
      },
      event_timestamp: timestamp,
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
        category: 'risk',
        description: 'Malware identified on user endpoint',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malware detected on user endpoint by CrowdStrike Falcon',
            'Security software detected a threat on your device',
            riskLevel
          ),
      },
      {
        id: 'suspicious-process',
        label: 'Suspicious Process',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Suspicious process execution detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Suspicious process execution detected on endpoint',
            'Unusual activity was detected on your device',
            riskLevel
          ),
      },
      {
        id: 'ioc-match',
        label: 'IOC Match',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Indicator of compromise matched threat intelligence',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Indicator of compromise matched known threat intelligence',
            'A security threat was identified on your device',
            riskLevel
          ),
      },
      {
        id: 'credential-theft',
        label: 'Credential Theft Attempt',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Credential theft attempt detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Credential theft attempt detected by CrowdStrike Falcon',
            'An attempt to steal your credentials was blocked',
            riskLevel
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
        category: 'risk',
        description: 'Data loss prevention policy violation detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'DLP policy violation: sensitive data exfiltration attempted',
            'A data security policy was violated',
            riskLevel
          ),
      },
      {
        id: 'malware-blocked',
        label: 'Malware Download Blocked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Attempted malware download was blocked',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malware download attempt blocked by Zscaler ZIA',
            'A potentially harmful download was blocked',
            riskLevel
          ),
      },
      {
        id: 'suspicious-cloud',
        label: 'Suspicious Cloud Activity',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Suspicious cloud application activity detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Suspicious cloud application activity detected',
            'Unusual cloud activity was detected from your account',
            riskLevel
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
        category: 'risk',
        description: 'Command and control communication detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Command and control (C2) communication detected',
            'Suspicious network communication was detected from your device',
            riskLevel
          ),
      },
      {
        id: 'lateral-movement',
        label: 'Lateral Movement',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Lateral movement behavior detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Lateral movement detected in network by Cortex XDR',
            'Suspicious network activity was detected from your account',
            riskLevel
          ),
      },
      {
        id: 'ransomware-behavior',
        label: 'Ransomware Behavior',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Ransomware-like behavior detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Ransomware behavior detected: mass file encryption attempt',
            'Potentially harmful file activity was detected on your device',
            riskLevel
          ),
      },
    ],
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft Defender',
    defaultIssuer: 'https://security.microsoft.com',
    description: 'Microsoft Defender for Endpoint',
    color: 'bg-blue-500',
    events: [
      {
        id: 'threat-detected',
        label: 'Threat Detected',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Active threat detected on device',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Active threat detected on device by Microsoft Defender',
            'Security software detected a threat on your device',
            riskLevel
          ),
      },
      {
        id: 'suspicious-activity',
        label: 'Suspicious Activity',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Suspicious user or device activity detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Suspicious activity detected by Microsoft Defender',
            'Unusual activity was detected on your account',
            riskLevel
          ),
      },
      {
        id: 'risky-signin',
        label: 'Risky Sign-In',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'High-risk sign-in attempt detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'High-risk sign-in detected by Microsoft Entra ID Protection',
            'A suspicious sign-in attempt was detected',
            riskLevel
          ),
      },
      {
        id: 'impossible-travel',
        label: 'Impossible Travel',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Impossible travel activity detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Impossible travel detected: sign-in from geographically distant locations',
            'Unusual sign-in locations were detected',
            riskLevel
          ),
      },
    ],
  },
  sentinelone: {
    id: 'sentinelone',
    name: 'SentinelOne',
    defaultIssuer: 'https://usea1.sentinelone.net',
    description: 'Autonomous endpoint security platform',
    color: 'bg-purple-600',
    events: [
      {
        id: 'threat-mitigated',
        label: 'Threat Mitigated',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Threat automatically mitigated on endpoint',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Threat automatically mitigated by SentinelOne',
            'A security threat was detected and blocked',
            riskLevel
          ),
      },
      {
        id: 'malicious-file',
        label: 'Malicious File Detected',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Malicious file identified on endpoint',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malicious file detected and quarantined by SentinelOne',
            'A harmful file was found on your device',
            riskLevel
          ),
      },
      {
        id: 'behavioral-ai',
        label: 'Behavioral AI Alert',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Behavioral AI detected suspicious activity',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Behavioral AI detected suspicious activity patterns',
            'Unusual behavior was detected on your device',
            riskLevel
          ),
      },
    ],
  },
  netskope: {
    id: 'netskope',
    name: 'Netskope',
    defaultIssuer: 'https://addon.goskope.com',
    description: 'Cloud security and SASE platform',
    color: 'bg-teal-600',
    events: [
      {
        id: 'data-exfiltration',
        label: 'Data Exfiltration Attempt',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Potential data exfiltration detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Potential data exfiltration attempt detected by Netskope',
            'Suspicious data transfer activity was detected',
            riskLevel
          ),
      },
      {
        id: 'risky-app-usage',
        label: 'Risky App Usage',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'User accessing high-risk cloud application',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'User accessing high-risk cloud application detected',
            'Access to a risky application was detected',
            riskLevel
          ),
      },
      {
        id: 'policy-violation',
        label: 'Cloud Policy Violation',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Cloud security policy violation',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Cloud security policy violation detected by Netskope',
            'A cloud security policy was violated',
            riskLevel
          ),
      },
    ],
  },
  proofpoint: {
    id: 'proofpoint',
    name: 'Proofpoint',
    defaultIssuer: 'https://tap.proofpoint.com',
    description: 'Email security and threat protection',
    color: 'bg-yellow-600',
    events: [
      {
        id: 'phishing-clicked',
        label: 'Phishing Link Clicked',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'User clicked on phishing link',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'User clicked on known phishing link detected by Proofpoint',
            'You may have clicked on a malicious link',
            riskLevel
          ),
      },
      {
        id: 'malware-attachment',
        label: 'Malware Attachment',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Malicious email attachment detected',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malicious email attachment detected by Proofpoint TAP',
            'A harmful email attachment was blocked',
            riskLevel
          ),
      },
      {
        id: 'bec-attempt',
        label: 'BEC Attempt',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Business email compromise attempt',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Business email compromise (BEC) attempt detected',
            'A suspicious email impersonation was detected',
            riskLevel
          ),
      },
      {
        id: 'vap-targeted',
        label: 'VAP Targeted',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Very Attacked Person targeted by campaign',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Very Attacked Person (VAP) targeted by threat campaign',
            'Your account has been targeted by attackers',
            riskLevel
          ),
      },
    ],
  },
  cisco: {
    id: 'cisco',
    name: 'Cisco Secure Endpoint',
    defaultIssuer: 'https://api.amp.cisco.com',
    description: 'Endpoint detection and response',
    color: 'bg-cyan-600',
    events: [
      {
        id: 'malware-executed',
        label: 'Malware Executed',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Malware execution detected on endpoint',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Malware execution detected by Cisco Secure Endpoint',
            'Malicious software was detected running on your device',
            riskLevel
          ),
      },
      {
        id: 'exploit-prevention',
        label: 'Exploit Prevented',
        schema: OKTA_RISK_SCHEMA,
        severity: 'high',
        category: 'risk',
        description: 'Exploit attempt blocked',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Exploit attempt prevented by Cisco Secure Endpoint',
            'An attack attempt was blocked on your device',
            riskLevel
          ),
      },
      {
        id: 'threat-quarantined',
        label: 'Threat Quarantined',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'Threat detected and quarantined',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'Threat detected and quarantined by Cisco Secure Endpoint',
            'A potential threat was isolated on your device',
            riskLevel
          ),
      },
    ],
  },
  risc: {
    id: 'risc',
    name: 'RISC Lifecycle',
    defaultIssuer: 'https://my-local-transmitter.com',
    description: 'OpenID RISC lifecycle events',
    color: 'bg-indigo-600',
    events: [
      {
        id: 'risc-session-revoked',
        label: 'Session Revoked',
        schema: RISC_SESSION_REVOKED,
        severity: 'medium',
        category: 'lifecycle',
        description: 'User sessions have been revoked',
        buildPayload: (email, timestamp) =>
          buildLifecyclePayload(email, timestamp, RISC_SESSION_REVOKED),
      },
      {
        id: 'risc-credential-change',
        label: 'Credential Change Required',
        schema: RISC_CREDENTIAL_CHANGE,
        severity: 'high',
        category: 'lifecycle',
        description: 'User must change credentials',
        buildPayload: (email, timestamp) =>
          buildLifecyclePayload(email, timestamp, RISC_CREDENTIAL_CHANGE),
      },
      {
        id: 'risc-account-disabled',
        label: 'Account Disabled',
        schema: RISC_ACCOUNT_DISABLED,
        severity: 'high',
        category: 'lifecycle',
        description: 'User account has been disabled',
        buildPayload: (email, timestamp) =>
          buildLifecyclePayload(email, timestamp, RISC_ACCOUNT_DISABLED),
      },
      {
        id: 'risc-account-credential-change',
        label: 'Account Credential Change Required',
        schema: RISC_ACCOUNT_CREDENTIAL_CHANGE,
        severity: 'high',
        category: 'lifecycle',
        description: 'Account-level credential change required',
        buildPayload: (email, timestamp) =>
          buildLifecyclePayload(email, timestamp, RISC_ACCOUNT_CREDENTIAL_CHANGE),
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
        category: 'risk',
        description: 'Generic high-risk event for testing ITP',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'External provider reported account compromise',
            'Your account may have been compromised',
            riskLevel
          ),
      },
      {
        id: 'session-revoked-risk',
        label: 'Session Revoked (Risk)',
        schema: OKTA_RISK_SCHEMA,
        severity: 'medium',
        category: 'risk',
        description: 'User session terminated due to security concern',
        buildPayload: (email, timestamp, riskLevel) =>
          buildRiskPayload(
            email,
            timestamp,
            'User session revoked due to security policy',
            'Your session was ended for security reasons',
            riskLevel
          ),
      },
    ],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);
