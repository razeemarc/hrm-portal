import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

export async function POST(req: NextRequest) {
  try {
    const { stackUserId, email, status } = await req.json();

    if (!status || (!stackUserId && !email)) {
      return NextResponse.json(
        { error: "Missing required fields: (stackUserId or email) and status" },
        { status: 400 }
      );
    }

    let user;
    if (stackUserId) {
      user = await stackServerApp.getUserById(stackUserId);
    } else if (email) {
      const users = await stackServerApp.listUsers({ query: email });
      user = users.find(u => u.primaryEmail?.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return NextResponse.json({ error: "User not found in authentication system" }, { status: 404 });
    }

    const role = user.serverMetadata?.role || user.clientReadOnlyMetadata?.role;

    await user.update({
      clientReadOnlyMetadata: {
        ...user.clientReadOnlyMetadata,
        status: status,
      },
      serverMetadata: {
        ...user.serverMetadata,
        status: status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
    });
  } catch (error: unknown) {
    console.error("Status update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
