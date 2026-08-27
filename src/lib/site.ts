/**
 * The site's canonical origin.
 *
 * Napkins lives on a Minerva subdomain — see docs/deploy.md — and every
 * absolute URL Next.js generates (canonical links, og:image, og:url) is built
 * from this. It is a constant rather than a request-derived value because
 * metadata is resolved at build time for prerendered pages, where there is no
 * request to read a host from.
 *
 * NEXT_PUBLIC_SITE_URL overrides it, which is what a preview deployment or a
 * future domain change needs. Note this is deliberately *not* how
 * `siteOrigin()` in src/app/admin/login/actions.ts works: OAuth has to bounce
 * back to whichever host the editor actually signed in on, so that one reads
 * the request. Metadata wants one canonical answer; auth wants the real one.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://napkins.minerva.edu";

export const SITE_NAME = "Napkins";
