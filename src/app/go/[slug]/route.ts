import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const { data: link } = await supabase
    .from('affiliate_links')
    .select('id, profile_id, destination')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!link) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

  supabase.from('affiliate_clicks').insert({
    link_id:    link.id,
    profile_id: link.profile_id,
    referrer:   req.headers.get('referer') || null,
    user_agent: req.headers.get('user-agent') || null,
    ip_hash:    ipHash,
  })

  supabase.rpc('increment_affiliate_clicks', { link_id: link.id })

  return NextResponse.redirect(link.destination)
}