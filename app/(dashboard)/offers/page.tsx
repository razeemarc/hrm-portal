"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Offer, Plus, Send, Eye, FileText } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

// Mock candidates who can receive offers
const mockCandidates = [
  { _id: "1", name: "John Doe", email: "john@example.com", role: "Frontend Developer", department: "Engineering" },
  { _id: "2", name: "Jane Smith", email: "jane@example.com", role: "Backend Developer", department: "Engineering" },
];

// Mock existing offers
const mockOffers = [
  {
    _id: "o1",
    candidateId: "1",
    candidate: { name: "John Doe", email: "john@example.com" },
    offerType: "employee",
    role: "Frontend Developer",
    department: "Engineering",
    package: 80000,
    startDate: Date.now() + 86400000 * 14,
    expiryDate: Date.now() + 86400000 * 28,
    status: "pending",
    createdAt: Date.now() - 86400000,
  },
  {
    _id: "o2",
    candidateId: "3",
    candidate: { name: "Mike Johnson", email: "mike@example.com" },
    offerType: "intern",
    role: "UI/UX Designer",
    department: "Design",
    package: 2000,
    startDate: Date.now() + 86400000 * 7,
    expiryDate: Date.now() + 86400000 * 60,
    status: "accepted",
    createdAt: Date.now() - 86400000 * 5,
  },
];

const offerSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  offerType: z.enum(["intern", "employee"]),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  package: z.number().min(0, "Package must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type OfferFormValues = z.infer<typeof offerSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function OffersPage() {
  const [offers, setOffers] = useState(mockOffers);
  const [candidates] = useState(mockCandidates);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidateId: "",
      offerType: "employee",
      role: "",
      department: "",
      package: 0,
      startDate: "",
      expiryDate: "",
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    const candidate = candidates.find((c) => c._id === data.candidateId);
    const newOffer = {
      _id: Date.now().toString(),
      candidateId: data.candidateId,
      candidate: { name: candidate?.name || "", email: candidate?.email || "" },
      offerType: data.offerType,
      role: data.role,
      department: data.department,
      package: data.package,
      startDate: new Date(data.startDate).getTime(),
      expiryDate: new Date(data.expiryDate).getTime(),
      status: "pending",
      createdAt: Date.now(),
    };
    setOffers([newOffer, ...offers]);
    setIsCreateOpen(false);
    form.reset();
    toast.success("Offer created successfully");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Offer Letters</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Offer Letter</DialogTitle>
              <DialogDescription>
                Generate an offer letter for a candidate
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select candidate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {candidates.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name} ({c.email})
                            </SelectItem>
                          ))}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Full-time Employee</SelectItem>
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
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{form.watch("offerType") === "intern" ? "Stipend ($/month)" : "Annual Salary ($)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={form.watch("offerType") === "intern" ? "2000" : "80000"}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Offer
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{offers.length}</div>
            <div className="text-sm text-gray-500">Total Offers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {offers.filter((o) => o.status === "pending").length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {offers.filter((o) => o.status === "accepted").length}
            </div>
            <div className="text-sm text-gray-500">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {offers.filter((o) => o.status === "rejected").length}
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No offers created yet
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer._id}>
                    <TableCell>
                      <div className="font-medium">{offer.candidate.name}</div>
                      <div className="text-sm text-gray-500">{offer.candidate.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {offer.offerType === "intern" ? "Intern" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>{offer.role}</TableCell>
                    <TableCell>
                      ${offer.package.toLocaleString()}
                      {offer.offerType === "intern" && "/month"}
                    </TableCell>
                    <TableCell>
                      {new Date(offer.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[offer.status]}>
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/offer/${offer._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
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