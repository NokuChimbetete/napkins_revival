// One-off prep for the Napkins Drawer (/playground).
//
//   node scripts/prep-playground-assets.mjs <papers-dir> <fonts-dir>
//
// <papers-dir>: folder holding the 7 paper scans (1.png … 7.png).
// <fonts-dir>:  the extracted "Napkins Fonts" folder.
//
// Papers are downscaled to max-width 640 and re-encoded WebP into
// public/playground/papers/ (originals are ~1.4MB each — far too big for a
// ~250px napkin). Fonts are copied into src/fonts/playground/ under clean
// names; the roster here must stay in sync with src/app/playground/fonts.ts.
// The paper count (7) is permanent: napkin_variant = hash(slug) % 7 + 1, so
// adding papers later would re-deal every napkin's look.

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [papersDir, fontsDir] = process.argv.slice(2);
if (!papersDir || !fontsDir) {
  console.error("usage: node scripts/prep-playground-assets.mjs <papers-dir> <fonts-dir>");
  process.exit(1);
}

const root = path.join(import.meta.dirname, "..");
const papersOut = path.join(root, "public", "playground", "papers");
const fontsOut = path.join(root, "src", "fonts", "playground");

const MAX_WIDTH = 640;
const WEBP_QUALITY = 80;

// destination name → source path relative to the "Napkins Fonts" folder
const FONTS = {
  "canarina.woff2": "Canarina-master/canarina/fonts/web/Canarina-Mediana.woff2",
  "cmgeom.woff2": "GEOM/GEOM_REGULAR/WEB/CMGeom-Regular.woff2",
  "gulax.woff2": "Gulax-master/Gulax-master/fonts/webfonts/Gulax-Regular.woff2",
  "cakra.woff2": "OoM Type – Cakra/Cakra-Normal.woff2",
  "chaumont.woff2": "chaumont_script/Chaumont_Script/ChaumontScript-Regular.woff2",
  "hamlet.woff2":
    "gotico-antiqua_hamlet-cicero-12/gotico-antiqua_Hamlet-Cicero-12/Hamlet-Cicero12.woff2",
  // renamed: the "&" in the shipped filename breaks URLs
  "sweynheim.woff2":
    "gotico-antiqua_sweynheim-pannartz-120r/gotico-antiqua_Sweynheim-Pannartz-120R/Sweynheim&Pannartz-SubiacoProto-Roman120R.woff2",
  "syne-bold.woff2": "syne-typeface/fonts/webfonts/Syne-Bold.woff2",
  "syne-tactile.woff2": "syne-typeface/fonts/webfonts/SyneTactile-Regular.woff2",
  "league-script.woff":
    "league-script-number-one-master/league-script-number-one-master/webfonts/LeagueScriptNumberOne-webfont.woff",
  // Pecita deliberately excluded: 843KB for one face; Caveat + Gochi Hand
  // (already loaded app-wide via next/font/google) cover the handwriting look.
  "lt-stopwatch.ttf": "LTStopwatch-v2/LTStopwatch-v2.ttf",
  "sansita-swashed.ttf": "Sansita_Swashed/static/SansitaSwashed-Medium.ttf",
};

await mkdir(papersOut, { recursive: true });
await mkdir(fontsOut, { recursive: true });

const papers = (await readdir(papersDir)).filter((f) => /^\d+\.png$/i.test(f));
papers.sort((a, b) => parseInt(a) - parseInt(b));
for (const file of papers) {
  const img = await loadImage(path.join(papersDir, file));
  const scale = Math.min(1, MAX_WIDTH / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = createCanvas(w, h);
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  const out = path.join(papersOut, `paper-${parseInt(file)}.webp`);
  await writeFile(out, await canvas.encode("webp", WEBP_QUALITY));
  const kb = ((await stat(out)).size / 1024).toFixed(0);
  console.log(`paper-${parseInt(file)}.webp  ${img.width}x${img.height} → ${w}x${h}  ${kb}KB`);
}

let total = 0;
for (const [dest, src] of Object.entries(FONTS)) {
  const from = path.join(fontsDir, src);
  await copyFile(from, path.join(fontsOut, dest));
  const kb = (await stat(from)).size / 1024;
  total += kb;
  console.log(`${dest}  ${kb.toFixed(0)}KB`);
}
console.log(`fonts total: ${(total / 1024).toFixed(2)}MB`);
