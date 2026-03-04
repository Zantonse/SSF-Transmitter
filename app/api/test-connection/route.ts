import { NextRequest, NextResponse } from 'next/server';

/**
 * Sanitizes an Okta domain by removing protocol, trailing slashes, and -admin suffix
 */
function sanitizeDomain(domain: string): string {
  let sanitized = domain.trim();

  // Remove https:// or http://
  sanitized = sanitized.replace(/^https?:\/\//, '');

  // Remove trailing slashes
  sanitized = sanitized.replace(/\/$/, '');

  // Remove -admin suffix
  if (sanitized.endsWith('-admin.okta.com')) {
    sanitized = sanitized.replace('-admin.okta.com', '.okta.com');
  }

  return sanitized;
}

/**
 * POST /api/test-connection
 * Tests whether an Okta security events endpoint is reachable
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oktaDomain } = body;

    // Validate input
    if (!oktaDomain || typeof oktaDomain !== 'string') {
      return NextResponse.json(
        { reachable: false, message: 'oktaDomain is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize the domain
    const sanitizedDomain = sanitizeDomain(oktaDomain);

    // Validate that we have a valid domain after sanitization
    if (!sanitizedDomain || sanitizedDomain.length === 0) {
      return NextResponse.json(
        { reachable: false, message: 'Invalid Okta domain format' },
        { status: 400 }
      );
    }

    // Construct the Okta endpoint
    const endpoint = `https://${sanitizedDomain}/security/api/v1/security-events`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Send HEAD request to check if endpoint is reachable
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      // Any response (including 4xx) means the endpoint exists and is reachable
      return NextResponse.json(
        {
          reachable: true,
          message: 'Okta endpoint reachable',
          status: response.status,
        },
        { status: 200 }
      );
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          {
            reachable: false,
            message: 'Request timeout — endpoint unreachable or too slow',
          },
          { status: 408 }
        );
      }

      // Any other fetch error means endpoint is not reachable
      return NextResponse.json(
        {
          reachable: false,
          message: 'Cannot reach endpoint — check domain',
        },
        { status: 503 }
      );
    }
  } catch {
    // JSON parsing error or other server error
    return NextResponse.json(
      {
        reachable: false,
        message: 'Server error processing request',
      },
      { status: 500 }
    );
  }
}
