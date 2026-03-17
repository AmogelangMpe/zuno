import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditorClient from '@/components/editor/EditorClient'

export default async function EditPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/signup')

  const { data: socialLinks } = await supabase
    .from('social_links')
    .select('*')
    .eq('profile_id', user.id)
    .order('sort_order')

  const { data: sections } = await supabase
    .from('sections')
    .select('*, links(*)')
    .eq('profile_id', user.id)
    .order('sort_order')

  let finalSections = sections || []

  // Backfill missing collabs section for older profiles.
  if (!finalSections.some(s => s.type === 'collabs')) {
    const nextSort = finalSections.length ? Math.max(...finalSections.map(s => s.sort_order || 0)) + 1 : 0
    const { data: createdCollabs } = await supabase
      .from('sections')
      .insert({
        profile_id: user.id,
        type: 'collabs',
        title: 'Collabs',
        sort_order: nextSort,
        is_enabled: true,
      })
      .select('*, links(*)')
      .maybeSingle()

    if (createdCollabs) {
      finalSections = [...finalSections, createdCollabs]
    }
  }

  return (
    <EditorClient
      profile={profile}
      socialLinks={socialLinks || []}
      sections={finalSections}
    />
  )
}
