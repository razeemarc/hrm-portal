"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileCheck,
  ScrollText,
  UserCheck,
  Clock,
  Loader2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-purple-100 text-purple-800",
  offered: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const stats = useQuery(api.functions.candidates.getDashboardStats);
  const recentCandidates = useQuery(api.functions.candidates.getCandidates);

  const recent = recentCandidates
    ? [...recentCandidates]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
    : [];

  const isLoading = stats === undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.totalCandidates}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  In the hiring pipeline
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting document verification
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offered</CardTitle>
            <ScrollText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.offered}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.newHiresThisMonth}
                </div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Candidates from Convex */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCandidates === undefined ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recent.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-600">No recent activity</span>
                </div>
                <p className="text-sm text-gray-500">
                  Activity will appear here when candidates are invited or
                  documents are uploaded.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((c) => (
                  <Link
                    key={c._id}
                    href={`/admin/candidates/${c._id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    </div>
                    <Badge
                      className={
                        statusColors[c.status] ??
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {c.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/admin/candidates?invite=true"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">Invite New Candidate</div>
                <div className="text-xs text-gray-500">
                  Send invite link to potential candidate
                </div>
              </a>
              <a
                href="/admin/documents"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm flex items-center gap-2">
                  Review Documents
                  {stats && stats.pendingDocuments > 0 && (
                    <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs">
                      {stats.pendingDocuments} pending
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Verify pending candidate documents
                </div>
              </a>
              <a
                href="/admin/offers"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">Create Offer Letter</div>
                <div className="text-xs text-gray-500">
                  Generate offer for qualified candidate
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}