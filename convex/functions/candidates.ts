import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all candidates
export const getCandidates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("candidates").collect();
  },
});

// Get candidate by ID
export const getCandidateById = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get candidate by email
export const getCandidateByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get candidates by status
export const getCandidatesByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get dashboard stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allCandidates = await ctx.db.query("candidates").collect();

    const totalCandidates = allCandidates.length;
    const pendingReviews = allCandidates.filter((c) => c.status === "in_review").length;
    const newHires = allCandidates.filter((c) => c.status === "hired").length;
    const offered = allCandidates.filter((c) => c.status === "offered").length;

    // Calculate new hires this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newHiresThisMonth = allCandidates.filter(
      (c) => c.status === "hired" && c.hiredAt && c.hiredAt >= startOfMonth.getTime()
    ).length;

    // Get pending documents count
    const pendingDocuments = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      totalCandidates,
      pendingReviews,
      newHires,
      offered,
      newHiresThisMonth,
      pendingDocuments: pendingDocuments.length,
    };
  },
});

// Create candidate
export const createCandidate = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const candidateId = await ctx.db.insert("candidates", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return candidateId;
  },
});

// Update candidate
export const updateCandidate = mutation({
  args: {
    id: v.id("candidates"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    package: v.optional(v.number()),
    status: v.optional(v.string()),
    offerType: v.optional(v.string()),
    hiredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const candidate = await ctx.db.get(id);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Delete candidate
export const deleteCandidate = mutation({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => {
    // Delete related documents and offers first
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    const offers = await ctx.db
      .query("offers")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
      .collect();

    for (const offer of offers) {
      await ctx.db.delete(offer._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

// Update candidate status (move through pipeline)
export const updateCandidateStatus = mutation({
  args: {
    id: v.id("candidates"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "hired") {
      updates.hiredAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});