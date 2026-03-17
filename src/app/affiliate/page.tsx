import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AffiliateManager from '@/components/affiliate/AffiliateManager'

export default async function AffiliatePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: links } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  // Click stats per link (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentClicks } = await supabase
    .from('affiliate_clicks')
    .select('link_id, created_at')
    .eq('profile_id', user.id)
    .gte('created_at', thirtyDaysAgo)

  const clicksByLink = (recentClicks || []).reduce<Record<string, number>>((acc, c) => {
    acc[c.link_id] = (acc[c.link_id] || 0) + 1
    return acc
  }, {})

  const totalClicks = (links || []).reduce((s, l) => s + l.total_clicks, 0)
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const requestOrigin = host ? `${proto}://${host}` : null
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const appUrl = requestOrigin || envAppUrl || 'https://zunobio.com'

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zuno-border bg-zuno-surface gap-3">
        <Link href="/dashboard" className="font-serif italic text-lg sm:text-xl">ZunoBio</Link>
        <Link href="/dashboard" className="btn-ghost text-xs sm:text-sm py-1.5 sm:py-2">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="font-serif italic text-2xl sm:text-3xl mb-2">Affiliate Storefront</h1>
        <p className="text-sm text-zuno-muted mb-8">
          Add your affiliate links. Each gets a short tracked URL at{' '}
          <span className="text-zuno-text">zunobio.com/go/your-slug</span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="card p-4 sm:p-5 text-center">
            <div className="font-serif text-2xl sm:text-3xl font-medium mb-1">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-zuno-muted uppercase tracking-wider">All-time clicks</div>
          </div>
          <div className="card p-4 sm:p-5 text-center">
            <div className="font-serif text-2xl sm:text-3xl font-medium mb-1">{links?.length || 0}</div>
            <div className="text-xs text-zuno-muted uppercase tracking-wider">Active links</div>
          </div>
        </div>

        <AffiliateManager
          profileId={user.id}
          links={links || []}
          clicksByLink={clicksByLink}
          appUrl={appUrl}
        />
      </div>
    </main>
  )
}
