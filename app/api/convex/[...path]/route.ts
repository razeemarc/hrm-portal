import { NextRequest, NextResponse } from "next/server";

// Convex API handler - in development, this forwards to the dev server
// In production, this would connect to a deployed Convex backend
export async function POST(request: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";

  // In development, the Convex dev server runs separately
  // This is just a placeholder - actual implementation depends on deployment
  try {
    const body = await request.text();
    const path = request.nextUrl.pathname.replace("/api/convex/", "");

    const response = await fetch(`${convexUrl}/api/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Convex backend not available. Run 'npx convex dev' to start." },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";

  try {
    const path = request.nextUrl.pathname.replace("/api/convex/", "");

    const response = await fetch(`${convexUrl}/api/${path}`, {
      method: "GET",
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Convex backend not available. Run 'npx convex dev' to start." },
      { status: 503 }
    );
  }
}