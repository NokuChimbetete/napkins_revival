// Pre-renders a magazine PDF to WebP page images for the spread viewer.
//
//   node scripts/render-pdf-pages.mjs "<path-to-pdf>" <issue-number>
//
// Output: public/issues/<n>/pages/<page>.webp + updates src/lib/fixtures/issue-<n>.json

import fs from "node:fs";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import sharp from "sharp";

globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;

const [pdfPath, issueNumberArg] = process.argv.slice(2);
if (!pdfPath || !issueNumberArg) {
  console.error('usage: node scripts/render-pdf-pages.mjs "<pdf>" <issue-number>');
  process.exit(1);
}
const issueNumber = Number(issueNumberArg);

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;

const outDir = path.join("public", "issues", String(issueNumber), "pages");
fs.mkdirSync(outDir, { recursive: true });

const pageImages = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const file = path.join(outDir, `${p}.webp`);
  await sharp(canvas.toBuffer("image/png")).webp({ quality: 84 }).toFile(file);
  pageImages.push(`/issues/${issueNumber}/pages/${p}.webp`);
  console.log(`  page ${p}/${doc.numPages} → ${file}`);
}

// keep the original PDF available for download
const pdfOut = path.join("public", "issues", String(issueNumber), `napkins-issue-${issueNumber}.pdf`);
fs.copyFileSync(pdfPath, pdfOut);

const fixtureFile = `src/lib/fixtures/issue-${issueNumber}.json`;
const fixture = fs.existsSync(fixtureFile)
  ? JSON.parse(fs.readFileSync(fixtureFile, "utf8"))
  : { issue_number: issueNumber, credits: null, pieces: [] };
fixture.page_images = pageImages;
fixture.pdf_download = `/issues/${issueNumber}/napkins-issue-${issueNumber}.pdf`;
fs.mkdirSync("src/lib/fixtures", { recursive: true });
fs.writeFileSync(fixtureFile, JSON.stringify(fixture, null, 2));
console.log(`wrote ${fixtureFile} (${pageImages.length} pages)`);
