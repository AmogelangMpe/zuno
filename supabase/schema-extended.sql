-- ============================================================
-- Zuno — Extended Schema (add to existing schema.sql)
-- Run this AFTER the base schema.sql in Supabase SQL Editor
-- ============================================================


-- ── CONTENT FEEDS ──
-- Stores auto-fetched YouTube + TikTok videos per profile
create table public.feed_items (
  id           uuid default uuid_generate_v4() primary key,
  profile_id   uuid references public.profiles(id) on delete cascade not null,
  platform     text not null,          -- 'youtube' | 'tiktok'
  external_id  text not null,          -- platform's video ID
  title        text not null default '',
  thumbnail    text,                   -- thumbnail URL
  video_url    text,                   -- link to the video
  view_count   bigint default 0,
  published_at timestamptz,
  fetched_at   timestamptz not null default now(),
  unique(profile_id, platform, external_id)
);

-- Store API credentials per user (encrypted at app level)
create table public.feed_credentials (
  id            uuid default uuid_generate_v4() primary key,
  profile_id    uuid references public.profiles(id) on delete cascade not null unique,
  youtube_channel_id  text,
  tiktok_username     text,
  updated_at    timestamptz not null default now()
);


-- ── DIGITAL PRODUCTS ──
create table public.products (
  id            uuid default uuid_generate_v4() primary key,
  profile_id    uuid references public.profiles(id) on delete cascade not null,
  title         text not null,
  description   text not null default '',
  price         integer not null,     -- in cents e.g. 50000 = R500
  currency      text not null default 'ZAR',
  file_path     text,                 -- Supabase Storage path (private bucket)
  cover_url     text,                 -- product cover image
  is_published  boolean not null default false,
  stripe_price_id     text,           -- Stripe Price ID
  stripe_product_id   text,           -- Stripe Product ID
  sales_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- Orders — created after successful Stripe payment
create table public.orders (
  id                  uuid default uuid_generate_v4() primary key,
  product_id          uuid references public.products(id) on delete set null,
  profile_id          uuid references public.profiles(id) on delete set null,
  buyer_email         text not null,
  amount_paid         integer not null,   -- in cents
  currency            text not null default 'ZAR',
  stripe_session_id   text unique,
  stripe_payment_intent text,
  download_token      uuid default uuid_generate_v4() unique,
  download_count      integer not null default 0,
  status              text not null default 'pending',  -- 'pending' | 'paid' | 'refunded'
  created_at          timestamptz not null default now()
);

-- Stripe Connect — one row per creator who sets up payouts
create table public.stripe_accounts (
  profile_id          uuid references public.profiles(id) on delete cascade primary key,
  stripe_account_id   text unique not null,  -- acct_xxx
  is_onboarded        boolean not null default false,
  created_at          timestamptz not null default now()
);


-- ── EMAIL CAPTURE ──
create table public.email_subscribers (
  id           uuid default uuid_generate_v4() primary key,
  profile_id   uuid references public.profiles(id) on delete cascade not null,
  email        text not null,
  name         text,
  source       text default 'profile_page',  -- where they signed up
  tags         text[] default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique(profile_id, email)
);


-- ── AFFILIATE LINKS ──
create table public.affiliate_links (
  id           uuid default uuid_generate_v4() primary key,
  profile_id   uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  destination  text not null,          -- the real URL
  slug         text not null unique,   -- e.g. 'nike-shoes' → zuno.app/go/nike-shoes
  commission   text,                   -- display only e.g. '8%'
  network      text,                   -- 'amazon' | 'ltk' | 'custom' etc
  thumbnail    text,
  total_clicks integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.affiliate_clicks (
  id           uuid default uuid_generate_v4() primary key,
  link_id      uuid references public.affiliate_links(id) on delete cascade not null,
  profile_id   uuid references public.profiles(id) on delete cascade not null,
  referrer     text,
  user_agent   text,
  ip_hash      text,                   -- hashed for privacy
  created_at   timestamptz not null default now()
);


-- ── BRAND DEAL MARKETPLACE ──

-- Brand accounts (separate from creator profiles)
create table public.brand_profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  company_name text not null,
  website      text,
  industry     text,
  logo_url     text,
  bio          text,
  is_verified  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Deals posted by brands
create table public.deals (
  id              uuid default uuid_generate_v4() primary key,
  brand_id        uuid references public.brand_profiles(id) on delete cascade not null,
  title           text not null,
  description     text not null default '',
  deliverables    text not null default '',  -- what the creator must do
  budget_min      integer,                   -- in cents
  budget_max      integer,
  currency        text not null default 'ZAR',
  niche           text[],                    -- ['fashion','beauty','lifestyle']
  min_followers   integer,
  platforms       text[],                    -- ['instagram','tiktok','youtube']
  deadline        date,
  is_open         boolean not null default true,
  applications_count integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger deals_updated_at
  before update on public.deals
  for each row execute procedure public.handle_updated_at();

-- Creator applications to deals
create table public.deal_applications (
  id           uuid default uuid_generate_v4() primary key,
  deal_id      uuid references public.deals(id) on delete cascade not null,
  profile_id   uuid references public.profiles(id) on delete cascade not null,
  pitch        text not null,           -- creator's message to brand
  rate         integer,                 -- what they're asking in cents
  status       text not null default 'pending',  -- 'pending'|'shortlisted'|'accepted'|'rejected'
  created_at   timestamptz not null default now(),
  unique(deal_id, profile_id)
);

-- Messages between brand and creator (after application)
create table public.messages (
  id              uuid default uuid_generate_v4() primary key,
  application_id  uuid references public.deal_applications(id) on delete cascade not null,
  sender_id       uuid not null,        -- auth.users id
  sender_type     text not null,        -- 'creator' | 'brand'
  body            text not null,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);


-- ── RLS POLICIES FOR NEW TABLES ──

alter table public.feed_items          enable row level security;
alter table public.feed_credentials    enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.stripe_accounts     enable row level security;
alter table public.email_subscribers   enable row level security;
alter table public.affiliate_links     enable row level security;
alter table public.affiliate_clicks    enable row level security;
alter table public.brand_profiles      enable row level security;
alter table public.deals               enable row level security;
alter table public.deal_applications   enable row level security;
alter table public.messages            enable row level security;

-- Feed items: public read, owner write
create policy "Feed items are public" on public.feed_items for select using (true);
create policy "Owners manage feed items" on public.feed_items for all using (auth.uid() = profile_id);

-- Feed credentials: private
create policy "Owners manage feed creds" on public.feed_credentials for all using (auth.uid() = profile_id);

-- Products: published ones are public
create policy "Published products are public" on public.products for select using (is_published = true);
create policy "Owners manage products" on public.products for all using (auth.uid() = profile_id);

-- Orders: buyer sees by email match, owner sees their sales
create policy "Creators see their orders" on public.orders for select using (auth.uid() = profile_id);
create policy "Anyone can create order" on public.orders for insert with check (true);

-- Stripe accounts: private
create policy "Owners manage stripe account" on public.stripe_accounts for all using (auth.uid() = profile_id);

-- Email subscribers: owner only
create policy "Owners see subscribers" on public.email_subscribers for select using (auth.uid() = profile_id);
create policy "Anyone can subscribe" on public.email_subscribers for insert with check (true);
create policy "Owners manage subscribers" on public.email_subscribers for delete using (auth.uid() = profile_id);

-- Affiliate links: public read active, owner write
create policy "Active affiliate links are public" on public.affiliate_links for select using (is_active = true);
create policy "Owners manage affiliate links" on public.affiliate_links for all using (auth.uid() = profile_id);
create policy "Anyone can record click" on public.affiliate_clicks for insert with check (true);
create policy "Owners see their clicks" on public.affiliate_clicks for select using (auth.uid() = profile_id);

-- Brand profiles: public read
create policy "Brand profiles are public" on public.brand_profiles for select using (true);
create policy "Brands manage own profile" on public.brand_profiles for all using (auth.uid() = id);

-- Deals: public read open deals
create policy "Open deals are public" on public.deals for select using (is_open = true);
create policy "Brands manage own deals" on public.deals for all using (auth.uid() = brand_id);

-- Applications: creator sees own, brand sees applications to their deals
create policy "Creators see own applications" on public.deal_applications for select using (auth.uid() = profile_id);
create policy "Creators apply to deals" on public.deal_applications for insert with check (auth.uid() = profile_id);
create policy "Creators update own applications" on public.deal_applications for update using (auth.uid() = profile_id);

-- Messages: participants only
create policy "Participants see messages" on public.messages for select using (auth.uid() = sender_id);
create policy "Participants send messages" on public.messages for insert with check (auth.uid() = sender_id);


-- ── STORAGE BUCKETS (add these in Supabase dashboard) ──
-- 'products-private' → private bucket (signed URLs only, for digital downloads)
-- 'product-covers'   → public bucket (product cover images)
