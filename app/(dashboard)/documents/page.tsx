"use client";

import { useState } from "react";
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
import { FileText, Check, X, Eye, Download } from "lucide-react";
import { toast } from "sonner";

// Mock pending documents
const mockDocuments = [
  {
    _id: "d1",
    candidateId: "1",
    candidate: { name: "John Doe", email: "john@example.com" },
    type: "resume",
    fileName: "resume_john.pdf",
    status: "pending",
    uploadedAt: Date.now() - 86400000 * 2,
  },
  {
    _id: "d2",
    candidateId: "2",
    candidate: { name: "Jane Smith", email: "jane@example.com" },
    type: "id_proof",
    fileName: "id_jane.pdf",
    status: "pending",
    uploadedAt: Date.now() - 86400000,
  },
  {
    _id: "d3",
    candidateId: "1",
    candidate: { name: "John Doe", email: "john@example.com" },
    type: "certificate",
    fileName: "certificate_john.pdf",
    status: "pending",
    uploadedAt: Date.now() - 86400000 * 3,
  },
];

const docTypeLabels: Record<string, string> = {
  resume: "Resume",
  id_proof: "ID Proof",
  photo: "Photo",
  certificate: "Certificate",
  other: "Other",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const pendingDocs = documents.filter((d) => d.status === "pending");
  const verifiedDocs = documents.filter((d) => d.status === "verified");
  const rejectedDocs = documents.filter((d) => d.status === "rejected");

  const handleVerify = (docId: string, status: "verified" | "rejected") => {
    setDocuments(
      documents.map((d) =>
        d._id === docId ? { ...d, status } : d
      )
    );
    toast.success(`Document ${status === "verified" ? "approved" : "rejected"}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Document Verification</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingDocs.length}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{verifiedDocs.length}</div>
            <div className="text-sm text-gray-500">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{rejectedDocs.length}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingDocs.length === 0 ? (
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
                        <div className="font-medium">{doc.candidate.name}</div>
                        <div className="text-sm text-gray-500">{doc.candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{docTypeLabels[doc.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {doc.fileName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDoc(doc._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleVerify(doc._id, "verified")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
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

      {/* All Documents (for reference) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div className="font-medium">{doc.candidate.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{docTypeLabels[doc.type]}</Badge>
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
                  <TableCell>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}