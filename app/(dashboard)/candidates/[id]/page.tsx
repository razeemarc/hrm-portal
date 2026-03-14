"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Save, FileText, Mail, Phone, Building, Briefcase, DollarSign } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

// Mock data
const mockCandidate = {
  _id: "1",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  role: "Frontend Developer",
  department: "Engineering",
  package: 80000,
  offerType: "employee" as const,
  status: "pending",
  createdAt: Date.now() - 86400000 * 3,
  updatedAt: Date.now(),
  documents: [
    { _id: "d1", type: "resume", fileName: "resume.pdf", status: "pending" },
    { _id: "d2", type: "id_proof", fileName: "id_card.pdf", status: "verified" },
  ],
  offers: [
    {
      _id: "o1",
      offerType: "employee",
      role: "Frontend Developer",
      department: "Engineering",
      package: 80000,
      startDate: Date.now() + 86400000 * 14,
      status: "pending",
    },
  ],
};

const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  package: z.number().optional(),
  status: z.string(),
  offerType: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-purple-100 text-purple-800",
  offered: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState(mockCandidate);
  const [saving, setSaving] = useState(false);

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || "",
      role: candidate.role || "",
      department: candidate.department || "",
      package: candidate.package || undefined,
      status: candidate.status,
      offerType: candidate.offerType || "",
    },
  });

  const onSubmit = async (data: CandidateFormValues) => {
    setSaving(true);
    // In real app, call Convex mutation
    setTimeout(() => {
      setCandidate({ ...candidate, ...data, updatedAt: Date.now() });
      setSaving(false);
      toast.success("Candidate updated successfully");
    }, 1000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/candidates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
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
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Candidate</CardTitle>
              <CardDescription>Update candidate information and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <Input {...field} />
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
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="invited">Invited</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Documents</CardTitle>
              <CardDescription>View and verify uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
              ) : (
                <div className="space-y-4">
                  {candidate.documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-gray-500 capitalize">{doc.type.replace("_", " ")}</div>
                        </div>
                      </div>
                      <Badge variant={doc.status === "verified" ? "default" : "secondary"}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Offer Letters</CardTitle>
              <CardDescription>View and manage offer letters</CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.offers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No offers created yet</p>
                  <Link href={`/offers?candidate=${candidate._id}`}>
                    <Button>Create Offer</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidate.offers.map((offer) => (
                    <div key={offer._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {offer.offerType === "intern" ? "Internship" : "Employment"} Offer - {offer.role}
                        </div>
                        <Badge variant={offer.status === "pending" ? "secondary" : "default"}>
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Department: {offer.department}</div>
                        <div>Package: ${offer.package.toLocaleString()}</div>
                        <div>Start Date: {new Date(offer.startDate).toLocaleDateString()}</div>
                      </div>
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