// Ports issues' entries from the old Cargo site (napkinseverywhere.com)
// into local fixtures + downloaded images.
//
//   node scripts/scrape-issue.mjs <toc-slug> <issue-number>   one issue
//   node scripts/scrape-issue.mjs --all                       every known issue
//
// Output: src/lib/fixtures/issue-<n>.json + public/issues/<n>/<entry>/<i>.<ext>
// Existing fixture fields produced elsewhere (page_images, pdf_download) are preserved.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { sanitizeBody, htmlToText } from "./lib/sanitize-body.mjs";
import { MANUAL_ENTRIES } from "./manual-entries.mjs";

const BASE = "https://napkinseverywhere.com";

// canonical issue pages as linked from napkinseverywhere.com/Magazine,
// with the "<Season> <Year> Issue" label each entry page links back with
const ISSUES = {
  "Summer-2022-1": { number: 1, label: "Summer 2022" },
  "Fall-2022-1": { number: 2, label: "Fall 2022" },
  "Summer-2023": { number: 3, label: "Summer 2023" },
  "Fall-2023": { number: 4, label: "Fall 2023" },
  "Spring-2024-1": { number: 5, label: "Spring 2024" },
  "Summer-2024": { number: 6, label: "Summer 2024" },
  "Winter-2024-Issue-draft": { number: 7, label: "Winter 2024" },
  "Spring-2025-Issue": { number: 8, label: "Spring 2025" },
};

const NAV_SLUGS = /^(Magazine|About-Us|Events|Contact-Us|Submit-to-the-Magazine|Join-the-Team)$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "napkins-migration" } });
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}

// Cargo's asset CDN throttles bursts with 503s, which silently cost us whole
// photo series on the first pass. Retry those with backoff.
async function fetchAsset(url, attempts = 5) {
  let lastErr = "";
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "napkins-migration" } });
      if (res.ok) return res;
      lastErr = `HTTP ${res.status}`;
      // 404 is permanent; anything else is worth another try
      if (res.status === 404) break;
    } catch (err) {
      lastErr = err.message;
    }
    await sleep(1200 * (i + 1));
  }
  throw new Error(lastErr || "fetch failed");
}

// Cargo embeds each page's HTML as a JSON-escaped string under "content" keys.
function contentRecords(html) {
  const records = [];
  let idx = 0;
  while ((idx = html.indexOf('"content":"', idx)) !== -1) {
    let j = idx + '"content":"'.length;
    let buf = "";
    let esc = false;
    while (j < html.length) {
      const ch = html[j];
      if (esc) {
        buf += ch;
        esc = false;
      } else if (ch === "\\") {
        buf += ch;
        esc = true;
      } else if (ch === '"') {
        break;
      } else {
        buf += ch;
      }
      j++;
    }
    try {
      records.push(JSON.parse('"' + buf + '"'));
    } catch {
      // skip malformed record
    }
    idx = j;
  }
  return records;
}

// Cargo writes the same colour as "#0071ad" on some pages and
// "rgb(0, 113, 173)" on others, so normalise before anything matches on it.
const normalizeColors = (s) =>
  s.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/gi, (_m, r, g, b) =>
    "#" + [r, g, b].map((n) => Number(n).toString(16).padStart(2, "0")).join("")
  );

// The real page record is the longest one styled like article content.
function mainRecord(html) {
  const candidates = contentRecords(html)
    .map(normalizeColors)
    .filter((c) => c.includes("#0071ad") || c.includes("grid-col"));
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? "";
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’");

// HTML fragment → plain text with newlines; keeps *italic* / **bold** markers.
function toText(fragment) {
  return decode(
    fragment
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|h\d)>/gi, "\n")
      .replace(/<(i|em)\b[^>]*>/gi, "*")
      .replace(/<\/(i|em)>/gi, "*")
      .replace(/<(b|strong)\b[^>]*>/gi, "**")
      .replace(/<\/(b|strong)>/gi, "**")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\*\*\s*\*\*/g, "")
    .replace(/\*\s*\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Which issue does this entry say it belongs to? Prefer the visible
// "<Season> <Year> Issue" label over the href: some entry pages carry a stale
// href (e.g. "Abandoned" links to Summer-2022-1 but is labelled, and listed,
// as Summer 2023), and the label is what the editors actually maintained.
function homeIssueLabel(content) {
  for (const m of content.matchAll(/<a href="([^"]+)" rel="history">([\s\S]{0,160}?)<\/a>/g)) {
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const labelled = text.match(/^([A-Za-z]+ \d{4}) Issue$/i);
    if (labelled) return labelled[1];
    if (/Issue/i.test(text) && ISSUES[m[1]]) return ISSUES[m[1]].label;
  }
  return null;
}

