import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BuyButton from '@/components/products/BuyButton'

export default async function BuyPage({ params }: { params: { productId: string } }) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, profiles(display_name, username, avatar_url)')
    .eq('id', params.productId)
    .eq('is_published', true)
    .single()

  if (!product) notFound()

  const creator = (product as any).profiles

  return (
    <main className="min-h-screen bg-zuno-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Creator info */}
        <div className="text-center mb-6">
          <p className="text-sm text-zuno-muted mb-1">by</p>
          <a href={`/${creator?.username}`} className="font-serif italic text-xl hover:opacity-75 transition-opacity">
            {creator?.display_name || creator?.username}
          </a>
        </div>

        {/* Product card */}
        <div className="card overflow-hidden mb-6">
          {product.cover_url && (
            <img src={product.cover_url} alt={product.title} className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <h1 className="font-serif italic text-2xl mb-2">{product.title}</h1>
            <p className="text-sm text-zuno-muted mb-6 leading-relaxed">{product.description}</p>

            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-3xl">R{(product.price / 100).toLocaleString()}</span>
              <span className="text-xs text-zuno-muted bg-zuno-card px-3 py-1 rounded-full">
                Instant download
              </span>
            </div>

            <BuyButton productId={product.id} />
          </div>
        </div>

        <p className="text-center text-xs text-zuno-muted">
          Secure checkout powered by Stripe.<br />
          You&apos;ll receive a download link immediately after payment.
        </p>
      </div>
    </main>
  )
}
