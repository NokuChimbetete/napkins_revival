-- Phase 4: the admin. Everything here exists so four non-technical editors can
-- publish an issue with no code change and no redeploy, permanently.
--
-- Run after 0003_playground.sql. Safe to run against the seeded archive:
-- every new column has a default that leaves the existing 8 issues / 117 pieces
-- behaving exactly as they do today.

-- ---------------------------------------------------------------------------
-- 1. The block document becomes the source of truth.
--
--    body_html stays, but demoted to a derived cache: the admin regenerates it
--    from `doc` on every save. That inversion is the point of this migration.
--    Storing HTML as canonical means a restyle years from now is a find-and-
--    replace across 117 hand-edited strings, and a malformed tag from a paste
--    is permanent. A block document can be re-rendered, re-styled and repaired
--    without anyone touching content.
--
--    NULL doc = a row that predates the migration script. Nothing breaks: the
--    reader still reads body_html.
-- ---------------------------------------------------------------------------
alter table pieces add column doc jsonb;

-- ---------------------------------------------------------------------------
-- 2. Drafts.
--
--    An editor must be able to build an issue over several evenings without any
--    of it reaching the bookshelf or the drawer. App-level filtering alone is
--    one forgotten .eq() away from publishing someone's unfinished work, so the
--    rule is enforced here as well as in the query layer.
--
--    Default 'published' so the existing archive is unaffected.
-- ---------------------------------------------------------------------------
alter table issues add column status text not null default 'published'
  check (status in ('draft', 'published'));
alter table pieces add column status text not null default 'published'
  check (status in ('draft', 'published'));

create index if not exists issues_status_idx on issues (status);

-- ---------------------------------------------------------------------------
-- 3. is_admin(), case-insensitively.
--
--    The original compares the JWT email to the whitelist verbatim. Supabase
--    normalises addresses to lowercase today, but an editor added to the
--    whitelist as "Divya.Tarak@uni.minerva.edu" would silently get a session
--    that can read everything and write nothing — the most confusing possible
--    failure. Replaced in place, so the policies that call it keep working.
-- ---------------------------------------------------------------------------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_whitelist
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
$$;

-- ---------------------------------------------------------------------------
-- 4. The gate that fails closed before an email is ever sent.
--
--    admin_whitelist is admin-read-only, which is correct but means a signed-out
--    visitor cannot be checked against it. Without this, the only options are
--    mailing a working magic link to anybody who asks, or putting the service
--    role key on the sign-in path. This is a single boolean, nothing else is
--    exposed, and it is the reason a non-editor never receives a link at all.
-- ---------------------------------------------------------------------------
create or replace function is_email_whitelisted(addr text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_whitelist where lower(email) = lower(trim(addr))
  )
$$;

revoke all on function is_email_whitelisted(text) from public;
grant execute on function is_email_whitelisted(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Draft rows are invisible to the public, at the database.
--
--    issue_is_published() is security definer on purpose: a bare subquery
--    against `issues` inside a policy on `pieces` is itself subject to RLS on
--    issues, which is how policy recursion starts.
-- ---------------------------------------------------------------------------
create or replace function issue_is_published(iid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'published' from issues where id = iid), false)
$$;

drop policy if exists "public read" on issues;
create policy "public read" on issues
  for select using (status = 'published' or is_admin());

drop policy if exists "public read" on pieces;
create policy "public read" on pieces
  for select using (
    is_admin() or (status = 'published' and issue_is_published(issue_id))
  );

-- ---------------------------------------------------------------------------
-- 6. A controlled vocabulary for categories, with a deliberate escape hatch.
--
--    22 distinct values exist across 117 pieces, including three spellings of
--    Nonfiction and two of Short Fiction. Free text guarantees a worse mess in
--    two years; a hard-coded enum guarantees an editor eventually cannot file
--    the piece in front of them. A table splits the difference: the admin lists
--    these in a dropdown, and "add new" writes a row here rather than a
--    one-off string on a piece.
-- ---------------------------------------------------------------------------
create table categories (
  name       text primary key,
  sort_order int  not null default 100
);

alter table categories enable row level security;
create policy "public read"  on categories for select using (true);
create policy "admins write" on categories for all using (is_admin()) with check (is_admin());

insert into categories (name, sort_order) values
  ('Poetry',         10),
  ('Fiction',        20),
  ('Short Fiction',  30),
  ('Nonfiction',     40),
  ('Photography',    50),
  ('Art',            60),
  ('Illustration',   70),
  ('Collage',        80),
  ('Sequential Art', 90),
  ('Video',         100),
  ('Animation',     110),
  ('Audio',         120),
  ('Introduction',  130)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Fold the existing 22 values onto that vocabulary.
--
--    Checked against src/components/reader/EntrySection.tsx first: verse layout
--    keys off /poetry|poem|verse|song/i on the category. "Poetry/Song" folds to
--    "Poetry", which still matches, and nothing else that currently matches
--    changes — so no poem loses its no-wrap treatment.
--
--    "Introduction" is kept rather than renamed to "Foreword": it is displayed
--    as the eyebrow above those 7 pieces, and is_frontmatter (not the category)
--    is what actually keeps them off the drawer.
-- ---------------------------------------------------------------------------
update pieces set category = 'Nonfiction'
  where category in ('Non-Fiction', 'Non-fiction', 'Poetic Prose / Nonfiction');
update pieces set category = 'Short Fiction'
  where category in ('Short fiction');
update pieces set category = 'Fiction'
  where category in ('Historical Fiction', 'Fiction / Audio Recording');
update pieces set category = 'Poetry'
  where category in ('Poetry/Song');
update pieces set category = 'Photography'
  where category in ('Photography/Collage');
update pieces set category = 'Collage'
  where category in ('Visual Collage', 'Photo Collage', 'Collage photography');

-- Anything the archive used that is not yet in the vocabulary joins it, so no
-- existing piece is ever left holding a category the dropdown cannot show.
insert into categories (name, sort_order)
  select distinct category, 500 from pieces
  where category is not null and category <> ''
on conflict (name) do nothing;
