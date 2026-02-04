# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15+ application that demonstrates the Shared Signals Framework (SSF) for Okta. It acts as a **Transmitter** that generates, signs, and transmits Security Event Tokens (SETs) to the Okta Security Events API.

The app uses the React Compiler for optimization and implements the full SSF workflow: RSA key generation, JWKS export, JWT signing, and event transmission to Okta's security events endpoint.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Architecture

### Core Components

**Frontend (Client-side)**
- `app/page.tsx` - Main dashboard UI with configuration, key management, and transmission controls
- `app/utils/crypto.ts` - RSA key pair generation using Web Crypto API via `jose` library

**Backend (Server-side)**
- `app/api/transmit/route.ts` - Next.js API route that handles JWT signing and transmission to Okta

### Security Event Token (SET) Flow

1. **Key Generation** (`app/utils/crypto.ts`): Generates RS256 key pairs in the browser with `extractable: true` to allow PEM export
2. **Frontend Configuration** (`app/page.tsx`): User provides Okta domain, issuer URL, and target user email
3. **JWT Signing** (`app/api/transmit/route.ts`): Server imports private key, constructs SET payload, signs with `jose.SignJWT`
4. **Transmission**: POST to `https://{oktaDomain}/security/api/v1/security-events` with `Content-Type: application/secevent+jwt`

### Event Types

The application supports two distinct event types:

**Lifecycle Events** (`session-revoked`)
- Event schema: `https://schemas.openid.net/secevent/risc/event-type/session-revoked`
- Purpose: Informational signal about session state
- Triggers: Standard event logging in Okta System Log

**Risk Events** (`user-risk-change`)
- Event schema: `https://schemas.okta.com/secevent/okta/event-type/user-risk-change`
- Purpose: Triggers Identity Threat Protection (ITP) detections
- Sets user risk level from "low" to "high"
- Requires Entity Risk Policy configuration in Okta to take effect

## Key Technical Details

### JWT Structure

SETs are signed JWTs with specific requirements:
- **Header**: `{ alg: 'RS256', kid: <keyId>, typ: 'secevent+jwt' }`
- **Payload**: `{ iss, iat, jti, aud, events }`
- **Audience**: Must be `https://{oktaDomain}` (no trailing slash, no `-admin` suffix)

### Audience Validation

The `aud` claim is critical - it must exactly match Okta's expectation:
- Correct: `https://dev-12345.okta.com`
- Incorrect: `https://dev-12345-admin.okta.com` or `https://dev-12345.okta.com/`

See `app/api/transmit/route.ts:18-29` for hostname sanitization logic.

### JWKS Export

The public key must be hosted as a JWKS (JSON Web Key Set) with proper `Content-Type: application/json` headers. The format is:
```json
{
  "keys": [{
    "kty": "RSA",
    "kid": "<uuid>",
    "use": "sig",
    "alg": "RS256",
    "n": "<modulus>",
    "e": "<exponent>"
  }]
}
```

## React Compiler Configuration

This project uses the React Compiler (experimental) for automatic memoization optimization:
- Enabled in `next.config.ts` with `reactCompiler: true`
- ESLint plugin configured in `eslint.config.mjs` to enforce compiler compatibility
- Babel plugin `babel-plugin-react-compiler` installed as dependency

When writing React components, avoid patterns that break the compiler's assumptions (e.g., direct DOM manipulation, mutating props).

## TypeScript Configuration

- Module resolution: `bundler`
- Path alias: `@/*` maps to project root
- Target: ES2017
- Strict mode enabled

### Risk Event Payload Format

The `user-risk-change` event payload must match Okta's expected schema exactly. Key fields in `app/config/providers.ts`:

```json
{
  "https://schemas.okta.com/secevent/okta/event-type/user-risk-change": {
    "event_timestamp": 1234567890,
    "current_level": "high",
    "previous_level": "low",
    "initiating_entity": "policy",
    "reason_admin": { "en": "Admin-facing explanation" },
    "reason_user": { "en": "User-facing explanation" },
    "subject": {
      "user": {
        "format": "email",
        "email": "user@example.com"
      }
    }
  }
}
```

**Critical field requirements:**
- `initiating_entity` - Must be `"policy"` (not custom provider names like "CrowdStrike Falcon")
- `reason_admin` - Localized object with `en` key for admin-facing text
- `reason_user` - Localized object with `en` key for user-facing text (required by Okta)

## Common Issues

**Invalid Audience Error**
- Verify Okta domain has no `-admin` suffix or trailing slash
- Check that `aud` claim matches exactly: `https://{oktaDomain}`

**JWKS Verification Failed**
- Ensure JWKS URL returns `Content-Type: application/json`
- GitHub Gists often fail - use npoint.io or mocky.io instead
- If keys were regenerated, update the hosted JWKS immediately

**Risk Events Not Triggering ITP**
- Verify Entity Risk Policy exists in Okta (Security → Entity Risk Policy)
- Confirm policy is configured to set risk level to "High" on signal receipt
- Check User Risk Report or user profile for risk level changes

**initiating_entity Not Allowed Error**
- Error: `'events.mediationUserRiskChangeEvent.initiatingEntity': Not one of the allowed values`
- Cause: Using custom strings (e.g., provider names) instead of Okta's enum values
- Fix: Use `"policy"` as the `initiating_entity` value in `app/config/providers.ts`
