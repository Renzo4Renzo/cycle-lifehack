import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      // Cycle item image uploads (block manage form) routinely exceed the 1mb default
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
