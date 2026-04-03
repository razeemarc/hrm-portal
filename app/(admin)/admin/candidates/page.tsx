"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Search, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  offerType: z.string().min(1, "Please select an offer type"),
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

/**
 * Generates an invite token via Convex, then sends the email
 * through the Next.js API route (which can read .env.local).
 */
async function sendInviteEmail({
  email,
  role,
  department,
  baseUrl,
  generateToken,
}: {
  email: string;
  role?: string;
  department?: string;
  baseUrl: string;
  generateToken: (args: { email: string; role?: string; department?: string }) => Promise<{ token: string }>;
}): Promise<string> {
  // Step 1 — create token in Convex DB
  const { token } = await generateToken({ email, role, department });
  const inviteLink = `${baseUrl}/invite/${token}`;

  // Step 2 — send email via Next.js API route
  const res = await fetch("/api/send-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role, department, inviteLink }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Email sending failed");
  }

  return inviteLink;
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Convex integration
  const candidatesData = useQuery(api.functions.candidates.getCandidates) || [];
  const inviteCandidateMutation = useMutation(api.functions.candidates.createCandidate);
  const generateInviteToken = useMutation(api.functions.invitations.sendInvite);

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      offerType: "employee",
    },
  });

  const onSubmit = async (data: CandidateFormValues) => {
    try {
      // Create candidate record in Convex
      await inviteCandidateMutation({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        status: "invited",
        offerType: data.offerType,
      });

      // Send invite email via API route
      const inviteLink = await sendInviteEmail({
        email: data.email,
        role: data.role,
        department: data.department,
        baseUrl: window.location.origin,
        generateToken: generateInviteToken,
      });

      setIsInviteOpen(false);
      form.reset();
      toast.success(
        `✉️ Invitation sent to ${data.email}!`,
        { description: `Link: ${inviteLink}`, duration: 8000 }
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to send invitation`, { description: msg });
      console.error("Invite error:", error);
    }
  };

  const handleQuickInvite = async (email: string, role?: string, department?: string, label?: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      const inviteLink = await sendInviteEmail({
        email,
        role,
        department,
        baseUrl: window.location.origin,
        generateToken: generateInviteToken,
      });
      toast.success(
        `✉️ Invitation sent${label ? ` to ${label}` : ""}!`,
        { description: `Link emailed to: ${email}`, duration: 6000 }
      );
      return inviteLink;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to send invite", { description: msg });
      console.error("Quick invite error:", error);
    }
  };

  const filteredCandidates = candidatesData.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.role?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Quick Access Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Quick Email Invite</h3>
              <p className="text-sm text-blue-700">
                Enter a candidate&apos;s email to send them a direct invite link via Gmail.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                id="direct-email"
                placeholder="candidate@example.com"
                className="bg-white border-blue-200 focus-visible:ring-blue-500"
              />
              <Button
                onClick={async () => {
                  const emailInput = document.getElementById("direct-email") as HTMLInputElement;
                  await handleQuickInvite(emailInput?.value?.trim());
                  if (emailInput) emailInput.value = "";
                }}
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <div className="flex gap-2">
          {/* Invite Candidate Dialog */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Candidate
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Candidate</DialogTitle>
                <DialogDescription>
                  Fill in the candidate&apos;s details and click &quot;Send Invite&quot;. They will receive an email with the invitation link.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
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
                        <FormLabel>Phone (Optional)</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role (Optional)</FormLabel>
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
                        <FormLabel>Department (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Engineering" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="intern">Intern</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>Sending Invite...</>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.role || "-"}</TableCell>
                    <TableCell>{candidate.department || "-"}</TableCell>
                    <TableCell className="capitalize">
                      {candidate.offerType || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[candidate.status] ?? "bg-gray-100 text-gray-800"}>
                        {candidate.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Re-send invite email"
                        onClick={() =>
                          handleQuickInvite(
                            candidate.email,
                            candidate.role,
                            candidate.department,
                            candidate.name
                          )
                        }
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Link href={`/candidates/${candidate._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}