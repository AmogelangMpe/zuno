'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ConfirmPage() {
  const supabase = createClient()
  const [status, setStatus] = useState<'checking' | 'done'>('checking')

  useEffect(() => {
    async function ensureProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('done')
        return
      }

      // attempt to create profile if missing
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            username: user.email?.split('@')[0] || 'user',
            displayName: user.user_metadata?.full_name || '',
          }),
        })
        if (res.ok) {
          toast.success('Profile created, you can now log in')
        } else {
          const err = await res.json()
          toast.error(err.error || 'Failed to create profile')
        }
      }

      setStatus('done')
    }

    ensureProfile()
  }, [supabase])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-zuno-bg text-center">
      <Link href="/" className="font-serif italic text-3xl mb-10">Zuno</Link>
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-2">Check your email</h1>
        <p className="text-sm text-zuno-muted mb-8 leading-relaxed">
          We sent a confirmation link to your email address.
          Click it to activate your account.
        </p>
        <p className="text-xs text-zuno-muted">
          {status === 'checking' ? (
            'Finalising your account…'
          ) : (
            <>Didn&apos;t get it? Check your spam, or{' '}
            <Link href="/auth/signup" className="underline underline-offset-2 text-zuno-text">
              try again
            </Link>.</>
          )}
        </p>
      </div>
    </main>
  )
}