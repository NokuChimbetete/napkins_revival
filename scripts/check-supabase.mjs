// Reports what actually exists in the Supabase project, so we never guess at
// which migrations have run.
//
//   node scripts/check-supabase.mjs
//
// Reads .env.local. Uses the service role key when present (needed to see
// Storage buckets); falls back to the anon key for a read-only view.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const env = {
  ...Object.fromEntries(
    (fs.existsSync(path.join(ROOT, ".env.local"))
      ? fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")
      : []
    )
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  ),
  ...process.env,
};

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const usingKey = KEY && !KEY.startsWith("PASTE") ? KEY : ANON;

const placeholder = (v) => !v || v.startsWith("PASTE") || v.startsWith("your-");

if (placeholder(URL_)) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
  process.exit(1);
}
if (placeholder(usingKey)) {
  console.error("No usable key in .env.local — paste the anon and service_role keys first.");
  process.exit(1);
}

console.log(`project: ${URL_}`);
console.log(`using:   ${KEY && !KEY.startsWith("PASTE") ? "service_role" : "anon"} key\n`);

const db = createClient(URL_, usingKey, { auth: { persistSession: false } });

/** Does a table have a column? Selecting it errors with 42703 if not. */
async function hasColumn(table, column) {
  const { error } = await db.from(table).select(column).limit(1);
  if (!error) return true;
  if (error.code === "42703" || /column .* does not exist/i.test(error.message)) return false;
  return `? (${error.message})`;
}

async function tableExists(table) {
  const { error } = await db.from(table).select("*").limit(1);
  if (!error) return true;
  if (error.code === "42P01" || /does not exist/i.test(error.message)) return false;
  return `? (${error.message})`;
}

const results = {};
for (const t of ["issues", "pieces", "admin_whitelist"]) results[t] = await tableExists(t);

console.log("tables");
for (const [t, ok] of Object.entries(results)) {
  console.log(`  ${ok === true ? "✓" : "✗"} ${t}${ok === true ? "" : `  ${ok === false ? "(missing → run 0001_init.sql)" : ok}`}`);
}

if (results.pieces === true) {
  console.log("\ncolumns on pieces");
  const cols = {
    "0002": ["body", "images", "category", "sort_order"],
    "0003": ["body_html", "galleries", "verse", "slug", "is_frontmatter", "author_name"],
  };
  for (const [mig, list] of Object.entries(cols)) {
    for (const c of list) {
      const ok = await hasColumn("pieces", c);
      console.log(`  ${ok === true ? "✓" : "✗"} ${c.padEnd(15)} ${ok === true ? "" : `(missing → run ${mig}_*.sql)`}`);
    }
  }

  const { count } = await db.from("pieces").select("*", { count: "exact", head: true });
  const { count: issueCount } = await db.from("issues").select("*", { count: "exact", head: true });
  console.log(`\nrows: ${issueCount ?? "?"} issues, ${count ?? "?"} pieces`);

  // the trap: seeded rows must have NULL pairing, or every napkin looks the same
  if ((count ?? 0) > 0 && (await hasColumn("pieces", "napkin_variant")) === true) {
    const { count: pinned } = await db
      .from("pieces")
      .select("*", { count: "exact", head: true })
      .not("napkin_variant", "is", null);
    if (pinned) {
      console.log(
        `\n  ⚠ ${pinned} piece(s) have a non-NULL napkin_variant. Unless an editor` +
          ` deliberately pinned them, they should be NULL so the paper/font derive from the slug.`
      );
    }
  }
}

if (KEY && !KEY.startsWith("PASTE")) {
  const { data: buckets, error } = await db.storage.listBuckets();
  if (!error) {
    const want = ["covers", "issue-pdfs", "piece-pdfs", "piece-images"];
    const have = new Set((buckets ?? []).map((b) => b.name));
    console.log("\nstorage buckets");
    for (const b of want) console.log(`  ${have.has(b) ? "✓" : "✗"} ${b}`);
  }
}

console.log();
