"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Download, Mail, Calendar, DollarSign, Building, Briefcase } from "lucide-react";
import { toast } from "sonner";

// Mock offer data (would be fetched from Convex)
const mockOffer = {
  _id: "o1",
  candidate: { name: "John Doe", email: "john@example.com" },
  offerType: "employee",
  role: "Frontend Developer",
  department: "Engineering",
  package: 80000,
  startDate: Date.now() + 86400000 * 14,
  expiryDate: Date.now() + 86400000 * 28,
  status: "pending",
  createdAt: Date.now() - 86400000,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function OfferViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [offer, setOffer] = useState(mockOffer);
  const [processing, setProcessing] = useState(false);

  const handleResponse = async (response: "accepted" | "rejected") => {
    setProcessing(true);
    // In real app, call Convex mutation
    setTimeout(() => {
      setOffer({ ...offer, status: response });
      setProcessing(false);
      toast.success(response === "accepted" ? "Offer accepted! Welcome aboard!" : "Offer declined");
    }, 1000);
  };

  if (offer.status === "accepted") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Offer Accepted!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You have accepted the offer. We look forward to having you join our team.
            </p>
            <Button onClick={() => window.location.href = "/"}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offer.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Offer Declined</h2>
            <p className="text-gray-600 mb-6">
              You have declined the offer. We appreciate your time and wish you the best in your career.
            </p>
            <Button onClick={() => window.location.href = "/"}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Offer Letter</h1>
          <p className="text-gray-600">
            Ladder Academy is pleased to extend an offer to you
          </p>
        </div>

        {/* Offer Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Offer Details</CardTitle>
              <Badge className={statusColors[offer.status]}>
                {offer.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Candidate Info */}
            <div>
              <h3 className="font-semibold mb-2">Candidate</h3>
              <div className="text-gray-600">{offer.candidate.name}</div>
              <div className="text-sm text-gray-500">{offer.candidate.email}</div>
            </div>

            <Separator />

            {/* Offer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Position</div>
                  <div className="font-medium">{offer.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Department</div>
                  <div className="font-medium">{offer.department}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Annual Salary</div>
                  <div className="font-medium">${offer.package.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="font-medium">{new Date(offer.startDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Offer Type */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">Offer Type</div>
                <div className="font-medium capitalize">{offer.offerType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Valid Until</div>
                <div className="font-medium">{new Date(offer.expiryDate).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={() => handleResponse("accepted")}
                disabled={processing}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Offer
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleResponse("rejected")}
                disabled={processing}
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>

            <div className="text-center">
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Offer Letter (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Questions?</div>
                <div className="text-sm text-gray-500">
                  If you have any questions about this offer, please contact HR at hr@ladderacademy.com
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}