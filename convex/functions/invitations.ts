import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all invitations
export const getInvitations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invitations").collect();
  },
});

// Get invitation by token
export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    return invitation;
  },
});

// Get invitation by email
export const getInvitationByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return invitation;
  },
});

// Create invitation
export const createInvitation = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const invitationId = await ctx.db.insert("invitations", {
      ...args,
      createdAt: Date.now(),
    });
    return invitationId;
  },
});

// Mark invitation as used
export const useInvitation = mutation({
  args: {
    token: v.string(),
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    if (invitation.usedAt) {
      throw new Error("Invitation has already been used");
    }

    await ctx.db.patch(invitation._id, {
      usedAt: Date.now(),
      candidateId: args.candidateId,
    });

    // Update candidate status to "pending" (documents uploaded)
    await ctx.db.patch(args.candidateId, {
      status: "pending",
      invitedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return invitation._id;
  },
});

// Delete invitation
export const deleteInvitation = mutation({
  args: { id: v.id("invitations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

// Send invite email (creates invitation and returns token for email sending)
export const sendInvite = mutation({
  args: {
    email: v.string(),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already a valid invitation for this email
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing && !existing.usedAt && existing.expiresAt > Date.now()) {
      return existing;
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = await ctx.db.insert("invitations", {
      email: args.email,
      token,
      role: args.role,
      department: args.department,
      expiresAt,
      createdAt: Date.now(),
    });

    return { _id: invitationId, token, expiresAt };
  },
});