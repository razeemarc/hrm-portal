"use client";

import { useUser, useStackApp } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  User,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Phone
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function EmployeeDashboard() {
  const user = useUser({ or: 'redirect' });
  const app = useStackApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  // Check if role is employee
  // @ts-ignore
  const role = user.metadata?.role || user.clientReadOnlyMetadata?.role;
  if (role !== "employee" && role !== undefined) {
    // If not employee (and not new user), redirect back to home or admin
    // router.replace("/admin/dashboard");
  }

  const navigation = [
    { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Documents", href: "/dashboard/documents", icon: FileCheck },
    { name: "Company Directory", href: "/dashboard/directory", icon: Building2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              H
            </div>
            <span className="text-xl font-bold tracking-tight">HRM Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-64px)] justify-between p-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "/dashboard" === item.href
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", "/dashboard" === item.href ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/10">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user.displayName || 'Employee'}</p>
                <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-bold">Employee Portal</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
              size="sm"
              onClick={() => router.push(app.urls.signOut)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold tracking-tight">HRM Portal</span>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
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
        </main>
      </div>
    </div>
  );
}
