// Pulls the Events section's media off the old Cargo site into public/assets/events/.
//
//   node scripts/fetch-event-assets.mjs [--dry-run] [--only=fractal,honk,...]
//                                       [--skip-images]   video + audio only
//
// Cargo embeds the whole page model in a <script data-set="ScaffoldingData">
// blob on every response, including the page's raw content HTML, its media
// library (hash + filename + dimensions) and its backdrop config. That is a far
// better source than scraping the rendered DOM: the DOM lazy-loads, rewrites
// <img src> to a width-capped freight URL, and never exposes the backdrop's
// filename at all. Everything here comes out of that blob.
//
// Two things about the source images are not what they look like:
//
//   1. EXIF orientation. IMG_4875.JPG is stored 6960x4640 with orientation 6;
//      Cargo declares it 4640x6960 because browsers apply image-orientation
//      by default. sharp does not, unless you ask. So .rotate() runs before
//      every resize, and Cargo's declared dimensions — which are already
//      post-rotation — are the ones written to the manifest.
//   2. Freight serves originals at print resolution (6720x4480 is typical,
//      10-20 MB each). Nothing here is displayed above ~1220 CSS px, so the
//      caps below are already generous on a retina screen.
//
// Writes public/assets/events/<group>/<slug>.webp and a manifest at
// scripts/event-assets.manifest.json, which is the source for the generated
// src/components/events/event-images.ts. Copy is NOT scraped — it is
// hand-authored in events-data.ts, so an editor never has to read this file.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry-run");
const SKIP_IMAGES = process.argv.includes("--skip-images");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/assets/events");
const MANIFEST = path.join(ROOT, "scripts/event-assets.manifest.json");
const SITE = "https://napkinseverywhere.com";

/** Freight caps, by how large the asset is ever drawn.
 *  The reference container is 1264.67px wide (a 1280 viewport), so a full-bleed
 *  image is ~1223 CSS px and a half-column one ~611. Doubled for retina, then
 *  rounded up to something tidy. */
const WIDTH = {
  backdrop: 2200, // fixed, covers the viewport
  full: 2000, // spans the whole 12-column track
  content: 1400, // the common case: a 3-, 5- or 6-column cell
  portrait: 700, // Chimera's team headshots, drawn ~200px
};

/** Which Cargo pages make up the section, and where their media lands. */
const PAGES = [
  { url: "/Fractal-Landing-Page", group: "fractal", backdrop: true },
  { url: "/Honk-Please-1", group: "honk", backdrop: true },
  { url: "/Borde__", group: "borde", backdrop: true },
  { url: "/Chimera-1", group: "chimera", backdrop: true, portraits: true },
  // Every space page opens with one image spanning the full 12-column track
  // (~1019 CSS px, so ~2040 on a retina screen) before dropping to half- and
  // third-width cells. It is always the first image in the content.
  { url: "/Lungs", group: "spaces", fullFirst: true },
  { url: "/Waves", group: "spaces", fullFirst: true },
  { url: "/Engine", group: "spaces", fullFirst: true },
  { url: "/Web", group: "spaces", fullFirst: true },
  { url: "/Golden-Ratio", group: "spaces", fullFirst: true },
  { url: "/Synergy", group: "spaces", fullFirst: true },
  { url: "/Honk-Please-Photos", group: "honk-photos" },
];

/** Media that is not an image, and so not resizable — copied as-is. */
const FILES = [
  {
    group: "fractal",
    slug: "lungs-video",
    ext: "mp4",
    url: "https://files.cargocollective.com/c1905521/lungs_video.MP4",
    // Cargo serves the camera original: 1620x1080, 74s, 13.3 MB. The footage is
    // a bright blue projection on flat black, which is exactly what H.264
    // handles well — 1280 wide at CRF 24 is visually indistinguishable from the
    // source (checked frame-by-frame) at a fifth of the weight. Poster frame at
    // 22s, where the whole bronchial figure is on screen.
    reencode: { width: 1280, crf: 24, audioKbps: 96, posterAt: 22 },
  },
  ...[
    ["room-1", "-Edited--Room-1.m4a"],
    ["room-2", "-Edited--Room-2.m4a"],
    ["workshop-1-bodymapping", "-Edited-Room3.Bodymapping.m4a"],
    ["workshop-2-writing", "-Edited-Room3.writing.m4a"],
  ].map(([slug, name]) => ({
    group: "audio-guide",
    slug,
    ext: "m4a",
    url: `https://files.cargocollective.com/c1905521/${name}`,
  })),
];

