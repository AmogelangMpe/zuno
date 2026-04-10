import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username, displayName } = body

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // verify auth user exists (service role) with retry
    let userData, userError
    for (let i = 0; i < 5; i++) {
      const res = await supabase.auth.admin.getUserById(userId)
      userData = res.data
      userError = res.error
      if (userData?.user) break
      // wait 200ms before next attempt
      await new Promise(r => setTimeout(r, 200))
    }
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Auth user record not found. Please try again later.' },
        { status: 400 }
      )
    }

    // Insert profile with service role (bypasses RLS)
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      username: username.toLowerCase(),
      display_name: displayName || '',
    })

    if (error) {
      // detect foreign key violation
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { error: 'Auth user record missing; try again in a moment.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const email = userData.user.email
    if (email) {
      // Fire welcome email (don't await — don't block signup)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, displayName }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
