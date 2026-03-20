import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all documents
export const getDocuments = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

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

// Generate a Convex file upload URL (step 1 of 2 for file uploads)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create document record after upload (step 2 of 2)
export const createDocument = mutation({
  args: {
    candidateId: v.id("candidates"),
    type: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("Failed to get file URL");
    const docId = await ctx.db.insert("documents", {
      candidateId: args.candidateId,
      type: args.type,
      fileName: args.fileName,
      fileUrl,
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
    verifiedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      verifiedAt: Date.now(),
      ...(args.verifiedBy ? { verifiedBy: args.verifiedBy } : {}),
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

// Delete document (and its file from storage)
export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});