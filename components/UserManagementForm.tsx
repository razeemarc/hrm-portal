"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Lock, Mail, Save, ShieldCheck, User, X } from "lucide-react";

const managementUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["hr", "accountant"], {
    message: "Select a role",
  }),
});

type UserManagementFormValues = z.infer<typeof managementUserSchema>;

interface UserManagementFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserManagementForm({
  onSuccess,
  onCancel,
}: UserManagementFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [roleValue, setRoleValue] = useState<"hr" | "accountant">("hr");
  const createManagementUser = useMutation(api.functions.auth.createManagementUser);

  const form = useForm<UserManagementFormValues>({
    resolver: zodResolver(managementUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "hr",
    },
  });

  const { isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: UserManagementFormValues) {
    try {
      const response = await fetch("/api/create-management-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create management user");
      }

      await createManagementUser({
        email: values.email,
        name: values.name,
        role: values.role,
      });

      toast.success("User created successfully");
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "hr",
      });
      setRoleValue("hr");
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create management user"
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>User Details</span>
          </div>
          <Separator className="opacity-50" />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Enter full name"
                      className="h-11 bg-muted/30 pl-10"
                      {...field}
                    />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="name@company.com"
                      className="h-11 bg-muted/30 pl-10"
                      {...field}
                    />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="h-11 bg-muted/30 pl-10 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Role
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    const nextValue = value as "hr" | "accountant";
                    setRoleValue(nextValue);
                    field.onChange(nextValue);
                  }}
                  value={roleValue}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 bg-background pb-4 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="h-12 text-base font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Create User
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-11 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
