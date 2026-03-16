'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  className?: string
  label?: string
}

export default function LogoutButton({ className = 'btn-secondary text-sm py-2', label = 'Log out' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? 'Logging out…' : label}
    </button>
  )
}
