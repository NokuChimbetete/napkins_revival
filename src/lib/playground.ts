import { getIssueContent, type Entry } from "@/lib/issue-content";
import { getIssues } from "@/lib/issues";

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

const ISSUE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

export type NapkinLook = {
  /** 1-based paper index → /playground/papers/paper-N.webp */
  variant: number;
  /** 1-based index into the NAPKIN_FONTS roster */
  fontPreset: number;
  /** resting rotation, degrees */
  tilt: number;
  /** 0 small · 1 medium · 2 large */
  size: number;
  /** scatter offset within the grid cell, % of cell */
  jitterX: number;
  jitterY: number;
  z: number;
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
    jitterX: Math.round(roll("jx", slug) * 44 - 22),
    jitterY: Math.round(roll("jy", slug) * 36 - 18),
    z: 1 + (fnv1a("z" + slug) % 24),
  };
}

const isCreative = (p: Entry) => p.category !== "Introduction";

async function loadAll(): Promise<{ content: { pieces: Entry[] }; issue_number: number; season: string }[]> {
  const seasons = new Map((await getIssues()).map((i) => [i.issue_number, i.title]));
  const all = [];
  for (const n of ISSUE_NUMBERS) {
    const content = await getIssueContent(n);
    if (content) all.push({ content, issue_number: n, season: seasons.get(n) ?? `Issue ${n}` });
  }
  return all;
}

/** Every creative piece (Forewords excluded), shuffled deterministically so
 *  the issues intermingle in the pile. ~15KB of metadata — piece bodies stay
 *  on the server until a napkin is opened. */
export async function getPlaygroundNapkins(): Promise<NapkinMeta[]> {
  const napkins: NapkinMeta[] = [];
  for (const { content, issue_number, season } of await loadAll()) {
    for (const p of content.pieces.filter(isCreative)) {
      napkins.push({
        slug: p.slug,
        title: p.title,
        author_name: p.author_name,
        class_year: p.class_year,
        category: p.category,
        issue_number,
        season,
        look: napkinLook(p),
      });
    }
  }
  napkins.sort((a, b) => fnv1a("order" + a.slug) - fnv1a("order" + b.slug));
  return napkins;
}

/** Full piece for the modal (slugs are unique across all issues). */
export async function getPieceForPlayground(slug: string): Promise<PlaygroundPiece | null> {
  for (const { content, issue_number, season } of await loadAll()) {
    const entry = content.pieces.find((p) => p.slug === slug && isCreative(p));
    if (entry) return { entry, issue_number, season };
  }
  return null;
}
