import { convex } from "@convex-dev/auth/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return convex.handleNextRequest(request);
}

export async function GET(request: NextRequest) {
  return convex.handleNextRequest(request);
}