import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DealApplyForm from '@/components/marketplace/DealApplyForm'

export default async function ApplyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: deal } = await supabase
    .from('deals')
    .select('*, brand_profiles(company_name, logo_url)')
    .eq('id', params.id)
    .eq('is_open', true)
    .single()

  if (!deal) notFound()

  // Check if already applied
  const { data: existing } = await supabase
    .from('deal_applications')
    .select('id, status')
    .eq('deal_id', params.id)
    .eq('profile_id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-zuno-bg">
      <div className="max-w-xl mx-auto px-6 py-10">
        <a href="/marketplace" className="text-sm text-zuno-muted mb-6 block hover:text-zuno-text">
          ← Back to marketplace
        </a>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {deal.brand_profiles?.logo_url ? (
              <img src={deal.brand_profiles.logo_url} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-zuno-card flex items-center justify-center text-sm font-medium">
                {deal.brand_profiles?.company_name?.[0]}
              </div>
            )}
            <span className="font-medium">{deal.brand_profiles?.company_name}</span>
          </div>
          <h1 className="font-serif italic text-2xl mb-2">{deal.title}</h1>
          <p className="text-sm text-zuno-muted mb-4">{deal.description}</p>
          <div className="bg-zuno-card rounded-xl p-4 text-sm">
            <p className="font-medium mb-1">Deliverables</p>
            <p className="text-zuno-muted">{deal.deliverables}</p>
          </div>
        </div>

        {existing ? (
          <div className="card p-6 text-center">
            <p className="font-medium mb-1">Application submitted</p>
            <p className="text-sm text-zuno-muted">
              Status: <span className="capitalize font-medium">{existing.status}</span>
            </p>
          </div>
        ) : (
          <DealApplyForm dealId={deal.id} profileId={user.id} currency={deal.currency} />
        )}
      </div>
    </main>
  )
}
