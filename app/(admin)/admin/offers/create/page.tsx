"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
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
import { CalendarIcon, Loader2, ArrowLeft, Upload, X, Edit3, FileText, CheckCircle2, Mail } from "lucide-react";
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
  candidateName: z.string(),
  candidateEmail: z.string(),
  offerType: z.enum(["intern", "employee"]),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  package: z.number().min(0, "Package must be positive"),
  packageType: z.enum(["lpa", "monthly", "stipend"]),
  startDate: z.date({ message: "Start date is required" }),
  letterDate: z.date({ message: "Letter date is required" }),
  expiryDate: z.date({ message: "Expiry date is required" }),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  hrName: z.string().min(1, "HR name is required"),
  introductionText: z.string(),
  benefitsText: z.string(),
  acceptanceText: z.string(),
  closingText: z.string(),
  footerText: z.string(),
  titleText: z.string().optional(),
  hrSignature: z.string(),
  companyLogo: z.string(),
  positionLabel: z.string(),
  departmentLabel: z.string(),
  startDateLabel: z.string(),
  packageLabel: z.string(),
  dateLabel: z.string(),
  toLabel: z.string(),
  dearLabel: z.string(),
  descriptionHeader: z.string(),
  detailsHeader: z.string(),
  benefitsTitle: z.string(),
  acceptanceTitle: z.string(),
  candidateSignatureLabel: z.string(),
  authorizedSignatoryLabel: z.string(),
  hrTitle: z.string(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

const blobToBase64 = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

export default function CreateOfferPage() {
  const router = useRouter();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "pdf">("edit");
  const hrSignatureInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  const candidatesData = useQuery(api.functions.candidates.getCandidates);
  const createOffer = useMutation(api.functions.offers.createOffer);
  const generateUploadUrl = useMutation(api.functions.documents.generateUploadUrl);
  const getStorageUrl = useAction(api.functions.settings.getStorageUrl);
  const candidates = candidatesData ?? [];

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidateId: "",
      candidateName: "Candidate Name",
      candidateEmail: "candidate@email.com",
      offerType: "employee",
      role: "",
      department: "",
      package: 0,
      packageType: "lpa",
      companyName: "Ladder Academy",
      companyAddress: "123 Tech Street, San Francisco, CA 94105",
      hrName: "HR Manager",
      hrSignature: "",
      companyLogo: "",
      titleText: "",
      positionLabel: "Position",
      departmentLabel: "Department",
      startDateLabel: "Start Date",
      packageLabel: "Annual CTC",
      introductionText: "",
      benefitsText: "",
      acceptanceText: "",
      closingText: "",
      footerText: "",
      startDate: new Date(),
      letterDate: new Date(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dateLabel: "Date:",
      toLabel: "To,",
      dearLabel: "Dear",
      descriptionHeader: "Description",
      detailsHeader: "Details",
      benefitsTitle: "2. Benefits",
      acceptanceTitle: "3. Acceptance",
      candidateSignatureLabel: "Candidate Signature",
      authorizedSignatoryLabel: "Authorized Signatory",
      hrTitle: "HR Manager",
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

  useEffect(() => {
    if (!selectedCandidate) return;
    form.setValue("candidateName", selectedCandidate.name);
    form.setValue("candidateEmail", selectedCandidate.email);
  }, [form, selectedCandidate]);

  const previewData = useMemo(() => {
    const candidateName = form.watch("candidateName");
    const candidateEmail = form.watch("candidateEmail");
    const offerType = form.watch("offerType");
    const role = form.watch("role");
    const department = form.watch("department");
    const packageValue = form.watch("package");
    const packageType = form.watch("packageType");
    const startDate = form.watch("startDate");
    const letterDate = form.watch("letterDate");
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
    const positionLabel = form.watch("positionLabel");
    const departmentLabel = form.watch("departmentLabel");
    const startDateLabel = form.watch("startDateLabel");
    const packageLabel = form.watch("packageLabel");
    const dateLabel = form.watch("dateLabel");
    const toLabel = form.watch("toLabel");
    const dearLabel = form.watch("dearLabel");
    const descriptionHeader = form.watch("descriptionHeader");
    const detailsHeader = form.watch("detailsHeader");
    const benefitsTitle = form.watch("benefitsTitle");
    const acceptanceTitle = form.watch("acceptanceTitle");
    const candidateSignatureLabel = form.watch("candidateSignatureLabel");
    const authorizedSignatoryLabel = form.watch("authorizedSignatoryLabel");
    const hrTitle = form.watch("hrTitle");

    return {
      candidateName: candidateName || selectedCandidate?.name || "Candidate Name",
      candidateEmail: candidateEmail || selectedCandidate?.email || "candidate@email.com",
      offerType,
      role: role || "Role",
      department: department || "Department",
      package: packageValue || 0,
      packageType: packageType || "lpa",
      startDate: startDate?.getTime() ?? Date.now(),
      letterDate: letterDate?.getTime() ?? Date.now(),
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
      titleText: form.watch("titleText") || undefined,
      positionLabel: form.watch("positionLabel") || "Position",
      departmentLabel: form.watch("departmentLabel") || "Department",
      startDateLabel: form.watch("startDateLabel") || "Start Date",
      packageLabel: form.watch("packageLabel") || (offerType === "intern" ? "Monthly Stipend" : "Annual CTC"),
      dateLabel: dateLabel || "Date:",
      toLabel: toLabel || "To,",
      dearLabel: dearLabel || "Dear",
      descriptionHeader: descriptionHeader || "Description",
      detailsHeader: detailsHeader || "Details",
      benefitsTitle: benefitsTitle || "2. Benefits",
      acceptanceTitle: acceptanceTitle || "3. Acceptance",
      candidateSignatureLabel: candidateSignatureLabel || "Candidate Signature",
      authorizedSignatoryLabel: authorizedSignatoryLabel || "Authorized Signatory",
      hrTitle: hrTitle || "HR Manager",
    };
  }, [selectedCandidate, form.watch("candidateName"), form.watch("candidateEmail"), form.watch("offerType"), form.watch("role"), form.watch("department"), form.watch("package"), form.watch("packageType"), form.watch("startDate"), form.watch("letterDate"), form.watch("companyName"), form.watch("companyAddress"), form.watch("hrName"), form.watch("hrSignature"), form.watch("companyLogo"), form.watch("introductionText"), form.watch("benefitsText"), form.watch("acceptanceText"), form.watch("closingText"), form.watch("footerText"), form.watch("titleText"), form.watch("positionLabel"), form.watch("departmentLabel"), form.watch("startDateLabel"), form.watch("packageLabel"), form.watch("dateLabel"), form.watch("toLabel"), form.watch("dearLabel"), form.watch("descriptionHeader"), form.watch("detailsHeader"), form.watch("benefitsTitle"), form.watch("acceptanceTitle"), form.watch("candidateSignatureLabel"), form.watch("authorizedSignatoryLabel"), form.watch("hrTitle")]);

  const onSubmit = async (data: OfferFormValues, shareWithResend = false) => {
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
      const documentUrl = await getStorageUrl({ storageId });

      // 3. Create Offer record with document URL
      const offerId = await createOffer({
        candidateId: data.candidateId as Id<"candidates">,
        offerType: data.offerType,
        role: data.role,
        department: data.department,
        package: data.package,
        packageType: data.packageType,
        startDate: data.startDate.getTime(),
        expiryDate: data.expiryDate.getTime(),
        documentUrl: documentUrl ?? undefined,
      });

      if (shareWithResend) {
        const pdfBase64 = await blobToBase64(blob);
        const safeCandidateName = (previewData.candidateName || "candidate")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();
        const response = await fetch("/api/send-offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: previewData.candidateEmail,
            candidateName: previewData.candidateName,
            companyName: previewData.companyName,
            role: previewData.role,
            offerUrl: `${window.location.origin}/offer/${offerId}`,
            documentUrl: documentUrl ?? undefined,
            pdfBase64,
            pdfFilename: `${safeCandidateName || "offer-letter"}.pdf`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Offer created, but Resend sharing failed");
        }
      }

      router.push("/admin/offers");
      toast.success(shareWithResend ? "Offer created and shared through Resend" : "Offer created and saved as PDF");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create offer", { description: msg });
      console.error(err);
    }
  };

  const hrSignature = form.watch("hrSignature");
  const companyLogo = form.watch("companyLogo");

  const renderEditField = (fieldName: keyof OfferFormValues, placeholder: string, isTextarea = false, className = "", editKey: string = fieldName) => {
    const isEditing = editingField === editKey;
    const value = form.watch(fieldName);

    return (
      <span className={cn("relative inline-block min-w-[20px] group", className)}>
        {isEditing ? (
          <span className="block">
            {isTextarea ? (
              <Textarea
                {...form.register(fieldName)}
                placeholder={placeholder}
                className="text-sm min-w-[200px] border-2 border-[#7c3aed] bg-white shadow-[0_0_0_3px_rgba(124,58,237,0.15)] rounded-md focus:border-[#7c3aed] focus:ring-0 transition-all"
                autoFocus
                rows={4}
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
                className="text-sm h-8 min-w-[150px] border-2 border-[#7c3aed] bg-white shadow-[0_0_0_3px_rgba(124,58,237,0.15)] rounded-md focus:border-[#7c3aed] focus:ring-0 transition-all"
                autoFocus
                type={fieldName === "package" ? "number" : "text"}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); setEditingField(null); }
                  if (e.key === "Escape") setEditingField(null);
                }}
                onChange={(e) => {
                  if (fieldName === "package") {
                    form.setValue("package", Number(e.target.value));
                  }
                }}
              />
            )}
          </span>
        ) : (
          <span
            className="cursor-text rounded px-1 -mx-1 py-0.5 transition-all duration-150 hover:outline hover:outline-2 hover:outline-[#7c3aed]/50 hover:bg-[#7c3aed]/[0.04] group"
            onClick={() => setEditingField(editKey)}
          >
            {value ? String(value) : <span className="text-gray-400 italic">{placeholder}</span>}
          </span>
        )}
      </span>
    );
  };

  const renderDateEditField = (fieldName: "letterDate" | "startDate", className = "") => {
    const isEditing = editingField === fieldName;
    const value = form.watch(fieldName);

    return (
      <span className={cn("relative inline-block min-w-[20px] group", className)}>
        {isEditing ? (
          <Input
            type="date"
            value={value ? format(value, "yyyy-MM-dd") : ""}
            className="text-sm h-8 min-w-[150px] border-2 border-[#7c3aed] bg-white shadow-[0_0_0_3px_rgba(124,58,237,0.15)] rounded-md focus:border-[#7c3aed] focus:ring-0 transition-all"
            autoFocus
            onBlur={() => setEditingField(null)}
            onChange={(e) => {
              const nextDate = e.target.value ? new Date(`${e.target.value}T00:00:00`) : new Date();
              form.setValue(fieldName, nextDate);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); setEditingField(null); }
              if (e.key === "Escape") setEditingField(null);
            }}
          />
        ) : (
          <span
            className="cursor-text rounded px-1 -mx-1 py-0.5 transition-all duration-150 hover:outline hover:outline-2 hover:outline-[#7c3aed]/50 hover:bg-[#7c3aed]/[0.04] group"
            onClick={() => setEditingField(fieldName)}
          >
            {value ? value.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Pick date"}
          </span>
        )}
      </span>
    );
  };

  const OfferLetterHTMLPreview = () => {
    const data = previewData;
    const isIntern = data.offerType === "intern";

    return (
      <div className="bg-white shadow-2xl mx-auto my-4 min-h-[1100px] w-[800px] text-[#333] relative flex flex-col overflow-hidden" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {/* Decorative top gradient bar */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #1e293b 0%, #7c3aed 40%, #c084fc 70%, #e9d5ff 100%)" }} />

        {/* Decorative side accent */}
        <div className="absolute left-0 top-0 w-[6px] h-full" style={{ background: "linear-gradient(180deg, #7c3aed 0%, #a78bfa 50%, #e9d5ff 100%)" }} />

        {/* Watermark pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 50px, #7c3aed 50px, #7c3aed 51px)" }} />

        <div className="p-[50px] pl-[56px] flex flex-col flex-1 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 pb-6 relative">
            {data.companyLogo && (
              <img src={data.companyLogo} alt="Logo" className="h-14 object-contain mx-auto mb-4" />
            )}
            <h1 className="text-[28px] font-bold tracking-wide mb-1" style={{ color: "#1e293b", fontFamily: "'Georgia', serif" }}>
              {renderEditField("companyName", "Company Name")}
            </h1>
            <p className="text-[13px] tracking-[0.15em] uppercase" style={{ color: "#64748b" }}>
              {renderEditField("companyAddress", "Company Address")}
            </p>
            {/* Gold decorative line */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="h-[1px] w-20" style={{ background: "linear-gradient(90deg, transparent, #b8860b)" }} />
              <div className="w-2 h-2 rotate-45 border border-[#b8860b]" />
              <div className="h-[1px] w-20" style={{ background: "linear-gradient(90deg, #b8860b, transparent)" }} />
            </div>
          </div>

          {/* Date */}
          <div className="flex justify-end mb-8 text-[13px]" style={{ color: "#475569" }}>
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "#1e293b" }}>
                {renderEditField("dateLabel", "Date:")}
              </span>
              <span>{renderDateEditField("letterDate")}</span>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="mb-8">
            <p className="font-semibold mb-1 text-[13px] uppercase tracking-wider" style={{ color: "#64748b" }}>
              {renderEditField("toLabel", "To,")}
            </p>
            <p className="text-[18px] font-bold" style={{ color: "#1e293b" }}>
              {renderEditField("candidateName", "Candidate Name", false, "", "candidateNameAddress")}
            </p>
            <p className="text-[13px] italic" style={{ color: "#64748b" }}>
              {renderEditField("candidateEmail", "candidate@email.com", false, "", "candidateEmailAddress")}
            </p>
          </div>

          {/* Title - Editable */}
          <div className="text-center mb-8 py-1">
            <div className="inline-block relative px-10 border border-transparent hover:border-gray-300 rounded transition-colors group">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 10%, #1e293b 30%, #1e293b 70%, transparent 90%)" }} />
              <h2 className="text-[20px] font-extrabold uppercase tracking-[0.25em] py-3" style={{ color: "#1e293b", fontFamily: "'Georgia', serif" }}>
                {renderEditField(
                  "titleText",
                  isIntern ? "INTERNSHIP OFFER LETTER" : "LETTER OF APPOINTMENT",
                  false,
                  "text-center min-w-[300px]"
                )}
              </h2>
              <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 10%, #1e293b 30%, #1e293b 70%, transparent 90%)" }} />
            </div>
          </div>

          {/* Opening paragraph */}
          <div className="mb-6">
            <p className="mb-4 text-[14px]" style={{ color: "#334155" }}>
              {renderEditField("dearLabel", "Dear")} <span className="font-bold" style={{ color: "#1e293b" }}>{renderEditField("candidateName", "Candidate Name", false, "", "candidateNameGreeting")}</span>,
            </p>
            <div className="text-justify leading-[1.8] text-[14px]" style={{ color: "#475569" }}>
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
          <div className="mb-8 overflow-hidden rounded-lg border" style={{ borderColor: "#e2e8f0" }}>
            <div className="grid grid-cols-2 px-5 py-3 font-bold text-[13px] uppercase tracking-wider" style={{ background: "linear-gradient(135deg, #1e293b, #334155)", color: "#f8fafc" }}>
              <div>{renderEditField("descriptionHeader", "Description")}</div>
              <div>{renderEditField("detailsHeader", "Details")}</div>
            </div>
            <div className="grid grid-cols-2 px-5 py-3 border-b text-[13px]" style={{ borderColor: "#f1f5f9" }}>
              <div className="font-medium" style={{ color: "#64748b" }}>
                {renderEditField("positionLabel", "Position")}
              </div>
              <div className="font-bold" style={{ color: "#1e293b" }}>
                {renderEditField("role", "Role")}
              </div>
            </div>
            <div className="grid grid-cols-2 px-5 py-3 border-b text-[13px]" style={{ background: "#fafafa", borderColor: "#f1f5f9" }}>
              <div className="font-medium" style={{ color: "#64748b" }}>
                {renderEditField("departmentLabel", "Department")}
              </div>
              <div className="font-bold" style={{ color: "#1e293b" }}>
                {renderEditField("department", "Department")}
              </div>
            </div>
            <div className="grid grid-cols-2 px-5 py-3 border-b text-[13px]" style={{ borderColor: "#f1f5f9" }}>
              <div className="font-medium" style={{ color: "#64748b" }}>
                {renderEditField("startDateLabel", "Start Date")}
              </div>
              <div className="font-bold" style={{ color: "#1e293b" }}>
                {renderDateEditField("startDate")}
              </div>
            </div>
            <div className="grid grid-cols-2 px-5 py-4 text-[13px]" style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)" }}>
              <div className="font-semibold" style={{ color: "#5b21b6" }}>
                {renderEditField("packageLabel", isIntern ? "Monthly Stipend" : "Annual CTC")}
              </div>
              <div
                className="font-bold text-[15px] cursor-text rounded px-1 -mx-1 py-0.5 transition-all duration-150 hover:outline hover:outline-2 hover:outline-[#7c3aed]/50 hover:bg-white/60"
                style={{ color: "#5b21b6" }}
                onClick={() => setEditingField("package")}
              >
                {editingField === "package" ? (
                  <Input
                    type="number"
                    value={form.watch("package")}
                    className="h-8 w-28 border-2 border-[#7c3aed] bg-white shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
                    autoFocus
                    onBlur={() => setEditingField(null)}
                    onChange={(e) => form.setValue("package", Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); setEditingField(null); }
                      if (e.key === "Escape") setEditingField(null);
                    }}
                  />
                ) : (
                  <span
                    className="cursor-text hover:bg-white/50 px-1 rounded transition-colors"
                    onClick={() => setEditingField("package")}
                  >
                    {data.packageType === "lpa"
                      ? `₹${data.package.toFixed(1)} LPA`
                      : `₹${data.package.toLocaleString("en-IN")}/month`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="font-bold text-[14px] mb-2 pl-4 relative" style={{ color: "#1e293b" }}>
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: "linear-gradient(180deg, #7c3aed, #a78bfa)" }} />
              {renderEditField("benefitsTitle", "2. Benefits")}
            </h3>
            <div className="leading-[1.8] pl-4 text-[14px]" style={{ color: "#475569" }}>
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
            <h3 className="font-bold text-[14px] mb-2 pl-4 relative" style={{ color: "#1e293b" }}>
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: "linear-gradient(180deg, #7c3aed, #a78bfa)" }} />
              {renderEditField("acceptanceTitle", "3. Acceptance")}
            </h3>
            <div className="mb-6 pl-4 leading-[1.8] text-[14px]" style={{ color: "#475569" }}>
              {renderEditField(
                "acceptanceText",
                "Please sign and return a copy of this letter within 7 days to confirm your acceptance.",
                true,
                "w-full"
              )}
            </div>
            <div className="italic text-[14px] font-medium" style={{ color: "#334155" }}>
              {renderEditField("closingText", "We look forward to having you as part of our team!", false, "w-full")}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-auto pt-10 grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="h-10 mb-2" style={{ borderBottom: "1px solid #94a3b8" }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#64748b" }}>
                {renderEditField("candidateSignatureLabel", "Candidate Signature")}
              </p>
              <p className="text-[13px] mt-1 font-medium" style={{ color: "#334155" }}>
                {renderEditField("candidateName", "Candidate Name", false, "", "candidateNameSignature")}
              </p>
            </div>
            <div className="text-center">
              <div className="h-10 mb-2 flex items-center justify-center">
                {data.hrSignature ? (
                  <img src={data.hrSignature} alt="Signature" className="h-10 object-contain" />
                ) : (
                  <div className="w-full h-full" style={{ borderBottom: "1px solid #94a3b8" }} />
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#64748b" }}>
                {renderEditField("authorizedSignatoryLabel", "Authorized Signatory")}
              </p>
              <div className="text-[13px] font-bold mt-1" style={{ color: "#334155" }}>
                {renderEditField("hrName", "HR Name")}
              </div>
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                {renderEditField("hrTitle", "HR Manager")}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 text-center relative">
            {/* Decorative footer line */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(90deg, transparent, #cbd5e1)" }} />
              <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#7c3aed" }} />
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(90deg, #cbd5e1, transparent)" }} />
            </div>
            <div className="text-[10px] italic" style={{ color: "#94a3b8", fontFamily: "'Georgia', serif" }}>
              {renderEditField("footerText", "This document is confidential and intended for the named recipient only.", false, "w-full")}
            </div>
          </div>
        </div>

        {/* Decorative bottom gradient bar */}
        <div className="h-2 w-full mt-auto" style={{ background: "linear-gradient(90deg, #e9d5ff 0%, #c084fc 30%, #7c3aed 60%, #1e293b 100%)" }} />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/offers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Offer Letter</h1>
        <span className="text-sm text-muted-foreground ml-auto">Click on any text in the preview to edit</span>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* PDF Preview Section - Takes 2 columns */}
        <div className="col-span-2 bg-gray-100 rounded-lg border flex flex-col overflow-hidden">
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
          <div className="flex-1 overflow-y-auto bg-gray-200/50 backdrop-blur-sm p-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
            <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-4">
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
                      <FormLabel className="text-xs">Amount</FormLabel>
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

              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                  onClick={form.handleSubmit((data) => onSubmit(data, true))}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Share
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
