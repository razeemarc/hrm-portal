import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth accounts table (required for password auth)
  accounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_provider", ["provider", "providerAccountId"]),

  // Auth sessions table
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // User table - HR admin users
  users: defineTable({
    stackUserId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.string()), // "admin", "hr", "employee"
    passwordHash: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    status: v.optional(v.string()), // "active", "blocked"
    createdAt: v.number(),
    // Employee details for non-admin users
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dob: v.optional(v.number()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    manager: v.optional(v.string()),
    startDate: v.optional(v.number()),
    employeeId: v.optional(v.string()),
    salary: v.optional(v.number()),
    contractType: v.optional(v.string()),
    benefits: v.optional(v.string()),
    workSchedule: v.optional(v.string()),
  }).index("by_email", ["email"]),

  // Candidates table
  candidates: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    status: v.string(), // "invited", "pending", "in_review", "offered", "hired", "rejected"
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    package: v.optional(v.number()),
    offerType: v.optional(v.string()), // "intern", "employee"
    invitedAt: v.optional(v.number()),
    hiredAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Expanded employee fields
    address: v.optional(v.string()),
    dob: v.optional(v.number()),
    manager: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    benefits: v.optional(v.string()),
    workSchedule: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  // Documents table
  documents: defineTable({
    candidateId: v.id("candidates"),
    type: v.string(), // "resume", "id_proof", "photo", "certificate", "other"
    fileName: v.string(),
    fileUrl: v.string(),
    status: v.string(), // "pending", "verified", "rejected"
    uploadedAt: v.number(),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["status"]),

  // Attendance table
  attendance: defineTable({
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    checkIn: v.number(), // timestamp
    checkOut: v.optional(v.number()), // timestamp
    status: v.string(), // "present", "on_leave", "absent"
    workingHours: v.optional(v.number()), // in hours
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"]),

  // Offers table
  offers: defineTable({
    candidateId: v.id("candidates"),
    offerType: v.string(), // "intern", "employee"
    role: v.string(),
    department: v.string(),
    package: v.number(),
    packageType: v.string(), // "lpa" (Lakhs per Annum), "monthly" (per month), "stipend" (intern stipend)
    startDate: v.number(),
    expiryDate: v.number(),
    status: v.string(), // "pending", "accepted", "rejected", "expired"
    documentUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["status"]),

  // Invitations table
  invitations: defineTable({
    email: v.string(),
    candidateId: v.optional(v.id("candidates")),
    token: v.string(),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_candidate", ["candidateId"]),

  // Company Settings table
  company_settings: defineTable({
    companyName: v.string(),
    companyAddress: v.string(),
    hrEmail: v.string(),
    logoUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }),
});
