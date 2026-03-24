"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Loader2, Mail, Phone, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function OffersPage() {
  // ── Convex queries ──
  const offersData = useQuery(api.functions.offers.getOffers);
  const settings = useQuery(api.functions.settings.getSettings);

  const offers = offersData ?? [];
  const companyName = settings?.companyName || "Ladder Academy";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Offer Letters</h1>
        <Link href="/offers/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{offers.length}</div>
                <div className="text-sm text-gray-500">Total Offers</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {offers.filter((o) => o.status === "pending").length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {offers.filter((o) => o.status === "accepted").length}
                </div>
                <div className="text-sm text-gray-500">Accepted</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {offers.filter((o) => o.status === "rejected").length}
                </div>
                <div className="text-sm text-gray-500">Rejected</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardContent className="p-0">
          {offersData === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No offers created yet
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell>
                        <div className="font-medium hover:underline">
                          <Link href={`/candidates/${offer.candidateId}`}>
                            {offer.candidate?.name ?? "Unknown"}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${offer.candidate?.email}`}
                            className="hover:text-blue-600 hover:underline"
                            title="Send email"
                          >
                            {offer.candidate?.email ?? ""}
                          </a>
                        </div>
                        {offer.candidate?.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {offer.candidate.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {offer.offerType === "intern" ? "Intern" : "Employee"}
                        </Badge>
                      </TableCell>
                      <TableCell>{offer.role}</TableCell>
                      <TableCell>
                        {offer.packageType === "lpa"
                          ? `₹${(offer.package / 100000).toFixed(1)} LPA`
                          : offer.packageType === "monthly"
                            ? `₹${offer.package.toLocaleString()}/month`
                            : `₹${offer.package.toLocaleString()}/month`
                        }
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        {new Date(offer.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        {new Date(offer.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[offer.status] ?? ""}>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/candidates/${offer.candidateId}`}>
                            <Button variant="outline" size="sm" title="View Candidate">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <a
                            href={`/offer/${offer._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" title="View Offer Portal">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Email Offer Link"
                            onClick={() => {
                              const subject = encodeURIComponent(`Offer Letter from ${companyName}`);
                              const body = encodeURIComponent(`Hello ${offer.candidate?.name},\n\nWe are pleased to extend an offer from ${companyName} to you. You can view and respond to your offer letter at the following link:\n\n${window.location.origin}/offer/${offer._id}\n\nBest regards,\nHR Team`);
                              window.location.href = `mailto:${offer.candidate?.email}?subject=${subject}&body=${body}`;
                            }}
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
