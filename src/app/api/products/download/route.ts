import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!supabaseUrl || !serviceRoleKey || !/^https?:\/\//.test(supabaseUrl)) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }
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

  if (order.download_count >= 5) {
    return NextResponse.json({ error: 'Download limit reached. Contact support.' }, { status: 403 })
  }

  const { data: signed, error } = await supabase.storage
    .from('products-private')
    .createSignedUrl(product.file_path, 60)

  if (error || !signed) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })

  await supabase
    .from('orders')
    .update({ download_count: order.download_count + 1 })
    .eq('id', order.id)

  return NextResponse.redirect(signed.signedUrl)
}