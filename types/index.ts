export type CandidateStatus =
  | "invited"
  | "pending"
  | "in_review"
  | "offered"
  | "hired"
  | "rejected";

export type DocumentType =
  | "resume"
  | "id_proof"
  | "photo"
  | "certificate"
  | "other";

export type DocumentStatus = "pending" | "verified" | "rejected";

export type OfferType = "intern" | "employee";

export type OfferStatus = "pending" | "accepted" | "rejected" | "expired";

export interface User {
  _id: string;
  email: string;
  name: string;
  role?: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface Candidate {
  _id: string;
  userId?: string;
  email: string;
  name: string;
  phone?: string;
  status: CandidateStatus;
  role?: string;
  department?: string;
  package?: number;
  offerType?: OfferType;
  invitedAt?: number;
  hiredAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  _id: string;
  candidateId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: number;
  verifiedAt?: number;
  verifiedBy?: string;
  candidate?: Candidate;
}

export interface Offer {
  _id: string;
  candidateId: string;
  offerType: OfferType;
  role: string;
  department: string;
  package: number;
  startDate: number;
  expiryDate: number;
  status: OfferStatus;
  documentUrl?: string;
  createdAt: number;
  candidate?: Candidate;
}

export interface Invitation {
  _id: string;
  email: string;
  candidateId?: string;
  token: string;
  role?: string;
  department?: string;
  expiresAt: number;
  usedAt?: number;
  createdAt: number;
}

export interface DashboardStats {
  totalCandidates: number;
  pendingReviews: number;
  newHires: number;
  offered: number;
  newHiresThisMonth: number;
  pendingDocuments: number;
}