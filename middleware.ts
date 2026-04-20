import { NextResponse, type NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack/server";

type RoleMetadata = {
  role?: string;
};

function getRole(user: {
  metadata?: RoleMetadata;
  clientReadOnlyMetadata?: RoleMetadata;
  serverMetadata?: RoleMetadata;
} | null) {
  return (
    user?.metadata?.role ||
    user?.clientReadOnlyMetadata?.role ||
    user?.serverMetadata?.role
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle /admin redirect
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Handle common auth redirects
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/handler/login", request.url));
  }
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/handler/signup", request.url));
  }

  const isUserManagementPath =
    pathname === "/user-management" ||
    pathname === "/dashboard/user-management" ||
    pathname === "/admin/dashboard/user-management";

  const isAdminPath = pathname.startsWith("/admin");

  if (!isUserManagementPath && !isAdminPath) {
    return NextResponse.next();
  }

  const user = await stackServerApp.getUser({
    tokenStore: request,
    or: "return-null",
    includeRestricted: true,
  });

  if (!user) {
    if (isUserManagementPath || isAdminPath) {
      return NextResponse.redirect(new URL("/handler/login", request.url));
    }
    return NextResponse.next();
  }

  const role = getRole(user as Parameters<typeof getRole>[0]);

  // Handle Admin role specifically for admin paths (Restricted)
  if (role === "admin" && isAdminPath) {
    const allowedAdminPaths = [
      "/admin/dashboard",
      "/admin/dashboard/user-management",
      "/admin/settings",
    ];
    const isAllowed = allowedAdminPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
    
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Handle HR role specifically for admin paths (Full access to HR modules)
  if (role === "hr" && isAdminPath) {
    const allowedHrPaths = [
      "/admin/dashboard",
      "/admin/settings",
      "/admin/candidates",
      "/admin/documents",
      "/admin/offers",
      "/admin/employees",
      "/admin/management",
      "/admin/dashboard/user-management",
    ];
    const isAllowed = allowedHrPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
    
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Original user management logic
  if (isUserManagementPath) {
    if (role === "admin" || role === "hr") {
      if (pathname !== "/admin/dashboard/user-management") {
        return NextResponse.redirect(
          new URL("/admin/dashboard/user-management", request.url)
        );
      }
      return NextResponse.next();
    }

    if (role === "accountant" || role === "employee") {
      if (pathname !== "/dashboard/user-management") {
        return NextResponse.redirect(new URL("/dashboard/user-management", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup", "/user-management", "/dashboard/user-management"],
};
