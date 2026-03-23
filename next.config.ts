import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@stackframe/stack"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pleasant-buffalo-414.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
