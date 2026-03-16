'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zuno-bg" />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)

    // Create a timeout that will force reset after 10 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false)
      toast.error('Login request timed out. Please check your connection and try again.')
    }, 10000)

    try {
      console.log('🔐 Logging in with:', email)
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      clearTimeout(timeoutId)

      if (error) {
        console.error('❌ Login error:', error.message)
        toast.error(error.message || 'Login failed')
        setLoading(false)
        return
      }

      if (!data?.user) {
        console.error('❌ No user returned')
        toast.error('Login failed. Please try again.')
        setLoading(false)
        return
      }

      console.log('✅ Login successful:', data.user.email)
toast.success('Login successful!')

// Full reload so middleware sees the session cookie
window.location.href = redirect
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('❌ Login error:', err)
      toast.error('An error occurred during login: ' + (err?.message || 'Unknown error'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zuno-bg">
      <Link href="/" className="font-serif italic text-3xl mb-10">ZunoBio</Link>

      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">Welcome back</h1>
        <p className="text-sm text-zuno-muted mb-8">Log in to your ZunoBio account</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-zuno-muted text-center mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-zuno-text underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
