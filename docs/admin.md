# The Napkins admin

Publishing an issue takes no code change and no redeploy. An editor signs in at
`/admin`, builds the issue, presses Publish, and it is on the shelf and on the
drawer. This document is for whoever inherits it.

---

## The one decision everything else follows from

**`pieces.doc` (JSONB) is the content. `pieces.body_html` is a cache.**

It used to be the other way round. Inverting it buys three things:

- the reader can be restyled years from now by editing one file
  (`src/lib/blocks/render.ts`) instead of find-and-replacing 119 hand-written
  HTML strings;
- an editor cannot produce malformed HTML, because they never touch HTML;
- a bad render is always recoverable — `body_html` is regenerated from `doc` on
  every save, and `doc` can itself be rebuilt from `body_html` by the parser.

Three files, in dependency order:

| File | Does |
| --- | --- |
| `src/lib/blocks/types.ts` | The block document shape |
| `src/lib/blocks/render.ts` | `Doc → body_html`. The only thing that decides what a piece's markup looks like |
| `src/lib/blocks/parse.ts` | `body_html → Doc`. Migration, and repair if a `doc` is ever lost |
| `src/lib/blocks/inline.ts` | Text ↔ inline HTML. The two functions that decide whether a poem survives |
| `src/lib/sanitize-html.ts` | Allowlist, applied on every read in `rowToEntry()` |

### Prove it still works

```bash
node scripts/verify-blocks.mjs
```

Asserts, against every piece in the live database:

1. `render(parse(x)) === x`, byte for byte
2. canonicalising twice changes nothing
3. the sanitizer leaves all of it untouched — and refuses 15 things it should

Run it after touching anything under `src/lib/blocks/`. It exits non-zero on
failure and is what `scripts/migrate-blocks.mjs` refuses to run without.

---

## Why the editor is a textarea

Because 46 of 119 pieces are poetry and the archive holds 4,612 `<br>` tags.

A poet's line breaks are the form of the poem. Every rich-text editor worth the
name normalises whitespace as part of its schema; a textarea cannot, because a
newline in a textarea is just a newline. The preview beside it is the real
`EntrySection` component, re-rendered on every keystroke, so nothing is lost by
not typing into a WYSIWYG surface.

Emphasis is stored as literal `<em>` / `<strong>` / `<a>` tags, **not** markdown.
The archive contains 39 asterisks and 39 square brackets in ordinary prose —
`***` as a scene divider, `[Baobab Boy]` as a figure label, `wh*re` — and any
`**bold**` convention would either corrupt them or need escaping that editors
can see. The toolbar inserts the tags so nobody types one.

Two whitespace rules exist in `keepAuthoredSpaces()` because HTML collapses
runs of spaces and poets indent. They are applied to the *whole* text before it
is split into inline segments — applying them per-segment silently added a hard
space after every `<em>` and changed 46 archive pieces.

---

## Signing in

**Google, and only Google.** "Continue with Google" — use the account that
matches your Minerva email. `prompt=select_account` is set deliberately, so
Google always asks which account rather than silently reusing whatever the
browser is signed into, which on a personal laptop is usually the wrong one.

There is no password and no second door. If Google ever stops working for this
project the fix is in the Supabase dashboard, below — most often an OAuth client
secret that has expired. The sign-in page says so by name rather than just
failing, because the person reading it will be an editor with a deadline, not
whoever built this.

### Turning Google on (one-time, and it can lapse)

1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID**
   (Web application).
2. Authorised redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → **Google** → paste the client ID and
   secret, enable.
4. Supabase → Authentication → URL Configuration → Redirect URLs must include
   the site origin (`http://localhost:3000/**` for local work).

If the provider is off, the button says so and names the fix rather than dumping
the editor on a raw JSON error on supabase.co. `signInWithOAuth()` never
contacts Supabase — it only builds a URL — so `googleIsEnabled()` in
`actions.ts` asks `/auth/v1/settings` first. `node scripts/check-supabase.mjs`
reports the same thing from the terminal.

## What is enforced where

