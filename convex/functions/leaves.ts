import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const applyForLeave = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leave_requests", {
      userId: args.userId,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      status: "pending",
      appliedAt: Date.now(),
    });
  },
});

export const getMyLeaves = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leave_requests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getAllLeaves = query({
  handler: async (ctx) => {
    const leaves = await ctx.db.query("leave_requests").order("desc").collect();
    
    // Enrich with user details
    const leavesWithUser = await Promise.all(
      leaves.map(async (leave) => {
        const user = await ctx.db.get(leave.userId);
        return {
          ...leave,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
        };
      })
    );
    
    return leavesWithUser;
  },
});

export const updateLeaveStatus = mutation({
  args: {
    leaveId: v.id("leave_requests"),
    status: v.string(),
    processedBy: v.id("users"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leaveId, {
      status: args.status,
      processedAt: Date.now(),
      processedBy: args.processedBy,
      comments: args.comments,
    });
    
    // If approved, we could also automatically update the attendance table
    // but usually leave management is separate from daily check-ins.
    return args.leaveId;
  },
});
