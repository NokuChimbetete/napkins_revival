import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 refuses cross-origin requests to dev-only resources, and a phone
  // opening the LAN address counts as cross-origin — it blocks /__nextjs_font
  // and the HMR endpoint, so the site renders on a phone with the wrong fonts
  // and no live reload. Dev-only setting; it has no effect on a build.
  // Update the address if the machine's LAN IP changes (`npm run dev` prints it).
  allowedDevOrigins: ["10.112.18.147", "10.112.18.*"],
  images: {
    // Vercel's free plan allows 5,000 image transformations a month, and every
    // (image, width, format) combination is one. With ~370 images in public/
    // plus the Supabase artwork, the defaults ran through that in September
    // 2026 — after which un-cached images simply fail to load. Three settings
    // keep us under it:
    //
    // WebP only. AVIF was ~30% smaller still, but asking for both formats
    // made every image twice. Every current browser takes WebP.
    formats: ["image/webp"],
    // Keep each optimized copy for 31 days instead of the 4-hour default, so
    // a copy is made once rather than again every few hours. Safe because
    // admin uploads carry a ?v= cache-buster (src/lib/admin/upload.ts), and a
    // replaced file in public/ should get a new filename anyway.
    minimumCacheTTL: 2678400,
    // Fewer widths means fewer distinct copies across visitors' screens.
    // Dropped 2048/3840: only 13 images in public/ are wider than 1920, and
    // Next never enlarges. Every width optimizeBodyImages() asks for
    // (384–1200) must stay in one of these lists, or those images 400.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
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
