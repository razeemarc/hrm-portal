import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { convex } from "@convex-dev/auth/server";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await convex.runQuery(
      async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first();
      },
      { email }
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = Date.now();

    const userId = await convex.runMutation(
      async (ctx) => {
        return await ctx.db.insert("users", {
          email,
          name,
          passwordHash,
          role: "admin",
          createdAt: now,
        });
      },
      {}
    );

    // Create auth account
    await convex.runMutation(
      async (ctx) => {
        return await ctx.db.insert("accounts", {
          userId,
          provider: "password",
          providerAccountId: email,
          passwordHash,
          createdAt: now,
        });
      },
      {}
    );

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}