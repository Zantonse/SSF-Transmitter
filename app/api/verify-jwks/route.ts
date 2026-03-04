import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, expectedKid } = body;

    if (!url || !expectedKid) {
      return NextResponse.json(
        { valid: false, message: "Missing 'url' or 'expectedKid' in request body" },
        { status: 400 }
      );
    }

    // Fetch the JWKS URL with a 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, message: "Could not reach URL" },
        { status: 200 }
      );
    }

    let jwksData;
    try {
      jwksData = await response.json();
    } catch {
      return NextResponse.json(
        { valid: false, message: "Response is not valid JSON" },
        { status: 200 }
      );
    }

    if (!Array.isArray(jwksData.keys)) {
      return NextResponse.json(
        { valid: false, message: "JSON does not contain a 'keys' array" },
        { status: 200 }
      );
    }

    const keyFound = jwksData.keys.some((key: { kid?: string }) => key.kid === expectedKid);

    if (!keyFound) {
      return NextResponse.json(
        { valid: false, message: "No key found with matching kid" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { valid: true, message: "JWKS verified — kid matches" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, message: "Could not reach URL" },
      { status: 200 }
    );
  }
}
