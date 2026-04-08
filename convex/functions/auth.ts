import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRoleFromIdentity(identity: { role?: string | null; client_metadata?: { role?: string | null } | null; clientMetadata?: { role?: string | null } | null; client_read_only_metadata?: { role?: string | null } | null; clientReadOnlyMetadata?: { role?: string | null } | null; server_metadata?: { role?: string | null } | null; serverMetadata?: { role?: string | null } | null; }) {
  return (
    identity.role ||
    identity.clientMetadata?.role ||
    identity.client_metadata?.role ||
    identity.clientReadOnlyMetadata?.role ||
    identity.client_read_only_metadata?.role ||
    identity.serverMetadata?.role ||
    identity.server_metadata?.role ||
    undefined
  );
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
        role: "employee",
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      email: normalizedEmail,
      role: "employee",
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Sync user from Stack Auth identity
export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!identity.email) throw new Error("Authenticated user has no email");

    const normalizedEmail = normalizeEmail(args.email || identity.email);
    const role = getRoleFromIdentity(identity) ?? "admin";

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
