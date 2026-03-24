import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";

// Get company settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("company_settings").first();
    return settings || {
      companyName: "Ladder Academy",
      companyAddress: "123 Tech Street, San Francisco, CA",
      hrEmail: "hr@ladderacademy.com",
      logoUrl: undefined,
    };
  },
});

// Update company settings
export const updateSettings = mutation({
  args: {
    companyName: v.string(),
    companyAddress: v.string(),
    hrEmail: v.string(),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("company_settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("company_settings", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});

// Generate an upload URL for files (e.g. logo)
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get public URL from storage ID
export const getStorageUrl = action({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
