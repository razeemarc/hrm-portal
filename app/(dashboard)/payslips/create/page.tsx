"use client";

import { useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

const payslipSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020, "Valid year required"),
  baseSalary: z.number().min(0, "Base salary must be positive"),
  houseRentAllowance: z.number().optional(),
  conveyanceAllowance: z.number().optional(),
  specialAllowance: z.number().optional(),
  otherAllowances: z.number().optional(),
  providentFund: z.number().optional(),
  professionalTax: z.number().optional(),
  incomeTax: z.number().optional(),
  otherDeductions: z.number().optional(),
  status: z.enum(["draft", "generated"]),
  notes: z.string().optional(),
});

type PayslipFormValues = z.infer<typeof payslipSchema>;

// Generate month options for last 12 months
const getMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7); // "2024-01"
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
};

export default function CreatePayslipPage() {
  const router = useRouter();
  const monthOptions = getMonthOptions();

  const employeesData = useQuery(api.functions.payslips.getEmployees);
  const createPayslip = useMutation(api.functions.payslips.createPayslip);
  const employees = employeesData ?? [];

  const form = useForm<PayslipFormValues>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeId: "",
      month: new Date().toISOString().slice(0, 7),
      year: new Date().getFullYear(),
      baseSalary: 0,
      houseRentAllowance: 0,
      conveyanceAllowance: 0,
      specialAllowance: 0,
      otherAllowances: 0,
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
      otherDeductions: 0,
      status: "draft",
      notes: "",
    },
  });

  // Calculate totals
  const calculations = useMemo(() => {
    const baseSalary = form.watch("baseSalary") || 0;
    const houseRentAllowance = form.watch("houseRentAllowance") || 0;
    const conveyanceAllowance = form.watch("conveyanceAllowance") || 0;
    const specialAllowance = form.watch("specialAllowance") || 0;
    const otherAllowances = form.watch("otherAllowances") || 0;

    const providentFund = form.watch("providentFund") || 0;
    const professionalTax = form.watch("professionalTax") || 0;
    const incomeTax = form.watch("incomeTax") || 0;
    const otherDeductions = form.watch("otherDeductions") || 0;

    const allowances =
      houseRentAllowance + conveyanceAllowance + specialAllowance + otherAllowances;
    const deductions = providentFund + professionalTax + incomeTax + otherDeductions;
    const grossEarnings = baseSalary + allowances;
    const totalDeductions = deductions;
    const netSalary = grossEarnings - totalDeductions;

    return {
      baseSalary,
      allowances,
      grossEarnings,
      deductions,
      totalDeductions,
      netSalary,
    };
  }, [
    form.watch("baseSalary"),
    form.watch("houseRentAllowance"),
    form.watch("conveyanceAllowance"),
    form.watch("specialAllowance"),
    form.watch("otherAllowances"),
    form.watch("providentFund"),
    form.watch("professionalTax"),
    form.watch("incomeTax"),
    form.watch("otherDeductions"),
  ]);

  const selectedEmployeeId = form.watch("employeeId");
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e._id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const onSubmit = async (data: PayslipFormValues) => {
    try {
      await createPayslip({
        employeeId: data.employeeId as Id<"candidates">,
        month: data.month,
        year: data.year,
        baseSalary: data.baseSalary,
        houseRentAllowance: data.houseRentAllowance || undefined,
        conveyanceAllowance: data.conveyanceAllowance || undefined,
        specialAllowance: data.specialAllowance || undefined,
        otherAllowances: data.otherAllowances || undefined,
        providentFund: data.providentFund || undefined,
        professionalTax: data.professionalTax || undefined,
        incomeTax: data.incomeTax || undefined,
        otherDeductions: data.otherDeductions || undefined,
        status: data.status,
        notes: data.notes || undefined,
      });
      router.push("/payslips");
      toast.success("Payslip created successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create payslip", { description: msg });
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/payslips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Payslip</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form Section - 2 columns */}
        <div className="col-span-2 bg-card rounded-lg border p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee & Period */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp._id} value={emp._id}>
                              {emp.name}
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
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {monthOptions.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
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
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Base Salary */}
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allowances */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Allowances</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="houseRentAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">House Rent Allowance (HRA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conveyanceAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Conveyance Allowance</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Special Allowance</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="otherAllowances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Other Allowances</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Deductions */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Deductions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="providentFund"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Provident Fund (PF)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="professionalTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Professional Tax (PT)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="incomeTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Income Tax (TDS)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="otherDeductions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Other Deductions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(v) => v && field.onChange(v)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Save as Draft</SelectItem>
                          <SelectItem value="generated">Generate Payslip</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes..." {...field} rows={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Payslip
                </Button>
                <Link href="/payslips">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Section - 1 column */}
        <div className="space-y-4">
          {/* Employee Info */}
          {selectedEmployee && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Employee Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {selectedEmployee.name}</p>
                <p><span className="text-muted-foreground">Email:</span> {selectedEmployee.email}</p>
                {selectedEmployee.phone && (
                  <p><span className="text-muted-foreground">Phone:</span> {selectedEmployee.phone}</p>
                )}
                {selectedEmployee.role && (
                  <p><span className="text-muted-foreground">Role:</span> {selectedEmployee.role}</p>
                )}
                {selectedEmployee.department && (
                  <p><span className="text-muted-foreground">Department:</span> {selectedEmployee.department}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Salary Breakdown Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Salary Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Earnings */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Earnings</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary</span>
                    <span>₹{calculations.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Allowances</span>
                    <span>+₹{calculations.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Gross Earnings</span>
                    <span className="text-green-600">₹{calculations.grossEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Deductions</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Deductions</span>
                    <span className="text-red-600">-₹{calculations.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Salary</span>
                  <span className="text-green-600">₹{calculations.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
