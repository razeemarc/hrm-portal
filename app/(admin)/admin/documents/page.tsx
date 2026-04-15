"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Check, X, Eye, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const docTypeLabels: Record<string, string> = {
  resume: "Resume",
  id_proof: "ID Proof",
  photo: "Photo",
  certificate: "Certificate",
  other: "Other",
};

export default function DocumentsPage() {
  // ── Convex queries ──
  const pendingDocs = useQuery(api.functions.documents.getPendingDocuments);
  const allDocs = useQuery(api.functions.documents.getDocuments);

  // ── Convex mutations ──
  const verifyDocument = useMutation(api.functions.documents.verifyDocument);

  const verifiedCount = allDocs?.filter((d) => d.status === "verified").length ?? 0;
  const rejectedCount = allDocs?.filter((d) => d.status === "rejected").length ?? 0;

  const handleVerify = async (
    docId: string,
    status: "verified" | "rejected"
  ) => {
    try {
      await verifyDocument({ id: docId as Id<"documents">, status });
      toast.success(`Document ${status === "verified" ? "approved ✓" : "rejected ✗"}`);
    } catch (err) {
      toast.error("Failed to update document status");
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Document Verification</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            {pendingDocs === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingDocs.length}
                </div>
                <div className="text-sm text-gray-500">Pending Review</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {allDocs === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {verifiedCount}
                </div>
                <div className="text-sm text-gray-500">Verified</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {allDocs === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {rejectedCount}
                </div>
                <div className="text-sm text-gray-500">Rejected</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingDocs === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending documents to review
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDocs.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <div>
                        <Link
                        href={`/admin/candidates/${doc.candidateId}`}
                        className="font-medium hover:underline"
                      >
                          {doc.candidate?.name ?? "Unknown"}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {doc.candidate?.email ?? ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {docTypeLabels[doc.type] ?? doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {doc.fileName}
                      </div>
                    </TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View file */}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                        {/* Approve */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 border-green-200"
                          onClick={() => handleVerify(doc._id, "verified")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        {/* Reject */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200"
                          onClick={() => handleVerify(doc._id, "rejected")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Documents */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allDocs === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDocs.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/candidates/${doc.candidateId}`}
                        className="hover:underline"
                      >
                        {doc.candidate?.name ?? "Candidate"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {docTypeLabels[doc.type] ?? doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {doc.fileName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          doc.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : doc.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}