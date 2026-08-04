// Proves the admin is protected by the database, not by the UI.
//
//   node scripts/verify-rls.mjs
//
// Hiding buttons is not access control. This mints two *real* Supabase
// sessions — one for a whitelisted editor, one for a stranger — and puts each
// through the same writes the admin performs, using the anon key exactly as the
// browser does. The stranger's session must be refused by Postgres every time.
//
// The stranger account is created and deleted by this script; nothing is left
// behind.

import { createRequire } from "node:module";
import { loadEnv, ROOT } from "./lib/load-blocks.mjs";
import path from "node:path";

const require_ = createRequire(path.join(ROOT, "package.json"));
const { createClient } = require_("@supabase/supabase-js");

const env = loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const anonClient = () => createClient(URL_, ANON, { auth: { persistSession: false } });

const STRANGER = `napkins-rls-probe-${Date.now().toString(36)}@example.com`;

let failures = 0;
const pass = (what) => console.log(`  ✓ ${what}`);
const fail = (what, detail) => {
  failures++;
  console.log(`  ✗ ${what}${detail ? ` — ${detail}` : ""}`);
};

/** A write that MUST be refused. PostgREST reports an RLS refusal either as an
 *  explicit 42501 or as "0 rows affected", so both count as denied. */
async function mustDeny(label, run) {
  const { data, error } = await run();
  if (error) return pass(`${label} — denied (${error.code || error.message.slice(0, 42)})`);
  if (Array.isArray(data) && data.length === 0) return pass(`${label} — denied (no rows affected)`);
  fail(label, "the write SUCCEEDED");
}

async function mustAllow(label, run) {
  const { error } = await run();
  if (error) fail(label, error.message.slice(0, 90));
  else pass(label);
}

// --- fixtures -------------------------------------------------------------

const { data: whitelist } = await admin.from("admin_whitelist").select("email");
const editorEmail = whitelist?.[0]?.email;
if (!editorEmail) {
  console.error("admin_whitelist is empty — nothing to test against.");
  process.exit(1);
}

const { data: samplePiece } = await admin.from("pieces").select("id, slug, title").limit(1).single();
const { data: sampleIssue } = await admin.from("issues").select("id, issue_number").limit(1).single();

console.log(`\nproject: ${URL_}`);
console.log(`editor:  ${editorEmail}`);
console.log(`stranger: ${STRANGER}\n`);

// --- 1. a signed-out visitor ----------------------------------------------

console.log("signed out (anon key, no session)");
{
  const db = anonClient();
  const { data: isAdmin } = await db.rpc("is_admin");
  isAdmin === true ? fail("is_admin() says false", "returned true") : pass("is_admin() is false");

  await mustDeny("insert an issue", () =>
    db.from("issues").insert({ issue_number: 9999, title: "probe", cover_url: "" }).select()
  );
  await mustDeny("update a piece", () =>
    db.from("pieces").update({ title: "probe" }).eq("id", samplePiece.id).select()
  );
  await mustDeny("delete a piece", () =>
    db.from("pieces").delete().eq("id", samplePiece.id).select()
  );

  const { data: readable } = await db.from("issues").select("issue_number");
  readable?.length
    ? pass(`can still read ${readable.length} published issues`)
    : fail("public read is broken", "read nothing");
}

// --- 2. a real session for someone not on the whitelist -------------------

