import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all offers
export const getOffers = query({
  args: {},
  handler: async (ctx) => {
    const offers = await ctx.db.query("offers").collect();

    // Get candidate info for each offer
    const offersWithCandidates = await Promise.all(
      offers.map(async (offer) => {
        const candidate = await ctx.db.get(offer.candidateId);
        return { ...offer, candidate };
      })
    );

    return offersWithCandidates;
  },
});

// Get offer by ID
export const getOfferById = query({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.id);
    if (offer) {
      const candidate = await ctx.db.get(offer.candidateId);
      return { ...offer, candidate };
    }
    return null;
  },
});

// Get offers by candidate ID
export const getOffersByCandidate = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("offers")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
  },
});

// Get offer by status
export const getOffersByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const offers = await ctx.db
      .query("offers")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const offersWithCandidates = await Promise.all(
      offers.map(async (offer) => {
        const candidate = await ctx.db.get(offer.candidateId);
        return { ...offer, candidate };
      })
    );

    return offersWithCandidates;
  },
});

// Create offer
export const createOffer = mutation({
  args: {
    candidateId: v.id("candidates"),
    offerType: v.string(),
    role: v.string(),
    department: v.string(),
    package: v.number(),
    packageType: v.string(), // "lpa", "monthly", "stipend"
    startDate: v.number(),
    expiryDate: v.number(),
    storageId: v.optional(v.string()), // storageId from upload
    documentUrl: v.optional(v.string()), // optional for backwards compatibility
  },
  handler: async (ctx, args) => {
    const { storageId, ...rest } = args;
    let documentUrl = undefined;
    
    if (storageId) {
      documentUrl = await ctx.storage.getUrl(storageId as any) || undefined;
    }

    const offerId = await ctx.db.insert("offers", {
      ...rest,
      documentUrl,
      status: "pending",
      createdAt: Date.now(),
    });

    // Update candidate status to "offered"
    await ctx.db.patch(args.candidateId, {
      status: "offered",
      offerType: args.offerType,
      role: args.role,
      department: args.department,
      package: args.package,
      updatedAt: Date.now(),
    });

    return offerId;
  },
});

// Update offer status
export const updateOfferStatus = mutation({
  args: {
    id: v.id("offers"),
    status: v.string(),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const offer = await ctx.db.get(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    await ctx.db.patch(id, updates);

    // If offer is accepted, mark candidate as hired
    if (args.status === "accepted") {
      await ctx.db.patch(offer.candidateId, {
        status: "hired",
        hiredAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return id;
  },
});

// Delete offer
export const deleteOffer = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});