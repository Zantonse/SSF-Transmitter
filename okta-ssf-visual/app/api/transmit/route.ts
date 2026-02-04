import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { PROVIDERS } from '../../config/providers';

interface TransmitRequest {
  oktaDomain: string;
  issuerUrl: string;
  privateKeyPem: string;
  keyId: string;
  subjectEmail: string;
  providerId: string;
  eventId: string;
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
    } catch {
      throw new Error(`Could not parse Okta Domain: ${body.oktaDomain}`);
    }

    const issuerUrl = body.issuerUrl.trim();
    const subjectEmail = body.subjectEmail.trim();
    const { privateKeyPem, keyId, providerId, eventId } = body;

    // 2. Lookup Provider and Event
    const provider = PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    const event = provider.events.find((e) => e.id === eventId);
    if (!event) {
      throw new Error(`Unknown event "${eventId}" for provider "${providerId}"`);
    }

    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

    // 3. Build Payload using event's buildPayload function
    const timestamp = Math.floor(Date.now() / 1000);
    const eventsPayload = event.buildPayload(subjectEmail, timestamp, provider.name);

    // 4. Construct the SET
    const tokenAudience = `https://${oktaHost}`;
    const destinationEndpoint = `https://${oktaHost}/security/api/v1/security-events`;

    const payload = {
      iss: issuerUrl,
      iat: timestamp,
      jti: uuidv4(),
      aud: tokenAudience,
      events: eventsPayload,
    };

    console.log(`[Server] Sending ${provider.name} - ${event.label} to: ${destinationEndpoint}`);

    // 5. Sign and Send
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
        Accept: 'application/json',
      },
      body: signedJwt,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorCode = '';
      let errorDescription = '';

      // Try to parse Okta's JSON error response
      try {
        const errorJson = JSON.parse(errorText);
        errorCode = errorJson.error || errorJson.errorCode || '';
        errorDescription = errorJson.error_description || errorJson.errorSummary || errorText;
      } catch {
        errorDescription = errorText || `HTTP ${response.status}`;
      }

      // Provide helpful hints based on common error codes
      let hint = '';
      if (errorCode === 'invalid_request' || errorDescription.includes('issuer')) {
        hint = 'Check that the Issuer URL matches your Okta SSF stream configuration exactly.';
      } else if (errorDescription.includes('jwks') || errorDescription.includes('key') || errorDescription.includes('signature')) {
        hint = 'JWKS verification failed. Ensure your hosted JWKS contains the current public key.';
      } else if (errorDescription.includes('audience') || errorDescription.includes('aud')) {
        hint = 'Audience mismatch. Ensure Okta domain has no -admin suffix or trailing slash.';
      } else if (response.status === 400) {
        hint = 'Okta rejected the request. Verify SSF stream is configured with matching Issuer URL and JWKS.';
      } else if (response.status === 401 || response.status === 403) {
        hint = 'Authentication failed. Check that your JWKS is accessible and contains the correct key.';
      }

      console.error(`[Okta Error] ${response.status}: ${errorCode} - ${errorDescription}`);

      return NextResponse.json(
        {
          success: false,
          error: errorCode || `Okta Error (${response.status})`,
          errorDescription,
          hint,
          details: errorText,
          debugInfo: {
            audience: tokenAudience,
            issuer: issuerUrl,
            endpoint: destinationEndpoint,
            keyId,
          },
          status: response.status,
          payload,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      jwt: signedJwt,
      payload,
      logs: `Successfully sent ${provider.name} - ${event.label} to ${destinationEndpoint}. Status: ${response.status}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Server Error]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
