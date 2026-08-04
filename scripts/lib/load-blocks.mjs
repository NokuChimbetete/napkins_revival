// Lets Node scripts import the real block engine instead of a second copy of it.
//
// The parser, the renderer and the sanitizer live in src/ as TypeScript because
// the app and the admin's live preview import them. A migration script that
// re-implemented any of them would drift from the thing it is supposed to be
// verifying, which defeats the point of verifying.
//
// So: transpile those few files to CommonJS in a temp dir and require them.
// No type checking (that is `npx tsc --noEmit`'s job), no build step to
// remember, and CJS resolution handles the extensionless imports that plain
// `node --experimental-strip-types` cannot.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

const ROOT = path.resolve(import.meta.dirname, "../..");
const require_ = createRequire(path.join(ROOT, "package.json"));
const ts = require_("typescript");

const FILES = [
  "src/lib/blocks/types.ts",
  "src/lib/blocks/inline.ts",
  "src/lib/blocks/parse.ts",
  "src/lib/blocks/render.ts",
  "src/lib/sanitize-html.ts",
  "src/lib/optimize-body-images.ts",
  "src/lib/categories.ts",
];

let cached = null;

export function loadBlocks() {
  if (cached) return cached;

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "napkins-blocks-"));
  for (const rel of FILES) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    const js = ts.transpileModule(fs.readFileSync(src, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: src,
    }).outputText;
    const dest = path.join(out, rel.replace(/^src\//, "").replace(/\.ts$/, ".js"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, js);
  }

  const load = (rel) => require_(path.join(out, rel));
  cached = {
    ...load("lib/blocks/parse.js"),
    ...load("lib/blocks/render.js"),
    ...load("lib/blocks/inline.js"),
    ...load("lib/blocks/types.js"),
    ...load("lib/sanitize-html.js"),
    ...load("lib/optimize-body-images.js"),
    ...(fs.existsSync(path.join(out, "lib/categories.js")) ? load("lib/categories.js") : {}),
  };
  return cached;
}

/** Shared .env.local reader — every script in here needs the same three keys. */
export function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  const fromFile = Object.fromEntries(
    (fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n") : [])
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
  return { ...fromFile, ...process.env };
}

export function supabaseAdmin() {
  const env = loadEnv();
  const { createClient } = require_("@supabase/supabase-js");
  if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.startsWith("PASTE")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export { ROOT };
