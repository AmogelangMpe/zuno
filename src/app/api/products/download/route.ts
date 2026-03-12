import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: order } = await supabase
    .from('orders')
    .select('*, products(file_path, title)')
    .eq('download_token', token)
    .eq('status', 'paid')
    .single()

  if (!order) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })

  const product = (order as any).products
  if (!product?.file_path) return NextResponse.json({ error: 'No file attached' }, { status: 404 })

  // Max 5 downloads per order
  if (order.download_count >= 5) {
    return NextResponse.json({ error: 'Download limit reached. Contact support.' }, { status: 403 })
  }

  // Generate a 60-second signed URL
  const { data: signed, error } = await supabase.storage
    .from('products-private')
    .createSignedUrl(product.file_path, 60)

  if (error || !signed) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })

  // Increment download count
  await supabase
    .from('orders')
    .update({ download_count: order.download_count + 1 })
    .eq('id', order.id)

  // Redirect to the signed URL
  return NextResponse.redirect(signed.signedUrl)
}
