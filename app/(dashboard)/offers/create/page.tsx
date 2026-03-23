"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarIcon, Loader2, ArrowLeft, Upload, X } from "lucide-react";
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
  // Company details
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  hrName: z.string().min(1, "HR name is required"),
  // Custom text content
  introductionText: z.string().optional(),
  benefitsText: z.string().optional(),
  acceptanceText: z.string().optional(),
  closingText: z.string().optional(),
  footerText: z.string().optional(),
  // Signatures
  hrSignature: z.string().optional(),
  companyLogo: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function CreateOfferPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const hrSignatureInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  // ── Convex queries ──
  const candidatesData = useQuery(api.functions.candidates.getCandidates);

  // ── Convex mutations ──
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

  // Handle file upload for signatures
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

  // Get selected candidate for preview
  const selectedCandidateId = form.watch("candidateId");
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c._id === selectedCandidateId);
  }, [candidates, selectedCandidateId]);

  // Preview data - computed from form values
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/offers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Offer Letter</h1>
      </div>

      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Form Section */}
        <div className="bg-card rounded-lg border p-6 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Fill in the details below to generate an offer letter. Preview updates in real-time.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Section: Candidate & Offer Type */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Candidate Details</h3>

                {/* Candidate select */}
                <FormField
                  control={form.control}
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate</FormLabel>
                      <Select
                        onValueChange={(v) => v && field.onChange(v)}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select candidate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {candidates.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              No candidates found
                            </SelectItem>
                          ) : (
                            candidates.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name} ({c.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Offer type */}
                <FormField
                  control={form.control}
                  name="offerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Type</FormLabel>
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
                          <SelectItem value="employee">
                            Full-time Employee
                          </SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
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
                </div>

                {/* Package in Rupees with Type */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="package"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("offerType") === "intern"
                            ? "Stipend Amount (₹)"
                            : "Salary Amount (₹)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={
                              form.watch("offerType") === "intern"
                                ? "20000"
                                : "800000"
                            }
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
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
                            <SelectItem value="lpa">
                              LPA (Lakhs Per Annum)
                            </SelectItem>
                            <SelectItem value="monthly">
                              Monthly (₹/month)
                            </SelectItem>
                            <SelectItem value="stipend">
                              Stipend (₹/month)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Dates */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              />
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              />
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Company Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Company Details</h3>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ladder Academy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hrName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Manager Name</FormLabel>
                      <FormControl>
                        <Input placeholder="HR Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: Signatures & Logo */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Signatures & Logo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hrSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HR Signature (Image)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              ref={hrSignatureInputRef}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, "hrSignature");
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => hrSignatureInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                            {hrSignature && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => form.setValue("hrSignature", "")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        {hrSignature && (
                          <div className="mt-2 border rounded p-2">
                            <img src={hrSignature} alt="HR Signature" className="h-16 object-contain" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              ref={companyLogoInputRef}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, "companyLogo");
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => companyLogoInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                            {companyLogo && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => form.setValue("companyLogo", "")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        {companyLogo && (
                          <div className="mt-2 border rounded p-2">
                            <img src={companyLogo} alt="Company Logo" className="h-16 object-contain" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Custom Text Content */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customize Letter Content</h3>
                <FormField
                  control={form.control}
                  name="introductionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Introduction Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Custom introduction text (leave empty for default)"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="benefitsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benefits Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Custom benefits description (leave empty for default)"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acceptanceText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acceptance/Terms Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Custom acceptance terms (leave empty for default)"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closingText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Custom closing message (leave empty for default)"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="footerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Custom footer text (leave empty for default)"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Offer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === "form" ? "preview" : "form")}
                >
                  {activeTab === "form" ? "Show Preview" : "Show Form"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-100 rounded-lg border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b">
            <span className="text-sm font-medium">Live Preview</span>
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
      </div>
    </div>
  );
}
