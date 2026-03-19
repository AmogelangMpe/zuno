-- ============================================================
-- ZunoBio — SQL Helper Functions
-- Run in Supabase SQL Editor after schema-extended.sql
-- ============================================================

-- Increment product sales count safely
create or replace function increment_sales(product_id uuid)
returns void as $$
  update public.products set sales_count = sales_count + 1 where id = product_id;
$$ language sql security definer;

-- Increment affiliate link click count safely
create or replace function increment_affiliate_clicks(link_id uuid)
returns void as $$
  update public.affiliate_links set total_clicks = total_clicks + 1 where id = link_id;
$$ language sql security definer;

-- Increment deal application count safely
create or replace function increment_applications(deal_id uuid)
returns void as $$
  update public.deals set applications_count = applications_count + 1 where id = deal_id;
$$ language sql security definer;

-- ── MIGRATION: Move 'connect' section to end ──
-- Run once in Supabase SQL Editor to reorder existing profiles.
update public.sections set sort_order = 4 where type = 'collabs';
update public.sections set sort_order = 5 where type = 'connect';
