Okta SSF Visual Transmitter

A visual dashboard built with Next.js to demonstrate how to generate, sign, and transmit Security Event Tokens (SETs) to the Okta Security Events API. This tool acts as a "Transmitter" in the Shared Signals Framework (SSF) ecosystem.

🚀 Features

Visual Configuration: Simple UI to input Okta domain and issuer details.

Key Generation: Generates RSA key pairs (RS256) in the browser using the Web Crypto API.

JWKS Export: Provides the exact JSON needed to host your public keys for Okta verification.

Event Types: Supports triggering two distinct signal types:

⚡ Lifecycle: session-revoked (Informational)

🚨 Risk: account-compromised (Triggers Identity Threat Protection detections)

Robust Backend: A Next.js API route that handles JWT signing and manages strict Okta audience validation logic.

Optimized: Built with Next.js 15+ and the React Compiler for automatic performance optimization.

🛠️ Prerequisites

Node.js (v18 or later)

An Okta Organization (Developer or Production)

Access to the Okta Admin Console to configure Security Streams.

📦 Installation

Clone the repository:

git clone <your-repo-url>
cd okta-ssf-visual


Install dependencies:

npm install


This installs Next.js, React, jose (for crypto), uuid, and the React Compiler tools.

Run the development server:

npm run dev


Open http://localhost:3000 with your browser.

⚙️ Configuration Guide

To make this app talk to Okta, you need to set up a trust relationship.

Step 1: Generate & Host Keys

Open the app at http://localhost:3000.

Click "Generate New Keys".

Copy the JSON output shown in the yellow box.

Go to a JSON hosting service like npoint.io (recommended) or Mocky.

Why? Okta requires the JWKS URL to return Content-Type: application/json. GitHub Gists often fail this check.

Paste your JSON, save it, and copy the public URL.

Step 2: Configure Okta

Log in to your Okta Admin Console.

Navigate to Security > Device Integrations > Receive shared signals.

Click Create Stream.

Fill in the details:

Stream Name: Visual Transmitter

Issuer URL: https://my-local-transmitter.com (or whatever matches your dashboard input).

JWKS URL: The npoint.io or mocky.io URL you created in Step 1.

Save the integration.

🎮 Usage

Okta Domain: Enter your org URL (e.g., dev-123456.okta.com).

Note: Do not include https:// or -admin. The app will auto-correct this, but clean input is best.

Issuer URL: Must match exactly what you entered in Okta (e.g., https://my-local-transmitter.com).

Target Subject: The email of a real user in your Okta org (e.g., your admin email).

Transmit:

Click ⚡ Lifecycle to send a standard log event.

Click 🚨 Risk to trigger a threat detection.

🔍 Verification

Check System Logs

Go to Reports > System Log in Okta. Search for:

eventType eq "security.events.provider.receive_event"


Check Risk Detection (ITP)

To see the Risk event explicitly:

Ensure you have an Entity Risk Policy set up in Okta (Security > Entity Risk Policy) that sets risk to "High" when a signal is received from your stream.

Send the 🚨 Risk event from the dashboard.

Check the User Risk report or the user's profile to see the risk level change.

📂 Project Structure

app/page.tsx: The frontend dashboard logic and UI.

app/api/transmit/route.ts: The backend API that handles JWT signing and transmission.

app/utils/crypto.ts: Helper functions for generating RSA keys.

next.config.ts: Configuration enabling the React Compiler.

eslint.config.mjs: Linting rules ensuring React Compiler compatibility.

❓ Troubleshooting

Error

Cause

Fix

invalid_audience

The aud claim in the JWT doesn't match Okta's expectation.

Ensure you are using the correct Okta Domain (no -admin, no trailing slash). The app attempts to fix this automatically.

jwks_url is not valid

Okta cannot read your JWKS URL.

Ensure your hosting provider (npoint/mocky) sends Content-Type: application/json.

verification_failed

The signature is invalid.

You likely generated new keys in the app but forgot to update the JSON on npoint.io. Update the hosted JSON.

📜 License

This project is open source and available under the MIT License.