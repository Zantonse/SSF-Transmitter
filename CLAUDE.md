# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 application that simulates real security vendor signals to Okta Identity Threat Protection. Acts as an SSF (Shared Signals Framework) **Transmitter** — generates RSA keys, signs Security Event Tokens (SETs) as JWTs, and POSTs them to Okta's Security Events API. Used by Okta Solutions Engineers to demo ITP without relying on real EDR endpoint polling.

9 security vendor profiles (CrowdStrike, Zscaler, Palo Alto, etc.), 31 event types, 3 pre-built attack scenarios.

## Development Commands

```bash
npm run dev          # Dev server at http://localhost:3000 (Turbopack)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint (includes React Compiler rules)
```

No test framework is configured.

## Architecture

### Single-Page Client App

The entire UI lives in `app/page.tsx` — a `'use client'` component that owns all application state. There is no routing beyond the single page. State is managed via `useState` hooks (no external state library). Configuration and transmission history persist to localStorage with debounced writes.

**localStorage keys:**
- `ssf-transmitter-config` — Okta domain, issuer URL, subject email, provider, risk level, theme, JWKS URL
- `ssf-transmission-history` — last 100 transmission records

### API Routes (Server-Side)

All three routes are POST-only Next.js API routes:

- **`app/api/transmit/route.ts`** — Core endpoint. Imports the private key via `jose.importPKCS8`, builds the SET payload from provider/event config or a custom payload, signs with `jose.SignJWT`, and POSTs to `https://{oktaDomain}/security/api/v1/security-events` with `Content-Type: application/secevent+jwt`. Returns the signed JWT and parsed Okta error details on failure.
- **`app/api/verify-jwks/route.ts`** — Fetches a user-provided JWKS URL and checks that it contains a key matching the expected `kid`. Used for pre-flight validation before transmitting.
- **`app/api/test-connection/route.ts`** — Sends a HEAD request to the Okta security events endpoint to verify reachability. Sanitizes `-admin` suffix and trailing slashes from the domain.

### Data Model

Provider and event definitions live in `app/config/`:
- **`providers.ts`** — `PROVIDERS` record keyed by provider ID. Each provider has `events[]` where each event has a `buildPayload(email, timestamp, riskLevel)` function that returns the SET `events` claim.
- **`scenarios.ts`** — Pre-built multi-step attack chains referencing provider/event IDs with inter-step delays.

Types are in `app/types/` — `SecurityProvider`, `SecurityEvent`, `RiskLevel`, `TransmissionRecord`, `QueuedEvent`, `Scenario`, `ScenarioExecutionState`.

### Key Generation Flow

1. Browser generates RS256 key pair via `jose.generateKeyPair('RS256', { extractable: true })` in `app/utils/crypto.ts`
2. Private key exported as PKCS8 PEM, stays in browser state (never persisted)
3. Public key exported as JWK — user copies it to a hosted JWKS endpoint
4. On transmit, PEM is sent to the server API route for signing

### Components

All in `app/components/`. Notable ones: `ProviderSelector` (vendor switcher that updates issuer URL), `EventButtonGrid` (event action buttons), `ScenarioRunner` (multi-step attack automation with delays), `BulkSender` (event queue), `CustomEventBuilder` (freeform JSON payload), `TransmissionHistory` (log with replay), `PayloadPreview` (JWT inspection modal).

## React Compiler

Enabled in `next.config.ts` with `reactCompiler: true`. ESLint enforces `react-compiler/react-compiler: "error"`. Avoid patterns that break compiler assumptions: direct DOM manipulation, mutating props, non-idiomatic ref usage in render.

## Key Technical Constraints

### JWT / SET Requirements

- **Header**: `{ alg: 'RS256', kid: <keyId>, typ: 'secevent+jwt' }`
- **Payload**: `{ iss, iat, jti, aud, events }`
- **Audience (`aud`)** must be exactly `https://{oktaDomain}` — no trailing slash, no `-admin` suffix. See `app/api/transmit/route.ts:24-34` for hostname sanitization.

### Risk Event Payload Rules

The `user-risk-change` event (`OKTA_RISK_SCHEMA`) has strict field requirements enforced by Okta:
- `initiating_entity` must be `"policy"` — not custom vendor names
- `reason_admin` and `reason_user` must be localized objects: `{ "en": "..." }`
- `subject.user.format` must be `"email"`

See `buildRiskPayload()` in `app/config/providers.ts:17-41`.

### JWKS Hosting

The public key JWKS must be hosted at a URL returning `Content-Type: application/json`. GitHub Gists fail this — use npoint.io or mocky.io. If keys are regenerated, the hosted JWKS must be updated immediately.

## Common Errors

| Error | Fix |
|-------|-----|
| `invalid_audience` | Remove `-admin` suffix and trailing slash from Okta domain |
| `jwks_url is not valid` / `verification_failed` | Re-host JWKS with correct `Content-Type: application/json`; ensure `kid` matches |
| Risk events not triggering ITP | Create Entity Risk Policy in Okta (Security > Entity Risk Policy) |
| `initiating_entity: Not one of the allowed values` | Use `"policy"`, not vendor names, in `app/config/providers.ts` |
