// Fills `pieces.doc` for the whole archive, making the block document
// canonical and body_html a derived cache.
//
//   node scripts/migrate-blocks.mjs --dry     # report, write nothing
//   node scripts/migrate-blocks.mjs           # write
//
// Refuses to run unless scripts/verify-blocks.mjs would pass for every piece,
// so a migration can never be the thing that loses an author's layout. Safe to
// run more than once: it is idempotent by construction, and it only writes rows
// whose doc is missing or whose re-render disagrees with what is stored.

import { loadBlocks, supabaseAdmin } from "./lib/load-blocks.mjs";

const { parseHtml, renderDoc, canonicalize, sanitizeHtml, walkBlocks } = loadBlocks();
const dry = process.argv.includes("--dry");

const db = supabaseAdmin();

const { data: pieces, error } = await db
  .from("pieces")
  .select("id, slug, body_html, doc")
  .order("slug");
if (error) {
  if (error.code === "42703") {
    console.error("\n`pieces.doc` doesn't exist yet — run supabase/migrations/0004_admin.sql first.\n");
    process.exit(1);
  }
  throw error;
}

const plan = [];
const problems = [];
let legacy = 0;

for (const p of pieces) {
  const original = p.body_html ?? "";
  const doc = parseHtml(canonicalize(original));
  const rendered = renderDoc(doc);

  // the same three assertions verify-blocks.mjs makes, re-checked per row so a
  // partial write can never happen behind a passing report
  if (renderDoc(parseHtml(rendered)) !== rendered) {
    problems.push(`${p.slug}: does not round-trip`);
    continue;
  }
  if (sanitizeHtml(rendered) !== rendered) {
    problems.push(`${p.slug}: the sanitizer alters the rendered output`);
    continue;
  }

  walkBlocks(doc.blocks, (b) => b.type === "legacy" && legacy++);

  const hasDoc = p.doc && typeof p.doc === "object" && p.doc.v === 1;
  if (hasDoc && rendered === original) continue; // already migrated and in step

  plan.push({ id: p.id, slug: p.slug, doc, body_html: rendered, changed: rendered !== original });
}

if (problems.length) {
  console.error(`\n${problems.length} piece(s) are not safe to migrate:\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error("\nNothing was written. Run `node scripts/verify-blocks.mjs --verbose` for detail.\n");
  process.exit(1);
}

const rewrites = plan.filter((p) => p.changed);
console.log(`\n${pieces.length} pieces · ${plan.length} to write · ${legacy} legacy block(s)`);
console.log(`${rewrites.length} will have body_html rewritten (entity spelling / empty tags):`);
for (const r of rewrites) console.log(`  · ${r.slug}`);

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

console.log(`\n✓ ${done} pieces migrated. body_html is now derived from doc.\n`);
