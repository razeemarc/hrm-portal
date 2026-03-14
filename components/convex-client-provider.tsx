"use client";

import { createContext, useContext, ReactNode } from "react";
import { createConvexClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";

// Create client once
const convex = createConvexClient({
  url: convexUrl,
});

const ConvexContext = createContext<typeof convex | null>(convex);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexContext.Provider value={convex}>
      {children}
    </ConvexContext.Provider>
  );
}

export function useConvex() {
  return useContext(ConvexContext);
}