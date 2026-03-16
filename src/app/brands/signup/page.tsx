'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const INDUSTRIES = ['Fashion','Beauty','Lifestyle','Tech','Food & Beverage','Fitness','Travel','Finance','Entertainment','Other']

export default function BrandSignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany]   = useState('')
  const [website, setWebsite]   = useState('')
  const [industry, setIndustry] = useState('')
  const [bio, setBio]           = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignup() {
    if (!company || !email || !password) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      toast.error(authError?.message || 'Sign up failed')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('brand_profiles').insert({
      id:           authData.user.id,
      company_name: company,
      website:      website || null,
      industry:     industry || null,
      bio:          bio || null,
    })

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    toast.success('Brand account created!')
    router.push('/brands/dashboard')
  }

  return (
    <main className="min-h-screen bg-zuno-bg flex flex-col items-center justify-center px-6">
      <Link href="/" className="font-serif italic text-3xl mb-3">ZunoBio</Link>
      <p className="text-sm text-zuno-muted mb-10">for Brands</p>

      <div className="w-full max-w-md">
        <h1 className="text-xl font-medium mb-1">Create a brand account</h1>
        <p className="text-sm text-zuno-muted mb-8">Find and connect with creators for your campaigns</p>

        <div className="flex flex-col gap-4">
          <input className="input" placeholder="Company name *" value={company} onChange={e => setCompany(e.target.value)} />
          <input className="input" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
          <select className="input" value={industry} onChange={e => setIndustry(e.target.value)}>
            <option value="">Industry</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <textarea
            className="input resize-none h-20"
            placeholder="Brief description of your brand (optional)"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <hr className="border-zuno-border" />
          <input className="input" type="email" placeholder="Email address *" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password *" value={password} onChange={e => setPassword(e.target.value)} minLength={8} />
          <button className="btn-primary mt-2" onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account…' : 'Create brand account'}
          </button>
        </div>

        <p className="text-sm text-center text-zuno-muted mt-6">
          Are you a creator?{' '}
          <Link href="/auth/signup" className="text-zuno-text underline underline-offset-2">Sign up here</Link>
        </p>
      </div>
    </main>
  )
}
