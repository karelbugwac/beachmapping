import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  devIndicators: false, // Disables the floating Next.js ("N") dev indicator badge

  // Allow access from your phone through local network
  allowedDevOrigins: ["192.168.254.102"],
  
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
    proxyClientMaxBodySize: "25mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
