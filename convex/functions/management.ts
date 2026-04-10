import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAttendanceManagement = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const [users, attendanceRecords] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db
        .query("attendance")
        .withIndex("by_date", (q) => q.eq("date", args.date))
        .collect(),
    ]);

    const attendanceByUserId = new Map(
      attendanceRecords.map((record) => [record.userId, record])
    );

    return users
      .filter((user) => user.role === "employee")
      .map((user) => {
        const attendance = attendanceByUserId.get(user._id);
        const status = attendance ? attendance.status || "present" : "absent";

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          jobTitle: user.jobTitle,
          employeeId: user.employeeId,
          status,
          checkIn: attendance?.checkIn,
          checkOut: attendance?.checkOut,
          workingHours: attendance?.workingHours,
          attendanceId: attendance?._id,
          date: args.date,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
