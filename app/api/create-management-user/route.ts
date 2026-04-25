import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

const allowedRoles = new Set(["hr", "accountant", "admin", "employee"]);

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, and role" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPassword = String(password);
    const normalizedRole = String(role).trim().toLowerCase();

    if (!allowedRoles.has(normalizedRole)) {
      return NextResponse.json(
        { error: "Role must be either hr, accountant, admin, or employee" },
        { status: 400 }
      );
    }

    let user;

    try {
      user = await stackServerApp.createUser({
        primaryEmail: normalizedEmail,
        primaryEmailAuthEnabled: true,
        primaryEmailVerified: true,
        password: normalizedPassword,
        displayName: normalizedName,
        clientReadOnlyMetadata: {
          role: normalizedRole,
          status: "active",
        },
        serverMetadata: {
          role: normalizedRole,
          status: "active",
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
        role: normalizedRole,
        status: "active",
      },
      serverMetadata: {
        role: normalizedRole,
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Management user created successfully",
    });
  } catch (error: unknown) {
    console.error("Management user creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create management user";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