Hiding a button is not access control. There are two independent gates, and the
second one is the real boundary:

1. **The moment a session exists** — `/auth/callback` checks `is_admin()`
   against the whitelist *as it stands now*, and signs out anything that fails.
   This is what catches a non-editor Google account. The whitelist cannot be
   checked any earlier than this, because Google is the one who knows which
   address is coming. Access fails closed; the only trace a stranger leaves is a
   Supabase auth row with no permissions attached to it.
2. **Postgres** — RLS on `issues`, `pieces`, `categories` and `storage.objects`,
   all keyed on the same `is_admin()` the callback calls.

`is_email_whitelisted(text)` from `0004_admin.sql` is no longer called by the
app — it existed to vet an address before mailing a sign-in link. It is left in
place because dropping a security-definer function needs its own migration and
it is harmless where it stands.

`src/proxy.ts` (Next 16 renamed `middleware` → `proxy`) refreshes the session
and bounces signed-out visitors, but is explicitly **not** trusted: proxy
bypasses are a real CVE class, and a Server Action can be invoked without any
page rendering. Every admin page calls `requireAdmin()`; every action calls
`assertAdmin()`.

```bash
node scripts/verify-rls.mjs
```

Mints two real sessions — a whitelisted editor and a stranger — and puts each
through every write the admin performs, using the anon key exactly as the
browser does. The stranger must be refused every time. Creates and deletes its
own probe account.

---

## Things that will bite you

**Slugs are immutable, and it matters more than it looks.** A slug decides a
piece's permalink, its napkin's deep link, *and* its napkin's paper, font, tilt,
size and position — all hashed from the slug in `src/lib/drawer.ts`. The
`pieces_freeze_slug()` trigger rejects any change. The admin never sends the
slug on update, so renaming a piece is safe and the trigger never fires; the
error message in `explain()` is a safety net, not a normal path.

**Do not change `PAPER_COUNT` (7) or reorder `NAPKIN_FONTS` (14).** Both are
hash moduli. Either change re-deals every napkin in the archive.

```bash
node scripts/napkin-snapshot.mjs capture before.json
# …do the thing…
node scripts/napkin-snapshot.mjs diff before.json
```

Run this around anything that touches `pieces`. It reads the rendered
`/drawer` and compares paper, font, tilt, depth and position per slug.

**Drafts are hidden in two places on purpose.** RLS policies *and* `.eq("status",
"published")` in `getIssues()`, `getIssueContent()` and `getDrawerNapkins()`.
Belt and braces: app-level filtering alone is one forgotten `.eq()` away from
publishing someone's unfinished issue.

**Deleting an issue deletes its pieces first, explicitly.** `pieces.issue_id` is
`ON DELETE SET NULL`, so dropping the issue row alone would orphan them — they'd
vanish from the site while still holding their slugs forever, blocking anyone
re-creating that issue.

**Next 16 rejects any `next/image` `q` not in `images.qualities`** (default
`[75]`) with an HTTP 400. `src/lib/optimize-body-images.ts` uses 75.

**Phantom 404s in dev mean a stale Turbopack cache**, not a data bug. Delete
`.next/cache`.

---

## Getting to the admin

`/admin` is deliberately unlinked from the site. A visible "Admin" link on a
student zine is an invitation to rattle the handle, and the four editors already
know where they are going.

**Click the yellow smiley on the landing page nine times.** The count forgets
itself after two seconds of stillness, and the doodle tilts a little further on
each of the last three so you can tell it is working. `src/components/landing/SecretDoor.tsx`.

The smiley sits at `z-index: 3` and it has to. `.titleWrap` is a full-width flex
container that invisibly overlaps 119 of the doodle's 167 pixels; at equal
z-index it came later in the DOM and swallowed every click except a sliver down
the right-hand edge. That never showed while the smiley was a plain `<img>`,
because an `<img>` has nothing to click.

This is not a security measure and does not pretend to be one — everything
behind it is gated on the magic link and on RLS. It exists so an editor on a
borrowed laptop can reach the admin without remembering a URL.

