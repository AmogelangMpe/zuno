import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilePreview from '@/components/profile/ProfilePreview'
import AnalyticsTracker from '@/components/profile/AnalyticsTracker'
import type { Metadata } from 'next'

type Props = { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, bio, cover_url')
    .eq('username', params.username)
    .single()

  if (!data) return { title: 'Not found' }

  return {
    title: `${data.display_name || params.username} | ZunoBio`,
    description: data.bio || `Check out ${data.display_name}'s ZunoBio page`,
    openGraph: {
      images: data.cover_url ? [data.cover_url] : [],
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .eq('is_published', true)
    .single()

  if (!profile) notFound()

  const { data: socialLinks } = await supabase
    .from('social_links')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order')

  const { data: sections } = await supabase
    .from('sections')
    .select('*, links(*)')
    .eq('profile_id', profile.id)
    .eq('is_enabled', true)
    .order('sort_order')

  // Filter to only enabled links within each section
  const sectionsWithLinks = (sections || []).map(s => ({
    ...s,
    links: (s.links || []).filter((l: any) => l.is_enabled).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }))

  return (
    <>
      <AnalyticsTracker profileId={profile.id} />
      <ProfilePreview
        profile={profile}
        socialLinks={socialLinks || []}
        sections={sectionsWithLinks}
      />
    </>
  )
}
