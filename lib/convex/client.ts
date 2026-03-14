import { createConvexClient } from "convex/client";
import { api } from "../convex/generated";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";

export const convex = createConvexClient(api, {
  server: convexUrl,
});

export default convex;