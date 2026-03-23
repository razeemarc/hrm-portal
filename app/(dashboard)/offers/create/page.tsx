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
import { CalendarIcon, Loader2, ArrowLeft, Upload, X, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { PDFViewer } from "@react-pdf/renderer";
import { EmployeeOfferTemplate, InternOfferTemplate } from "@/templates/OfferLetterTemplate";

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
  const hrSignatureInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  const candidatesData = useQuery(api.functions.candidates.getCandidates);
  const createOffer = useMutation(api.functions.offers.createOffer);
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
      await createOffer({
        candidateId: data.candidateId as Id<"candidates">,
        offerType: data.offerType,
        role: data.role,
        department: data.department,
        package: data.package,
        packageType: data.packageType,
        startDate: data.startDate.getTime(),
        expiryDate: data.expiryDate.getTime(),
      });
      router.push("/offers");
      toast.success("Offer created successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create offer", { description: msg });
      console.error(err);
    }
  };

  const hrSignature = form.watch("hrSignature");
  const companyLogo = form.watch("companyLogo");

  // Render inline edit field
  const renderEditField = (fieldName: keyof OfferFormValues, label: string, placeholder: string, isTextarea = false) => {
    const isEditing = editingField === fieldName;

    return (
      <div className="relative">
        {isEditing ? (
          <div className="flex items-center gap-2">
            {isTextarea ? (
              <Textarea
                {...form.register(fieldName)}
                placeholder={placeholder}
                className="text-sm"
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && setEditingField(null)}
              />
            ) : (
              <Input
                {...form.register(fieldName)}
                placeholder={placeholder}
                className="text-sm h-8"
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
              />
            )}
          </div>
        ) : (
          <div
            className="text-sm cursor-pointer hover:bg-accent rounded px-2 py-1 -mx-2 min-h-[28px] flex items-center"
            onClick={() => setEditingField(fieldName)}
          >
            {form.watch(fieldName as any) || <span className="text-muted-foreground">{placeholder}</span>}
          </div>
        )}
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
          <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
            <span className="text-sm font-medium">Live Preview</span>
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-[calc(100%-40px)]">
            <PDFViewer width="100%" height="100%" showToolbar>
              {previewData.offerType === "intern" ? (
                <InternOfferTemplate {...previewData} />
              ) : (
                <EmployeeOfferTemplate {...previewData} />
              )}
            </PDFViewer>
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
                    <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
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
                    <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
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
                      <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
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
