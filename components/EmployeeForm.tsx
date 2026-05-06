"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  DollarSign,
  X,
  Save,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  dob: z.string().min(1, "Date of birth is required"),
  role: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  manager: z.string().min(1, "Manager name is required"),
  hiredAt: z.string().min(1, "Start date is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  offerType: z.string().min(1, "Contract type is required"),
  package: z.preprocess((val) => Number(val), z.number().min(0, "Salary must be positive")),
  benefits: z.string().min(1, "Benefits description is required"),
  workSchedule: z.string().min(1, "Work schedule is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmployeeForm({ onSuccess, onCancel }: EmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const createCandidate = useMutation(api.functions.candidates.createCandidate);
  const updateCandidate = useMutation(api.functions.candidates.updateCandidate);
  const createEmployeeUser = useMutation(api.functions.auth.createEmployeeUser);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      dob: new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString(),
      role: "",
      department: "",
      manager: "",
      hiredAt: new Date().toISOString(),
      employeeId: "",
      offerType: "employee",
      package: 0,
      benefits: "Health Insurance, Paid Time Off, 401(k) Matching",
      workSchedule: "Monday - Friday, 9:00 AM - 5:00 PM",
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const fieldClassName =
    "h-14 rounded-2xl border border-zinc-200 bg-white/80 px-4 text-[15px] shadow-sm transition-shadow placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-4 focus-visible:ring-zinc-200";
  const iconFieldWrapperClassName =
    "relative rounded-2xl border border-zinc-200 bg-white/80 shadow-sm focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-200";
  const iconClassName = "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500";

  async function onSubmit(values: EmployeeFormValues) {
    try {
      const stackAuthRes = await fetch("/api/create-employee-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
          role: "admin",
        }),
      });

      if (!stackAuthRes.ok) {
        const errorData = await stackAuthRes.json();
        throw new Error(errorData.error || "Failed to create user in Stack Auth");
      }

      await stackAuthRes.json();

      await createEmployeeUser({
        email: values.email,
        name: values.name,
        phone: values.phone,
        address: values.address,
        dob: new Date(values.dob).getTime(),
        jobTitle: values.role,
        department: values.department,
        manager: values.manager,
        startDate: new Date(values.hiredAt).getTime(),
        employeeId: values.employeeId,
        salary: values.package,
        contractType: values.offerType,
        benefits: values.benefits,
        workSchedule: values.workSchedule,
      });

      const candidateId = await createCandidate({
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        department: values.department,
        offerType: values.offerType,
        status: "hired",
        address: values.address,
        dob: new Date(values.dob).getTime(),
        manager: values.manager,
        employeeId: values.employeeId,
        benefits: values.benefits,
        workSchedule: values.workSchedule,
      });

      await updateCandidate({
        id: candidateId,
        package: values.package,
        hiredAt: new Date(values.hiredAt).getTime(),
      });

      toast.success("Employee created and profile synced successfully");
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create employee");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-2">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-600">
            <User className="h-4 w-4" />
            <span>Personal Information</span>
          </div>
          <Separator className="bg-zinc-200" />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Full Name</FormLabel>
                <FormControl>
                  <div className={iconFieldWrapperClassName}>
                    <User className={iconClassName} />
                    <Input placeholder="John Doe" className={`border-0 bg-transparent pl-11 shadow-none ${fieldClassName}`} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Email Address</FormLabel>
                <FormControl>
                  <div className={iconFieldWrapperClassName}>
                    <Mail className={iconClassName} />
                    <Input placeholder="john@example.com" className={`border-0 bg-transparent pl-11 shadow-none ${fieldClassName}`} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Password</FormLabel>
                <FormControl>
                  <div className={iconFieldWrapperClassName}>
                    <Lock className={iconClassName} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-14 border-0 bg-transparent pl-11 pr-11 text-[15px] shadow-none"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 000-0000" className={fieldClassName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-14 w-full justify-start rounded-2xl border-zinc-200 bg-white/80 pl-4 text-left font-normal shadow-sm",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <span className="flex min-w-0 flex-1 items-center">
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      </span>
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Home Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, City, Country" className={fieldClassName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-600">
            <Briefcase className="h-4 w-4" />
            <span>Professional Details</span>
          </div>
          <Separator className="bg-zinc-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Job Title</FormLabel>
                  <FormControl>
                    <div className={iconFieldWrapperClassName}>
                      <Briefcase className={iconClassName} />
                      <Input placeholder="Software Engineer" className={`border-0 bg-transparent pl-11 shadow-none ${fieldClassName}`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Department</FormLabel>
                  <FormControl>
                    <div className={iconFieldWrapperClassName}>
                      <Building2 className={iconClassName} />
                      <Input placeholder="Engineering" className={`border-0 bg-transparent pl-11 shadow-none ${fieldClassName}`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="manager"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Reporting Manager</FormLabel>
                  <FormControl>
                    <Input placeholder="Manager Name" className={fieldClassName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP-001" className={`${fieldClassName} font-mono`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-600">
            <DollarSign className="h-4 w-4" />
            <span>Contract & Compensation</span>
          </div>
          <Separator className="bg-zinc-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="offerType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-200 bg-white/80 shadow-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Full-time</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="package"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Annual Salary (LPA)</FormLabel>
                  <FormControl>
                    <div className={iconFieldWrapperClassName}>
                      <DollarSign className={iconClassName} />
                      <Input type="number" className={`border-0 bg-transparent pl-11 shadow-none font-mono ${fieldClassName}`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Benefits Package</FormLabel>
                <FormControl>
                  <Input placeholder="Health, Dental, Vision, etc." className={fieldClassName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workSchedule"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Work Schedule</FormLabel>
                <FormControl>
                  <Input placeholder="Mon-Fri, 9am-5pm" className={fieldClassName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hiredAt"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">Joining Date</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-14 w-full justify-start rounded-2xl border-zinc-200 bg-white/80 pl-4 text-left font-normal shadow-sm",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center">
                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                    </span>
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-zinc-200 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="h-12 rounded-2xl px-6 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="h-14 rounded-2xl px-8 text-base font-semibold shadow-lg shadow-zinc-200/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
