// Turns a magazine PDF into the spread viewer's page images, in Supabase.
//
//   node scripts/import-issue-pdf.mjs <pdf> <issue-number> [options]
//
//   --pdf-url <url>   what "Download PDF" should point at. Omit to leave
//                     issues.pdf_url alone.
//   --width <px>      rendered page width. Default 1400 — about 180 DPI on a
//                     7.8in page, which is crisp on a laptop and on a phone at
//                     2x, and lands around 220 KB per page.
//   --dry             render and measure, write nothing.
//
// Why this exists rather than uploading the PDF itself: the Supabase free tier
// caps a single file at 50 MB and the whole project at 5 GB of egress a month.
// The originals of these issues run to 298 MB. One reader downloading one of
// those would spend 6% of the month's bandwidth for the entire site — covers,
// artwork, everything. Rendered pages are ~25x smaller in total AND arrive one
// at a time, so a reader who opens two pages pays for two pages.
//
// This is LOSSY and deliberately so. Text becomes pixels: not selectable, not
// searchable, not print resolution. The original stays wherever it came from
// and `--pdf-url` is how a reader still reaches it — see docs/admin.md.

import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "./lib/load-blocks.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const [pdfPath, issueArg] = positional;
const issueNumber = Number(issueArg);
const width = Number(flag("width", 1400));
const pdfUrl = flag("pdf-url", null);
const dry = args.includes("--dry");

if (!pdfPath || !Number.isInteger(issueNumber)) {
  console.error('usage: node scripts/import-issue-pdf.mjs <pdf> <issue-number> [--pdf-url <url>] [--width 1400] [--dry]');
  process.exit(1);
}
if (!fs.existsSync(pdfPath)) {
  console.error(`no such file: ${pdfPath}`);
  process.exit(1);
}

const { createCanvas, DOMMatrix, ImageData, Path2D } = await import("@napi-rs/canvas");
globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;
const sharp = (await import("sharp")).default;
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const db = supabaseAdmin();

const { data: issue, error: issueError } = await db
  .from("issues")
  .select("id, issue_number, title, pdf_url, page_images")
  .eq("issue_number", issueNumber)
  .maybeSingle();
if (issueError) throw issueError;
if (!issue) {
  console.error(`no issue numbered ${issueNumber}`);
  process.exit(1);
}

const sourceMb = fs.statSync(pdfPath).size / 1048576;
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;

console.log(`\nissue ${issue.issue_number} — ${issue.title}`);
console.log(`  source     ${path.basename(pdfPath)}  ${sourceMb.toFixed(1)} MB, ${doc.numPages} pages`);
console.log(`  rendering  ${width}px wide, WebP q82\n`);

const pages = [];
let bytes = 0;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  // PDFs routinely have no background of their own; without this, anything
  // transparent renders black instead of paper.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const webp = await sharp(canvas.toBuffer("image/png")).webp({ quality: 82 }).toBuffer();
  bytes += webp.length;

  const key = `${issueNumber}/pages/${p}.webp`;
  if (!dry) {
    const { error } = await db.storage
      .from("piece-images")
      .upload(key, webp, { contentType: "image/webp", upsert: true });
    if (error) {
      console.error(`\n✗ page ${p}: ${error.message}`);
      process.exit(1);
    }
  }
  pages.push(db.storage.from("piece-images").getPublicUrl(key).data.publicUrl);

  process.stdout.write(
    `\r  page ${String(p).padStart(3)}/${doc.numPages}   ${(bytes / 1048576).toFixed(1)} MB so far   `
  );
}

console.log(`\n\n  ${doc.numPages} pages → ${(bytes / 1048576).toFixed(1)} MB` +
  `  (${(bytes / doc.numPages / 1024).toFixed(0)} KB/page, ${(sourceMb / (bytes / 1048576)).toFixed(1)}x smaller)`);

// Pages left over from a shorter previous render would otherwise sit in the
// bucket forever AND keep appearing after the last real page of the new one.
if (!dry) {
  const { data: existing } = await db.storage.from("piece-images").list(`${issueNumber}/pages`, { limit: 1000 });
  const stale = (existing ?? [])
    .filter((f) => {
      const n = Number(f.name.replace(/\.webp$/, ""));
      return Number.isInteger(n) && n > doc.numPages;
    })
    .map((f) => `${issueNumber}/pages/${f.name}`);
  if (stale.length) {
    await db.storage.from("piece-images").remove(stale);
    console.log(`  removed ${stale.length} page(s) left over from a previous, shorter render`);
  }
}

if (dry) {
  console.log("\n--dry: nothing uploaded, nothing written.\n");
  process.exit(0);
}

const update = { page_images: pages };
if (pdfUrl) update.pdf_url = pdfUrl;

const { error: writeError } = await db.from("issues").update(update).eq("id", issue.id);
if (writeError) throw writeError;

console.log(`\n✓ issue ${issueNumber}: ${pages.length} page images`);
console.log(`  Download PDF → ${pdfUrl ?? issue.pdf_url ?? "(none)"}\n`);
