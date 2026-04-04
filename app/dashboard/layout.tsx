"use client";

import { useUser, useStackApp } from "@stackframe/stack";
import { useRouter, usePathname } from "next/navigation";
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
  Clock
} from "lucide-react";
import { useState } from "react";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser({ or: 'redirect' });
  const app = useStackApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  const navigation = [
    { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
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
                  pathname === item.href
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
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
          {children}
        </main>
      </div>
    </div>
  );
}
