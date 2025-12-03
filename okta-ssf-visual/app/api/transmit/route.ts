import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

interface TransmitRequest {
  oktaDomain: string;
  issuerUrl: string;
  privateKeyPem: string;
  keyId: string;
  subjectEmail: string;
  eventType: 'risk' | 'lifecycle';
}

export async function POST(req: NextRequest) {
  try {
    const body: TransmitRequest = await req.json();
    
    // 1. Hostname Sanitization
    let inputDomain = body.oktaDomain.trim();
    if (!inputDomain.startsWith('http')) {
        inputDomain = `https://${inputDomain}`;
    }
    
    let oktaHost;
    try {
        oktaHost = new URL(inputDomain).hostname;
    } catch (e) {
        throw new Error(`Could not parse Okta Domain: ${body.oktaDomain}`);
    }

    const issuerUrl = body.issuerUrl.trim();
    const subjectEmail = body.subjectEmail.trim();
    const { privateKeyPem, keyId, eventType } = body;

    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

    // 2. Determine Payload based on Event Type
    let eventsPayload = {};
    const timestamp = Math.floor(Date.now() / 1000);

    if (eventType === 'risk') {
      // 🛡️ Okta ITP Specific Event: User Risk Change
      // This creates a user.risk.detect event in Okta
      eventsPayload = {
        'https://schemas.okta.com/secevent/okta/event-type/user-risk-change': {
          event_timestamp: timestamp,
          current_level: "high",
          previous_level: "low",
          initiating_entity: "system",
          reason_admin: { "en": "External provider reported account compromise" },
          subject: {
            user: {
              format: "email",
              email: subjectEmail,
            }
          }
        },
      };
    } else {
      // Default: Lifecycle (Session Revoked)
      eventsPayload = {
        'https://schemas.openid.net/secevent/risc/event-type/session-revoked': {
          subject: {
            format: 'email',
            email: subjectEmail,
          },
        },
      };
    }

    // 3. Construct the SET
    const tokenAudience = `https://${oktaHost}`; 
    const destinationEndpoint = `https://${oktaHost}/security/api/v1/security-events`;

    const payload = {
      iss: issuerUrl,
      iat: timestamp,
      jti: uuidv4(),
      aud: tokenAudience,
      events: eventsPayload,
    };

    console.log(`[Server] Sending ${eventType} event to: ${destinationEndpoint}`);

    // 4. Sign and Send
    const signedJwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'secevent+jwt' })
      .setIssuedAt()
      .setIssuer(issuerUrl)
      .setAudience(payload.aud)
      .sign(privateKey);

    const response = await fetch(destinationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/secevent+jwt',
        'Accept': 'application/json',
      },
      body: signedJwt,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `Okta Rejected Payload.`,
        details: errorText,
        debugAudience: tokenAudience,
        status: response.status,
        payload // Return payload even on failure for debugging
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      jwt: signedJwt,
      payload, // Return the payload so frontend can display it
      logs: `Successfully sent ${eventType} event to ${destinationEndpoint}. Status: ${response.status}` 
    });

  } catch (error: any) {
    console.error("[Server Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}