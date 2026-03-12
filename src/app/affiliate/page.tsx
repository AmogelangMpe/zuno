import { redirect } from 'next/navigation'
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

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/dashboard" className="font-serif italic text-xl">Zuno</Link>
        <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif italic text-3xl mb-2">Affiliate Storefront</h1>
        <p className="text-sm text-zuno-muted mb-8">
          Add your affiliate links. Each gets a short tracked URL at{' '}
          <span className="text-zuno-text">zuno.app/go/your-slug</span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-5 text-center">
            <div className="font-serif text-3xl font-medium mb-1">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-zuno-muted uppercase tracking-wider">All-time clicks</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-serif text-3xl font-medium mb-1">{links?.length || 0}</div>
            <div className="text-xs text-zuno-muted uppercase tracking-wider">Active links</div>
          </div>
        </div>

        <AffiliateManager
          profileId={user.id}
          links={links || []}
          clicksByLink={clicksByLink}
          appUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://zuno.app'}
        />
      </div>
    </main>
  )
}
