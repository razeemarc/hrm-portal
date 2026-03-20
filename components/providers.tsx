"use client";

import { ReactNode } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { ConvexClientProvider } from "./convex-client-provider";
import { stackClientApp } from "@/lib/stack/client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ConvexClientProvider>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          {children}
        </StackTheme>
      </StackProvider>
    </ConvexClientProvider>
  );
}
