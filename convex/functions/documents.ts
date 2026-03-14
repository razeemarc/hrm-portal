import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all documents
export const getDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

// Get document by ID
export const getDocumentById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get documents by candidate ID
export const getDocumentsByCandidate = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
  },
});

// Get pending documents (for verification queue)
export const getPendingDocuments = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get candidate info for each document
    const docsWithCandidates = await Promise.all(
      docs.map(async (doc) => {
        const candidate = await ctx.db.get(doc.candidateId);
        return { ...doc, candidate };
      })
    );

    return docsWithCandidates;
  },
});

// Get documents by status
export const getDocumentsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Create document (uploaded by candidate)
export const createDocument = mutation({
  args: {
    candidateId: v.id("candidates"),
    type: v.string(),
    fileName: v.string(),
    fileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      ...args,
      status: "pending",
      uploadedAt: Date.now(),
    });
    return docId;
  },
});

// Verify document
export const verifyDocument = mutation({
  args: {
    id: v.id("documents"),
    status: v.string(), // "verified" or "rejected"
    verifiedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      verifiedAt: Date.now(),
      verifiedBy: args.verifiedBy,
    });

    // If document is verified, check if all required documents are verified
    // If so, update candidate status to in_review
    if (args.status === "verified") {
      const allDocs = await ctx.db
        .query("documents")
        .withIndex("by_candidate", (q) => q.eq("candidateId", doc.candidateId))
        .collect();

      const pendingDocs = allDocs.filter((d) => d.status === "pending");
      if (pendingDocs.length === 0) {
        // All documents are verified, move to in_review
        await ctx.db.patch(doc.candidateId, {
          status: "in_review",
          updatedAt: Date.now(),
        });
      }
    }

    return args.id;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});