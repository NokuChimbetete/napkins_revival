import { getIssueContent, rowToEntry, PIECE_COLUMNS, type Entry } from "@/lib/issue-content";
import { getIssues } from "@/lib/issues";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/configured";

/**
 * The Napkins Drawer: every creative piece ever published, as a napkin.
 *
 * A napkin's whole look — paper, font, tilt, size, scatter offset — is derived
 * deterministically from the piece's slug, so "Moonshine" looks like Moonshine
 * on every visit and the server and client always agree (no Math.random()).
 * The derived paper/font mirror the `napkin_variant` / `font_preset` smallint
 * columns on `pieces`; explicit DB values, once Supabase is live, win.
 */

import { FONT_PRESET_COUNT, PAPER_COUNT } from "@/lib/napkin-constants";

export type NapkinLook = {
  /** 1-based paper index → /playground/papers/paper-N.webp */
  variant: number;
  /** 1-based index into the NAPKIN_FONTS roster */
  fontPreset: number;
  /** resting rotation, degrees */
  tilt: number;
  /** 0 small · 1 medium · 2 large */
  size: number;
  z: number;
  /** position on the pannable 2D field, % of field size */
  fx: number;
  fy: number;
  /** 0.5–1.0 multiplier on the velocity/mouse parallax (the reference
   *  component rolls Math.random() here; we hash for stability) */
  parallaxEase: number;
};

export type NapkinMeta = {
  slug: string;
  title: string;
  author_name: string;
  class_year: string;
  category: string | null;
  issue_number: number;
  season: string;
  look: NapkinLook;
};

export type PlaygroundPiece = {
  entry: Entry;
  issue_number: number;
  season: string;
};

// FNV-1a, 32-bit. Tiny, stable, and identical on server and client.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** uniform [0, 1) from a salted slug */
const roll = (salt: string, slug: string) => fnv1a(salt + slug) / 0x100000000;

export function napkinLook(entry: Pick<Entry, "slug" | "napkin_variant" | "font_preset">): NapkinLook {
  const { slug } = entry;
  const sizeRoll = roll("size", slug);
  return {
    variant: entry.napkin_variant ?? (fnv1a("paper" + slug) % PAPER_COUNT) + 1,
    fontPreset: entry.font_preset ?? (fnv1a("font" + slug) % FONT_PRESET_COUNT) + 1,
    tilt: Math.round((roll("tilt", slug) * 24 - 12) * 10) / 10,
    size: sizeRoll < 0.3 ? 0 : sizeRoll < 0.82 ? 1 : 2,
    z: 1 + (fnv1a("z" + slug) % 24),
    fx: 0, // assigned by assignFieldPositions (needs the piece's place in print order)
    fy: 0,
    parallaxEase: Math.round((0.5 + roll("pe", slug) * 0.5) * 100) / 100,
  };
}

/** columns of the 2D field; rows follow from the piece count */
export const FIELD_COLS = 12;

/** cell pitch in px. The field grows by ADDING ROWS at this pitch, so the
 *  density never changes as the archive fills up. Desktop values reproduce
 *  the hand-tuned 4440×4340 field that held the first 110 napkins. */
const CELL = { desktop: { w: 370, h: 434 }, mobile: { w: 275, h: 320 } };

export type FieldSize = { desktop: { w: number; h: number }; mobile: { w: number; h: number } };

/** The single source of truth for the table's dimensions — handed to the
 *  client component, which sets both the CSS box and the pan engine's wrap
 *  period from it. They must agree exactly or the infinite wrap tears. */
export function fieldSizeFor(count: number): FieldSize {
  const rows = Math.max(1, Math.ceil(count / FIELD_COLS));
  return {
    desktop: { w: FIELD_COLS * CELL.desktop.w, h: rows * CELL.desktop.h },
    mobile: { w: FIELD_COLS * CELL.mobile.w, h: rows * CELL.mobile.h },
  };
}

/**
 * Seat every napkin on the field, in print order — oldest issue at the top,
 * newest at the bottom, each piece keeping its place within its issue.
 *
 * The point of print order is permanence: a new issue only ever appends rows
 * below, so every napkin already on the table keeps its exact spot. (Ordering
 * by a hash instead would interleave new pieces into the middle and shove
 * everyone along, re-dealing the whole table on each publication.)
 *
 * Positions are percentages, which stay put as the field grows because the row
 * count cancels: y = (row + ½ + jitter)/rows × (rows × cellH) = a fixed pixel
 * offset, whatever `rows` becomes.
 */
function assignFieldPositions(napkins: NapkinMeta[]) {
  const rows = Math.max(1, Math.ceil(napkins.length / FIELD_COLS));
  napkins.forEach((n, i) => {
    const col = i % FIELD_COLS;
    const row = Math.floor(i / FIELD_COLS);
    // ±0.41 of a cell, so the rows read as a strewn pile, not a spreadsheet
    const jx = (roll("fjx", n.slug) - 0.5) * 0.82;
    const jy = (roll("fjy", n.slug) - 0.5) * 0.82;
    // 4 decimals (sub-0.01px): coarser rounding is granular in *percent*, so
    // the quantisation would shift as the field grows and nudge every napkin
    n.look.fx = Math.round(((col + 0.5 + jx) / FIELD_COLS) * 1e6) / 1e4;
    n.look.fy = Math.round(((row + 0.5 + jy) / rows) * 1e6) / 1e4;
  });
}

