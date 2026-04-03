import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, and name" },
        { status: 400 }
      );
    }

    // Create user in Stack Auth
    const user = await stackServerApp.createUser({
      primaryEmail: email,
      password: password,
      displayName: name,
    });

    // Ensure role is 'employee' in all metadata types for redundancy and access
    // Stack Auth UI separates Client, Client Read-Only, and Server metadata
    await user.update({
      clientReadOnlyMetadata: {
        role: "employee",
      },
      serverMetadata: {
        role: "employee",
      },
    });

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: "User created in Stack Auth successfully as an employee" 
    });

  } catch (error: any) {
    console.error("Stack Auth user creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user in Stack Auth" },
      { status: 500 }
    );
  }
}
