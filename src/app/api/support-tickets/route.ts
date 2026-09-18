import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireUser } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (!session && !email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const supabase = await createAdminClient()
  let query = supabase
    .from('support_tickets')
    .select('id, ticket_number, subject, category, status, created_at')
    .order('created_at', { ascending: false })
  query = session ? query.eq('user_id', session.userId) : query.eq('customer_email', email!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load support tickets.' }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser()
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const category = String(body.category ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()
    const orderNumber = String(body.orderNumber ?? '').trim() || null

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: session.userId,
        customer_name: name,
        customer_email: email,
        category,
        order_number: orderNumber,
        subject,
        message,
      })
      .select('id, ticket_number, subject, category, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: 'Unable to submit your ticket.' }, { status: 500 })
    return NextResponse.json({ ticket: data }, { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    return NextResponse.json(
      { error: status === 401 ? 'Please sign in to submit a support ticket.' : 'Unable to submit your ticket.' },
      { status },
    )
  }
}
