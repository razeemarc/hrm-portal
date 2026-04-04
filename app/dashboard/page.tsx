"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  User,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function EmployeeDashboard() {
  const user = useUser({ or: 'redirect' });
  const router = useRouter();

  if (!user) {
    return null;
  }

  // Check if role is employee
  // @ts-ignore
  const role = user.metadata?.role || user.clientReadOnlyMetadata?.role;
  console.log("EmployeeDashboard: User role", role);
  
  if (role !== "employee" && role !== undefined && role !== null) {
    console.log("EmployeeDashboard: Not an employee, redirecting to /admin/dashboard");
    router.replace("/admin/dashboard");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user.displayName?.split(' ')[0] || 'Employee'}!</h1>
        <p className="text-muted-foreground mt-1">Here is an overview of your employee profile and recent updates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Your personal and professional details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Info</p>
                  <Separator className="my-2 opacity-50" />
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{user.primaryEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">+1 (555) 0123-4567</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground italic">Address not set</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Work Details</p>
                  <Separator className="my-2 opacity-50" />
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Software Engineer</span>
                        <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Engineering Dept</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">March 15, 2024</span>
                        <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Join Date</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sarah Jenkins</span>
                        <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Reporting Manager</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats/Actions */}
        <div className="space-y-8">
          <Card className="shadow-sm border-muted/60 bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-primary">$120,000</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Annual Salary (LPA)</p>
              </div>
              <Badge variant="secondary" className="mt-4 bg-primary/10 text-primary border-primary/20">
                Full-time Employee
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {['Offer_Letter.pdf', 'Work_Policy.pdf'].map((doc, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
