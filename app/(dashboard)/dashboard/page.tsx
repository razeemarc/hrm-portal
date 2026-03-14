"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, Offer, UserCheck, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/generated";

export default function DashboardPage() {
  // We'll use mock data for now since Convy might not be running
  const stats = {
    totalCandidates: 0,
    pendingReviews: 0,
    newHires: 0,
    newHiresThisMonth: 0,
    offered: 0,
    pendingDocuments: 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
            <p className="text-xs text-gray-500 mt-1">
              In the hiring pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting document verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offered</CardTitle>
            <Offer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offered}</div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newHiresThisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">No recent activity</span>
              </div>
              <p className="text-sm text-gray-500">
                Activity will appear here when candidates are invited or documents are uploaded.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/candidates?invite=true"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">Invite New Candidate</div>
                <div className="text-xs text-gray-500">Send invite link to potential candidate</div>
              </a>
              <a
                href="/documents"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">Review Documents</div>
                <div className="text-xs text-gray-500">Verify pending candidate documents</div>
              </a>
              <a
                href="/offers"
                className="block p-3 rounded-md border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">Create Offer Letter</div>
                <div className="text-xs text-gray-500">Generate offer for qualified candidate</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}