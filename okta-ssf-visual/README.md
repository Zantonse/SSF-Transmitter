# SSF Transmitter

A visual dashboard for simulating security provider signals to Okta's Identity Threat Protection (ITP) via the Shared Signals Framework (SSF).

Built with **Next.js 16**, this tool acts as a *Transmitter* that generates, signs, and sends Security Event Tokens (SETs) to Okta, simulating real-world integrations with providers like CrowdStrike, Zscaler, and Palo Alto Networks.

---

## Features

- **Multi-Provider Simulation** - Simulate signals from CrowdStrike Falcon, Zscaler ZIA, Palo Alto Cortex XDR, or custom sources
- **12 Pre-configured Event Types** - Malware detection, credential theft, DLP violations, ransomware behavior, and more
- **Browser-based Key Generation** - RSA key pairs (RS256) generated securely in the browser
- **JWKS Export** - Ready-to-host JSON Web Key Set for Okta verification
- **Real-time Activity Log** - Track all transmission attempts and responses
- **Dark/Light Mode** - Toggle between themes for your preference
- **ITP Integration** - All events use Okta's `user-risk-change` schema to trigger Identity Threat Protection

---

## Supported Providers & Events

| Provider | Events |
|----------|--------|
| **CrowdStrike Falcon** | Malware Detected, Suspicious Process, IOC Match, Credential Theft Attempt |
| **Zscaler ZIA** | DLP Policy Violation, Malware Download Blocked, Suspicious Cloud Activity |
| **Palo Alto Cortex XDR** | C2 Communication Detected, Lateral Movement, Ransomware Behavior |
| **Custom** | Generic Risk Event, Session Revoked |

Each event includes appropriate severity levels (HIGH/MEDIUM) and descriptive payloads that appear in Okta's System Log.

---

## Prerequisites

- **Node.js v18+**
- **Okta Organization** with admin access
- **Entity Risk Policy** configured in Okta (for ITP triggers)

---

## Quick Start

### 1. Install & Run

```bash
git clone https://github.com/Zantonse/SSF-Transmitter.git
cd okta-ssf-visual
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

---

## Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Okta Domain** | Your Okta org domain (no `https://` or `-admin`) | `dev-123456.okta.com` |
| **Security Provider** | The simulated security vendor | CrowdStrike Falcon |
| **Issuer URL** | Must match Okta stream configuration | `https://falcon.crowdstrike.com` |
| **Target Subject** | Email of the user to apply the risk signal to | `user@company.com` |

---

## Verifying Events in Okta

### System Log

Navigate to **Reports > System Log** and search:

```
eventType eq "security.events.provider.receive_event"
```

You'll see entries showing:
- The provider name in `initiating_entity`
- Event details in `reason_admin`
- Risk level changes

### User Risk

After sending a HIGH severity event:

1. Go to **Directory > People**
2. Select the target user
3. Check their **Risk Level** in the profile

Or view **Reports > User Risk Report** for aggregated data.

---

## Project Structure

```
app/
├── page.tsx                    # Main dashboard UI
├── globals.css                 # Theme variables & styling
├── api/transmit/route.ts       # API route for signing & sending SETs
├── utils/crypto.ts             # RSA key generation
├── types/providers.ts          # TypeScript interfaces
├── config/providers.ts         # Provider & event definitions
└── components/
    ├── ProviderSelector.tsx    # Provider dropdown
    └── EventButtonGrid.tsx     # Event buttons grid
```

---

## Adding Custom Providers

Edit `app/config/providers.ts` to add new providers:

```typescript
newprovider: {
  id: 'newprovider',
  name: 'New Provider',
  defaultIssuer: 'https://api.newprovider.com',
  description: 'Description here',
  color: 'bg-purple-600',
  events: [
    {
      id: 'event-id',
      label: 'Event Name',
      schema: OKTA_RISK_SCHEMA,
      severity: 'high',
      description: 'Event description',
      buildPayload: (email, timestamp, entity) =>
        buildRiskPayload(email, timestamp, entity, 'Reason text for Okta logs'),
    },
  ],
},
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_audience` | Audience claim mismatch | Ensure Okta domain has no `-admin` suffix or trailing slash |
| `jwks_url is not valid` | Okta can't read your JWKS | Host on npoint.io/mocky.io with proper JSON content-type |
| `verification_failed` | Signature doesn't match | Update hosted JWKS after regenerating keys |
| Events not triggering ITP | No Entity Risk Policy | Create a policy under Security > Entity Risk Policy |
| User risk not changing | Policy not configured | Ensure policy action sets risk level on signal receipt |

---

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

---

## Tech Stack

- **Next.js 16** with Turbopack
- **React 19** with React Compiler
- **jose** for JWT signing
- **Tailwind CSS** for styling
- **TypeScript** for type safety

---

## License

MIT License - See [LICENSE](LICENSE) for details.
