import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  devIndicators: false, // Disables the floating Next.js ("N") dev indicator badge

  // Allow access from your phone and local network devices
  allowedDevOrigins: [
    "192.168.254.105:3000",
    "192.168.254.105",
    "192.168.254.*",
    "10.240.253.248",
    "localhost:3000",
  ],


  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
    proxyClientMaxBodySize: "25mb",
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // Cache optimized images for 7 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
