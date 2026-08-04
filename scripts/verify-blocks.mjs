// Proves the block format is lossless against the real archive.
//
//   node scripts/verify-blocks.mjs            # report only, touches nothing
//   node scripts/verify-blocks.mjs --verbose  # show every difference in full
//
// Three assertions, in order of how much they matter:
//
//   1. ROUND-TRIP   render(parse(x)) === x, byte for byte, where x is the
//                   canonical form of a piece's body_html. If this fails, the
//                   block document cannot reproduce that piece and migrating
//                   it would lose an author's layout.
//   2. IDEMPOTENT   canonicalising twice changes nothing. A format that keeps
//                   drifting on each save would rewrite the archive slowly.
//   3. EQUIVALENT   the canonical form differs from what is in the database
//                   only in ways that render identically — entity spelling and
//                   empty tags. Every difference is classified and counted,
//                   never waved through.
//
// It also reports how many blocks land in the `legacy` escape hatch, because
// that number is the honest measure of how well the model fits the archive.

import { loadBlocks, supabaseAdmin } from "./lib/load-blocks.mjs";

const { parseHtml, renderDoc, canonicalize, sanitizeHtml, walkBlocks } = loadBlocks();
const verbose = process.argv.includes("--verbose");

const db = supabaseAdmin();
const { data: pieces, error } = await db
  .from("pieces")
  .select("slug, title, body_html, issue_id")
  .order("slug");
if (error) throw error;

/** Strip every difference that cannot change what a reader sees, so two
 *  strings can be compared for *rendered* equality rather than byte equality. */
function renderEquivalent(html) {
  let h = html;
  // repeat: emptying the inner tag is what makes the outer one empty
  for (let i = 0; i < 6; i++) {
    const before = h;
    h = h.replace(/<(em|strong)><\/\1>/gi, "").replace(/<a\b[^>]*><\/a>/gi, "");
    if (h === before) break;
  }
  return h
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&");
}

const firstDiff = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return {
    at: i,
    a: a.slice(Math.max(0, i - 60), i + 90),
    b: b.slice(Math.max(0, i - 60), i + 90),
  };
};

const fail = { roundTrip: [], idempotent: [], equivalent: [], sanitize: [] };
const legacyBlocks = [];
const blockCounts = new Map();
let changed = 0;
let entityOnly = 0;
let emptyTagOnly = 0;

for (const p of pieces) {
  const original = p.body_html ?? "";
  const doc = parseHtml(canonicalize(original));
  const canonical = renderDoc(doc);

  // 1. round-trip: re-parsing the canonical form reproduces it exactly
  const again = renderDoc(parseHtml(canonical));
  if (again !== canonical) fail.roundTrip.push({ p, ...firstDiff(canonical, again) });

  // 2. idempotent: a second canonicalise pass is a no-op
  const twice = renderDoc(parseHtml(canonicalize(canonical)));
  if (twice !== canonical) fail.idempotent.push({ p, ...firstDiff(canonical, twice) });

  // 3. equivalent to what is stored today
  if (canonical !== original) {
    changed++;
    if (renderEquivalent(canonical) !== renderEquivalent(original)) {
      fail.equivalent.push({ p, ...firstDiff(original, canonical) });
    } else {
      const entities = (original.match(/&(?:rsquo|lsquo|ldquo|rdquo|ndash|mdash|hellip);/g) ?? []).length;
      const empties =
        (original.match(/<(em|strong)>\s*<\/\1>/gi) ?? []).length +
        (original.match(/<a\b[^>]*>\s*<\/a>/gi) ?? []).length;
      if (entities) entityOnly++;
      if (empties) emptyTagOnly++;
    }
  }

  // the sanitizer runs over this HTML on every read — it must not alter it
  if (sanitizeHtml(canonical) !== canonical) {
    fail.sanitize.push({ p, ...firstDiff(canonical, sanitizeHtml(canonical)) });
  }

  walkBlocks(doc.blocks, (b) => {
    blockCounts.set(b.type, (blockCounts.get(b.type) ?? 0) + 1);
    if (b.type === "legacy") legacyBlocks.push({ slug: p.slug, html: b.html });
  });
}

