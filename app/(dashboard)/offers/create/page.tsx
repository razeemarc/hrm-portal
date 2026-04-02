"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, ArrowLeft, Upload, X, Edit3, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { EmployeeOfferTemplate, InternOfferTemplate } from "@/templates/OfferLetterTemplate";
import { pdf, PDFViewer } from "@react-pdf/renderer";

const offerSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  offerType: z.enum(["intern", "employee"]),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  package: z.number().min(0, "Package must be positive"),
  packageType: z.enum(["lpa", "monthly", "stipend"]),
  startDate: z.date({ message: "Start date is required" }),
  expiryDate: z.date({ message: "Expiry date is required" }),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  hrName: z.string().min(1, "HR name is required"),
  introductionText: z.string().optional(),
  benefitsText: z.string().optional(),
  acceptanceText: z.string().optional(),
  closingText: z.string().optional(),
  footerText: z.string().optional(),
  hrSignature: z.string().optional(),
  companyLogo: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function CreateOfferPage() {
  const router = useRouter();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "pdf">("edit");
  const hrSignatureInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  const candidatesData = useQuery(api.functions.candidates.getCandidates);
  const createOffer = useMutation(api.functions.offers.createOffer);
  const generateUploadUrl = useMutation(api.functions.documents.generateUploadUrl);
  const candidates = candidatesData ?? [];

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidateId: "",
      offerType: "employee",
      role: "",
      department: "",
      package: 0,
      packageType: "lpa",
      companyName: "Ladder Academy",
      companyAddress: "123 Tech Street, San Francisco, CA 94105",
      hrName: "HR Manager",
      introductionText: "",
      benefitsText: "",
      acceptanceText: "",
      closingText: "",
      footerText: "",
      hrSignature: "",
      companyLogo: "",
    },
  });

  const handleFileUpload = async (file: File, fieldName: "hrSignature" | "companyLogo") => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue(fieldName, result);
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  };

  const selectedCandidateId = form.watch("candidateId");
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c._id === selectedCandidateId);
  }, [candidates, selectedCandidateId]);

  const previewData = useMemo(() => {
    const offerType = form.watch("offerType");
    const role = form.watch("role");
    const department = form.watch("department");
    const packageValue = form.watch("package");
    const packageType = form.watch("packageType");
    const startDate = form.watch("startDate");
    const companyName = form.watch("companyName");
    const companyAddress = form.watch("companyAddress");
    const hrName = form.watch("hrName");
    const hrSignature = form.watch("hrSignature");
    const companyLogo = form.watch("companyLogo");
    const introductionText = form.watch("introductionText");
    const benefitsText = form.watch("benefitsText");
    const acceptanceText = form.watch("acceptanceText");
    const closingText = form.watch("closingText");
    const footerText = form.watch("footerText");

    return {
      candidateName: selectedCandidate?.name ?? "Candidate Name",
      candidateEmail: selectedCandidate?.email ?? "candidate@email.com",
      offerType,
      role: role || "Role",
      department: department || "Department",
      package: packageValue || 0,
      packageType: packageType || "lpa",
      startDate: startDate?.getTime() ?? Date.now(),
      companyName: companyName || "Ladder Academy",
      companyAddress: companyAddress || "Address",
      hrName: hrName || "HR Manager",
      hrSignature: hrSignature || undefined,
      companyLogo: companyLogo || undefined,
      introductionText: introductionText || undefined,
      benefitsText: benefitsText || undefined,
      acceptanceText: acceptanceText || undefined,
      closingText: closingText || undefined,
      footerText: footerText || undefined,
    };
  }, [selectedCandidate, form.watch("offerType"), form.watch("role"), form.watch("department"), form.watch("package"), form.watch("packageType"), form.watch("startDate"), form.watch("companyName"), form.watch("companyAddress"), form.watch("hrName"), form.watch("hrSignature"), form.watch("companyLogo"), form.watch("introductionText"), form.watch("benefitsText"), form.watch("acceptanceText"), form.watch("closingText"), form.watch("footerText")]);

  const onSubmit = async (data: OfferFormValues) => {
    try {
      // 1. Generate PDF Blob
      const blob = await pdf(
        data.offerType === "intern" ? (
          <InternOfferTemplate {...previewData} />
        ) : (
          <EmployeeOfferTemplate {...previewData} />
        )
      ).toBlob();

      // 2. Upload to Convex Storage
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: blob,
      });

      if (!uploadResult.ok) throw new Error("PDF upload failed");
      const { storageId } = await uploadResult.json();

      // 3. Create Offer record with document URL
      await createOffer({
        candidateId: data.candidateId as Id<"candidates">,
        offerType: data.offerType,
        role: data.role,
        department: data.department,
        package: data.package,
        packageType: data.packageType,
        startDate: data.startDate.getTime(),
        expiryDate: data.expiryDate.getTime(),
        storageId: storageId,
      });

      router.push("/offers");
      toast.success("Offer created and saved as PDF");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create offer", { description: msg });
      console.error(err);
    }
  };

  const hrSignature = form.watch("hrSignature");
  const companyLogo = form.watch("companyLogo");

  const renderEditField = (fieldName: keyof OfferFormValues, placeholder: string, isTextarea = false, className = "") => {
    const isEditing = editingField === fieldName;

    return (
      <span className={cn("relative inline-block min-w-[20px]", className)}>
        {isEditing ? (
          <span className="flex items-center gap-2">
            {isTextarea ? (
              <Textarea
                {...form.register(fieldName)}
                placeholder={placeholder}
                className="text-sm min-w-[200px]"
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setEditingField(null); }
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
            ) : (
              <Input
                {...form.register(fieldName)}
                placeholder={placeholder}
                className="text-sm h-8 min-w-[150px]"
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); setEditingField(null); }
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
            )}
          </span>
        ) : (
          <span
            className="cursor-pointer hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 rounded px-1 -mx-1 transition-all group"
            onClick={() => setEditingField(fieldName)}
          >
            {form.watch(fieldName as any) || <span className="text-muted-foreground italic">{placeholder}</span>}
            <Edit3 className="h-3 w-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity" />
          </span>
        )}
      </span>
    );
  };

  const OfferLetterHTMLPreview = () => {
    const data = previewData;
    const isIntern = data.offerType === "intern";

    return (
      <div className="bg-white shadow-2xl mx-auto my-4 p-[50px] min-h-[1050px] w-[800px] text-[#333] font-sans leading-relaxed relative flex flex-col">
        {/* Header */}
        <div className="text-center mb-10 border-b pb-6">
          {data.companyLogo && (
            <img src={data.companyLogo} alt="Logo" className="h-12 object-contain mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {renderEditField("companyName", "Company Name")}
          </h1>
          <p className="text-sm text-gray-500">
            {renderEditField("companyAddress", "Company Address")}
          </p>
        </div>

        {/* Date & Ref */}
        <div className="flex justify-end mb-8 text-sm text-gray-600">
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Candidate Info */}
        <div className="mb-8">
          <p className="font-semibold mb-1">To,</p>
          <p className="text-lg font-bold">{data.candidateName}</p>
          <p className="text-gray-600 italic">{data.candidateEmail}</p>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-extrabold border-y-2 border-gray-900 py-2 inline-block px-8 uppercase tracking-widest">
            {isIntern ? "Internship Offer Letter" : "Letter of Appointment"}
          </h2>
        </div>

        {/* Opening */}
        <div className="mb-6">
          <p className="mb-4">Dear <span className="font-bold">{data.candidateName}</span>,</p>
          <div className="text-justify leading-relaxed">
            {renderEditField(
              "introductionText",
              isIntern
                ? `We are pleased to offer you an internship position as ${data.role} at ${data.companyName}. We believe this internship will provide you with valuable industry experience and help you develop your professional skills.`
                : `We are pleased to offer you the position of ${data.role} at ${data.companyName}. We believe your skills and experience will be a valuable addition to our ${data.department} team.`,
              true,
              "w-full text-justify"
            )}
          </div>
        </div>

        {/* Details Table */}
        <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-2 px-4 py-2 font-bold text-sm">
            <div>Description</div>
            <div>Details</div>
          </div>
          <div className="grid grid-cols-2 px-4 py-3 border-b border-gray-100 text-sm">
            <div className="font-medium text-gray-500">Position</div>
            <div className="font-bold text-gray-900">{data.role}</div>
          </div>
          <div className="grid grid-cols-2 px-4 py-3 border-b border-gray-100 text-sm">
            <div className="font-medium text-gray-500">Department</div>
            <div className="font-bold text-gray-900">{data.department}</div>
          </div>
          <div className="grid grid-cols-2 px-4 py-3 border-b border-gray-100 text-sm">
            <div className="font-medium text-gray-500">Start Date</div>
            <div className="font-bold text-gray-900">
              {new Date(data.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div className="grid grid-cols-2 px-4 py-3 text-sm bg-blue-50/50">
            <div className="font-semibold text-blue-900">
              {isIntern ? "Monthly Stipend" : "Annual CTC"}
            </div>
            <div className="font-bold text-blue-900 tabular-nums lining-nums">
              {data.packageType === "lpa"
                ? `₹${(data.package / 100000).toFixed(1)} LPA`
                : `₹${data.package.toLocaleString("en-IN")}/month`
              }
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-8">
          <h3 className="font-bold text-md mb-2 border-l-4 border-primary pl-3">2. Benefits</h3>
          <div className="text-gray-700 leading-relaxed pl-4">
            {renderEditField(
              "benefitsText",
              isIntern ? "As an intern, you will receive mentorship, certificate of completion, and stipend." : "As a full-time employee, you will be entitled to health insurance, paid leaves, and performance reviews.",
              true,
              "w-full"
            )}
          </div>
        </div>

        {/* Acceptance & Closing */}
        <div className="mb-10">
          <h3 className="font-bold text-md mb-2 border-l-4 border-primary pl-3">3. Acceptance</h3>
          <div className="text-gray-700 mb-6 pl-4 leading-relaxed">
            {renderEditField(
              "acceptanceText",
              "Please sign and return a copy of this letter within 7 days to confirm your acceptance.",
              true,
              "w-full"
            )}
          </div>
          <div className="font-medium italic text-gray-800">
            {renderEditField("closingText", "We look forward to having you as part of our team!", false, "w-full")}
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-auto pt-10 grid grid-cols-2 gap-20">
          <div className="text-center">
            <div className="border-b border-gray-400 h-10 mb-2"></div>
            <p className="text-xs font-bold uppercase text-gray-500">Candidate Signature</p>
            <p className="text-sm mt-1">{data.candidateName}</p>
          </div>
          <div className="text-center">
            <div className="h-10 mb-2 flex items-center justify-center">
              {data.hrSignature ? (
                <img src={data.hrSignature} alt="Signature" className="h-10 object-contain" />
              ) : (
                <div className="border-b border-gray-400 w-full h-full"></div>
              )}
            </div>
            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Authorized Signatory</p>
            <div className="text-sm font-bold mt-1">
              {renderEditField("hrName", "HR Name")}
            </div>
            <p className="text-[10px] text-gray-400">HR Manager</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t pt-4 text-center">
          <div className="text-[10px] text-gray-400 italic font-serif">
            {renderEditField("footerText", "This document is confidential and intended for the named recipient only.", false, "w-full")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/offers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Offer Letter</h1>
        <span className="text-sm text-muted-foreground ml-auto">Click on any text in the preview to edit</span>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* PDF Preview Section - Takes 2 columns */}
        <div className="col-span-2 bg-gray-100 rounded-lg border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Preview Mode:</span>
              <div className="flex bg-background rounded-md p-1 border shadow-sm">
                <button
                  onClick={() => setPreviewMode("edit")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-sm transition-all flex items-center gap-2",
                    previewMode === "edit" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Edit3 className="h-3 w-3" />
                  Editable Editor
                </button>
                <button
                  onClick={() => setPreviewMode("pdf")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-sm transition-all flex items-center gap-2",
                    previewMode === "pdf" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FileText className="h-3 w-3" />
                  PDF Preview
                </button>
              </div>
            </div>
            {previewMode === "edit" && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                Interactive: Click text to edit in-place
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-gray-200/50 backdrop-blur-sm p-4 scrollbar-hide">
            {previewMode === "edit" ? (
              <OfferLetterHTMLPreview />
            ) : (
              <PDFViewer width="100%" height="100%" showToolbar className="min-h-[1050px] w-full border-0">
                {previewData.offerType === "intern" ? (
                  <InternOfferTemplate {...previewData} />
                ) : (
                  <EmployeeOfferTemplate {...previewData} />
                )}
              </PDFViewer>
            )}
          </div>
        </div>

        {/* Edit Panel - Takes 1 column */}
        <div className="bg-card rounded-lg border p-4 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Candidate */}
              <FormField
                control={form.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Candidate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidates.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Offer Type */}
              <FormField
                control={form.control}
                name="offerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Offer Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Full-time Employee</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Role</FormLabel>
                      <FormControl>
                        <Input className="h-8" placeholder="Role" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Department</FormLabel>
                      <FormControl>
                        <Input className="h-8" placeholder="Department" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Package */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-8"
                          placeholder="Amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lpa">LPA</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="stipend">Stipend</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button variant="outline" className={cn("h-8 text-xs justify-start", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {field.value ? format(field.value, "MMM d, yyyy") : "Pick"}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button variant="outline" className={cn("h-8 text-xs justify-start", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {field.value ? format(field.value, "MMM d, yyyy") : "Pick"}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>

              {/* Company Details */}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Company Details</p>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Company Name</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Address</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hrName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">HR Name</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Signatures */}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Signatures & Logo</p>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="hrSignature"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs">HR Signature</FormLabel>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={hrSignatureInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "hrSignature");
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => hrSignatureInputRef.current?.click()}>
                          <Upload className="h-3 w-3 mr-1" /> Upload
                        </Button>
                        {hrSignature && (
                          <div className="mt-1">
                            <img src={hrSignature} alt="Signature" className="h-10 object-contain" />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyLogo"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs">Logo</FormLabel>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={companyLogoInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "companyLogo");
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => companyLogoInputRef.current?.click()}>
                          <Upload className="h-3 w-3 mr-1" /> Upload
                        </Button>
                        {companyLogo && (
                          <div className="mt-1">
                            <img src={companyLogo} alt="Logo" className="h-10 object-contain" />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Custom Text */}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Custom Text</p>
                <FormField
                  control={form.control}
                  name="introductionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Introduction</FormLabel>
                      <Textarea className="text-xs" placeholder="Custom intro..." {...field} rows={2} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="benefitsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Benefits</FormLabel>
                      <Textarea className="text-xs" placeholder="Custom benefits..." {...field} rows={2} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closingText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Closing</FormLabel>
                      <Textarea className="text-xs" placeholder="Custom closing..." {...field} rows={2} />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Offer
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