---

## Sizing and aligning an image

Two properties, and they mean different things:

- `width` / `height` describe the **file**. They are written once on upload and
  let the browser reserve the right box before the image arrives, so the text
  below doesn't jump.
- `scale` is the **editorial** decision: how wide it should look, as a
  percentage of the reading column. It renders as `style="width:N%"`.

That style attribute is the only one allowed anywhere in body HTML.
`sanitize-html.ts` rebuilds it from a strict `width:N%` match rather than
passing it through, and `verify-blocks.mjs` has attack cases proving nothing
else rides in on it.

Alignment only becomes visible once an image is scaled down — a full-width image
has no side to take. `.align-left img[style]` and `.align-right img[style]`
carry extra specificity on purpose: it is what lets an image set to Left win
against the `.align-center` of the "image + caption" figure it sits inside, and
because the archive contains no styled images, it also guarantees nothing
already published can move.

`.align-right` images that are *not* scaled have always been centred, and two
archive pieces depend on that. It is left alone.

---

## Captions and reading size

A text block carries two optional properties, both rendered as a `<span>`
around the whole run rather than as a class on a wrapper div — a text block
often has no wrapper, and inventing one would change the block-level layout of
everything already published.

- `caption: true` → `.caption`, **16px and italic** (two points down from the
  18px body). It is what the "Image + caption" block sets on its text half, and
  the **Caption** button in the builder toggles it on any text block.
- `size: "sm" | "lg" | "xl"` → `.size-sm` / `.size-lg` / `.size-xl` (16 / 21 /
  25px). Absent is the reader's 18px. Named `size-*` and **not** `text-*`
  because Tailwind 4 is loaded in this app and owns `text-sm` and `text-lg`.

An explicit size beats the caption default — it comes second in the class
attribute and second in the stylesheet — so a long caption can be dropped
further without losing the italic.

`<span>` exists in the sanitizer's allowlist *only* to carry these two, matched
whole against `SPAN_CLASS`. `verify-blocks.mjs` has cases proving nothing else
rides in on it.

### The retroactive migration

`scripts/migrate-captions.mjs` marked the captions that already existed. The
rule is deliberately narrow: **a text block inside a `group` whose previous
sibling is an image, and which has visible text.** That is exactly the shape
the "Image + caption" button produces. It found 9, in 3 pieces.

The same "text after an image" shape appears in two other places and was left
alone on purpose:

- **inside a row column** (16 cases) — mixed. Some really are captions, but
  `tuchan-by-yufei-xiao-m23` has 950-character paragraphs of body prose there.
- **at the top level** (19 cases) — body prose, up to 4,150 characters.

Guessing on those would have silently shrunk somebody's essay. Editors can mark
any of them by hand with the Caption button.

Empty caption slots were skipped too: fifteen figures have never had a caption
written, and marking one would wrap a lone `<br>` in a span — changing the
stored HTML of six published pieces so a reader sees precisely nothing.

## Adding an editor

Insert their email into `admin_whitelist` in the Supabase SQL editor:

```sql
insert into admin_whitelist (email) values ('newperson@uni.minerva.edu');
```

That is the whole process. `is_admin()` is case-insensitive, and the sign-in
page tells anyone who isn't on the list exactly what to ask for.

Supabase also needs the site's origin under **Authentication → URL
Configuration → Redirect URLs** (`http://localhost:3000/**` for local work).
Without it the magic link lands nowhere.

---

## Scripts

| Command | Does |
| --- | --- |
| `node scripts/check-supabase.mjs` | What actually exists in the database. Trust this over the dashboard |
| `node scripts/verify-blocks.mjs` | Block format is lossless; sanitizer holds |
| `node scripts/verify-rls.mjs` | Non-editors are refused by Postgres |
| `node scripts/migrate-blocks.mjs --dry` | What a re-migration would rewrite |
| `node scripts/migrate-captions.mjs --dry` | Which figure captions would get caption styling |
| `node scripts/napkin-snapshot.mjs capture\|diff <file>` | No napkin moved |
