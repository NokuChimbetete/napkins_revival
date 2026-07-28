/**
 * Routes the <img> tags inside a piece's body_html through Next's image
 * optimizer.
 *
 * Piece artwork is injected with dangerouslySetInnerHTML, which means it never
 * touches next/image: every reader downloads the full ~1500px original even on
 * a phone, in whatever format it was stored as. Rewriting the src/srcset here
 * gets AVIF negotiation and per-viewport sizing for free, with no change to
 * what anything looks like.
 *
 * Done in the data layer rather than at render so it is computed once, travels
 * with the JSON the napkin modal fetches, and can be cached by the HTTP layer.
 */

/** Widths must come from Next's configured deviceSizes/imageSizes, or the
 *  optimizer answers 400. These are the defaults that bracket our layout. */
const WIDTHS = [384, 640, 828, 1080, 1200];

/** Must be one of `images.qualities` in next.config — Next rejects anything
 *  else with a 400, which shows up as every body image silently broken.
 *  75 is the framework default; adding another value means configuring it. */
const QUALITY = 75;

/**
 * The widest a body image is ever displayed — measured, not guessed: a
 * full-width image in the reader column lays out at 680px. Images inside a
 * side-by-side .col row are about half that, and the napkin modal uses the
 * same column, so 680px is the honest upper bound. Under-declaring here makes
 * the browser pick a candidate that's too small and the artwork goes soft.
 */
const SIZES = "(max-width: 720px) 92vw, 680px";

/** Only rewrite what the optimizer is actually allowed to fetch: our own
 *  public paths and the Supabase Storage host in next.config remotePatterns. */
function optimizable(src: string): boolean {
  if (!src || src.startsWith("data:") || src.startsWith("/_next/image")) return false;
  if (src.startsWith("/")) return true;
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(src);
}

const optimizedUrl = (src: string, w: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${QUALITY}`;

/** Read one HTML attribute off a tag, single or double quoted. */
const attr = (tag: string, name: string): string | null =>
  tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
  tag.match(new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, "i"))?.[1] ??
  null;

export function optimizeBodyImages(html: string | null): string | null {
  if (!html) return html;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attr(tag, "src");
    if (!src || !optimizable(src)) return tag;

    // keep everything the scraper set — width/height especially, since they
    // reserve the box and stop the text jumping while the image arrives
    const keep = ["alt", "width", "height", "class", "loading", "decoding"]
      .map((name) => {
        const v = attr(tag, name);
        return v === null ? null : `${name}="${v.replace(/"/g, "&quot;")}"`;
      })
      .filter(Boolean);

    if (!keep.some((a) => a!.startsWith("loading="))) keep.push('loading="lazy"');
    if (!keep.some((a) => a!.startsWith("decoding="))) keep.push('decoding="async"');

    const srcSet = WIDTHS.map((w) => `${optimizedUrl(src, w)} ${w}w`).join(", ");

    return (
      `<img src="${optimizedUrl(src, 1080)}" srcset="${srcSet}" sizes="${SIZES}" ` +
      keep.join(" ") +
      ">"
    );
  });
}
