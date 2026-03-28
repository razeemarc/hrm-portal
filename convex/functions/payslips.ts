import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all payslips with employee info
export const getPayslips = query({
  args: {},
  handler: async (ctx) => {
    const payslips = await ctx.db.query("payslips").collect();

    // Get employee info for each payslip
    const payslipsWithEmployees = await Promise.all(
      payslips.map(async (payslip) => {
        const employee = await ctx.db.get(payslip.employeeId);
        return { ...payslip, employee };
      })
    );

    return payslipsWithEmployees;
  },
});

// Get payslip by ID
export const getPayslipById = query({
  args: { id: v.id("payslips") },
  handler: async (ctx, args) => {
    const payslip = await ctx.db.get(args.id);
    if (payslip) {
      const employee = await ctx.db.get(payslip.employeeId);
      return { ...payslip, employee };
    }
    return null;
  },
});

// Get payslips by employee ID
export const getPayslipsByEmployee = query({
  args: { employeeId: v.id("candidates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payslips")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
  },
});

// Get payslips by month
export const getPayslipsByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const payslips = await ctx.db
      .query("payslips")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    const payslipsWithEmployees = await Promise.all(
      payslips.map(async (payslip) => {
        const employee = await ctx.db.get(payslip.employeeId);
        return { ...payslip, employee };
      })
    );

    return payslipsWithEmployees;
  },
});

// Get payslips by status
export const getPayslipsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const payslips = await ctx.db
      .query("payslips")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const payslipsWithEmployees = await Promise.all(
      payslips.map(async (payslip) => {
        const employee = await ctx.db.get(payslip.employeeId);
        return { ...payslip, employee };
      })
    );

    return payslipsWithEmployees;
  },
});

// Get hired candidates (employees) for selection
export const getEmployees = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_status", (q) => q.eq("status", "hired"))
      .collect();

    return candidates;
  },
});

// Create payslip
export const createPayslip = mutation({
  args: {
    employeeId: v.id("candidates"),
    month: v.string(),
    year: v.number(),
    baseSalary: v.number(),
    houseRentAllowance: v.optional(v.number()),
    conveyanceAllowance: v.optional(v.number()),
    specialAllowance: v.optional(v.number()),
    otherAllowances: v.optional(v.number()),
    providentFund: v.optional(v.number()),
    professionalTax: v.optional(v.number()),
    incomeTax: v.optional(v.number()),
    otherDeductions: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate totals
    const allowances =
      (args.houseRentAllowance || 0) +
      (args.conveyanceAllowance || 0) +
      (args.specialAllowance || 0) +
      (args.otherAllowances || 0);

    const deductions =
      (args.providentFund || 0) +
      (args.professionalTax || 0) +
      (args.incomeTax || 0) +
      (args.otherDeductions || 0);

    const grossEarnings = args.baseSalary + allowances;
    const totalDeductions = deductions;
    const netSalary = grossEarnings - totalDeductions;

    const payslipId = await ctx.db.insert("payslips", {
      ...args,
      grossEarnings,
      totalDeductions,
      netSalary,
      status: args.status || "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return payslipId;
  },
});

// Update payslip
export const updatePayslip = mutation({
  args: {
    id: v.id("payslips"),
    baseSalary: v.optional(v.number()),
    houseRentAllowance: v.optional(v.number()),
    conveyanceAllowance: v.optional(v.number()),
    specialAllowance: v.optional(v.number()),
    otherAllowances: v.optional(v.number()),
    providentFund: v.optional(v.number()),
    professionalTax: v.optional(v.number()),
    incomeTax: v.optional(v.number()),
    otherDeductions: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const payslip = await ctx.db.get(id);

    if (!payslip) {
      throw new Error("Payslip not found");
    }

    // Recalculate totals if salary components are being updated
    const baseSalary = updates.baseSalary ?? payslip.baseSalary;
    const houseRentAllowance = updates.houseRentAllowance ?? payslip.houseRentAllowance ?? 0;
    const conveyanceAllowance = updates.conveyanceAllowance ?? payslip.conveyanceAllowance ?? 0;
    const specialAllowance = updates.specialAllowance ?? payslip.specialAllowance ?? 0;
    const otherAllowances = updates.otherAllowances ?? payslip.otherAllowances ?? 0;
    const providentFund = updates.providentFund ?? payslip.providentFund ?? 0;
    const professionalTax = updates.professionalTax ?? payslip.professionalTax ?? 0;
    const incomeTax = updates.incomeTax ?? payslip.incomeTax ?? 0;
    const otherDeductions = updates.otherDeductions ?? payslip.otherDeductions ?? 0;

    const allowances =
      houseRentAllowance + conveyanceAllowance + specialAllowance + otherAllowances;
    const deductions = providentFund + professionalTax + incomeTax + otherDeductions;
    const grossEarnings = baseSalary + allowances;
    const totalDeductions = deductions;
    const netSalary = grossEarnings - totalDeductions;

    await ctx.db.patch(id, {
      ...updates,
      grossEarnings,
      totalDeductions,
      netSalary,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Update payslip status
export const updatePayslipStatus = mutation({
  args: {
    id: v.id("payslips"),
    status: v.string(),
    paymentDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const payslip = await ctx.db.get(id);

    if (!payslip) {
      throw new Error("Payslip not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete payslip
export const deletePayslip = mutation({
  args: { id: v.id("payslips") },
  handler: async (ctx, args) => {
    const payslip = await ctx.db.get(args.id);
    if (!payslip) {
      throw new Error("Payslip not found");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
