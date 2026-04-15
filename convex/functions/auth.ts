import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    if (!identity.email) return null;

    const normalizedEmail = normalizeEmail(identity.email);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    return user;
  },
});

// Get user by email for Stack-authenticated client flows
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create user (registration)
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name,
      passwordHash: args.passwordHash,
      role: "admin",
      createdAt: Date.now(),
    });

    // Create auth account
    await ctx.db.insert("accounts", {
      userId,
      provider: "password",
      providerAccountId: normalizedEmail,
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// List all users
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Update current user profile
export const updateUserProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Create employee user (after stack auth account creation)
export const createEmployeeUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dob: v.optional(v.number()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    manager: v.optional(v.string()),
    startDate: v.optional(v.number()),
    employeeId: v.optional(v.string()),
    salary: v.optional(v.number()),
    contractType: v.optional(v.string()),
    benefits: v.optional(v.string()),
    workSchedule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        email: normalizedEmail,
        role: "admin",
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      email: normalizedEmail,
      role: "admin",
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const createManagementUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const normalizedRole = args.role.trim().toLowerCase();

    if (!["hr", "accountant"].includes(normalizedRole)) {
      throw new Error("Role must be either hr or accountant");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: normalizedEmail,
        name: args.name.trim(),
        role: normalizedRole,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name.trim(),
      role: normalizedRole,
      createdAt: Date.now(),
    });
  },
});

// Sync user from Stack Auth identity
export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.email) {
      return null;
    }

    const normalizedEmail = normalizeEmail(args.email);
    const role = "admin";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: normalizedEmail,
        role: existing.role ?? role,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        email: normalizedEmail,
        name: args.name,
        role,
        createdAt: Date.now(),
      });
    }
  },
});
