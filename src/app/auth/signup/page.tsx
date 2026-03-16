'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isValidUsername } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()

    if (!isValidUsername(username)) {
      toast.error('Username must be 3–30 characters: letters, numbers, underscores only')
      return
    }

    setLoading(true)

    // Check username is available
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      toast.error('That username is already taken')
      setLoading(false)
      return
    }

    // Create auth user
    const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zunobio.com'
    const appUrl = typeof window !== 'undefined' ? window.location.origin : fallbackAppUrl
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          full_name: name.trim(),
        },
      },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Something went wrong')
      setLoading(false)
      return
    }

    // user created; profile will be created after email confirmation
    toast.success('Account created! Please check your email to confirm.')
    router.push(`/auth/confirm?email=${encodeURIComponent(email.trim())}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zuno-bg">
      <Link href="/" className="font-serif italic text-3xl mb-10">ZunoBio</Link>

      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">Create your page</h1>
        <p className="text-sm text-zuno-muted mb-8">It only takes a minute</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            className="input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">
              zunobio.com/
            </span>
            <input
              className="input pl-[4.5rem]"
              type="text"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              required
            />
          </div>
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Creating your page…' : 'Create my ZunoBio page'}
          </button>
        </form>

        <p className="text-sm text-zuno-muted text-center mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-zuno-text underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
