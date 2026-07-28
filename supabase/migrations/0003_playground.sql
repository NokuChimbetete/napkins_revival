-- Phase 3/4: make publishing an issue require no code changes and no redeploy.
-- Run after 0002_reader.sql, BEFORE seeding.
--
-- Most of this fixes silent degradation, not errors: seed without it and the
-- archive still loads, just wrong — poems flattened, every napkin identical,
-- every shared link broken. Each block says what breaks without it.

-- ---------------------------------------------------------------------------
-- 1. Columns the reader already reads but no migration ever created.
--    getIssueContent() selects body_html/galleries/verse today; without them
--    every stanza break, alignment and slideshow in the archive is lost.
-- ---------------------------------------------------------------------------
alter table pieces add column body_html text;
alter table pieces add column galleries jsonb not null default '[]';
alter table pieces add column verse boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Napkin pairing must default to NULL, not 1.
--    The playground reads `napkin_variant ?? hash(slug)` — the hash fallback
--    only fires on NULL. With `not null default 1` every napkin would render
--    on paper 1 in font 1. NULL means "derive from the slug"; a value means an
--    editor is deliberately overriding this one piece's look.
-- ---------------------------------------------------------------------------
alter table pieces alter column napkin_variant drop default,
                   alter column napkin_variant drop not null;
alter table pieces alter column font_preset    drop default,
                   alter column font_preset    drop not null;
-- clear any rows already seeded under the old defaults
update pieces set napkin_variant = null where napkin_variant = 1;
update pieces set font_preset    = null where font_preset    = 1;

-- ---------------------------------------------------------------------------
-- 3. Slug: a real stored column, immutable for life.
--    The slug decides a napkin's paper, font, tilt, position, its deep link
--    (/playground?piece=<slug>) and its reader anchor (/issues/3#<slug>).
--    Deriving it from the title would re-skin the table and 404 every shared
--    link the moment anyone fixes a typo — so it is written once and frozen.
-- ---------------------------------------------------------------------------
alter table pieces add column slug text not null unique;

create or replace function pieces_freeze_slug() returns trigger
language plpgsql as $$
begin
  if new.slug is distinct from old.slug then
    raise exception
      'piece slug is immutable: % cannot become %. The slug is baked into shared links and into the napkin''s appearance.',
      old.slug, new.slug;
  end if;
  return new;
end;
$$;

create trigger pieces_slug_immutable
  before update on pieces
  for each row execute function pieces_freeze_slug();

-- ---------------------------------------------------------------------------
-- 4. Front matter as a real flag, not a magic category string.
--    The drawer excluded forewords with `category !== 'Introduction'`, so an
--    editor typing "Foreword" or "Editor's Note" would put it on the table.
-- ---------------------------------------------------------------------------
alter table pieces add column is_frontmatter boolean not null default false;

-- ---------------------------------------------------------------------------
-- 5. sort_order drives print-order seating. A null would scramble the table.
-- ---------------------------------------------------------------------------
update pieces set sort_order = 0 where sort_order is null;
alter table pieces alter column sort_order set not null;

-- ---------------------------------------------------------------------------
-- 6. The column holds full names ("Ari Perez and Júlia Alkmin"), so the old
--    name actively misleads whoever fills in the admin form.
-- ---------------------------------------------------------------------------
alter table pieces rename column author_first_name to author_name;

-- ---------------------------------------------------------------------------
-- 7. Only issue 5 has a PDF. Requiring one blocks creating any normal issue.
-- ---------------------------------------------------------------------------
alter table issues alter column pdf_url drop not null;

-- ---------------------------------------------------------------------------
-- 8. Piece artwork moves out of the repo. While images live in public/issues/
--    (~49 MB committed), publishing an issue means a redeploy — which is the
--    whole thing we're removing.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('piece-images', 'piece-images', true)
on conflict (id) do nothing;

-- the 0001 policies name their buckets explicitly, so restate them with the new one
drop policy if exists "public read files"   on storage.objects;
drop policy if exists "admins upload files" on storage.objects;
drop policy if exists "admins update files" on storage.objects;
drop policy if exists "admins delete files" on storage.objects;

create policy "public read files" on storage.objects
  for select using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs', 'piece-images'));
create policy "admins upload files" on storage.objects
  for insert with check (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs', 'piece-images') and is_admin());
create policy "admins update files" on storage.objects
  for update using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs', 'piece-images') and is_admin());
create policy "admins delete files" on storage.objects
  for delete using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs', 'piece-images') and is_admin());

-- ---------------------------------------------------------------------------
-- 9. Indexes the reader and drawer actually query on.
-- ---------------------------------------------------------------------------
create index if not exists pieces_issue_sort_idx on pieces (issue_id, sort_order);
