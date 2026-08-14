// Contact form — saves messages to the `contact_messages` Supabase table.
//
// Required table (run once in Supabase SQL editor):
//   CREATE TABLE contact_messages (
//     id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
//     name       text        NOT NULL,
//     email      text        NOT NULL,
//     message    text        NOT NULL,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Allow public inserts" ON contact_messages
//     FOR INSERT WITH CHECK (true);

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name    = body.name?.trim()
  const email   = body.email?.trim().toLowerCase()
  const message = body.message?.trim()

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'Please enter a message (at least 10 characters).' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_messages')
    .insert({ name, email, message })

  if (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
