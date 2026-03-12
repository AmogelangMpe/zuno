import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductManager from '@/components/products/ProductManager'

export default async function ProductsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const { data: stripeAccount } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const { data: orders } = await supabase
    .from('orders')
    .select('amount_paid, currency, created_at, products(title)')
    .eq('profile_id', user.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(10)

  const totalRevenue = (orders || []).reduce((sum, o) => sum + o.amount_paid, 0)

  return (
    <main className="min-h-screen bg-zuno-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <Link href="/dashboard" className="font-serif italic text-xl">Zuno</Link>
        <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif italic text-3xl mb-8">Digital Products</h1>

        {/* Stripe Connect banner */}
        {!stripeAccount?.is_onboarded && (
          <div className="bg-zuno-text text-zuno-bg rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium mb-1">Set up payouts first</p>
              <p className="text-sm opacity-60">Connect Stripe to receive payments from your product sales</p>
            </div>
            <StripeConnectButton profileId={user.id} />
          </div>
        )}

        {/* Revenue stats */}
        {stripeAccount?.is_onboarded && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card p-5 text-center">
              <div className="font-serif text-3xl font-medium mb-1">
                R{(totalRevenue / 100).toLocaleString()}
              </div>
              <div className="text-xs text-zuno-muted uppercase tracking-wider">Total revenue</div>
            </div>
            <div className="card p-5 text-center">
              <div className="font-serif text-3xl font-medium mb-1">{orders?.length || 0}</div>
              <div className="text-xs text-zuno-muted uppercase tracking-wider">Total sales</div>
            </div>
          </div>
        )}

        <ProductManager
          profileId={user.id}
          products={products || []}
          canSell={!!stripeAccount?.is_onboarded}
        />

        {/* Recent orders */}
        {orders && orders.length > 0 && (
          <div className="mt-10">
            <h2 className="font-medium mb-4">Recent sales</h2>
            <div className="card overflow-hidden">
              {orders.map((order, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 ${i < orders.length - 1 ? 'border-b border-zuno-border' : ''}`}>
                  <div>
                    <p className="text-sm font-medium">{(order as any).products?.title}</p>
                    <p className="text-xs text-zuno-muted">{new Date(order.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    +R{(order.amount_paid / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StripeConnectButton({ profileId }: { profileId: string }) {
  // Client component wrapper needed — inline for simplicity
  return (
    <form action="/api/stripe/connect" method="POST">
      <input type="hidden" name="profileId" value={profileId} />
      <button type="submit" className="bg-white text-zuno-text text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap hover:opacity-90 transition-opacity">
        Connect Stripe →
      </button>
    </form>
  )
}
