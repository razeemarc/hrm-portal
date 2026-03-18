"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Mock invitation data - real app would use useQuery(api.invitations.getInvitationByToken, { token })
const getMockInvite = (token: string) => {
  let decodedEmail = "candidate@example.com";
  if (token.startsWith("mock-")) {
    try {
      decodedEmail = atob(token.replace("mock-", ""));
    } catch (e) {
      decodedEmail = "invalid@example.com";
    }
  }

  return {
    _id: "inv1",
    token: token,
    email: decodedEmail,
    role: "Frontend Developer",
    department: "Engineering",
    expiresAt: Date.now() + 86400000 * 7,
  };
};

// Document types to upload
const requiredDocuments = [
  { type: "resume", label: "Resume/CV", required: true },
  { type: "id_proof", label: "ID Proof (Aadhar/Passport)", required: true },
  { type: "photo", label: "Passport Photo", required: true },
  { type: "certificate", label: "Educational Certificates", required: false },
];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^[0-9]+$/, "Only digits are allowed"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  // Convex integration
  const invitation = useQuery(api.functions.invitations.getInvitationByToken, { token });
  const updateCandidateMutation = useMutation(api.functions.candidates.updateCandidate);
  const getCandidateByEmail = useQuery(api.functions.candidates.getCandidateByEmail, 
    invitation ? { email: invitation.email } : "skip"
  );
  const useInvitationMutation = useMutation(api.functions.invitations.useInvitation);

  const mockInvitation = getMockInvite(token);
  const activeInvitation = invitation || (token.startsWith("mock-") ? mockInvitation : null);

  const [step, setStep] = useState<"profile" | "documents">("profile");
  const [documents, setDocuments] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const handleFileChange = (type: string, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [type]: file }));
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      if (activeInvitation && getCandidateByEmail) {
        await updateCandidateMutation({
          id: getCandidateByEmail._id,
          name: data.name,
          phone: data.phone,
        });
      }
      setStep("documents");
      toast.success("Profile saved! Please upload your documents.");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const handleDocumentUpload = async () => {
    // Check if all required documents are uploaded
    const missingDocs = requiredDocuments
      .filter((d) => d.required && !documents[d.type])
      .map((d) => d.label);

    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.join(", ")}`);
      return;
    }

    setUploading(true);
    // In real app, upload documents to Convex storage
    setTimeout(() => {
      setUploading(false);
      setSubmitted(true);
      toast.success("Documents submitted successfully! Your application is under review.");
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your profile and documents have been submitted successfully. HR will review your application and get back to you soon.
            </p>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
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
          <h1 className="text-3xl font-bold mb-2">Welcome to Ladder Academy</h1>
          <p className="text-gray-600">
            Complete your profile and upload required documents
          </p>
        </div>

        {/* Invitation Details */}
        {!activeInvitation ? (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>Invalid or expired invitation link. Please contact HR.</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <span>
                  You&apos;ve been invited to apply for the position of{" "}
                  <strong>{activeInvitation.role}</strong> in the{" "}
                  <strong>{activeInvitation.department}</strong> department.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={step} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="profile" className="flex-1">
              1. Personal Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">
              2. Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Please provide your details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234567890" 
                              maxLength={10} 
                              {...field} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Email:</strong> {activeInvitation?.email}
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Continue to Documents
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Please upload the required documents. Maximum file size: 5MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredDocuments.map((doc) => (
                  <div key={doc.type} className="space-y-2">
                    <Label>
                      {doc.label}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {documents[doc.type] ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{documents[doc.type]?.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange(doc.type, null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <div className="text-sm text-gray-500">
                            Click to upload or drag and drop
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleDocumentUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Submit Application"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}