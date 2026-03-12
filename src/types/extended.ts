// ============================================================
// Zuno — Extended Types (new features)
// ============================================================

// ── FEEDS ──
export type FeedItem = {
  id:           string
  profile_id:   string
  platform:     'youtube' | 'tiktok'
  external_id:  string
  title:        string
  thumbnail:    string | null
  video_url:    string | null
  view_count:   number
  published_at: string | null
  fetched_at:   string
}

export type FeedCredentials = {
  id:                 string
  profile_id:         string
  youtube_channel_id: string | null
  tiktok_username:    string | null
}


// ── DIGITAL PRODUCTS ──
export type Product = {
  id:                 string
  profile_id:         string
  title:              string
  description:        string
  price:              number       // in cents
  currency:           string
  file_path:          string | null
  cover_url:          string | null
  is_published:       boolean
  stripe_price_id:    string | null
  stripe_product_id:  string | null
  sales_count:        number
  created_at:         string
  updated_at:         string
}

export type Order = {
  id:                    string
  product_id:            string | null
  profile_id:            string | null
  buyer_email:           string
  amount_paid:           number
  currency:              string
  stripe_session_id:     string | null
  download_token:        string
  download_count:        number
  status:                'pending' | 'paid' | 'refunded'
  created_at:            string
}

export type StripeAccount = {
  profile_id:        string
  stripe_account_id: string
  is_onboarded:      boolean
}


// ── EMAIL CAPTURE ──
export type EmailSubscriber = {
  id:         string
  profile_id: string
  email:      string
  name:       string | null
  source:     string
  tags:       string[]
  is_active:  boolean
  created_at: string
}


// ── AFFILIATE ──
export type AffiliateLink = {
  id:           string
  profile_id:   string
  title:        string
  destination:  string
  slug:         string
  commission:   string | null
  network:      string | null
  thumbnail:    string | null
  total_clicks: number
  is_active:    boolean
  created_at:   string
}

export type AffiliateClick = {
  id:         string
  link_id:    string
  profile_id: string
  referrer:   string | null
  created_at: string
}


// ── BRAND DEAL MARKETPLACE ──
export type BrandProfile = {
  id:           string
  company_name: string
  website:      string | null
  industry:     string | null
  logo_url:     string | null
  bio:          string | null
  is_verified:  boolean
  created_at:   string
}

export type Deal = {
  id:                 string
  brand_id:           string
  title:              string
  description:        string
  deliverables:       string
  budget_min:         number | null
  budget_max:         number | null
  currency:           string
  niche:              string[]
  min_followers:      number | null
  platforms:          string[]
  deadline:           string | null
  is_open:            boolean
  applications_count: number
  created_at:         string
  brand_profiles?:    BrandProfile
}

export type DealApplication = {
  id:         string
  deal_id:    string
  profile_id: string
  pitch:      string
  rate:       number | null
  status:     'pending' | 'shortlisted' | 'accepted' | 'rejected'
  created_at: string
  deals?:     Deal
}

export type Message = {
  id:             string
  application_id: string
  sender_id:      string
  sender_type:    'creator' | 'brand'
  body:           string
  is_read:        boolean
  created_at:     string
}
