'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase.from('analytics').insert({
      profile_id: profileId,
      event_type: 'page_view',
      referrer:   document.referrer || null,
      user_agent: navigator.userAgent,
    })
  }, [profileId])

  return null
}
