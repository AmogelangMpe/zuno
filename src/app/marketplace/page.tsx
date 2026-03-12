import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Deal } from '@/types/extended'

export default async function MarketplacePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('deals')
    .select('*, brand_profiles(company_name, logo_url, is_verified)')
    .eq('is_open', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/dashboard" className="font-serif italic text-xl">Zuno</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm">Log in</Link>
          )}
          <Link href="/brands/signup" className="btn-secondary text-sm">Post a deal →</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-serif italic text-4xl mb-2">Brand Deals</h1>
        <p className="text-zuno-muted mb-8 text-sm">
          Open collaborations from brands looking for creators like you.
        </p>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {['All', 'Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Fitness'].map(f => (
            <button key={f} className={`btn-secondary text-xs py-1.5 px-3 whitespace-nowrap ${f === 'All' ? 'bg-zuno-text text-zuno-bg border-zuno-text' : ''}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Deals grid */}
        <div className="flex flex-col gap-4">
          {deals?.map(deal => <DealCard key={deal.id} deal={deal} isLoggedIn={!!user} />)}
          {!deals?.length && (
            <div className="card p-10 text-center">
              <p className="text-zuno-muted">No open deals right now. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function DealCard({ deal, isLoggedIn }: { deal: Deal & { brand_profiles: any }, isLoggedIn: boolean }) {
  const brand = deal.brand_profiles
  const budgetText = deal.budget_min && deal.budget_max
    ? `R${(deal.budget_min/100).toLocaleString()} – R${(deal.budget_max/100).toLocaleString()}`
    : deal.budget_min ? `From R${(deal.budget_min/100).toLocaleString()}` : 'Budget TBD'

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {brand?.logo_url ? (
            <img src={brand.logo_url} alt={brand.company_name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-zuno-card flex items-center justify-content text-xs font-medium text-zuno-muted">
              {brand?.company_name?.[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm">{brand?.company_name}</span>
              {brand?.is_verified && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
            </div>
            {deal.deadline && (
              <span className="text-xs text-zuno-muted">
                Deadline: {new Date(deal.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
          {budgetText}
        </span>
      </div>

      <h3 className="font-medium mb-2">{deal.title}</h3>
      <p className="text-sm text-zuno-muted mb-4 line-clamp-2">{deal.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {deal.platforms?.map(p => (
          <span key={p} className="text-xs bg-zuno-card px-2 py-1 rounded-lg capitalize">{p}</span>
        ))}
        {deal.niche?.map(n => (
          <span key={n} className="text-xs bg-zuno-card px-2 py-1 rounded-lg capitalize">{n}</span>
        ))}
        {deal.min_followers && (
          <span className="text-xs bg-zuno-card px-2 py-1 rounded-lg">
            {(deal.min_followers / 1000).toFixed(0)}K+ followers
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zuno-muted">{deal.applications_count} applied</span>
        {isLoggedIn ? (
          <Link href={`/deals/${deal.id}/apply`} className="btn-primary text-sm py-2">
            Apply now
          </Link>
        ) : (
          <Link href="/auth/login" className="btn-primary text-sm py-2">
            Log in to apply
          </Link>
        )}
      </div>
    </div>
  )
}
