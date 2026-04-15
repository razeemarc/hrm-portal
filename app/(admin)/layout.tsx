"use client";

import { useUser, useStackApp } from "@stackframe/stack";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ScrollText,
  Building2,
  ClipboardCheck,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/admin/candidates", icon: Users },
  { name: "Documents", href: "/admin/documents", icon: FileCheck },
  { name: "Offers", href: "/admin/offers", icon: ScrollText },
  { name: "Employees", href: "/admin/employees", icon: Building2 },
  { name: "Management", href: "/admin/management", icon: ClipboardCheck },
  { name: "User Management", href: "/admin/user-management", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

type RoleMetadata = {
  role?: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser({ or: 'redirect' });
  const app = useStackApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) {
    return null;
  }

  // Security check: If employee tries to access /admin, redirect them back to their dashboard
  const userWithRole = user as typeof user & {
    metadata?: RoleMetadata;
    clientReadOnlyMetadata?: RoleMetadata;
  };
  const role = userWithRole.metadata?.role || userWithRole.clientReadOnlyMetadata?.role;
  console.log("AdminLayout: User role", role);
  
  if (role === "employee") {
    console.log("AdminLayout: Employee detected, redirecting to /dashboard");
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-white border-r lg:block"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/admin/dashboard" className="text-xl font-bold">
            HRM Portal
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.primaryEmail}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => router.push(app.urls.signOut)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Link href="/admin/dashboard" className="font-semibold">
              HRM Portal
            </Link>
            <button
              onClick={() => router.push(app.urls.signOut)}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="p-4 pb-28 lg:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex min-w-[4.75rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
