// Newsletter signup — saves email to the `subscribers` Supabase table.
//
// Required table (run once in Supabase SQL editor):
//   CREATE TABLE subscribers (
//     id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
//     email      text        UNIQUE NOT NULL,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('subscribers').insert({ email })

  if (error) {
    // Unique constraint violation — email already subscribed, treat as success
    if (error.code === '23505') return NextResponse.json({ ok: true })
    console.error('Newsletter signup error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