function parseEntry(content, slug, pageHtml) {
  const grays = [...content.matchAll(/<span style="color: #828282;">([^<]+)<\/span>/g)]
    .map((m) => decode(m[1]).trim())
    .filter(Boolean);
  const category = grays.find((g) => !/issue/i.test(g)) ?? null;

  // Title = the first non-empty <h2>. Don't key on the heading colour or a bare
  // <span> child: titles are sometimes a slightly different blue (#0070ae) and/or
  // wrapped in <i>, which the old exact-match regex silently dropped.
  let title = slug;
  for (const m of content.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
    // Plain tag-strip + decode, NOT toText(): toText adds/collapses *…* emphasis
    // markers, which both invents asterisks on an italic title (tatterdemalion)
    // and mangles a title that genuinely IS asterisks (Almira Halkina's "***").
    const t = decode(
      m[1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
    )
      .replace(/\s+/g, " ")
      .trim();
    if (t) {
      title = t;
      break;
    }
  }

  // Read the whole orange byline span, then split name from class year.
  // Matching "(...)" directly is unsafe: bylines like "by Dasha Panasenko and
  // Zhi Zhi Chia" carry no year, and the regex would run on into the body text
  // hunting for the next bracket.
  const bylineMatch = content.match(/<span style="color: #ff5900;">([\s\S]*?)<\/span>/i);
  let author_name = "";
  let class_year = "";
  if (bylineMatch) {
    const text = decode(bylineMatch[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    // some bylines are credited "Words by …" / "Photos by …"
    const m = text.match(/^(?:[A-Za-z]+\s+)?by\s+(.*?)\s*(?:\(([^)]*)\))?$/i);
    if (m) {
      author_name = m[1].trim();
      class_year = (m[2] ?? "").trim();
    }
  }
  if (!author_name && pageHtml) {
    // some entries only carry the byline in the <title> tag
    const t = pageHtml.match(/<title>[^<]*? by ([^<(—–]+?)(?:\((M[^)]*)\))?\s*[—–]/);
    if (t) {
      author_name = decode(t[1]).trim();
      class_year = t[2] ?? "";
    }
  }

  // Two image shapes on the old site:
  //  - <div class="image-gallery"> … </div>  → a real slideshow
  //  - plain <img> in the prose               → an illustration that must stay
  //    exactly where the author placed it
  // Each gallery is its own slideshow and belongs where the author put it —
  // an entry can interleave several with text (Tattoo Diary has ten, one per
  // person). Tokenise them in place rather than hoisting them to the top.
  const galleries = [];
  let frag = content.replace(/<div class="image-gallery"[\s\S]*?<\/div>/gi, (block) => {
    const urls = [...block.matchAll(/(?:data-src|src)="([^"]+)"/g)].map((m) => m[1]);
    if (!urls.length) return "";
    galleries.push(urls);
    return ` [[NAPKINSGAL${galleries.length - 1}]] `;
  });

  // body = everything after the byline block; sanitizeBody keeps the original
  // line breaks, stanza breaks, alignment and emphasis.
  // The byline block ends with the "<Season> <Year> Issue" back-link, so cut
  // after that when present — cutting at the byline text alone leaves the link
  // and a trail of orphaned closing tags in the body.
  let bodyStart = bylineMatch ? frag.indexOf(bylineMatch[0]) + bylineMatch[0].length : 0;
  for (const m of frag.matchAll(/<a href="[^"]*" rel="history">([\s\S]*?)<\/a>/g)) {
    if (/\bIssue\b/i.test(m[1]) && m.index + m[0].length > bodyStart) {
      bodyStart = m.index + m[0].length;
      break;
    }
  }
  let afterByline = frag.slice(bodyStart);

  // Video pieces (the Animation category) are entirely a <video> embed, so the
  // video has to survive sanitising the same way inline images do.
  const inlineVideos = [];
  afterByline = afterByline.replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, (block) => {
    const src = block.match(/<source[^>]+src="([^"]+)"/i)?.[1] ?? block.match(/<video[^>]+src="([^"]+)"/i)?.[1];
    if (!src) return "";
    inlineVideos.push({ src });
    return ` [[NAPKINSVID${inlineVideos.length - 1}]] `;
  });

  // Some pieces embed media we can't download — a YouTube film, a Spotify
  // playlist that's part of the piece. Keep the embed so nothing is lost.
  const embeds = [];
  afterByline = afterByline.replace(/<iframe\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/gi, (_block, src) => {
    const url = src.replace(/&amp;/g, "&");
    const kind = /youtube\.com\/embed|youtu\.be|player\.vimeo\.com/i.test(url)
      ? "video"
      : /open\.spotify\.com\/embed|bandcamp\.com\/EmbeddedPlayer|w\.soundcloud\.com\/player/i.test(url)
        ? "audio"
        : null;
    if (!kind) return "";
    embeds.push({ url, kind });
    return ` [[NAPKINSEMBED${embeds.length - 1}]] `;
  });
  // SoundCloud/Spotify auto-append a tiny attribution div after their player;
  // it's boilerplate (the player shows the same info), so drop it
  afterByline = afterByline.replace(
    /(\[\[NAPKINSEMBED\d+\]\])\s*<div\b[^>]*>[\s\S]*?(?:soundcloud|spotify)\.com[\s\S]*?<\/div>/gi,
    "$1"
  );

  // Swap inline images for tokens so sanitizeBody can't strip them, then put
  // them back (pointing at local files) once they're downloaded.
  const inlineImages = [];
  afterByline = afterByline.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/(?:data-src|src)="([^"]+)"/i)?.[1];
    if (!src) return "";
    inlineImages.push({
      src,
      width: tag.match(/\swidth="(\d+)"/i)?.[1] ?? null,
      height: tag.match(/\sheight="(\d+)"/i)?.[1] ?? null,
    });
    return ` [[NAPKINSIMG${inlineImages.length - 1}]] `;
  });
  let body_html = sanitizeBody(afterByline);
  // strip the "<Season> <Year> Issue" label the byline block leaves behind, then
  // re-tidy: removing it can expose the closing tags that wrapped it
  if (/^[A-Za-z]+ \d{4} Issue/i.test(body_html)) {
    body_html = sanitizeBody(body_html.replace(/^[A-Za-z]+ \d{4} Issue/i, ""));
  }
  // media placeholders are markup, not prose — keep them out of the text body
  let body = htmlToText(body_html.replace(/\s*\[\[NAPKINS(?:IMG|VID|GAL|EMBED)\d+\]\]\s*/g, "\n")).trim();
  if (/^[A-Za-z]+ \d{4} Issue$/.test(body)) {
    body = "";
    body_html = "";
  }

  return {
    slug,
    title,
    author_name,
    class_year,
    category,
    body,
    body_html,
    galleries,
    inlineImages,
    inlineVideos,
    embeds,
  };
}

