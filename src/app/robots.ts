import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /napkin-drawer was a placeholder saying the staff login was coming in
      // Phase 4. It arrived, at /admin, and the stub was deleted — so this is
      // the only staff entrance left to keep out of the index. The drawer
      // itself is public and belongs in it.
      disallow: ["/admin"],
    },
  };
}