/** Front matter (forewords, editors' notes) is read inside the issue, not put
 *  on the table. Driven by a real column so it survives an editor typing
 *  "Foreword" or "Editor's Note" instead of the exact category we once matched. */
const isCreative = (p: Entry) => !p.is_frontmatter;

/** Issues come from the issues table (sorted by number), so publishing a new
 *  one needs no code change — it simply appears on the next page load. */
async function loadAll(): Promise<{ content: { pieces: Entry[] }; issue_number: number; season: string }[]> {
  const issues = await getIssues();
  const all = [];
  for (const issue of issues) {
    const content = await getIssueContent(issue.issue_number);
    if (content) {
      all.push({
        content,
        issue_number: issue.issue_number,
        season: issue.title || `Issue ${issue.issue_number}`,
      });
    }
  }
  return all;
}

/** Seat rows that are already in print order, then hand back the napkins.
 *  Shared by both data paths so seating can never differ between them. */
function seat(
  rows: { entry: Pick<Entry, "slug" | "title" | "author_name" | "class_year" | "category" | "napkin_variant" | "font_preset">; issue_number: number; season: string }[]
): NapkinMeta[] {
  const napkins = rows.map(({ entry, issue_number, season }) => ({
    slug: entry.slug,
    title: entry.title,
    author_name: entry.author_name,
    class_year: entry.class_year,
    category: entry.category,
    issue_number,
    season,
    look: napkinLook(entry),
  }));
  assignFieldPositions(napkins);
  return napkins;
}

/** Every creative piece (front matter excluded), laid out in print order so the
 *  table reads oldest-at-the-top and new issues only ever extend it downward.
 *  ~15KB of metadata — piece bodies stay on the server until a napkin opens. */
export async function getPlaygroundNapkins(): Promise<NapkinMeta[]> {
  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      // ONE query for the whole table. Deliberately no body_html: it is ~95% of
      // the row and never shown on a napkin — fetching it here was pulling
      // ~800KB to render ~15KB of metadata.
      const { data, error } = await supabase
        .from("pieces")
        .select(
          "slug, title, author_name, class_year, category, sort_order, napkin_variant, font_preset, issues!inner(issue_number, title)"
        )
        .eq("is_frontmatter", false)
        // A piece reaches the table only when both it and its issue are live.
        // The !inner join is what makes the second filter reach the issue row.
        .eq("status", "published")
        .eq("issues.status", "published");
      if (!error && data?.length) {
        type Row = (typeof data)[number] & { issues: { issue_number: number; title: string } | { issue_number: number; title: string }[] };
        const rows = (data as unknown as Row[]).map((r) => {
          const iss = Array.isArray(r.issues) ? r.issues[0] : r.issues;
          return {
            entry: r as unknown as Entry,
            issue_number: iss.issue_number,
            season: iss.title || `Issue ${iss.issue_number}`,
          };
        });
        // sort here rather than in SQL: ordering by an embedded table is
        // awkward in PostgREST, and 117 rows is nothing. Print order =
        // issue number, then the piece's place within its issue.
        rows.sort(
          (a, b) =>
            a.issue_number - b.issue_number ||
            (a.entry.sort_order ?? 0) - (b.entry.sort_order ?? 0)
        );
        return seat(rows);
      }
    } catch {
      // fall through to fixtures
    }
  }

  const rows = [];
  for (const { content, issue_number, season } of await loadAll()) {
    const ordered = content.pieces
      .filter(isCreative)
      // sort explicitly: seating must not depend on fixture key order
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const entry of ordered) rows.push({ entry, issue_number, season });
  }
  rows.sort((a, b) => a.issue_number - b.issue_number);
  return seat(rows);
}

/** Full piece for the modal (slugs are unique across all issues).
 *
 *  This runs on every napkin click, so it is a single indexed lookup. It used
 *  to walk every issue — 17 queries and ~800KB — to find one row, which left
 *  the napkin sitting flipped for over a second after the 420ms flight. */
export async function getPieceForPlayground(slug: string): Promise<PlaygroundPiece | null> {
  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("pieces")
        .select(`${PIECE_COLUMNS}, issues!inner(issue_number, title)`)
        .eq("slug", slug)
        .eq("is_frontmatter", false)
        .eq("status", "published")
        .eq("issues.status", "published")
        .maybeSingle();
      if (!error && data) {
        const row = data as unknown as Record<string, unknown> & {
          issues: { issue_number: number; title: string } | { issue_number: number; title: string }[];
        };
        const iss = Array.isArray(row.issues) ? row.issues[0] : row.issues;
        return {
          entry: rowToEntry(row),
          issue_number: iss.issue_number,
          season: iss.title || `Issue ${iss.issue_number}`,
        };
      }
      if (!error) return null; // genuinely absent, don't scan the fixtures
    } catch {
      // fall through to fixtures
    }
  }

  for (const { content, issue_number, season } of await loadAll()) {
    const entry = content.pieces.find((p) => p.slug === slug && isCreative(p));
    if (entry) return { entry, issue_number, season };
  }
  return null;
}
