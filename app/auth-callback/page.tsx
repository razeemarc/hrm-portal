"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const user = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      try {
        // @ts-ignore
        const role = user.metadata?.role || user.clientReadOnlyMetadata?.role || user.serverMetadata?.role;
        
        if (role === "employee") {
          router.replace("/dashboard");
        } else if (role === "admin" || role === "hr") {
          router.replace("/admin/dashboard");
        } else {
          // If no role is assigned yet, default to dashboard or show error
          console.warn("User has no role assigned in metadata:", user.id);
          router.replace("/dashboard"); 
        }
      } catch (err) {
        console.error("Redirection error:", err);
        setError("An error occurred during redirection. Please try logging in again.");
      }
    }
  }, [user, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
                Return to Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
