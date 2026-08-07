// Records exactly how every napkin is dealt — paper, font, tilt, size, depth,
// field position — by reading the *rendered* /drawer HTML, keyed by slug.
//
//   node scripts/napkin-snapshot.mjs capture <file>   record current state
//   node scripts/napkin-snapshot.mjs diff <file>      compare current to a record
//
// Why: migrating the archive from fixtures into Supabase must not move or
// re-skin a single napkin. A changed slug, a different piece order, a tweak to
// PAPER_COUNT or the font roster all silently re-deal the whole table. This is
// how we prove none of that happened.
//
// Requires the dev server on :3000 (npm run dev).

import fs from "node:fs";

const [mode, file] = process.argv.slice(2);
if (!["capture", "diff"].includes(mode) || !file) {
  console.error("usage: node scripts/napkin-snapshot.mjs <capture|diff> <file>");
  process.exit(1);
}

const BASE = process.env.NAPKINS_BASE_URL ?? "http://localhost:3000";

const res = await fetch(`${BASE}/drawer`).catch((e) => {
  console.error(`could not reach ${BASE}/drawer — is the dev server running?\n  ${e.message}`);
  process.exit(1);
});
if (!res.ok) {
  console.error(`${BASE}/drawer returned HTTP ${res.status}`);
  process.exit(1);
}
const html = await res.text();

// Each napkin renders as:
//   <div class=".. spot" data-napkin-slug="X" style="left:A%;top:B%;z-index:C">
//     <button class=".. scene" data-size=".." data-variant=".." data-preset=".." style="--tilt:Ddeg;..">
const SPOT = /data-napkin-slug="([^"]+)"[^>]*style="([^"]*)"[\s\S]{0,400}?data-size="(\d+)"[^>]*data-variant="(\d+)"[^>]*data-preset="(\d+)"[^>]*style="([^"]*)"/g;

const pick = (style, prop) => style.match(new RegExp(`${prop}\\s*:\\s*([^;"]+)`))?.[1]?.trim() ?? null;

const napkins = {};
for (const m of html.matchAll(SPOT)) {
  const [, slug, spotStyle, size, variant, preset, sceneStyle] = m;
  napkins[slug] = {
    left: pick(spotStyle, "left"),
    top: pick(spotStyle, "top"),
    z: pick(spotStyle, "z-index"),
    size: Number(size),
    variant: Number(variant),
    preset: Number(preset),
    tilt: pick(sceneStyle, "--tilt"),
  };
}

const count = Object.keys(napkins).length;
if (count === 0) {
  console.error("parsed 0 napkins — the markup shape changed; update the SPOT regex");
  process.exit(1);
}

const current = { count, napkins };

if (mode === "capture") {
  fs.writeFileSync(file, JSON.stringify(current, null, 2));
  console.log(`captured ${count} napkins → ${file}`);
  process.exit(0);
}

const before = JSON.parse(fs.readFileSync(file, "utf8"));
const beforeSlugs = Object.keys(before.napkins);
const afterSlugs = new Set(Object.keys(napkins));
const FIELDS = ["left", "top", "z", "size", "variant", "preset", "tilt"];

const problems = [];
for (const slug of beforeSlugs) {
  if (!afterSlugs.has(slug)) {
    problems.push(`MISSING  ${slug} — was on the table, now gone (its shared links 404)`);
    continue;
  }
  for (const key of FIELDS) {
    const a = before.napkins[slug][key];
    const b = napkins[slug][key];
    if (a !== b) problems.push(`CHANGED  ${slug} · ${key}: ${a} → ${b}`);
  }
}

const added = [...afterSlugs].filter((s) => !before.napkins[s]);

console.log(`before: ${before.count} napkins   after: ${count} napkins`);
if (added.length) {
  console.log(`\nnew napkins (${added.length}) — expected when an issue is published:`);
  for (const s of added.slice(0, 15)) console.log(`  + ${s}`);
  if (added.length > 15) console.log(`  … and ${added.length - 15} more`);
}

if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S) — existing napkins must never move or re-skin:`);
  for (const p of problems.slice(0, 40)) console.log("  " + p);
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

console.log("\nOK — every pre-existing napkin kept its paper, font, tilt, depth and position.");
