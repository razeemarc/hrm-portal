"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ConvexClientProvider } from "./convex-client-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ConvexClientProvider>
      <SessionProvider>{children}</SessionProvider>
    </ConvexClientProvider>
  );
}