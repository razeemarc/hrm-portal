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

  const isUserManagementPath =
    pathname === "/user-management" ||
    pathname === "/dashboard/user-management" ||
    pathname === "/admin/dashboard/user-management";

  if (!isUserManagementPath) {
    return NextResponse.next();
  }

  const user = await stackServerApp.getUser({
    tokenStore: request,
    or: "return-null",
    includeRestricted: true,
  });

  if (!user) {
    if (isUserManagementPath) {
      return NextResponse.redirect(new URL("/handler/login", request.url));
    }
    return NextResponse.next();
  }

  const role = getRole(user as Parameters<typeof getRole>[0]);

  if (role === "admin") {
    if (pathname !== "/admin/dashboard/user-management") {
      return NextResponse.redirect(
        new URL("/admin/dashboard/user-management", request.url)
      );
    }
    return NextResponse.next();
  }

  if (role === "hr" || role === "accountant" || role === "employee") {
    if (pathname !== "/dashboard/user-management") {
      return NextResponse.redirect(new URL("/dashboard/user-management", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/user-management", "/dashboard/user-management", "/admin/dashboard/user-management"],
};
