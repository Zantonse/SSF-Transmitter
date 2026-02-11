# SSF Transmitter — Improvement Design

**Date:** 2026-02-10
**Audience:** Self (demos), other Okta SEs, customers testing SSF/ITP

## Problem Statement

The app is feature-rich but has two key gaps:
1. **Setup is confusing** — new users struggle with Okta domain formatting, understanding issuer URLs, and hosting JWKS (especially via npoint.io)
2. **Demo impact is limited** — after sending events, there's no visual storytelling; it's button-click → log entry, which undersells the value during live demos

## Design: 9 Improvements Across 3 Themes

---

## Theme A: Inline Setup Improvements

### A1. Smart Domain Input

Enhance the Okta domain input field with real-time validation and auto-correction.

**Behavior:**
- As the user types, detect and warn about common mistakes:
  - `-admin` suffix detected → show warning + auto-strip option
  - Trailing slash → silently remove
  - `https://` prefix included → silently strip to just the hostname
  - Doesn't look like an Okta domain → soft warning (not blocking)
- Below the input, display the computed audience value:
  > Audience (aud): `https://dev-12345.okta.com`
- Use green/red border + icon to indicate valid/invalid state

**Implementation:** Add validation logic to the `oktaDomain` state setter in `page.tsx`. Add a derived `computedAud` display below the input. CSS for validation states already exists in the design system (success/error colors).

---

### A2. Issuer URL Contextual Help

Add an inline help tooltip next to the Issuer URL field.

**Behavior:**
- Small `?` icon button next to the "Issuer URL" label
- On click/hover, expands an inline explanation:
  > "This is the URL you entered when creating the Security Events Push Stream in Okta. It identifies this transmitter. It can be any URL you control — many people use their JWKS hosting URL as the base."
- Collapses when clicked again or when the user starts typing

**Implementation:** Small tooltip/popover component. No external dependencies needed — use a `details`/`summary` element or a simple toggle state.

---

### A3. JWKS Hosting Flow

After key generation, upgrade the JWKS section from "here's your JSON, good luck" to a guided mini-flow.

**Behavior:**
After clicking "Generate Keys", the key management card shows:
1. **Copy JWKS** button (already exists — keep as-is)
2. **"Open npoint.io"** button — opens `https://www.npoint.io/` in a new tab
3. **Verify JWKS URL** section:
   - Text input for the user to paste their hosted JWKS URL
   - "Verify" button that:
     - Fetches the URL via a server-side proxy (to avoid CORS)
     - Checks: responds with valid JSON, contains a `keys` array, has a key with matching `kid`
     - Shows result: green checkmark with "JWKS verified — kid matches" or red X with specific error

**Implementation:** Add a new API route `app/api/verify-jwks/route.ts` that proxies the fetch server-side. Add UI elements to the key management section in `page.tsx`. Store verified JWKS URL in localStorage alongside the config.

---

### A4. Connection Test Button

Add a lightweight pre-flight check to validate the Okta domain before the user attempts their first transmission.

