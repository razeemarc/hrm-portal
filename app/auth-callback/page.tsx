"use client";

import { useUser } from "@stackframe/stack";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const user = useUser();

  useEffect(() => {
    if (user) {
      console.log("AuthCallback: User detected", user.id);
      try {
        const role =
          user.clientMetadata?.role ||
          user.clientReadOnlyMetadata?.role ||
          ("serverMetadata" in user ? user.serverMetadata?.role : undefined);
        console.log("AuthCallback: Role detected", role);
        
        if (role === "admin" || role === "hr") {
          console.log("AuthCallback: Redirecting to /admin/dashboard");
          window.location.href = "/admin/dashboard";
        } else {
          console.log("AuthCallback: Redirecting to /dashboard");
          window.location.href = "/dashboard";
        }
      } catch (err) {
        console.error("Redirection error:", err);
        window.location.href = "/";
      }
    } else {
      console.log("AuthCallback: No user detected yet");
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Verifying your credentials and role...
        </p>
      </div>
    </div>
  );
}
