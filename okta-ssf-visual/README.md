# SSF Transmitter

A production-grade tool that simulates real security vendor signals to Okta Identity Threat Protection — live, in the demo.

## What It Is

SSF Transmitter is a Next.js application that generates, signs, and transmits standards-compliant Security Event Tokens (SETs) to Okta's Security Events API. It does exactly what vendors like CrowdStrike, Zscaler, and Palo Alto do in production through the Shared Signals Framework (SSF) — letting Solutions Engineers fire real signed tokens and watch Okta respond in real time.

## Why It Matters

The most compelling ITP demo moment is showing a security vendor detect a threat and Okta respond instantly — elevating user risk, triggering Universal Logout, revoking sessions across every connected app. But the traditional EDR integration relies on endpoint polling through Okta Verify, which is fragile and frequently fails during live demos.

SSF Transmitter eliminates that fragility. No endpoint dependencies. No hoping the agent polls at the right moment. The demo just works.

## How It Works

1. **Key Generation** — RSA-256 keypairs are generated in the browser using the Web Crypto API. The public key is exported as a JWKS and hosted at a public URL for Okta to verify signatures against.

2. **Configuration** — Provide your Okta domain, select a security vendor, and specify a target user email.

3. **Token Signing** — The server constructs a SET payload matching Okta's exact schema requirements (`user-risk-change` for ITP triggers, `session-revoked` for lifecycle events) and signs it as a JWT with the `secevent+jwt` type header per RFC 8936.

4. **Transmission** — The signed token is POSTed to `https://{oktaDomain}/security/api/v1/security-events`. Okta validates the signature, processes the risk signal, and — with an Entity Risk Policy configured — triggers automated response actions like Universal Logout.

## Supported Vendors

| Vendor | Category | Events |
|--------|----------|--------|
| **CrowdStrike Falcon** | EDR / MDR | Malware Detected, Suspicious Process, IOC Match, Credential Theft |
| **Zscaler ZIA** | CASB / DLP | DLP Violation, Malware Download Blocked, Suspicious Cloud Activity |
| **Palo Alto Cortex XDR** | XDR | C2 Communication, Lateral Movement, Ransomware Behavior |
| **Microsoft Defender** | Entra ID / Defender | Threat Detected, Suspicious Activity, Risky Sign-In, Impossible Travel |
| **SentinelOne** | EPP / EDR | Threat Mitigated, Malicious File, Behavioral AI Alert |
| **Netskope** | SASE / DLP | Data Exfiltration, Risky App Usage, Policy Violation |
| **Proofpoint** | Email Security | Phishing Clicked, Malware Attachment, BEC Attempt, VAP Targeted |
| **Cisco Secure Endpoint** | EDR | Malware Executed, Exploit Prevented, Threat Quarantined |
| **RISC Lifecycle** | OpenID Standard | Session Revoked, Credential Change Required, Account Disabled |

**9 vendors. 31 event types. 3 pre-built attack scenarios.**

## Features

- **Real JWT Signing** — Standards-compliant SETs signed with RS256
- **Browser RSA Crypto** — Key generation via Web Crypto API, no server-side secrets
- **Scenario Automation** — Pre-built multi-step attack chains (Compromised User, Risk Escalation, Multi-Vector Attack)
- **Bulk Event Sending** — Queue multiple events with configurable delays
- **Payload Preview** — Inspect the exact JWT before transmission
- **Transmission History** — Replay past events, filter and search
- **Custom Event Builder** — Freeform JSON for arbitrary event schemas
- **Config Persistence** — Settings saved across sessions via localStorage
- **Dark / Light Mode** — Full theme support

## Quick Start

### 1. Install & Run

```bash
git clone https://github.com/Zantonse/SSF-Transmitter.git
cd SSF-Transmitter
npm install
npm run dev
```

Open **http://localhost:3000**

### 2. Generate Keys

