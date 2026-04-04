import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get attendance for a user
export const getAttendance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get attendance for a user on a specific date
export const getAttendanceByDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();
  },
});

// Check in
export const checkIn = mutation({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", args.date))
      .first();

    if (existing) {
      throw new Error("Already checked in for today");
    }

    const now = Date.now();
    return await ctx.db.insert("attendance", {
      userId: args.userId,
      date: args.date,
      checkIn: now,
      status: "present",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Check out
export const checkOut = mutation({
  args: { attendanceId: v.id("attendance") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.attendanceId);
    if (!existing) {
      throw new Error("Attendance record not found");
    }

    if (existing.checkOut) {
      throw new Error("Already checked out for today");
    }

    const now = Date.now();
    const workingHours = (now - existing.checkIn) / (1000 * 60 * 60);

    await ctx.db.patch(args.attendanceId, {
      checkOut: now,
      workingHours,
      updatedAt: now,
    });

    return args.attendanceId;
  },
});
