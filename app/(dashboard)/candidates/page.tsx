"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Mail, Phone, Building, Briefcase } from "lucide-react";
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

interface Candidate extends CandidateFormValues {
  _id: string;
  status: string;
  createdAt: number;
}

// Mock data - will be replaced with Convex query
const mockCandidates: Candidate[] = [
  {
    _id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    role: "Frontend Developer",
    department: "Engineering",
    status: "pending",
    employeeType: "employee",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    _id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+0987654321",
    role: "Backend Developer",
    department: "Engineering",
    status: "in_review",
    employeeType: "employee",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    _id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1122334455",
    role: "UI/UX Designer",
    department: "Design",
    status: "offered",
    employeeType: "intern",
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    _id: "4",
    name: "Sarah Williams",
    email: "sarah@example.com",
    phone: "+5566778899",
    role: "Marketing Manager",
    department: "Marketing",
    status: "hired",
    employeeType: "employee",
    createdAt: Date.now() - 86400000 * 15,
  },
];

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-purple-100 text-purple-800",
  offered: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  // Convex integration
  const candidatesData = useQuery(api.functions.candidates.getCandidates) || [];
  const inviteCandidateMutation = useMutation(api.functions.candidates.createCandidate);
  const sendInviteMutation = useMutation(api.functions.invitations.sendInvite);

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
      // First create/update candidate record
      await inviteCandidateMutation({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        status: "invited",
        offerType: data.offerType,
      });

      // Then send the invite (token generation)
      await sendInviteMutation({
        email: data.email,
        role: data.role,
        department: data.department,
      });

      setIsInviteOpen(false);
      form.reset();
      toast.success("Invitation sent successfully!");
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
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
              <h3 className="font-semibold text-blue-900">Direct Portal Invite</h3>
              <p className="text-sm text-blue-700">Enter a candidate's email to go straight to their portal form.</p>
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
                  const email = emailInput?.value;
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!email || !emailRegex.test(email)) {
                    toast.error("Please enter a valid email address");
                    return;
                  }
                  
                  try {
                    const result = await sendInviteMutation({ email });
                    const portalLink = `${window.location.protocol}//${window.location.host}/invite/${result.token}`;
                    toast.success("Invitation generated & redirected!");
                    window.open(portalLink, "_blank");
                  } catch (error) {
                    toast.error("Failed to generate invite");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <div className="flex gap-2">
          {/* Quick Invite Form */}
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              <Mail className="h-4 w-4 mr-2" />
              Quick Portal Access
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Access Candidate Portal</DialogTitle>
                <DialogDescription>
                  Enter a candidate's email to generate an invite and go straight to their portal form.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <FormLabel>Candidate Email</FormLabel>
                  <Input placeholder="candidate@example.com" id="quick-invite-email" />
                </div>
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    const emailInput = document.getElementById("quick-invite-email") as HTMLInputElement;
                    const email = emailInput?.value;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!email || !emailRegex.test(email)) {
                      toast.error("Please enter a valid email address");
                      return;
                    }
                    
                    try {
                      const result = await sendInviteMutation({ email });
                      const portalLink = `${window.location.protocol}//${window.location.host}/invite/${result.token}`;
                      toast.success("Invitation generated & redirected!");
                      window.open(portalLink, "_blank");
                    } catch (error) {
                      toast.error("Failed to generate invite");
                    }
                  }}
                >
                  Generate & Go to Form
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Candidate
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Candidate</DialogTitle>
                <DialogDescription>
                  Send an invitation link to a candidate to complete their profile.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  {form.formState.isSubmitting ? "Inviting..." : "Send Invitation"}
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
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                      <Badge className={statusColors[candidate.status]}>
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
                        onClick={async () => {
                          try {
                            const result = await sendInviteMutation({ 
                              email: candidate.email,
                              role: candidate.role,
                              department: candidate.department
                            });
                            const portalLink = `${window.location.protocol}//${window.location.host}/invite/${result.token}`;
                            toast.success(`Invite link generated for ${candidate.name}`);
                            window.open(portalLink, "_blank");
                          } catch (error) {
                            toast.error("Failed to generate invite");
                          }
                        }}
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