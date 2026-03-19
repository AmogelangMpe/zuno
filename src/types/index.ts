// ============================================================
// Zuno — TypeScript Types
// ============================================================

export type Theme = {
  bg:      string
  surface: string
  text:    string
  accent:  string
}

export type Profile = {
  id:                string
  username:          string
  display_name:      string
  bio:               string
  cover_url:         string | null
  avatar_url:        string | null
  theme_bg:          string
  theme_surface:     string
  theme_text:        string
  theme_accent:      string
  is_published:      boolean
  open_to_collabs:   boolean
  collab_email:      string | null
  created_at:        string
  updated_at:        string
}

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'snapchat'
  | 'twitter'
  | 'email'
  | 'custom'

export type SocialLink = {
  id:             string
  profile_id:     string
  platform:       SocialPlatform
  url:            string
  follower_count: string | null
  sort_order:     number
  created_at:     string
}

export type SectionType = 'videos' | 'shop' | 'events' | 'press' | 'connect' | 'collabs' | 'books'

export type Section = {
  id:          string
  profile_id:  string
  type:        SectionType
  title:       string
  is_enabled:  boolean
  sort_order:  number
  channel_url: string | null
  last_synced: string | null
  created_at:  string
}

export type LinkType =
  | 'video'
  | 'product'
  | 'shop_link'
  | 'event'
  | 'press'
  | 'connect_link'
  | 'brand'
  | 'service'
  | 'book'

export type EventTag = 'Soon' | 'Free' | 'Invite' | 'Live'

export type Link = {
  id:          string
  profile_id:  string
  section_id:  string
  type:        LinkType
  title:       string
  subtitle:    string | null  // author name for books
  url:         string | null
  image_url:   string | null  // book cover
  price:       string | null
  platform:    string | null  // blurb for books
  event_date:  string | null
  event_tag:   EventTag | null
  is_enabled:  boolean
  sort_order:  number
  created_at:  string
  updated_at:  string
}

// Full profile page data (all relations joined)
export type PublicProfile = Profile & {
  social_links: SocialLink[]
  sections:     (Section & { links: Link[] })[]
}

export type AnalyticsEvent = {
  id:         string
  profile_id: string
  link_id:    string | null
  event_type: 'page_view' | 'link_click'
  referrer:   string | null
  created_at: string
}

export type DashboardStats = {
  total_views:  number
  total_clicks: number
  views_today:  number
  top_links:    { link_id: string; title: string; clicks: number }[]
}
