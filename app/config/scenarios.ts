import { Scenario } from '../types/scenarios';

export const SCENARIOS: Scenario[] = [
  {
    id: 'compromised-user',
    name: 'Compromised User',
    description: 'Endpoint compromise leads to data exfiltration and phishing — a cascading attack across three vendors.',
    steps: [
      { providerId: 'crowdstrike', eventId: 'malware-detected', riskLevel: 'high', delayAfterMs: 2000 },
      { providerId: 'zscaler', eventId: 'dlp-violation', riskLevel: 'high', delayAfterMs: 2000 },
      { providerId: 'proofpoint', eventId: 'phishing-clicked', riskLevel: 'high', delayAfterMs: 0 },
    ],
  },
  {
    id: 'risk-escalation',
    name: 'Risk Escalation',
    description: 'Same threat type reported three times with escalating severity — watch the risk level climb.',
    steps: [
      { providerId: 'crowdstrike', eventId: 'suspicious-process', riskLevel: 'low', delayAfterMs: 2000 },
      { providerId: 'crowdstrike', eventId: 'suspicious-process', riskLevel: 'medium', delayAfterMs: 2000 },
      { providerId: 'crowdstrike', eventId: 'suspicious-process', riskLevel: 'high', delayAfterMs: 0 },
    ],
  },
  {
    id: 'multi-vector-attack',
    name: 'Multi-Vector Attack',
    description: 'Attacker gains access, moves laterally, steals credentials, then exfiltrates data across four security layers.',
    steps: [
      { providerId: 'microsoft', eventId: 'risky-signin', riskLevel: 'medium', delayAfterMs: 2000 },
      { providerId: 'paloalto', eventId: 'lateral-movement', riskLevel: 'high', delayAfterMs: 2000 },
      { providerId: 'crowdstrike', eventId: 'credential-theft', riskLevel: 'high', delayAfterMs: 2000 },
      { providerId: 'netskope', eventId: 'data-exfiltration', riskLevel: 'high', delayAfterMs: 0 },
    ],
  },
];
