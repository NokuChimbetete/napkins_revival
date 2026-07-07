-- Napkins initial schema. Run in the Supabase SQL editor (or `supabase db push`).

create table issues (
  id            uuid primary key default gen_random_uuid(),
  issue_number  int unique not null,
  title         text not null,
  cover_url     text not null,
  pdf_url       text not null,
  published_at  date
);

create table pieces (
  id                uuid primary key default gen_random_uuid(),
  issue_id          uuid references issues(id) on delete set null,
  title             text not null,
  author_first_name text not null,
  class_year        text not null,
  pdf_url           text not null,
  napkin_variant    smallint not null default 1,
  font_preset       smallint not null default 1
);

create table admin_whitelist (
  email text primary key,
  name  text
);

insert into admin_whitelist (email) values
  ('nokchi1@uni.minerva.edu');
-- add the remaining admin emails to the insert above

-- security definer so the whitelist lookup bypasses RLS; without it,
-- admin_whitelist's own policy would call is_admin() recursively
create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_whitelist
    where email = (auth.jwt() ->> 'email')
  )
$$;

alter table issues enable row level security;
alter table pieces enable row level security;
alter table admin_whitelist enable row level security;

create policy "public read" on issues
  for select using (true);
create policy "admins write" on issues
  for all using (is_admin()) with check (is_admin());

create policy "public read" on pieces
  for select using (true);
create policy "admins write" on pieces
  for all using (is_admin()) with check (is_admin());

create policy "admins read" on admin_whitelist
  for select using (is_admin());

insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('issue-pdfs', 'issue-pdfs', true),
  ('piece-pdfs', 'piece-pdfs', true)
on conflict (id) do nothing;

create policy "public read files" on storage.objects
  for select using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs'));
create policy "admins upload files" on storage.objects
  for insert with check (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs') and is_admin());
create policy "admins update files" on storage.objects
  for update using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs') and is_admin());
create policy "admins delete files" on storage.objects
  for delete using (bucket_id in ('covers', 'issue-pdfs', 'piece-pdfs') and is_admin());