1. Click **Generate Keys** in the Key Management section
2. Copy the JWKS JSON output
3. Host the JSON at a public URL (recommended: [npoint.io](https://npoint.io) or [mocky.io](https://mocky.io))

> **Important:** The JWKS URL must return `Content-Type: application/json`. GitHub Gists often fail this requirement.

### 3. Configure Okta

1. Log in to Okta Admin Console
2. Navigate to: **Security > Device Integrations > Receive shared signals**
3. Click **Create Stream** and enter:
   - **Stream Name:** `SSF Transmitter`
   - **Issuer URL:** Use the provider's default (e.g., `https://falcon.crowdstrike.com`) or your custom URL
   - **JWKS URL:** Your hosted JWKS endpoint from Step 2
4. Save the integration

### 4. Configure Entity Risk Policy (Required for ITP)

1. Navigate to: **Security > Entity Risk Policy**
2. Create or edit a policy that responds to external risk signals
3. Configure actions (e.g., require MFA, block access) when risk level changes

### 5. Send Events

1. Enter your **Okta Domain** (e.g., `dev-123456.okta.com`)
2. Select a **Security Provider** from the dropdown
3. Enter a **Target Subject** (email of a real Okta user)
4. Click any event button to transmit

## Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Okta Domain** | Your Okta org domain (no `https://` or `-admin`) | `dev-123456.okta.com` |
| **Security Provider** | The simulated security vendor | CrowdStrike Falcon |
| **Issuer URL** | Must match Okta stream configuration | `https://falcon.crowdstrike.com` |
| **Target Subject** | Email of the user to apply the risk signal to | `user@company.com` |

## Verifying Events in Okta

### System Log

Navigate to **Reports > System Log** and search:

```
eventType eq "security.events.provider.receive_event"
```

You'll see entries showing the provider name, event details, and risk level changes.

### User Risk

After sending a HIGH severity event:

1. Go to **Directory > People**
2. Select the target user
3. Check their **Risk Level** in the profile

Or view **Reports > User Risk Report** for aggregated data.

## Architecture

```
app/
├── page.tsx                    # Main dashboard UI
├── globals.css                 # Theme variables & styling
├── api/
│   ├── transmit/route.ts       # JWT signing & transmission
│   ├── verify-jwks/route.ts    # JWKS validation
│   └── test-connection/route.ts # Okta endpoint reachability
├── utils/
│   └── crypto.ts               # RSA key generation
├── config/
│   ├── providers.ts            # 9 vendor definitions + 31 events
│   └── scenarios.ts            # Pre-built attack scenarios
├── types/
│   ├── providers.ts            # Event type definitions
│   ├── history.ts              # Transmission records
│   ├── bulk.ts                 # Bulk send queue
│   └── scenarios.ts            # Scenario execution state
└── components/
    ├── ProviderSelector.tsx     # Vendor switcher
    ├── EventButtonGrid.tsx      # Event action buttons
    ├── ScenarioRunner.tsx       # Attack scenario automation
    ├── BulkSender.tsx           # Multi-event queue
    ├── CustomEventBuilder.tsx   # Freeform event creation
    ├── TransmissionHistory.tsx  # Event log with replay
    ├── PayloadPreview.tsx       # JWT preview modal
    ├── RiskLevelSelector.tsx    # High/Medium/Low toggle
    ├── SessionStats.tsx         # Session metrics
    ├── EventTimeline.tsx        # Timeline visualization
    └── CopyButton.tsx           # Utility component
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_audience` | Audience claim mismatch | Ensure Okta domain has no `-admin` suffix or trailing slash |
| `jwks_url is not valid` | Okta can't read your JWKS | Host on npoint.io/mocky.io with proper JSON content-type |
| `verification_failed` | Signature doesn't match | Update hosted JWKS after regenerating keys |
| Events not triggering ITP | No Entity Risk Policy | Create a policy under Security > Entity Risk Policy |
| `initiating_entity` error | Using custom string | Use `"policy"` as the value, not vendor names |

## Tech Stack

- **Next.js 16** with Turbopack
- **React 19** with React Compiler
- **TypeScript** in strict mode
- **jose** for JWT signing & cryptography
- **Tailwind CSS 4** for styling
- **Web Crypto API** for browser-side RSA key generation

## Development

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Run ESLint
```

## License

MIT License - See [LICENSE](LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code)
