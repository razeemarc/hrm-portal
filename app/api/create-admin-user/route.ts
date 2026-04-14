import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, and name" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPassword = String(password);

    let user;

    try {
      user = await stackServerApp.createUser({
        primaryEmail: normalizedEmail,
        primaryEmailAuthEnabled: true,
        primaryEmailVerified: true,
        password: normalizedPassword,
        displayName: normalizedName,
        clientReadOnlyMetadata: {
          role: "admin",
        },
        serverMetadata: {
          role: "admin",
        },
      });
    } catch (error) {
      const existingUsers = await stackServerApp.listUsers({
        query: normalizedEmail,
        includeRestricted: true,
      });

      user =
        existingUsers.find(
          (candidate) => candidate.primaryEmail?.toLowerCase() === normalizedEmail
        ) ?? null;

      if (!user) {
        throw error;
      }
    }

    await user.update({
      primaryEmail: normalizedEmail,
      primaryEmailAuthEnabled: true,
      primaryEmailVerified: true,
      password: normalizedPassword,
      displayName: normalizedName,
      clientReadOnlyMetadata: {
        role: "admin",
      },
      serverMetadata: {
        role: "admin",
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "User created in Stack Auth successfully as an admin",
    });
  } catch (error: unknown) {
    console.error("Stack Auth admin creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create admin user in Stack Auth";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
