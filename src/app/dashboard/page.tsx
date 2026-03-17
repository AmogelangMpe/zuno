import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // If user is logged in but doesn't have a profile, create a basic one
  let finalProfile = profile
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      })
      .select('*')
      .maybeSingle()

    if (createError) {
      console.error('Error creating default profile:', createError)
      // Continue anyway - user can still access dashboard
    } else {
      finalProfile = newProfile
    }
  }

  // Analytics counts
  const { count: totalViews } = await supabase
    .from('analytics')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('event_type', 'page_view')

  const { count: totalClicks } = await supabase
    .from('analytics')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('event_type', 'link_click')

  const today = new Date().toISOString().split('T')[0]
  const { count: viewsToday } = await supabase
    .from('analytics')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('event_type', 'page_view')
    .gte('created_at', today)

  const username = finalProfile?.username || user.email?.split('@')[0]
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const requestOrigin = host ? `${proto}://${host}` : null
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const appUrl = requestOrigin || envAppUrl || 'https://zunobio.com'
  const profileUrl = `${appUrl}/${username}`
  const profileUrlDisplay = `zunobio.com/${username}`

  return (
    <main className="min-h-screen bg-zuno-bg">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 border-b border-zuno-border bg-zuno-surface">
        <span className="font-serif italic text-lg sm:text-xl shrink-0">ZunoBio</span>
        <div className="flex items-center justify-end flex-wrap gap-2 sm:gap-3">
          <a
            href={profileUrl}
            target="_blank"
            className="btn-ghost text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 whitespace-nowrap"
          >
            View page ↗
          </a>
          <Link href="/edit" className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-2.5 sm:px-4 whitespace-nowrap">
            Edit page
          </Link>
          <LogoutButton className="btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-2.5 sm:px-4 whitespace-nowrap" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="font-serif italic text-2xl sm:text-3xl mb-1">
          Hey, {finalProfile?.display_name || finalProfile?.username || 'there'} 👋
        </h1>
        <p className="text-sm text-zuno-muted mb-8">
          Your page is live at{' '}
          <a href={profileUrl} target="_blank" className="underline underline-offset-2 text-zuno-text break-words">
            {profileUrlDisplay}
          </a>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {[
            { label: 'Total views',   value: totalViews  ?? 0 },
            { label: 'Total clicks',  value: totalClicks ?? 0 },
            { label: 'Views today',   value: viewsToday  ?? 0 },
          ].map(s => (
            <div key={s.label} className="card p-4 sm:p-5 text-center">
              <div className="font-serif text-2xl sm:text-3xl font-medium mb-1">{s.value}</div>
              <div className="text-xs text-zuno-muted uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="font-medium mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: 'Edit your page',     href: '/edit',              desc: 'Update content, links, photos' },
            { label: 'Share your link',    href: profileUrl,           desc: profileUrlDisplay, external: true },
            { label: 'Change your theme',  href: '/edit?tab=theme',    desc: 'Colours, fonts, style' },
            { label: 'Account settings',   href: '/dashboard/settings',desc: 'Email, password, username' },
          ].map(a => (
            <Link
              key={a.label}
              href={a.href}
              target={a.external ? '_blank' : undefined}
              className="card p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-sm mb-1">{a.label}</div>
              <div className="text-xs text-zuno-muted break-words">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
