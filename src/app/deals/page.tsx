import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DealsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: applications } = await supabase
    .from('deal_applications')
    .select('*, deals(title, budget_min, budget_max, currency, brand_profiles(company_name, logo_url))')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const statusColor: Record<string, string> = {
    pending:     'bg-yellow-50 text-yellow-700',
    shortlisted: 'bg-blue-50 text-blue-700',
    accepted:    'bg-green-50 text-green-700',
    rejected:    'bg-red-50 text-red-600',
  }

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/dashboard" className="font-serif italic text-xl">Zuno</Link>
        <Link href="/marketplace" className="btn-secondary text-sm">Browse deals</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif italic text-3xl mb-8">My Applications</h1>

        {!applications?.length ? (
          <div className="card p-10 text-center">
            <p className="font-medium mb-2">No applications yet</p>
            <p className="text-sm text-zuno-muted mb-6">Browse open brand deals and start applying</p>
            <Link href="/marketplace" className="btn-primary">Browse deals</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map(app => {
              const deal  = (app as any).deals
              const brand = deal?.brand_profiles
              const budget = deal?.budget_min
                ? `R${(deal.budget_min/100).toLocaleString()}${deal.budget_max ? `–R${(deal.budget_max/100).toLocaleString()}` : '+'}`
                : 'TBD'

              return (
                <div key={app.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {brand?.logo_url ? (
                        <img src={brand.logo_url} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-zuno-card flex items-center justify-center text-xs font-medium">
                          {brand?.company_name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{deal?.title}</p>
                        <p className="text-xs text-zuno-muted">{brand?.company_name} · {budget}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor[app.status] || ''}`}>
                      {app.status}
                    </span>
                  </div>

                  <p className="text-sm text-zuno-muted line-clamp-2 mb-3">{app.pitch}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zuno-muted">
                      Applied {new Date(app.created_at).toLocaleDateString('en-ZA')}
                      {app.rate ? ` · Rate: R${(app.rate/100).toLocaleString()}` : ''}
                    </span>
                    {app.status === 'accepted' && (
                      <Link href={`/deals/${app.deal_id}/messages`} className="btn-primary text-xs py-1.5">
                        Open chat →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
