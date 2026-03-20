"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

const offerSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  offerType: z.enum(["intern", "employee"]),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  package: z.number().min(0, "Package must be positive"),
  startDate: z.date({ message: "Start date is required" }),
  expiryDate: z.date({ message: "Expiry date is required" }),
});

type OfferFormValues = z.infer<typeof offerSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function OffersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ── Convex queries ──
  const offersData = useQuery(api.functions.offers.getOffers);
  const candidatesData = useQuery(api.functions.candidates.getCandidates);

  // ── Convex mutations ──
  const createOffer = useMutation(api.functions.offers.createOffer);

  const offers = offersData ?? [];
  const candidates = candidatesData ?? [];

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidateId: "",
      offerType: "employee",
      role: "",
      department: "",
      package: 0,
    },
  });

  const onSubmit = async (data: OfferFormValues) => {
    try {
      await createOffer({
        candidateId: data.candidateId as Id<"candidates">,
        offerType: data.offerType,
        role: data.role,
        department: data.department,
        package: data.package,
        startDate: data.startDate.getTime(),
        expiryDate: data.expiryDate.getTime(),
      });
      setIsCreateOpen(false);
      form.reset();
      toast.success("Offer created successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create offer", { description: msg });
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Offer Letters</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Offer Letter</DialogTitle>
              <DialogDescription>
                Generate an offer letter for a candidate
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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

                {/* Package */}
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("offerType") === "intern"
                          ? "Stipend ($/month)"
                          : "Annual Salary ($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={
                            form.watch("offerType") === "intern"
                              ? "2000"
                              : "80000"
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

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
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

                  {/* Expiry Date */}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
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
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{offers.length}</div>
                <div className="text-sm text-gray-500">Total Offers</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {offers.filter((o) => o.status === "pending").length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {offers.filter((o) => o.status === "accepted").length}
                </div>
                <div className="text-sm text-gray-500">Accepted</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {offersData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {offers.filter((o) => o.status === "rejected").length}
                </div>
                <div className="text-sm text-gray-500">Rejected</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardContent className="p-0">
          {offersData === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No offers created yet
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell>
                        <div className="font-medium">
                          {offer.candidate?.name ?? "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.candidate?.email ?? ""}
                        </div>
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
                      <TableCell suppressHydrationWarning>
                        {new Date(offer.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        {new Date(offer.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[offer.status] ?? ""}>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/candidates/${offer.candidateId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}