// Seeds the ported archive (8 issues, 117 pieces) from the JSON fixtures into
// Supabase, moving every image, video and PDF out of public/issues/ and into
// Storage on the way.
//
//   node scripts/seed-supabase.mjs            seed
//   node scripts/seed-supabase.mjs --dry-run  report what it would do
//
// Needs, in .env.local (gitignored — never paste this key into a chat):
//   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<service role key>
//
// The service role key bypasses RLS, which is why this is a local script and
// not something the site can do. Run 0001 → 0002 → 0003 first.
//
// Re-runnable: issues upsert on issue_number, pieces upsert on slug, Storage
// uploads use upsert. Running it twice changes nothing.
//
// THE RULE THIS SCRIPT EXISTS TO KEEP: a piece's slug is copied from the
// fixture verbatim and napkin_variant/font_preset are left NULL. The slug
// decides each napkin's paper, font, tilt and position, and NULL is what makes
// the playground derive them by hash. Regenerate either and the whole table
// re-deals and every shared link breaks.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");

// ---------------------------------------------------------------- env
function readEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

const env = { ...readEnvLocal(), ...process.env };
// a dry run only walks the fixtures and the files on disk, so it works before
// the project exists — that's the point of being able to rehearse it
const URL_ = DRY
  ? env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dry-run.supabase.co"
  : env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY && (!URL_ || URL_.includes("your-project-ref"))) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder in .env.local");
  process.exit(1);
}
if (!DRY && (!SERVICE_KEY || SERVICE_KEY.startsWith("your-"))) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local.\n" +
      "Supabase dashboard → Project Settings → API → service_role. Keep it out of git and out of chat."
  );
  process.exit(1);
}

const db = DRY ? null : createClient(URL_, SERVICE_KEY, { auth: { persistSession: false } });

// ---------------------------------------------------------------- storage
const MIME = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".pdf": "application/pdf",
};

const BUCKET_FOR = (localPath) =>
  localPath.endsWith(".pdf") ? "issue-pdfs" : localPath.startsWith("/assets/") ? "covers" : "piece-images";

const uploaded = new Map(); // local path -> public URL
let uploadCount = 0;
let uploadBytes = 0;