console.log("\nsigned in, NOT on the whitelist");
{
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: STRANGER,
    password: `probe-${Math.random().toString(36).slice(2)}-Aa1!`,
    email_confirm: true,
  });
  if (createError) {
    console.error(`  could not create the probe account: ${createError.message}`);
    process.exit(1);
  }

  const db = anonClient();
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: STRANGER,
  });
  const { data: session, error: otpError } = await db.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });

  if (otpError || !session?.session) {
    fail("could not establish the probe session", otpError?.message);
  } else {
    pass(`real session established (${session.user.email})`);

    const { data: isAdmin } = await db.rpc("is_admin");
    isAdmin === true
      ? fail("is_admin() must be false for a non-whitelisted session", "returned true")
      : pass("is_admin() is false");

    const { data: allowed } = await db.rpc("is_email_whitelisted", { addr: STRANGER });
    allowed === true
      ? fail("is_email_whitelisted() must be false", "returned true")
      : pass("is_email_whitelisted() is false — no magic link would be sent");

    await mustDeny("insert an issue", () =>
      db.from("issues").insert({ issue_number: 9998, title: "probe", cover_url: "" }).select()
    );
    await mustDeny("update an issue", () =>
      db.from("issues").update({ title: "probe" }).eq("id", sampleIssue.id).select()
    );
    await mustDeny("delete an issue", () =>
      db.from("issues").delete().eq("id", sampleIssue.id).select()
    );
    await mustDeny("insert a piece", () =>
      db
        .from("pieces")
        .insert({ slug: `probe-${Date.now()}`, title: "probe", author_name: "", class_year: "", sort_order: 0 })
        .select()
    );
    await mustDeny("update a piece body", () =>
      db.from("pieces").update({ body_html: "<script>x</script>" }).eq("id", samplePiece.id).select()
    );
    await mustDeny("delete a piece", () =>
      db.from("pieces").delete().eq("id", samplePiece.id).select()
    );
    await mustDeny("add a category", () =>
      db.from("categories").insert({ name: `probe-${Date.now()}` }).select()
    );
    await mustDeny("read the whitelist", async () => {
      const r = await db.from("admin_whitelist").select("email");
      return { data: r.data ?? [], error: r.error };
    });

    // storage
    const upload = await db.storage
      .from("piece-images")
      .upload(`probe/${Date.now()}.txt`, new Blob(["probe"]), { contentType: "text/plain" });
    upload.error ? pass("upload to piece-images — denied") : fail("upload to piece-images", "SUCCEEDED");

    const coverUpload = await db.storage
      .from("covers")
      .upload(`probe-${Date.now()}.txt`, new Blob(["probe"]), { contentType: "text/plain" });
    coverUpload.error ? pass("upload to covers — denied") : fail("upload to covers", "SUCCEEDED");

    await db.auth.signOut();
  }

  await admin.auth.admin.deleteUser(created.user.id);
  console.log("  · probe account deleted");
}

// --- 3. a real session for a whitelisted editor ---------------------------

console.log("\nsigned in as a whitelisted editor");
{
  const db = anonClient();
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: editorEmail,
  });
  const { error: otpError } = await db.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });

  if (otpError) {
    fail("could not establish the editor session", otpError.message);
  } else {
    const { data: isAdmin } = await db.rpc("is_admin");
    isAdmin === true ? pass("is_admin() is true") : fail("is_admin() must be true", "returned false");

    const probeNumber = 9990 + Math.floor(Math.random() * 8);
    await mustAllow("insert a draft issue", () =>
      db.from("issues").insert({
        issue_number: probeNumber,
        title: "RLS probe",
        cover_url: "",
        status: "draft",
      })
    );

    // the draft must be invisible to everyone else
    const stranger = anonClient();
    const { data: seen } = await stranger.from("issues").select("issue_number").eq("issue_number", probeNumber);
    seen?.length
      ? fail("a draft issue is visible to signed-out visitors", `saw ${seen.length}`)
      : pass("the draft issue is invisible to signed-out visitors");

    await mustAllow("delete the probe issue", () =>
      db.from("issues").delete().eq("issue_number", probeNumber)
    );
    await db.auth.signOut();
  }
}

console.log(
  failures
    ? `\n${failures} check(s) FAILED — the admin is not safe to use.\n`
    : "\n✓ every write is refused for anyone not on admin_whitelist, and drafts are invisible to the public.\n"
);
process.exit(failures ? 1 : 0);
