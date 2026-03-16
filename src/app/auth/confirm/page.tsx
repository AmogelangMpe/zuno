'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const email = (searchParams.get('email') || '').trim()
  const [status, setStatus] = useState<'checking' | 'done'>('checking')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    async function ensureProfile() {
      const supabase = createClient()
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
  }, [])

  async function handleResend() {
    if (!email) {
      toast.error('Please go back to sign up and enter your email again.')
      return
    }

    setResending(true)
    try {
      const supabase = createClient()
      const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zunobio.com'
      const appUrl = typeof window !== 'undefined' ? window.location.origin : fallbackAppUrl
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message || 'Could not resend email yet. Please wait and try again.')
        return
      }

      toast.success('Confirmation email resent. Check Inbox, Spam, and Promotions.')
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-zuno-bg text-center">
      <Link href="/" className="font-serif italic text-3xl mb-10">ZunoBio</Link>
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-2">Check your email</h1>
        <p className="text-sm text-zuno-muted mb-8 leading-relaxed">
          We sent a confirmation link{email ? ` to ${email}` : ''}.
          Click it to activate your account.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="btn-secondary w-full"
        >
          {resending ? 'Resending…' : 'Resend confirmation email'}
        </button>
        <p className="text-xs text-zuno-muted">
          {status === 'checking' ? (
            'Finalising your account…'
          ) : (
            <>Didn&apos;t get it? Check Inbox, Spam, Promotions, then{' '}
            <Link href="/auth/signup" className="underline underline-offset-2 text-zuno-text">
              try again
            </Link>.</>
          )}
        </p>
      </div>
    </main>
  )
}