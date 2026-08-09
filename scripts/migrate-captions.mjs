// Marks existing figure captions as captions, so they pick up the smaller
// italic styling, and regenerates body_html for every piece it changes.
//
//   node scripts/migrate-captions.mjs --dry    # report, write nothing
//   node scripts/migrate-captions.mjs          # write
//
// Covers draft and published pieces alike — status is irrelevant to what a
// caption is.
//
// THE RULE, and why it is this narrow:
//
//   A text block is a caption if it sits inside a `group` and the block
//   directly before it is an image. That is exactly the shape the "Image +
//   caption" button produces.
//
// The same "text after an image" shape appears in two other places and is NOT
// safe to convert:
//
//   · inside a row column — mixed. Some are captions ("Midsommer", the
//     [Baobab Boy] entries in faces-of-madagascar), but tuchan has 950-character
//     paragraphs of body prose in the same position.
//   · at the top level of a piece — body prose, up to 4,150 characters of it.
//
// Editors can mark any of those by hand with the Caption button in the builder.
// Guessing on their behalf would silently shrink somebody's essay.

import { loadBlocks, supabaseAdmin } from "./lib/load-blocks.mjs";

const { renderDoc, parseHtml, canonicalize, sanitizeHtml, isDoc } = loadBlocks();
const dry = process.argv.includes("--dry");
const db = supabaseAdmin();

const { data: pieces, error } = await db
  .from("pieces")
  .select("id, slug, status, doc, body_html")
  .order("slug");
if (error) throw error;

const hasWords = (b) => b.text.replace(/<[^>]+>/g, "").trim().length > 0;

/** Mark captions in place. Returns how many it marked.
 *
 *  Empty caption slots are skipped. Fifteen of them exist — figures whose
 *  caption was never written — and marking one would wrap a lone <br> in a
 *  span, changing the stored HTML of six published pieces so that a reader
 *  sees precisely nothing different. Anyone who later types into one can press
 *  Caption in the builder; figures made from now on carry the flag already. */
function markCaptions(blocks, insideGroup) {
  let marked = 0;
  blocks.forEach((b, i) => {
    if (
      insideGroup &&
      b.type === "text" &&
      !b.caption &&
      hasWords(b) &&
      blocks[i - 1]?.type === "image"
    ) {
      b.caption = true;
      marked++;
    }
    if (b.type === "group") marked += markCaptions(b.blocks, true);
    if (b.type === "row") for (const c of b.cols) marked += markCaptions(c.blocks, false);
  });
  return marked;
}

const plan = [];
const problems = [];
let totalCaptions = 0;
let withText = 0;

for (const p of pieces) {
  const doc = isDoc(p.doc)
    ? structuredClone(p.doc)
    : parseHtml(canonicalize(p.body_html ?? ""));

  const marked = markCaptions(doc.blocks, false);
  if (!marked) continue;

  const body_html = sanitizeHtml(renderDoc(doc));

  // the same guarantee migrate-blocks.mjs makes: what we write must parse back
  // to exactly itself, or the format has stopped being lossless
  if (renderDoc(parseHtml(body_html)) !== body_html) {
    problems.push(`${p.slug}: the rewritten HTML does not round-trip`);
    continue;
  }

  // count the ones a reader will actually notice
  const visible = [];
  const walk = (bs) =>
    bs.forEach((b) => {
      if (b.type === "text" && b.caption && b.text.replace(/<[^>]+>/g, "").trim()) {
        visible.push(b.text.replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim().slice(0, 62));
      }
      if (b.type === "group") walk(b.blocks);
      if (b.type === "row") b.cols.forEach((c) => walk(c.blocks));
    });
  walk(doc.blocks);

  totalCaptions += marked;
  withText += visible.length;
  plan.push({ id: p.id, slug: p.slug, status: p.status, doc, body_html, marked, visible });
}

if (problems.length) {
  console.error(`\n${problems.length} piece(s) are not safe to change:\n`);
  for (const x of problems) console.error(`  ✗ ${x}`);
  console.error("\nNothing was written.\n");
  process.exit(1);
}

console.log(`\n${pieces.length} pieces scanned · ${plan.length} to update`);
console.log(`${totalCaptions} caption block(s) marked, of which ${withText} have visible text\n`);

for (const r of plan) {
  console.log(`  ${r.status.padEnd(9)} ${r.slug}`);
  for (const v of r.visible) console.log(`             “${v}”`);
}

if (dry) {
  console.log("\n--dry: nothing written.\n");
  process.exit(0);
}

let done = 0;
for (const row of plan) {
  const { error: writeError } = await db
    .from("pieces")
    .update({ doc: row.doc, body_html: row.body_html })
    .eq("id", row.id);
  if (writeError) {
    console.error(`\n✗ ${row.slug}: ${writeError.message}`);
    process.exit(1);
  }
  done++;
}

console.log(`\n✓ ${done} pieces updated. Captions are now smaller and italic.\n`);
