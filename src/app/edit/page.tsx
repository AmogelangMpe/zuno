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

  return (
    <EditorClient
      profile={profile}
      socialLinks={socialLinks || []}
      sections={sections || []}
    />
  )
}