const total = [...blockCounts.values()].reduce((a, b) => a + b, 0);
console.log(`\n${pieces.length} pieces → ${total} blocks\n`);
console.log(
  [...blockCounts]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${String(v).padStart(4)}  ${k}`)
    .join("\n")
);

console.log(`\ncanonical form differs from the stored body_html on ${changed} piece(s)`);
console.log(`  ${entityOnly} involve named entities (&rsquo; → ’), ${emptyTagOnly} an empty <strong></strong> or <a></a>`);

console.log(`\nlegacy blocks: ${legacyBlocks.length}`);
for (const l of legacyBlocks) {
  console.log(`  ${l.slug}`);
  console.log(`      ${l.html.replace(/\s+/g, " ").slice(0, verbose ? 4000 : 150)}`);
}

let bad = 0;
for (const [name, list] of Object.entries(fail)) {
  if (!list.length) continue;
  bad += list.length;
  console.log(`\n✗ ${name}: ${list.length}`);
  for (const f of list.slice(0, verbose ? 999 : 6)) {
    console.log(`  ${f.p.slug} — first difference at char ${f.at}`);
    console.log(`     expected …${f.a}`);
    console.log(`     actual   …${f.b}`);
  }
}

// ---------------------------------------------------------------------------
// The sanitizer's other half: leaving the archive alone is only useful if it
// also refuses everything else. body_html is injected with
// dangerouslySetInnerHTML, so this is the check that matters most.
// ---------------------------------------------------------------------------

const ATTACKS = [
  ["<script>alert(1)</script>", /<script/i],
  ["<img src=x onerror=alert(1)>", /onerror/i],
  ["<img src=\"https://evil.test/a.png\">", /evil\.test/],
  ["<a href=\"javascript:alert(1)\">x</a>", /javascript:/i],
  ["<a href=\"data:text/html,<script>x</script>\">x</a>", /data:/i],
  ["<iframe src=\"https://evil.test/\"></iframe>", /evil\.test/],
  ["<video src=\"https://evil.test/a.mp4\"></video>", /evil\.test/],
  ["<div onclick=\"steal()\">x</div>", /onclick/i],
  ["<svg><use href=\"#x\" /></svg>", /<svg|<use/i],
  ["<object data=\"x.swf\"></object>", /<object/i],
  ["<style>body{display:none}</style>", /<style/i],
  ["<!--<script>x</script>-->", /<script/i],
  ["<div class=\"row\" style=\"position:fixed\">x</div>", /style=/i],
  ["<img src=\"/a.png\" srcset=\"x\" onload=\"go()\">", /onload/i],
  ["<form action=\"https://evil.test\"><input name=p></form>", /<form|<input/i],
  // `style` on <img> is the one attribute allowed through, and only as a bare
  // width in percent. Everything else riding on it has to be dropped.
  ["<img src=\"/a.png\" style=\"position:fixed;top:0;left:0;width:100vw\">", /position|vw/i],
  ["<img src=\"/a.png\" style=\"width:30%;background:url(https://evil.test/x)\">", /evil\.test|background/i],
  ["<img src=\"/a.png\" style=\"width:expression(alert(1))\">", /expression/i],
  ["<img src=\"/a.png\" style=\"width:999%\">", /999/],
  ["<div class=\"align-left\" style=\"opacity:0\">x</div>", /opacity|style=/i],
];

/** …and the one thing it must NOT strip. */
const MUST_SURVIVE = [
  ["<img src=\"/a.png\" alt=\"\" style=\"width:30%\">", /style="width:30%"/],
  ["<div class=\"align-left\">x</div>", /class="align-left"/],
];

console.log("\nsanitizer, against things it must refuse");
for (const [input, mustNotAppear] of ATTACKS) {
  const out = sanitizeHtml(input) ?? "";
  const leaked = mustNotAppear.test(out);
  if (leaked) {
    bad++;
    console.log(`  ✗ ${input}`);
    console.log(`      survived as: ${out}`);
  } else {
    console.log(`  ✓ ${input.slice(0, 52)}${input.length > 52 ? "…" : ""}`);
  }
}

for (const [input, mustAppear] of MUST_SURVIVE) {
  const out = sanitizeHtml(input) ?? "";
  if (mustAppear.test(out)) {
    console.log(`  ✓ kept: ${input}`);
  } else {
    bad++;
    console.log(`  ✗ kept nothing of: ${input}`);
    console.log(`      became: ${out}`);
  }
}

if (bad) {
  console.log(`\n${bad} failure(s). The archive is NOT safe to migrate yet.\n`);
  process.exit(1);
}
console.log(`\n✓ all ${pieces.length} pieces round-trip exactly, survive the sanitizer unchanged,\n  and are render-identical to what is stored today.\n`);
