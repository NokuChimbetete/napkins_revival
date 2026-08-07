/**
 * Slugs are generated once, at creation, and never again.
 *
 * `pieces_freeze_slug()` in 0003_playground.sql enforces this with a trigger,
 * and it is not being cautious. A slug decides:
 *
 *   · the piece's permalink        /issues/3#<slug>
 *   · its napkin's deep link       /drawer?piece=<slug>
 *   · its napkin's paper, font, tilt, size, position and parallax — all
 *     derived from a hash of the slug in src/lib/drawer.ts
 *
 * So renaming a piece to fix a typo, if the slug followed the title, would
 * silently re-skin and re-seat that napkin and 404 every link anyone has
 * shared. The archive's slugs are `title-by-author-classyear`; that format is
 * kept so new pieces look like old ones.
 */

/** Matches the shape the 117 existing slugs already have. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // strip combining marks, so "Júlia" → "julia" rather than "jlia"
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

export function pieceSlug(title: string, author: string, classYear: string): string {
  const base = [title, author && `by ${author}`, classYear].filter(Boolean).join(" ");
  return slugify(base) || "untitled";
}

/**
 * Append -2, -3… until free. "Foreword" already repeats seven times in the
 * archive and a second "Untitled" is a matter of time.
 */
export function uniqueSlug(desired: string, taken: Set<string>): string {
  if (!taken.has(desired)) return desired;
  for (let n = 2; n < 500; n++) {
    const candidate = `${desired}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${desired}-${Date.now().toString(36)}`;
}
