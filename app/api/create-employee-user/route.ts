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

    // Set role to 'employee' in metadata or custom field as requested
    // Note: Stack Auth roles are usually managed via metadata if not using built-in roles
    await user.update({
      metadata: {
        role: role || "employee",
      },
    });

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: "User created in Stack Auth successfully" 
    });

  } catch (error: any) {
    console.error("Stack Auth user creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user in Stack Auth" },
      { status: 500 }
    );
  }
}
