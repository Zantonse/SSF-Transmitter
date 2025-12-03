# Okta SSF Visual Transmitter

A visual dashboard built with **Next.js** to demonstrate how to generate, sign, and transmit Security Event Tokens (SETs) to the **Okta Security Events API**. This tool acts as a *Transmitter* in the Shared Signals Framework (SSF) ecosystem.

---

## 🚀 Features

* **Visual Configuration:** Simple UI to input Okta domain and issuer details.
* **Key Generation:** Generates RSA key pairs (RS256) in the browser using the Web Crypto API.
* **JWKS Export:** Provides JSON output you can host for Okta verification.
* **Event Types:** Supports triggering two distinct signal types:

  * ⚡ **Lifecycle:** `session-revoked` (informational)
  * 🚨 **Risk:** `account-compromised` (triggers Identity Threat Protection detections)
* **Robust Backend:** Next.js API route handles JWT signing and audience validation.
* **Optimized:** Built on Next.js 15+ with the React Compiler.

---

## 🛠️ Prerequisites

* Node.js **v18 or later**
* An **Okta Organization** (Developer or Production)
* Access to the Okta Admin Console (to configure Shared Signals streams)

---

## 📦 Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd okta-ssf-visual
```

Install dependencies:

```bash
npm install
```

This installs Next.js, React, `jose` (crypto), `uuid`, and React Compiler tooling.

Run the development server:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⚙️ Configuration Guide

To connect this app to Okta, you need to establish a trust relationship.

### **Step 1: Generate & Host Keys**

1. Open the app at **[http://localhost:3000](http://localhost:3000)**.
2. Click **Generate New Keys**.
3. Copy the JSON shown in the yellow JWKS output box.
4. Host it on a JSON provider such as **npoint.io** or **mocky.io**.

> ⚠️ Okta requires the JWKS URL to return `Content-Type: application/json`. GitHub Gists often fail this check.

5. Save and copy the public URL.

### **Step 2: Configure Okta**

1. Log in to your Okta Admin Console.
2. Navigate to:
   **Security → Device Integrations → Receive shared signals**
3. Click **Create Stream**.
4. Fill out the form:

   * **Stream Name:** `Visual Transmitter`
   * **Issuer URL:** e.g. `https://my-local-transmitter.com`
   * **JWKS URL:** the JSON host URL from Step 1
5. Save the integration.

---

## 🎮 Usage

### **Fields**

* **Okta Domain:** Your org domain (e.g., `dev-123456.okta.com`).

  * Do **not** include `https://` or `-admin`.
* **Issuer URL:** Must match the Issuer in Okta.
* **Target Subject:** Email address of a real user in Okta.

### **Send Events**

* Click **⚡ Lifecycle** to send a `session-revoked` event.
* Click **🚨 Risk** to send an `account-compromised` event.

---

## 🔍 Verification

### **Check System Logs**

Go to **Reports → System Log** and search:

```
eventType eq "security.events.provider.receive_event"
```

### **Check Risk Detection (ITP)**

To test Risk events:

1. Ensure you have an **Entity Risk Policy** (Security → Entity Risk Policy) that sets risk to "High" when a signal is received.
2. Send the 🚨 **Risk** event.
3. Check the User Risk Report or user profile.

---

## 📂 Project Structure

```
app/page.tsx               # Frontend dashboard UI
app/api/transmit/route.ts  # Backend API for signing/transmitting SETs
app/utils/crypto.ts        # RSA key generation helpers
next.config.ts             # React Compiler configuration
eslint.config.mjs          # Linting for React Compiler compatibility
```

---

## ❓ Troubleshooting

| Error                     | Cause                                        | Fix                                                              |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **invalid_audience**      | `aud` claim doesn't match Okta's expectation | Ensure Okta domain is correct (no `-admin`, no trailing slash)   |
| **jwks_url is not valid** | Okta cannot read your JWKS URL               | Host JSON on npoint/mocky with proper `application/json` headers |
| **verification_failed**   | Signature mismatch                           | Update the JWKS URL if you regenerated keys                      |

---

## 📜 License

This project is open source under the **MIT License**.
