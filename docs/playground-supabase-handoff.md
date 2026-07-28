# Making the Napkins Drawer publish-itself (Supabase handoff)

**Goal:** after this work, publishing a new issue must require *zero code changes
and zero redeploys, forever*. An editor with no technical background adds the
issue in the admin dashboard, and the reader (`/issues/[n]`) and the playground
(`/playground`) both pick it up on the next page load.

The playground was built for this. Its layout is already future-proof: napkins
are seated in print order, so a new issue only ever appends rows to the bottom
of the table and every existing napkin keeps its exact position. What is *not*
done is the data path — content still comes from JSON fixtures compiled into
the bundle.

---

## 1. What already works

- `getIssueContent()` and `getIssues()` query Supabase first and fall back to
  fixtures only because the env vars are still placeholders
  (`supabaseConfigured()` checks for `your-project-ref` / `your-` prefixes).
- `/playground` and `/issues/[n]` are dynamic (server-rendered per request), so
  database changes appear without a rebuild.
- RLS is correct: `issues` and `pieces` are public-read, admin-write.
- A napkin's paper, font, tilt, and depth are derived from a hash of the piece's
  slug, so they are stable across visits and identical on server and client.

---

## 2. Schema gaps — the reader already reads columns that do not exist

`0002_reader.sql` never added three columns the code depends on. Seeding without
them silently degrades the archive:

| Column | Why it matters |
| --- | --- |
| `pieces.body_html text` | Carries every stanza break, alignment, gallery and embed. Without it, poems collapse into prose. **This is the single most damaging omission.** |
| `pieces.galleries jsonb not null default '[]'` | Editor-marked slideshows. |
| `pieces.verse boolean not null default false` | Forces no-wrap verse layout for poems filed under a prose category (one ported piece relies on it). |

Add them in a new `0003_playground.sql`, along with the changes in §3–§5.

---

## 3. The trap that makes every napkin identical

```sql
napkin_variant smallint not null default 1,
font_preset    smallint not null default 1
```

The code reads `entry.napkin_variant ?? hash(slug)` — the fallback only fires on
`null`. Because the column is `not null default 1`, every seeded piece arrives as
`1`, so **all 110 napkins would render on paper 1 in font 1**, destroying the
entire point of the drawer.

Fix: make both columns nullable and drop the defaults. Leave them `NULL` unless
an editor is deliberately overriding one piece's look.

```sql
alter table pieces alter column napkin_variant drop not null,
                   alter column napkin_variant drop default;
alter table pieces alter column font_preset    drop not null,
                   alter column font_preset    drop default;
```

Do **not** change `PAPER_COUNT` (7) in `src/lib/napkin-constants.ts` or reorder
`NAPKIN_FONTS` (14) in `src/app/playground/fonts.ts` — both are indexes into a
hash, so any change re-deals every napkin in the archive.

---

## 4. The slug trap — migrating naively breaks every shared link

`pieces` has no `slug` column, so `getIssueContent()` currently computes
`slugify(p.title)`. That yields `the-ascension`, whereas the fixture (and every
URL shared so far) uses `the-ascension-by-zhi-zhi-chia-m25`.

The slug is not cosmetic. It determines the napkin's **paper, font, tilt, depth,
parallax**, its **deep link** (`/playground?piece=<slug>`), and its **anchor in
the reader** (`/issues/3#<slug>`). Changing slugs on migration would silently
re-skin the whole table and 404 every link anyone has shared.

Required:

1. Add `pieces.slug text not null unique`.
2. When seeding, copy the **existing slug from each fixture verbatim** — do not
   regenerate. `src/lib/fixtures/issue-*.json` is the source of truth.
3. Make the slug **immutable after creation**. If an editor fixes a typo in a
   title later, the slug must not change, or that napkin moves and changes
   appearance.
4. New pieces: generate `title-by-author-classyear`, and on collision append a
   numeric suffix. (Today only "Foreword" repeats — seven times, all excluded
   from the drawer — but a second "Untitled" is a matter of time.)

Also map `slug: p.slug` and `verse: p.verse` in the Supabase branch of
`getIssueContent()`; both are currently dropped.

---

## 5. Front matter needs a real flag, not a magic string

The drawer excludes forewords with `category !== "Introduction"`. If an editor
types `introduction`, `Foreword`, or `Editor's Note`, that piece appears on the
table as if it were art.

Add `pieces.is_frontmatter boolean not null default false`, expose it in the
admin as a plain checkbox ("front matter — don't show in the drawer"), and
filter on it instead of the category text.

---

## 6. Images are the one thing that cannot stay in the repo

`body_html` references local paths like `/issues/3/<slug>/inline-1.webp`, and
`public/issues/` is ~49 MB of committed artwork. Committing images means a
redeploy per issue, which defeats the whole goal.

1. Add a public `piece-images` bucket, and include it in the four
   `storage.objects` policies in `0001_init.sql` alongside `covers`,
   `issue-pdfs`, `piece-pdfs`.
2. On upload, the admin must rewrite the `<img src>` values inside `body_html`
   to the returned Storage URLs. Nothing else in the pipeline rewrites them.
3. Issue covers go to the existing `covers` bucket and land in
   `issues.cover_url`.

`next.config.ts` already allows `*.supabase.co` storage URLs for `next/image`.

---

## 7. Remove the hardcoded issue list

`src/lib/playground.ts` iterates `const ISSUE_NUMBERS = [1..8]`. Derive it from
the issues table instead (`getIssues()` already returns them, sorted).

The fixtures (`FIXTURES` map in `issue-content.ts`, `FALLBACK_ISSUES` in
`issues.ts`) can stay as an offline fallback, but must stop being the source of
truth once Supabase is configured.

---

## 8. One consequence of print-order seating to respect

New issues **append** to the bottom of the table, which is exactly why existing
napkins never move. That guarantee holds only for issue numbers **higher than
every existing one**. Back-filling an older issue — inserting a missing issue 0,
say — re-seats everything below it. If that is ever needed, expect the table to
re-deal once, and warn the editor.

---

## 9. What the admin dashboard must handle (so nobody touches code again)

- Create an issue: number, season title ("Spring 2026"), cover upload, date.
- Add pieces: title, author, class year (free text — "Staff" and blank are real
  values in the archive), category, body with formatting preserved into
  `body_html`, images.
- Auto-assign `sort_order`; let editors reorder by dragging.
- Generate the slug once, show it read-only.
- Leave `napkin_variant` / `font_preset` blank by default.
- Upload images to Storage and rewrite `body_html` automatically.
- A "front matter" checkbox per piece.

Make `pieces.sort_order` `not null` — print-order seating sorts on it, and nulls
would scramble the table.

---

## 10. Acceptance tests

1. **Nothing changed for existing work.** With Supabase configured and seeded,
   `/playground` shows the same 110 napkins, each with the same
   `data-variant` / `data-preset` and the same `left`/`top`, as the fixture
   build. Diff the rendered HTML per slug before and after.
2. **Publishing is code-free.** Add a test issue 9 through the admin only. Its
   pieces appear at the bottom of the table; every pre-existing napkin's pixel
   position is unchanged; the field grows by one row per 12 pieces. No file is
   edited and no deploy is run.
3. **Formatting survived.** Open a poem in the drawer modal — line breaks intact,
   no wrapping. Open a piece with a gallery — it scroll-snaps.
4. **Links survived.** `/playground?piece=the-ascension-by-zhi-zhi-chia-m25`
   opens the modal, and `/issues/1#the-ascension-by-zhi-zhi-chia-m25` jumps to
   the piece.
5. **Images load from Storage,** not from `public/issues/`.
