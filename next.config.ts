import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 refuses cross-origin requests to dev-only resources, and a phone
  // opening the LAN address counts as cross-origin — it blocks /__nextjs_font
  // and the HMR endpoint, so the site renders on a phone with the wrong fonts
  // and no live reload. Dev-only setting; it has no effect on a build.
  // Update the address if the machine's LAN IP changes (`npm run dev` prints it).
  allowedDevOrigins: ["10.112.18.147", "10.112.18.*"],
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
  // The napkin drawer lived at /playground while it was being built, and the
  // code called it that throughout while the page itself always said "The
  // Napkins Drawer". The code now matches the page. These keep any link that
  // was shared in the meantime working — permanent, because the old address
  // is not coming back.
  async redirects() {
    return [
      { source: "/playground", destination: "/drawer", permanent: true },
      { source: "/playground/:path*", destination: "/drawer/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