/** Upload one file referenced by a leading-slash public path, return its public URL. */
async function toStorage(localPath) {
  if (uploaded.has(localPath)) return uploaded.get(localPath);

  const abs = path.join(PUBLIC, localPath.replace(/^\//, ""));
  if (!fs.existsSync(abs)) {
    console.warn(`  ! missing on disk, left as-is: ${localPath}`);
    uploaded.set(localPath, localPath);
    return localPath;
  }

  const bucket = BUCKET_FOR(localPath);
  // strip the leading segment so keys read 3/<slug>/inline-1.webp
  const key = localPath.replace(/^\/(issues|assets)\//, "");
  const bytes = fs.statSync(abs).size;

  if (!DRY) {
    const { error } = await db.storage.from(bucket).upload(key, fs.readFileSync(abs), {
      contentType: MIME[path.extname(abs).toLowerCase()] ?? "application/octet-stream",
      upsert: true,
    });
    if (error) throw new Error(`upload ${bucket}/${key}: ${error.message}`);
  }

  const url = `${URL_}/storage/v1/object/public/${bucket}/${key}`;
  uploaded.set(localPath, url);
  uploadCount++;
  uploadBytes += bytes;
  return url;
}

/** Rewrite every local src/href in body_html to its Storage URL. Nothing else
 *  in the pipeline rewrites these, so if this is skipped the site keeps serving
 *  images out of the repo and publishing still needs a redeploy. */
async function rewriteHtml(html) {
  if (!html) return html;
  const refs = [...new Set([...html.matchAll(/(?:src|href)="(\/issues\/[^"]+)"/g)].map((m) => m[1]))];
  let out = html;
  for (const ref of refs) {
    const url = await toStorage(ref);
    out = out.split(`"${ref}"`).join(`"${url}"`);
  }
  return out;
}

// ---------------------------------------------------------------- seed
const fixtures = [];
for (let n = 1; n <= 8; n++) {
  const f = path.join(ROOT, "src/lib/fixtures", `issue-${n}.json`);
  if (fs.existsSync(f)) fixtures.push(JSON.parse(fs.readFileSync(f, "utf8")));
}

// season titles + covers live in the shelf's fallback list, keyed by number
const ISSUE_META = {
  1: { title: "Summer 2022", cover: "/assets/cover-issue-1.png", published_at: "2022-06-01" },
  2: { title: "Fall 2022",   cover: "/assets/cover-issue-2.png", published_at: "2022-10-01" },
  3: { title: "Summer 2023", cover: "/assets/cover-issue-3.png", published_at: "2023-06-01" },
  4: { title: "Fall 2023",   cover: "/assets/cover-issue-4.jpeg", published_at: "2023-10-01" },
  5: { title: "Spring 2024", cover: "/assets/cover-issue-5.jpeg", published_at: "2024-03-01" },
  6: { title: "Summer 2024", cover: "/assets/cover-issue-6.png", published_at: "2024-06-01" },
  7: { title: "Winter 2024", cover: "/assets/cover-issue-7.jpg", published_at: "2024-12-01" },
  8: { title: "Spring 2025", cover: "/assets/cover-issue-8.jpeg", published_at: "2025-03-01" },
};

console.log(DRY ? "DRY RUN — nothing will be written\n" : `seeding ${URL_}\n`);

let pieceCount = 0;
const slugsSeen = new Set();

for (const fx of fixtures) {
  const n = fx.issue_number;
  const meta = ISSUE_META[n];
  if (!meta) throw new Error(`no title/cover known for issue ${n} — add it to ISSUE_META`);

  process.stdout.write(`issue ${n} · ${meta.title}\n`);

  const cover_url = await toStorage(meta.cover);
  const pdf_url = fx.pdf_download ? await toStorage(fx.pdf_download) : null;
  const page_images = [];
  for (const p of fx.page_images ?? []) page_images.push(await toStorage(p));

  let issue_id = null;
  if (!DRY) {
    const { data, error } = await db
      .from("issues")
      .upsert(
        {
          issue_number: n,
          title: meta.title,
          cover_url,
          pdf_url,
          published_at: meta.published_at,
          credits: fx.credits ?? null,
          page_images,
        },
        { onConflict: "issue_number" }
      )
      .select("id")
      .single();
    if (error) throw new Error(`issue ${n}: ${error.message}`);
    issue_id = data.id;
  }

  const rows = [];
  for (const [i, p] of fx.pieces.entries()) {
    if (slugsSeen.has(p.slug)) throw new Error(`duplicate slug across issues: ${p.slug}`);
    slugsSeen.add(p.slug);

    const galleries = [];
    for (const g of p.galleries ?? []) {
      const one = [];
      for (const img of g) one.push(await toStorage(img));
      galleries.push(one);
    }
    const images = [];
    for (const img of p.images ?? []) images.push(await toStorage(img));

    rows.push({
      issue_id,
      slug: p.slug,                                   // verbatim — never regenerate
      title: p.title,
      author_name: p.author_name ?? "",
      class_year: p.class_year ?? "",
      category: p.category ?? null,
      body: p.body ?? null,
      body_html: await rewriteHtml(p.body_html),
      galleries,
      images,
      verse: p.verse ?? false,
      // the archive's front matter is exactly the pieces the old magic string caught
      is_frontmatter: p.category === "Introduction",
      sort_order: p.sort_order ?? i,
      pdf_url: null,
      napkin_variant: null,   // NULL = derive from slug hash. A number would pin
      font_preset: null,      // every napkin to the same paper/font.
    });
    pieceCount++;
  }

  if (!DRY) {
    const { error } = await db.from("pieces").upsert(rows, { onConflict: "slug" });
    if (error) throw new Error(`issue ${n} pieces: ${error.message}`);
  }
  console.log(`  ${rows.length} pieces, ${rows.filter((r) => r.is_frontmatter).length} front matter`);
}

console.log(
  `\n${DRY ? "would seed" : "seeded"} ${fixtures.length} issues · ${pieceCount} pieces · ` +
    `${uploadCount} files (${(uploadBytes / 1048576).toFixed(1)} MB) to Storage`
);
if (DRY) console.log("\nre-run without --dry-run to apply");
