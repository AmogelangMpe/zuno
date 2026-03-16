import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { email, name, profileId, source } = await req.json()

  if (!email || !profileId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase.from('email_subscribers').upsert({
    profile_id: profileId,
    email:      email.toLowerCase().trim(),
    name:       name || null,
    source:     source || 'profile_page',
  }, { onConflict: 'profile_id,email', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
    await syncToMailchimp(email, name)
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const profileId = req.nextUrl.searchParams.get('profileId')
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

  const { data: { user } } = await (await import('@/lib/supabase/server')).createClient().auth.getUser()
  if (!user || user.id !== profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subscribers } = await supabase
    .from('email_subscribers')
    .select('email, name, source, created_at')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (!subscribers?.length) {
    return new NextResponse('email,name,source,date\n', {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': 'attachment; filename="subscribers.csv"',
      },
    })
  }

  const csv = [
    'email,name,source,date',
    ...subscribers.map((s: any) =>
      `"${s.email}","${s.name || ''}","${s.source}","${s.created_at}"`
    ),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="subscribers.csv"',
    },
  })
}

async function syncToMailchimp(email: string, name?: string) {
  const [firstName, ...rest] = (name || '').split(' ')
  await fetch(
    `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status:        'subscribed',
        merge_fields:  { FNAME: firstName, LNAME: rest.join(' ') },
      }),
    }
  )
}