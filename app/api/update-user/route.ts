import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

export async function POST(req: NextRequest) {
  try {
    const { stackUserId, email, name, role } = await req.json();

    if (!name || !email || !role || (!stackUserId && !email)) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, role, and (stackUserId or email)" },
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

    await user.update({
      displayName: name,
      primaryEmail: email,
      clientReadOnlyMetadata: {
        ...user.clientReadOnlyMetadata,
        role: role,
      },
      serverMetadata: {
        ...user.serverMetadata,
        role: role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error: unknown) {
    console.error("User update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
