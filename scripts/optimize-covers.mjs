// Replaces the issue covers in Storage with sensibly-sized WebP.
//
//   node scripts/optimize-covers.mjs [--dry-run]
//
// Why: the covers were uploaded at print resolution — cover-issue-3 is a
// 2480×3508 PNG weighing 12 MB. next/image has to fetch and re-encode that on
// every cold request, which is slow here and metered on Vercel. Nothing is
// ever displayed above ~420 CSS px (the reader hero), so 1400px wide is still
// generous headroom on a retina screen.
//
// The local originals under public/assets/ are left untouched as the archival
// copies (and as the offline fallback in src/lib/issues.ts).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const env = {
  ...Object.fromEntries(
    fs
      .readFileSync(path.join(ROOT, ".env.local"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  ),
  ...process.env,
};

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MAX_WIDTH = 1400;

const { data: issues, error } = await db
  .from("issues")
  .select("id, issue_number, title, cover_url")
  .order("issue_number");
if (error) throw new Error(error.message);

let before = 0;
let after = 0;

for (const issue of issues) {
  // find the local source that was originally uploaded for this issue
  const stem = `cover-issue-${issue.issue_number}`;
  const local = fs
    .readdirSync(path.join(ROOT, "public/assets"))
    .find((f) => f.startsWith(stem + "."));
  if (!local) {
    console.warn(`  ! no local source for issue ${issue.issue_number}, skipped`);
    continue;
  }

  const src = path.join(ROOT, "public/assets", local);
  const origBytes = fs.statSync(src).size;
  const meta = await sharp(src).metadata();
  const buf = await sharp(src)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();

  before += origBytes;
  after += buf.length;

  const key = `${stem}.webp`;
  const publicUrl = `${URL_}/storage/v1/object/public/covers/${key}`;

  console.log(
    `  issue ${issue.issue_number} · ${issue.title.padEnd(12)} ` +
      `${meta.width}x${meta.height} ${(origBytes / 1048576).toFixed(2)}MB → ` +
      `${Math.min(MAX_WIDTH, meta.width)}px ${(buf.length / 1024).toFixed(0)}KB`
  );

  if (!DRY) {
    const { error: upErr } = await db.storage
      .from("covers")
      .upload(key, buf, { contentType: "image/webp", upsert: true });
    if (upErr) throw new Error(`upload ${key}: ${upErr.message}`);

    if (issue.cover_url !== publicUrl) {
      const { error: dbErr } = await db
        .from("issues")
        .update({ cover_url: publicUrl })
        .eq("id", issue.id);
      if (dbErr) throw new Error(`cover_url issue ${issue.issue_number}: ${dbErr.message}`);
    }
  }
}

console.log(
  `\n${DRY ? "would replace" : "replaced"} ${issues.length} covers: ` +
    `${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(2)}MB ` +
    `(${Math.round((1 - after / before) * 100)}% smaller)`
);
if (DRY) console.log("re-run without --dry-run to apply");