// The reader shows images in a ~680px column, so full-resolution originals
// (some over 7MB) are pure cost — they stall the browser and would be brutal on
// mobile data. Downscale to 2x the display width and re-encode as WebP.
const MAX_WIDTH = 1500;

// Videos are the whole artwork for Animation pieces, so they're pulled local
// like everything else — but re-encoded, since the originals run to tens of MB.
async function downloadVideos(urls, issueNumber, slug) {
  if (!urls.length) return [];
  const dir = path.join("public", "issues", String(issueNumber), slug.toLowerCase().slice(0, 60));
  fs.mkdirSync(dir, { recursive: true });

  const out = [];
  for (let i = 0; i < urls.length; i++) {
    const file = path.join(dir, `video-${i + 1}.mp4`);
    const rel = "/" + file.replace(/\\/g, "/").replace(/^public\//, "");
    if (fs.existsSync(file)) {
      out.push(rel);
      continue;
    }
    const tmp = path.join(dir, `video-${i + 1}.src.mp4`);
    try {
      const res = await fetchAsset(urls[i]);
      fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      // 1080p cap, H.264/AAC — plays everywhere and cuts the file dramatically
      execFileSync(
        "ffmpeg",
        ["-y", "-i", tmp, "-vf", "scale='min(1920,iw)':-2", "-c:v", "libx264", "-crf", "26",
         "-preset", "medium", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", file],
        { stdio: "ignore" }
      );
      fs.unlinkSync(tmp);
      const mb = (fs.statSync(file).size / 1048576).toFixed(1);
      console.log(`    video → ${mb} MB`);
    } catch (err) {
      console.warn(`  ! video failed (${err.message}); keeping original`);
      if (fs.existsSync(tmp)) fs.renameSync(tmp, file);
      else {
        out.push(null);
        continue;
      }
    }
    out.push(rel);
  }
  return out;
}

// Downloads a list of image URLs into public/issues/<n>/<slug>/ and returns the
// local paths (null for any that failed, so inline positions stay aligned).
async function downloadImages(urls, issueNumber, slug, prefix) {
  if (!urls.length) return [];
  const dir = path.join("public", "issues", String(issueNumber), slug.toLowerCase().slice(0, 60));
  fs.mkdirSync(dir, { recursive: true });

  const localPaths = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const rel = (f) => "/" + f.replace(/\\/g, "/").replace(/^public\//, "");

    // animated GIFs are passed through; everything else becomes WebP
    const candidates = [`${prefix}${i + 1}.webp`, `${prefix}${i + 1}.gif`].map((f) => path.join(dir, f));
    const cached = candidates.find((f) => fs.existsSync(f));
    if (cached) {
      localPaths.push(rel(cached));
      continue;
    }

    let res;
    try {
      res = await fetchAsset(url);
    } catch (err) {
      console.warn(`  ! image gave up after retries (${err.message}): ${url.slice(0, 76)}`);
      localPaths.push(null);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const isGif = (res.headers.get("content-type") ?? "").includes("gif") || /\.gif(?:$|[?#])/i.test(url);

    let file;
    if (isGif) {
      file = path.join(dir, `${prefix}${i + 1}.gif`);
      fs.writeFileSync(file, buf);
    } else {
      file = path.join(dir, `${prefix}${i + 1}.webp`);
      try {
        await sharp(buf)
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(file);
      } catch (err) {
        console.warn(`  ! could not convert image, keeping original: ${err.message}`);
        file = path.join(dir, `${prefix}${i + 1}.orig`);
        fs.writeFileSync(file, buf);
      }
    }
    localPaths.push(rel(file));
    await sleep(150);
  }
  return localPaths;
}

async function scrapeIssue(tocSlug, issueNumber) {
  const toc = mainRecord(await fetchText(`${BASE}/${tocSlug}`));

  const entrySlugs = [...toc.matchAll(/<a href="([^"]+)" rel="history"/g)]
    .map((m) => m[1])
    .filter(
      (href) =>
        !href.startsWith("http") &&
        href !== tocSlug &&
        !NAV_SLUGS.test(href) &&
        ISSUES[href] === undefined
    );
  const uniqueSlugs = [...new Set(entrySlugs)];

  const creditsIdx = toc.search(/CREDITS/i);
  const credits =
    creditsIdx === -1 ? null : toText(toc.slice(creditsIdx)).replace(/^CREDITS\s*/i, "").trim() || null;

  console.log(`\n=== Issue ${issueNumber} (${tocSlug}): ${uniqueSlugs.length} linked entries${credits ? ", credits found" : ""}`);

  const pieces = [];
  let order = 0;
  for (const slug of uniqueSlugs) {
    let html;
    try {
      html = await fetchText(`${BASE}/${slug}`);
    } catch (err) {
      console.warn(`  ✗ SKIP ${slug} — ${err.message}`);
      continue;
    }
    const record = mainRecord(html);

    // integrity check: the entry page links back to its own issue
    const home = homeIssueLabel(record);
    if (home && home !== ISSUES[tocSlug]?.label) {
      console.warn(`  ✗ SKIP ${slug} — labelled "${home} Issue", not ${ISSUES[tocSlug]?.label}`);
      continue;
    }

    const entry = parseEntry(record, slug, html);
    const lower = entry.slug.toLowerCase();

    const galleries = [];
    for (let g = 0; g < entry.galleries.length; g++) {
      const paths = await downloadImages(entry.galleries[g], issueNumber, lower, `gal${g + 1}-`);
      galleries.push(paths.filter(Boolean));
    }
    const inlinePaths = await downloadImages(
      entry.inlineImages.map((im) => im.src),
      issueNumber,
      lower,
      "inline-"
    );

    // The foreword's video is decorative and the editors asked for it to be
    // left out; every other video IS the piece (Animation entries), so it stays.
    const keepVideos = !/^foreword/i.test(lower);
    const videoPaths = keepVideos
      ? await downloadVideos(entry.inlineVideos.map((v) => v.src), issueNumber, lower)
      : [];

    let body_html = entry.body_html.replace(/\s*\[\[NAPKINSVID(\d+)\]\]\s*/g, (_m, k) => {
      const src = videoPaths[Number(k)];
      if (!src) return "";
      return `<video src="${src}" controls preload="metadata" playsinline></video>`;
    });

    body_html = body_html.replace(/\s*\[\[NAPKINSEMBED(\d+)\]\]\s*/g, (_m, k) => {
      const e = entry.embeds[Number(k)];
      if (!e) return "";
      return `<div class="embed embed-${e.kind}"><iframe src="${escapeAttr(e.url)}" loading="lazy" allowfullscreen></iframe></div>`;
    });

    // A gallery becomes a real element holding its images, so body_html stays
    // valid, balanced HTML that server-renders as-is. The reader turns it into
    // a swipeable strip with CSS alone — splitting the HTML around a marker
    // instead would leave unclosed tags and break hydration.
    body_html = body_html.replace(/\s*\[\[NAPKINSGAL(\d+)\]\]\s*/g, (_m, k) => {
      const imgs = galleries[Number(k)] ?? [];
      if (!imgs.length) return "";
      const slides = imgs
        .map((src, i) => `<img src="${src}" alt="${escapeAttr(entry.title)} — ${i + 1} of ${imgs.length}" loading="lazy">`)
        .join("");
      return `<div class="gallery" data-count="${imgs.length}">${slides}</div>`;
    });

    // put the downloaded illustrations back exactly where they appeared
    body_html = body_html.replace(/\s*\[\[NAPKINSIMG(\d+)\]\]\s*/g, (_m, k) => {
      const meta = entry.inlineImages[Number(k)];
      const src = inlinePaths[Number(k)];
      if (!src) return "";
      const dims = meta.width && meta.height ? ` width="${meta.width}" height="${meta.height}"` : "";
      return `<img src="${src}" alt="${escapeAttr(entry.title)}"${dims} loading="lazy">`;
    });
    body_html = sanitizeBody(body_html);

    pieces.push({
      slug: lower,
      title: entry.title,
      author_name: entry.author_name,
      class_year: entry.class_year,
      category: entry.category,
      body: entry.body || null,
      body_html: body_html || null,
      galleries,
      images: [],
      sort_order: order++,
    });
    console.log(
      `  ✓ ${entry.title} — ${entry.author_name} (${entry.class_year}) [${entry.category}] ` +
        `${entry.body ? entry.body.length + " chars" : "no text"}, ` +
        `${inlinePaths.filter(Boolean).length} inline / ${galleries.reduce((n, g) => n + g.length, 0)} imgs in ${galleries.length} galler${galleries.length === 1 ? "y" : "ies"}` +
        (videoPaths.filter(Boolean).length ? `, ${videoPaths.filter(Boolean).length} video` : "") +
        (!keepVideos && entry.inlineVideos.length ? ", video skipped" : "")
    );
    await sleep(250);
  }

  // splice in pieces whose original pages are gone from the old site
  for (const manual of MANUAL_ENTRIES[issueNumber] ?? []) {
    const body_html = sanitizeBody(manual.piece.body_html);
    const at = manual.after_slug
      ? pieces.findIndex((p) => p.slug === manual.after_slug) + 1
      : pieces.length;
    pieces.splice(at, 0, {
      ...manual.piece,
      body: htmlToText(body_html),
      body_html,
      images: manual.piece.images ?? [],
      sort_order: 0,
    });
    console.log(`  + ${manual.piece.title} — ${manual.piece.author_name} (manual entry, position ${at + 1})`);
  }
  pieces.forEach((p, i) => (p.sort_order = i));

  // merge with any existing fixture so page_images / pdf_download survive re-scrapes
  const fixtureFile = `src/lib/fixtures/issue-${issueNumber}.json`;
  const existing = fs.existsSync(fixtureFile) ? JSON.parse(fs.readFileSync(fixtureFile, "utf8")) : {};
  const out = {
    ...existing,
    issue_number: issueNumber,
    credits,
    pieces,
  };
  fs.mkdirSync("src/lib/fixtures", { recursive: true });
  fs.writeFileSync(fixtureFile, JSON.stringify(out, null, 2));
  console.log(`  wrote ${fixtureFile} (${pieces.length} pieces)`);
}

const args = process.argv.slice(2);
if (args[0] === "--all") {
  for (const [slug, meta] of Object.entries(ISSUES)) {
    await scrapeIssue(slug, meta.number);
  }
} else {
  const [tocSlug, issueNumberArg] = args;
  if (!tocSlug || !issueNumberArg) {
    console.error("usage: node scripts/scrape-issue.mjs <toc-slug> <issue-number> | --all");
    process.exit(1);
  }
  await scrapeIssue(tocSlug, Number(issueNumberArg));
}
