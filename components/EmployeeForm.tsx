"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, User, Mail, Briefcase, Building2, Calendar as CalendarIcon, DollarSign, ChevronRight, Plus, X, Save, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const employeeSchema = z.object({
  // Personal Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  dob: z.string().min(1, "Date of birth is required"),
  
  // Professional Details
  role: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  manager: z.string().min(1, "Manager name is required"),
  hiredAt: z.string().min(1, "Start date is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  
  // Contract & Compensation
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

  async function onSubmit(values: EmployeeFormValues) {
    try {
      // 1. Create user in Stack Auth
      const stackAuthRes = await fetch("/api/create-employee-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
          role: "employee",
        }),
      });

      if (!stackAuthRes.ok) {
        const errorData = await stackAuthRes.json();
        throw new Error(errorData.error || "Failed to create user in Stack Auth");
      }

      const { userId } = await stackAuthRes.json();

      // 2. Store details in Convex User table
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

      // 3. Create candidate with status "hired" in Convex (for portal tracking)
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

      // 4. Update with package and hiredAt
      await updateCandidate({
        id: candidateId,
        package: values.package,
        hiredAt: new Date(values.hiredAt).getTime(),
      });

      toast.success("Employee created and profile synced successfully");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create employee");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
        {/* Personal Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Personal Information</span>
          </div>
          <Separator className="opacity-50" />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="John Doe" className="pl-10 h-11 bg-muted/30" {...field} />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="john@example.com" className="pl-10 h-11 bg-muted/30" {...field} />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-muted/30" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 000-0000" className="h-11 bg-muted/30" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-11 bg-muted/30",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Home Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, City, Country" className="h-11 bg-muted/30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Professional Info */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>Professional Details</span>
          </div>
          <Separator className="opacity-50" />
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Software Engineer" className="pl-10 h-11 bg-muted/30" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Engineering" className="pl-10 h-11 bg-muted/30" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reporting Manager</FormLabel>
                  <FormControl>
                    <Input placeholder="Manager Name" className="h-11 bg-muted/30" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP-001" className="h-11 bg-muted/30 font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Contract Info */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Contract & Compensation</span>
          </div>
          <Separator className="opacity-50" />
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="offerType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 bg-muted/30">
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Annual Salary (LPA)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-10 h-11 bg-muted/30 font-mono" {...field} />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Benefits Package</FormLabel>
                <FormControl>
                  <Input placeholder="Health, Dental, Vision, etc." className="h-11 bg-muted/30" {...field} />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Schedule</FormLabel>
                <FormControl>
                  <Input placeholder="Mon-Fri, 9am-5pm" className="h-11 bg-muted/30" {...field} />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Joining Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-11 bg-muted/30",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 pt-6 sticky bottom-0 bg-background pb-4">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="h-11 text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
