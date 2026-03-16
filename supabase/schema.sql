-- ============================================================
-- ZunoBio — Supabase Database Schema
-- Run this in your Supabase SQL editor (supabase.com > SQL Editor)
-- ============================================================


-- ── EXTENSIONS ──
create extension if not exists "uuid-ossp";


-- ── PROFILES ──
-- One profile per user. Username becomes their public URL: zunobio.com/username
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null,
  display_name    text not null default '',
  bio             text not null default '',
  cover_url       text,                          -- Supabase Storage URL
  avatar_url      text,                          -- Supabase Storage URL
  theme_bg        text not null default '#f8f7f5',
  theme_surface   text not null default '#ffffff',
  theme_text      text not null default '#1a1917',
  theme_accent    text not null default '#c4b8a8',
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();


-- ── SOCIAL LINKS ──
create table public.social_links (
  id          uuid default uuid_generate_v4() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  platform    text not null,   -- 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat' | 'email' | 'custom'
  url         text not null,
  follower_count text,         -- e.g. '124K' — display only
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- ── SECTIONS ──
-- Controls which tabs appear and in what order
create table public.sections (
  id          uuid default uuid_generate_v4() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  type        text not null,   -- 'videos' | 'shop' | 'events' | 'press' | 'connect'
  title       text not null,   -- customisable label shown on tab
  is_enabled  boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- ── LINKS ──
-- Every card in every section lives here
create table public.links (
  id          uuid default uuid_generate_v4() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  section_id  uuid references public.sections(id) on delete cascade not null,
  type        text not null,   -- 'video' | 'product' | 'shop_link' | 'event' | 'press' | 'connect_link'
  title       text not null default '',
  subtitle    text,
  url         text,
  image_url   text,            -- Supabase Storage URL
  price       text,            -- for products, e.g. 'R 1,200'
  platform    text,            -- for videos: 'youtube' | 'tiktok'
  event_date  date,            -- for events
  event_tag   text,            -- 'Soon' | 'Free' | 'Invite' | 'Live'
  is_enabled  boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger links_updated_at
  before update on public.links
  for each row execute procedure public.handle_updated_at();


-- ── ANALYTICS ──
-- Tracks profile views and link clicks
create table public.analytics (
  id          uuid default uuid_generate_v4() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  link_id     uuid references public.links(id) on delete set null,  -- null = page view
  event_type  text not null,   -- 'page_view' | 'link_click'
  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);


-- ── ROW LEVEL SECURITY ──
alter table public.profiles    enable row level security;
alter table public.social_links enable row level security;
alter table public.sections    enable row level security;
alter table public.links       enable row level security;
alter table public.analytics   enable row level security;

-- Profiles: public can read published profiles; only owner can write
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_published = true);

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Social links: public read, owner write
create policy "Social links are publicly readable"
  on public.social_links for select using (true);

create policy "Users can manage their own social links"
  on public.social_links for all
  using (auth.uid() = profile_id);

-- Sections: public read, owner write
create policy "Sections are publicly readable"
  on public.sections for select using (true);

create policy "Users can manage their own sections"
  on public.sections for all
  using (auth.uid() = profile_id);

-- Links: public read enabled only, owner can see all
create policy "Enabled links are publicly readable"
  on public.links for select
  using (is_enabled = true);

create policy "Users can manage their own links"
  on public.links for all
  using (auth.uid() = profile_id);

-- Analytics: anyone can insert, only owner can read
create policy "Anyone can record analytics"
  on public.analytics for insert
  with check (true);

create policy "Users can read their own analytics"
  on public.analytics for select
  using (auth.uid() = profile_id);


-- ── STORAGE BUCKETS ──
-- Run these in the Supabase dashboard: Storage > New Bucket
-- Or uncomment if using Supabase CLI:

-- insert into storage.buckets (id, name, public) values ('covers', 'covers', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('link-images', 'link-images', true);


-- ── HELPER FUNCTION ──
-- Auto-create default sections when a new profile is created
create or replace function public.create_default_sections()
returns trigger as $$
begin
  insert into public.sections (profile_id, type, title, sort_order) values
    (new.id, 'videos',  'Videos',  0),
    (new.id, 'shop',    'Shop',    1),
    (new.id, 'events',  'Events',  2),
    (new.id, 'press',   'Press',   3),
    (new.id, 'connect', 'Connect', 4);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_default_sections();
