import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next negotiates the best format the browser accepts, in this order.
    // AVIF is ~30–50% smaller than WebP on the collage and covers; anything
    // that can't take it silently falls back to WebP, then the original.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
