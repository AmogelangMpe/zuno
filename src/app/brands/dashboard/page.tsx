import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PostDealForm from '@/components/marketplace/PostDealForm'

export default async function BrandDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!brand) redirect('/brands/signup')

  const { data: deals } = await supabase
    .from('deals')
    .select('*, deal_applications(count)')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/" className="font-serif italic text-xl">Zuno <span className="text-sm font-sans not-italic text-zuno-muted">for Brands</span></Link>
        <span className="text-sm text-zuno-muted">{brand.company_name}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif italic text-3xl">Brand Dashboard</h1>
        </div>

        {/* Post a deal */}
        <div className="card p-6 mb-8">
          <h2 className="font-medium mb-4">Post a new deal</h2>
          <PostDealForm brandId={user.id} />
        </div>

        {/* Existing deals */}
        <h2 className="font-medium mb-4">Your deals</h2>
        {!deals?.length ? (
          <p className="text-sm text-zuno-muted">No deals posted yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {deals.map(deal => (
              <div key={deal.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{deal.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${deal.is_open ? 'bg-green-50 text-green-700' : 'bg-zuno-card text-zuno-muted'}`}>
                    {deal.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p className="text-sm text-zuno-muted mb-3 line-clamp-1">{deal.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zuno-muted">{deal.applications_count} applications</span>
                  <Link href={`/brands/deals/${deal.id}/applications`} className="btn-secondary text-xs py-1.5">
                    View applications →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