**Behavior:**
- Button labeled "Test Connection" in the configuration card
- Sends a HEAD or OPTIONS request to `https://{oktaDomain}/security/api/v1/security-events`
- Expected result: some form of 4xx (since we're not sending a valid token), which confirms the endpoint exists
- Display: "Okta endpoint reachable" (green) or "Cannot reach endpoint — check domain" (red)

**Implementation:** New API route `app/api/test-connection/route.ts` that makes the request server-side. Simple button + status display in the config card.

---

## Theme B: Visual Demo Impact

### B1. Session Stats Bar

Add a live statistics display that makes repeated sends and bulk operations visually engaging.

**Placement:** Horizontal bar between the header and the main content area.

**Metrics displayed:**
- **Events Sent**: Total count this session (resets on page reload)
- **Success Rate**: Percentage with color coding (green >90%, yellow >70%, red below)
- **Last Sent**: Relative timestamp ("3s ago", "1m ago")

**Visual treatment:**
- Compact horizontal strip with metrics separated by subtle dividers
- Numbers animate/count up when they change (CSS transition on content)
- During bulk sends, the counter rapidly increments — creates a satisfying "scoreboard" effect

**Implementation:** Derive from existing activity log state in `page.tsx`. New `SessionStats.tsx` component. CSS animations for number transitions.

---

### B2. Scenario Playbooks

Pre-built demo scripts that automatically send a sequence of events to tell an attack story.

**Pre-built Scenarios:**

1. **Compromised User** (3 events, ~6s total)
   - CrowdStrike: Malware Detected (High) → 2s delay
   - Zscaler: DLP Policy Violation (High) → 2s delay
   - Proofpoint: Phishing Link Clicked (High)
   - *Story: "User's endpoint is compromised, they start exfiltrating data, and fall for a phishing attack"*

2. **Risk Escalation** (3 events, ~4s total)
   - Same provider, same event type
   - Risk levels: Low → Medium → High
   - *Story: "Watch the user's risk level climb as signals accumulate"*

3. **Multi-Vector Attack** (4 events, ~8s total)
   - Microsoft Defender: Risky Sign-In (Medium) → 2s delay
   - Palo Alto: Lateral Movement (High) → 2s delay
   - CrowdStrike: Credential Theft (High) → 2s delay
   - Netskope: Data Exfiltration (High)
   - *Story: "Attacker gains access, moves laterally, steals credentials, then exfiltrates data"*

**UI Design:**
- New "Scenarios" tab alongside Activity Log / History / Bulk Queue / Custom Events
- Each scenario displayed as a card with:
  - Name and story description
  - Visual sequence showing provider icons → arrows → provider icons
  - Estimated event count and total duration
  - "Run Scenario" button
- During execution:
  - Step indicator highlights current event
  - Each event shows send/success/fail status as it executes
  - Stats bar (B1) updates in real-time
  - Activity log fills up with the narrative
- Configurable delay between scenario steps (default 2s, range 500ms-5s)

**Implementation:**
- New type `Scenario` in `app/types/scenarios.ts`: name, description, steps (providerId, eventId, riskLevel, delay)
- New config file `app/config/scenarios.ts` with pre-built scenarios
- New component `app/components/ScenarioRunner.tsx`
- Reuse existing `handleTransmit` logic from `page.tsx` for each step

---

### B3. Event Timeline Visualization

Visual timeline view in the History tab that makes transmitted events look compelling.

**Design:**
- Toggle between "List View" (current) and "Timeline View" in the History tab header
- Timeline is a horizontal scrollable strip showing events as markers on a time axis
- Each marker:
  - Colored by provider brand color
  - Sized by risk level (high = large, medium = medium, low = small)
  - Shape: circle for risk events, diamond for lifecycle events
  - Hover tooltip: event name, provider, time, status
- Time axis shows relative timestamps
- Failed events shown as outlined (unfilled) markers with red border
- Scenario runs are visually grouped with a subtle connecting line

**Implementation:**
- New component `app/components/EventTimeline.tsx`
- Pure CSS/SVG implementation (no charting library needed — the data is simple enough)
- Data source: existing `transmissionHistory` state
- Responsive: horizontal scroll on overflow, touch-friendly

---

## Theme C: Quick Wins

### C1. Configuration Persistence

Save the configuration fields to localStorage so returning users don't re-enter them.

**Fields persisted:**
- `oktaDomain`
- `issuerUrl`
- `subjectEmail`
- `selectedProviderId`
- `riskLevel`
- `jwksUrl` (if verified via A3)
- `theme` (already using state — persist it)

**Behavior:**
- On mount, check localStorage for saved config and hydrate state
- On change, debounce-save to localStorage (300ms delay to avoid thrashing)
- "Clear Saved Configuration" button in the config card (or a reset icon in header)
- Private/public keys are NOT persisted (security — must regenerate each session)

**Implementation:** Custom `usePersistedState` hook or direct `useEffect` in `page.tsx`. Key prefix: `ssf-transmitter-` to namespace.

---

### C2. Export/Import Configuration

Allow SEs to share their setup with each other without sharing private keys.

**Export:**
- "Export Config" button in the configuration card
- Downloads a JSON file: `ssf-config-{domain}.json`
- Contents:
  ```json
  {
    "version": 1,
    "oktaDomain": "dev-12345.okta.com",
    "issuerUrl": "https://example.npoint.io/abc123",
    "subjectEmail": "testuser@example.com",
    "selectedProviderId": "crowdstrike",
    "jwksUrl": "https://api.npoint.io/abc123",
    "exportedAt": "2026-02-10T..."
  }
  ```
- Explicitly excludes: private keys, public keys, transmission history

**Import:**
- "Import Config" button (or drag-and-drop zone)
- Reads the JSON file, validates schema version
- Populates config fields
- Shows confirmation: "Loaded config for dev-12345.okta.com — you'll need to generate new keys"

**Implementation:** File download via Blob URL for export. `<input type="file">` for import. Validation of the JSON structure before applying.

---

## Implementation Priority

Recommended order based on impact vs. effort:

| Priority | Item | Theme | Impact | Notes |
|----------|------|-------|--------|-------|
| 1 | C1. Config Persistence | Quick Win | High | Eliminates most setup friction for returning users |
| 2 | A1. Smart Domain Input | Setup | High | Prevents the #1 error (bad audience) |
| 3 | B1. Session Stats Bar | Demo | Medium | Quick to build, immediately visible |
| 4 | A2. Issuer URL Help | Setup | Medium | Small addition, big clarity gain |
| 5 | A3. JWKS Hosting Flow | Setup | High | Addresses major pain point, needs new API route |
| 6 | B2. Scenario Playbooks | Demo | Very High | Biggest demo differentiator, most implementation work |
| 7 | B3. Event Timeline | Demo | High | Visual payoff, moderate complexity |
| 8 | C2. Export/Import Config | Quick Win | Medium | Useful for SE sharing workflow |
| 9 | A4. Connection Test | Setup | Low | Nice-to-have, prevents confusion |
