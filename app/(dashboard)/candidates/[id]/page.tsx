"use client";

import { useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

/* ─────────────────── Schema ─────────────────── */
const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^[0-9]+$/, "Only digits are allowed")
    .optional()
    .or(z.literal("")),
  role: z.string().optional(),
  department: z.string().optional(),
  package: z.number().optional(),
  status: z.string(),
  offerType: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

/* ─────────────────── Helpers ─────────────────── */
const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-purple-100 text-purple-800",
  offered: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const docTypes = [
  { value: "resume", label: "Resume" },
  { value: "id_proof", label: "ID Proof" },
  { value: "photo", label: "Photo" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

function DocStatusIcon({ status }: { status: string }) {
  if (status === "verified")
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "rejected")
    return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

/* ─────────────────── Page ─────────────────── */
export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ── Convex queries ──
  const candidate = useQuery(api.functions.candidates.getCandidateById, {
    id: id as Id<"candidates">,
  });
  const documents = useQuery(api.functions.documents.getDocumentsByCandidate, {
    candidateId: id as Id<"candidates">,
  });
  const offers = useQuery(api.functions.offers.getOffersByCandidate, {
    candidateId: id as Id<"candidates">,
  });

  // ── Convex mutations ──
  const updateCandidate = useMutation(api.functions.candidates.updateCandidate);
  const generateUploadUrl = useMutation(
    api.functions.documents.generateUploadUrl
  );
  const createDocument = useMutation(api.functions.documents.createDocument);
  const deleteDocument = useMutation(api.functions.documents.deleteDocument);

  // ── Local state ──
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("resume");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form ──
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      package: undefined,
      status: "pending",
      offerType: "",
    },
    values: candidate
      ? {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || "",
        role: candidate.role || "",
        department: candidate.department || "",
        package: candidate.package ?? undefined,
        status: candidate.status,
        offerType: candidate.offerType || "",
      }
      : undefined,
  });

  /* ── Save candidate details ── */
  const onSubmit = async (data: CandidateFormValues) => {
    if (!candidate) return;
    setSaving(true);
    try {
      await updateCandidate({
        id: id as Id<"candidates">,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role || undefined,
        department: data.department || undefined,
        package: data.package,
        status: data.status,
        offerType: data.offerType || undefined,
        hiredAt: data.status === "hired" ? Date.now() : undefined,
      });
      toast.success("Candidate updated successfully");
    } catch (err) {
      toast.error("Failed to update candidate");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Upload document to Convex Storage ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate) return;

    setUploading(true);
    try {
      // Step 1: get a pre-signed upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: POST the file directly to Convex Storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // Step 3: save the document record in the DB
      await createDocument({
        candidateId: id as Id<"candidates">,
        type: selectedDocType,
        fileName: file.name,
        storageId,
      });

      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload document");
      console.error(err);
    } finally {
      setUploading(false);
      // reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Delete document ── */
  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument({ id: docId as Id<"documents"> });
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
      console.error(err);
    }
  };

  /* ─────── Loading / Not-found states ─────── */
  if (candidate === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (candidate === null) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold mb-2">Candidate not found</p>
        <p className="text-muted-foreground mb-6">
          This candidate may have been deleted or the ID is invalid.
        </p>
        <Button onClick={() => router.push("/candidates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidates
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/candidates"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-gray-500">{candidate.email}</p>
        </div>
        <Badge className={statusColors[candidate.status]}>
          {candidate.status.replace("_", " ")}
        </Badge>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">
            Documents{" "}
            {documents && documents.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                {documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="offers">
            Offers{" "}
            {offers && offers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                {offers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Details Tab ─── */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Candidate</CardTitle>
              <CardDescription>
                Update candidate information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              maxLength={10}
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role / Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Frontend Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Engineering" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="package"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Package ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="80000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={(v) => v && field.onChange(v)}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="invited">Invited</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_review">
                                In Review
                              </SelectItem>
                              <SelectItem value="offered">Offered</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="offerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offer Type</FormLabel>
                          <Select
                            onValueChange={(v) => v && field.onChange(v)}
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select offer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="intern">Intern</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span suppressHydrationWarning>
                      Created:{" "}
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span suppressHydrationWarning>
                      Last updated:{" "}
                      {new Date(candidate.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Documents Tab ─── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Documents</CardTitle>
              <CardDescription>
                Upload and view documents stored in Convex
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload area */}
              <div className="rounded-lg border border-dashed p-6 space-y-4">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Upload a new document
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Select
                    value={selectedDocType}
                    onValueChange={(v) => v && setSelectedDocType(v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {docTypes.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="doc-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading…" : "Choose File & Upload"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Supported: PDF, JPG, PNG, DOCX · Max 10 MB
                </p>
              </div>

              {/* Document list */}
              {documents === undefined ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-sm">
                            {doc.fileName}
                          </div>
                          <div className="text-xs text-gray-500 capitalize" suppressHydrationWarning>
                            {doc.type.replace("_", " ")} ·{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <DocStatusIcon status={doc.status} />
                          <Badge
                            variant={
                              doc.status === "verified" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        {/* Open file in new tab */}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View document"
                        >
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>

                        {/* Delete document */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Offers Tab ─── */}
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Offer Letters</CardTitle>
              <CardDescription>View and manage offer letters</CardDescription>
            </CardHeader>
            <CardContent>
              {offers === undefined ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No offers created yet</p>
                  <Link
                    href={`/offers?candidate=${candidate._id}`}
                    className={cn(buttonVariants({ variant: "default" }))}
                  >
                    Create Offer
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {offer.offerType === "intern"
                            ? "Internship"
                            : "Employment"}{" "}
                          Offer — {offer.role}
                        </div>
                        <Badge
                          variant={
                            offer.status === "pending" ? "secondary" : "default"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Department: {offer.department}</div>
                        <div>Package: ${offer.package.toLocaleString()}</div>
                        <div suppressHydrationWarning>
                          Start Date:{" "}
                          {new Date(offer.startDate).toLocaleDateString()}
                        </div>
                        <div suppressHydrationWarning>
                          Expiry:{" "}
                          {new Date(offer.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                      {offer.documentUrl && (
                        <div className="mt-3">
                          <a
                            href={offer.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Offer Letter
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}