// ---------------------------------------------------------------------------

const slugify = (filename) =>
  filename
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Cargo's own CDN sizing: /w/<px>/ scales the longest edge down to <px>. */
const freightUrl = (hash, name, width) =>
  `https://freight.cargo.site/w/${width}/i/${hash}/${encodeURIComponent(name)}`;

async function scaffolding(url) {
  const res = await fetch(SITE + url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(
    /<script[^>]+data-set="ScaffoldingData"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) throw new Error(`${url}: no ScaffoldingData`);

  // The blob is the whole site tree; the page we asked for is the only node
  // carrying `content` that is not a pinned element (the nav and the Instagram
  // corner are pins and appear on every response).
  const tree = JSON.parse(m[1]);
  const hits = [];
  const walk = (n) => {
    if (n.content !== undefined && !n.pin) hits.push(n);
    (n.pages || []).forEach(walk);
  };
  walk(tree);
  const node = hits.pop();
  if (!node) throw new Error(`${url}: no content node`);
  return node;
}

/** Every <img> in the page content, in document order, de-duplicated.
 *  Cargo writes the full-resolution freight URL to data-src and leaves width/
 *  height as the display (post-EXIF) dimensions. */
function imagesFromContent(html) {
  const out = [];
  const seen = new Set();
  const re = /<img\b[^>]*>/g;
  let tag;
  while ((tag = re.exec(html))) {
    const attr = (name) => {
      const m = tag[0].match(new RegExp(`\\b${name}="([^"]*)"`));
      return m ? m[1] : null;
    };
    const src = attr("data-src");
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const parts = src.split("/");
    out.push({
      src,
      hash: parts[parts.length - 2],
      name: decodeURIComponent(parts[parts.length - 1]),
      width: Number(attr("width")) || null,
      height: Number(attr("height")) || null,
      // a width percentage of the containing column — part of the layout
      scale: Number(attr("data-scale") || 100),
    });
  }
  return out;
}

function backdropFrom(node) {
  const id = node.backdrop?.data?.image;
  if (!id) return null;
  const media = (node.images || []).find((i) => String(i.id) === String(id));
  if (!media) return null;
  return {
    hash: media.hash,
    name: media.name,
    width: media.width,
    height: media.height,
    overlay: node.backdrop.data.overlay_color || "transparent",
    scaleOption: node.backdrop.data.scale_option,
    alignment: node.backdrop.data.image_alignment,
  };
}

async function writeImage({ hash, name, cap, dest, quality, declared }) {
  // Freight's /w/<px>/ sizes the image as *stored*, which for an EXIF-rotated
  // photo is the landscape original — so asking for 1400 on a portrait shot
  // yields 1400x933 and rotating it gives a 933px-wide result, well under the
  // cap. Ask for the width that lands on `cap` once rotated. Cargo's declared
  // dimensions are already post-rotation, so their ratio is what to scale by.
  const upright = declared?.width && declared?.height ? declared.height / declared.width : 1;
  const request = Math.round(cap * Math.max(1, upright));

  const res = await fetch(freightUrl(hash, name, request));
  if (!res.ok) throw new Error(`${name} -> HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  // .rotate() with no argument bakes in the EXIF orientation. It must come
  // before .resize(), or a 90-degree-rotated photo is resized on the wrong axis.
  const pipeline = sharp(input).rotate().resize({
    width: cap,
    withoutEnlargement: true,
  });
  const buf = await pipeline.webp({ quality }).toBuffer();
  const meta = await sharp(buf).metadata();

  if (!DRY) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  return { bytes: buf.length, width: meta.width, height: meta.height, sourceBytes: input.length };
}

async function writeFile({ url, dest }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!DRY) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  return { bytes: buf.length };
}

const ffmpeg = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "pipe" });

/** Re-encode in place and pull a poster frame. Returns null if ffmpeg is not
 *  installed, leaving the original in place rather than failing the run — the
 *  page works either way, it is just a heavier download. */
function reencodeVideo(file, dest) {
  const { width, crf, audioKbps, posterAt } = file.reencode;
  const tmp = dest.replace(/\.mp4$/, ".tmp.mp4");
  const poster = dest.replace(/\.mp4$/, "-poster.webp");
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    console.warn("  ! ffmpeg not found — keeping the original encode, no poster written");
    return null;
  }
  ffmpeg([
    "-i", dest,
    "-vf", `scale=${width}:-2`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf),
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    // so the browser can start playing before the whole file has arrived
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", `${audioKbps}k`,
    tmp,
  ]);
  fs.renameSync(tmp, dest);
  ffmpeg(["-ss", String(posterAt), "-i", dest, "-frames:v", "1",
    "-vf", `scale=${width}:-2`, "-c:v", "libwebp", "-quality", "82", poster]);
  return { bytes: fs.statSync(dest).size, poster, posterBytes: fs.statSync(poster).size };
}

// ---------------------------------------------------------------------------

// Merge into whatever is already recorded rather than starting empty, so a
// partial run (--only=, --skip-images) refreshes its own entries and leaves
// every other one intact.
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : { images: {}, files: {}, backdrops: {} };
let totalIn = 0;
let totalOut = 0;

const wanted = ONLY ? new Set(ONLY.split(",")) : null;
const pages = SKIP_IMAGES ? [] : PAGES.filter((p) => !wanted || wanted.has(p.group));

for (const page of pages) {
  const node = await scaffolding(page.url);
  const images = imagesFromContent(node.content);
  console.log(`\n${page.url}  (${node.title.trim()})  ${images.length} images`);

  if (page.backdrop) {
    const bd = backdropFrom(node);
    if (!bd) {
      console.warn("  ! backdrop declared but not found in media library");
    } else {
      const dest = path.join(OUT_DIR, page.group, "backdrop.webp");
      // The three later backdrops are flat white with crayon linework; lossy
      // WebP rings around those strokes below ~90. Fractal's is a photograph
      // and takes the usual 80 without showing it.
      const quality = page.group === "fractal" ? 80 : 90;
      const r = await writeImage({
        hash: bd.hash,
        name: bd.name,
        cap: WIDTH.backdrop,
        dest,
        quality,
        declared: { width: bd.width, height: bd.height },
      });
      totalIn += r.sourceBytes;
      totalOut += r.bytes;
      manifest.backdrops[page.group] = {
        src: `/assets/events/${page.group}/backdrop.webp`,
        width: r.width,
        height: r.height,
        overlay: bd.overlay,
        source: bd.name,
      };
      console.log(
        `  backdrop  ${bd.name}  ${bd.width}x${bd.height} -> ` +
          `${r.width}x${r.height}  ${(r.bytes / 1024).toFixed(0)}KB` +
          (bd.overlay !== "transparent" ? `  overlay ${bd.overlay}` : "")
      );
    }
  }

  for (const [index, img] of images.entries()) {
    const slug = slugify(img.name);
    const key = `${page.group}/${slug}`;
    if (manifest.images[key]) continue; // shared between pages; keep the first

    // Chimera's headshots are square and drawn ~204px wide in a 2-column cell.
    const isHeadshot = page.portraits && img.width === img.height && img.width <= 3100;
    const cap = isHeadshot
      ? WIDTH.portrait
      : page.fullFirst && index === 0
        ? WIDTH.full
        : WIDTH.content;
    const dest = path.join(OUT_DIR, page.group, `${slug}.webp`);
    const r = await writeImage({
      hash: img.hash,
      name: img.name,
      cap,
      dest,
      quality: 80,
      declared: { width: img.width, height: img.height },
    });
    totalIn += r.sourceBytes;
    totalOut += r.bytes;

    // Cargo's declared width/height are post-EXIF; sharp's are post-.rotate().
    // They must agree in aspect ratio — if they do not, the source is a case
    // this script has not seen and the layout would be wrong.
    if (img.width && img.height) {
      const declared = img.width / img.height;
      const actual = r.width / r.height;
      if (Math.abs(declared - actual) > 0.02) {
        console.warn(
          `  ! ${img.name}: declared ${img.width}x${img.height} (${declared.toFixed(3)}) ` +
            `but wrote ${r.width}x${r.height} (${actual.toFixed(3)})`
        );
      }
    }

    manifest.images[key] = {
      src: `/assets/events/${page.group}/${slug}.webp`,
      width: r.width,
      height: r.height,
      scale: img.scale,
      source: img.name,
    };
    console.log(
      `  ${slug.padEnd(34)} ${String(img.width).padStart(5)}x${String(img.height).padEnd(5)} -> ` +
        `${String(r.width).padStart(4)}x${String(r.height).padEnd(4)} ` +
        `${(r.bytes / 1024).toFixed(0).padStart(4)}KB${img.scale !== 100 ? `  @${img.scale}%` : ""}`
    );
  }
}

if (!wanted) {
  console.log("");
  for (const f of FILES) {
    const dest = path.join(OUT_DIR, f.group, `${f.slug}.${f.ext}`);
    const r = await writeFile({ url: f.url, dest });
    const entry = {
      src: `/assets/events/${f.group}/${f.slug}.${f.ext}`,
      bytes: r.bytes,
    };
    let note = "";

    if (f.reencode && !DRY) {
      const enc = reencodeVideo(f, dest);
      if (enc) {
        note = `  (was ${(r.bytes / 1048576).toFixed(2)}MB, +poster)`;
        entry.bytes = enc.bytes;
        entry.poster = `/assets/events/${f.group}/${f.slug}-poster.webp`;
        totalOut += enc.posterBytes;
      }
    }

    totalOut += entry.bytes;
    manifest.files[`${f.group}/${f.slug}`] = entry;
    console.log(`  ${f.slug.padEnd(34)} ${(entry.bytes / 1048576).toFixed(2)}MB${note}`);
  }
}

if (!DRY) {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  writeImagesModule();
}

/** Emit the typed lookup the components import. Keys are checked at compile
 *  time, so a renamed or missing asset fails `tsc` instead of rendering a
 *  broken image. Copy does not live here — see events-data.ts. */
function writeImagesModule() {
  const entries = Object.entries(manifest.images).sort(([a], [b]) => a.localeCompare(b));
  const line = ([key, v]) =>
    `  "${key}": { src: "${v.src}", width: ${v.width}, height: ${v.height}` +
    (v.scale !== 100 ? `, scale: ${v.scale}` : "") +
    ` },`;

  const body = `// GENERATED by scripts/fetch-event-assets.mjs — do not edit by hand.
//
// Every image the Events section renders, keyed "<group>/<slug>". Dimensions
// are the real on-disk pixels after EXIF rotation was baked in, so they can be
// handed straight to next/image. \`scale\` is Cargo's data-scale: the width the
// image occupied in its column, as a percentage, and part of the layout rather
// than decoration — it is only present where it is not 100.

export type EventImage = {
  src: string;
  width: number;
  height: number;
  scale?: number;
};

export const EVENT_IMAGES = {
${entries.map(line).join("\n")}
} as const satisfies Record<string, EventImage>;

export type EventImageKey = keyof typeof EVENT_IMAGES;

export const BACKDROPS = {
${Object.entries(manifest.backdrops)
  .map(
    ([k, v]) =>
      `  ${k}: { src: "${v.src}", width: ${v.width}, height: ${v.height}, overlay: "${v.overlay}" },`
  )
  .join("\n")}
} as const;

export const EVENT_FILES = {
${Object.entries(manifest.files)
  .map(
    ([k, v]) =>
      `  "${k}": { src: "${v.src}"${v.poster ? `, poster: "${v.poster}"` : ""} },`
  )
  .join("\n")}
} as const;
`;
  const dest = path.join(ROOT, "src/components/events/event-images.ts");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body);
  console.log(`generated src/components/events/event-images.ts (${entries.length} images)`);
}

const n = Object.keys(manifest.images).length + Object.keys(manifest.backdrops).length;
console.log(
  `\n${DRY ? "would write" : "wrote"} ${n} images + ${Object.keys(manifest.files).length} files ` +
    `— ${(totalIn / 1048576).toFixed(1)}MB fetched, ${(totalOut / 1048576).toFixed(1)}MB on disk`
);
if (DRY) console.log("re-run without --dry-run to apply");
