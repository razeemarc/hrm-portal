"use client";

import { useState, useMemo } from "react";
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
import { 
  FileText, 
  Check, 
  X, 
  Eye, 
  Loader2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
  const [pendingPage, setPendingPage] = useState(1);
  const [allDocsPage, setAllDocsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ── Convex queries ──
  const pendingDocs = useQuery(api.functions.documents.getPendingDocuments);
  const allDocs = useQuery(api.functions.documents.getDocuments);

  // ── Convex mutations ──
  const verifyDocument = useMutation(api.functions.documents.verifyDocument);

  const verifiedCount = allDocs?.filter((d) => d.status === "verified").length ?? 0;
  const rejectedCount = allDocs?.filter((d) => d.status === "rejected").length ?? 0;

  const paginatedPending = useMemo(() => {
    if (!pendingDocs) return [];
    return pendingDocs.slice(
      (pendingPage - 1) * ITEMS_PER_PAGE,
      pendingPage * ITEMS_PER_PAGE
    );
  }, [pendingDocs, pendingPage]);

  const paginatedAll = useMemo(() => {
    if (!allDocs) return [];
    return allDocs.slice(
      (allDocsPage - 1) * ITEMS_PER_PAGE,
      allDocsPage * ITEMS_PER_PAGE
    );
  }, [allDocs, allDocsPage]);

  const totalPendingPages = pendingDocs ? Math.ceil(pendingDocs.length / ITEMS_PER_PAGE) : 0;
  const totalAllPages = allDocs ? Math.ceil(allDocs.length / ITEMS_PER_PAGE) : 0;

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
                {paginatedPending.map((doc) => (
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
          {/* Pagination for Pending Documents */}
          {totalPendingPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(pendingPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(pendingPage * ITEMS_PER_PAGE, pendingDocs?.length || 0)} of{" "}
                {pendingDocs?.length || 0} documents
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                  disabled={pendingPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={pendingPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPendingPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage((p) => Math.min(totalPendingPages, p + 1))}
                  disabled={pendingPage === totalPendingPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
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
                {paginatedAll.map((doc) => (
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
          {/* Pagination for All Documents */}
          {totalAllPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(allDocsPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(allDocsPage * ITEMS_PER_PAGE, allDocs?.length || 0)} of{" "}
                {allDocs?.length || 0} documents
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllDocsPage((p) => Math.max(1, p - 1))}
                  disabled={allDocsPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalAllPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={allDocsPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAllDocsPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllDocsPage((p) => Math.min(totalAllPages, p + 1))}
                  disabled={allDocsPage === totalAllPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}