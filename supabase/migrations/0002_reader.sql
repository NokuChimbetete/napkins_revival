-- Phase 2: magazine reader — web entries + pre-rendered PDF pages.
-- Run after 0001_init.sql.

alter table pieces add column body text;
alter table pieces add column images jsonb not null default '[]';
alter table pieces add column category text;
alter table pieces add column sort_order int;
-- entries ported from the old site have no per-piece PDF
alter table pieces alter column pdf_url drop not null;

alter table issues add column foreword text;
alter table issues add column credits text;
alter table issues add column page_images jsonb not null default '[]';
