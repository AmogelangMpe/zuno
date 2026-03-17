import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function AccountSettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/dashboard/settings')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/dashboard" className="font-serif italic text-xl">
          ZunoBio
        </Link>
        <Link href="/dashboard" className="btn-ghost text-sm">
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif italic text-3xl mb-2">Account settings</h1>
        <p className="text-sm text-zuno-muted mb-8">Manage your account details and profile basics.</p>

        <section className="card p-6 mb-6 space-y-5">
          <div>
            <p className="text-xs text-zuno-muted uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm text-zuno-text break-all">{user.email}</p>
          </div>

          <div>
            <p className="text-xs text-zuno-muted uppercase tracking-wider mb-1">Username</p>
            <p className="text-sm text-zuno-text">{profile?.username || 'Not set yet'}</p>
          </div>

          <div>
            <p className="text-xs text-zuno-muted uppercase tracking-wider mb-1">Display name</p>
            <p className="text-sm text-zuno-text">{profile?.display_name || 'Not set yet'}</p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-medium mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/edit" className="btn-primary text-sm py-2">
              Edit profile
            </Link>
            <Link href="/auth/login" className="btn-secondary text-sm py-2">
              Reset password
            </Link>
            <LogoutButton />
          </div>
          <p className="text-xs text-zuno-muted mt-4">
            To reset your password, log out and use the forgot-password flow on the login page.
          </p>
        </section>
      </div>
    </main>
  )
}
