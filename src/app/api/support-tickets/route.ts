import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireUser } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'

function serializeTicket(ticket: any, messages: any[] = []) {
  return {
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    user_id: ticket.user_id,
    customer_name: ticket.customer_name,
    customer_email: ticket.customer_email,
    category: ticket.category,
    order_number: ticket.order_number ?? null,
    subject: ticket.subject,
    status: ticket.status,
    created_at: ticket.created_at,
    message: ticket.message,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      sender_type: message.sender_type,
      sender_name: message.sender_name,
      sender_email: message.sender_email ?? null,
      body: message.body,
      created_at: message.created_at,
      author: message.sender_name,
      isCustomer: message.sender_type === 'customer',
    })),
  }
}

async function loadTicketsForOwner(session: Awaited<ReturnType<typeof getSession>>, email?: string | null) {
  const supabase = await createAdminClient()

  let query = supabase
    .from('support_tickets')
    .select(
      'id, ticket_number, user_id, customer_name, customer_email, category, order_number, subject, status, created_at, message'
    )
    .order('created_at', { ascending: false })

  if (session) {
    query = query.eq('user_id', session.userId)
  } else if (email) {
    query = query.eq('customer_email', email)
  }

  const { data: tickets, error } = await query
  if (error) throw new Error('Unable to load support tickets.')

  const ticketIds = (tickets ?? []).map((ticket) => ticket.id)
  let messageRows: any[] = []

  if (ticketIds.length > 0) {
    const { data, error: messageError } = await supabase
      .from('support_ticket_messages')
      .select('id, ticket_id, sender_type, sender_name, sender_email, body, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true })

    if (messageError) {
      throw new Error('Unable to load ticket messages.')
    }

    messageRows = data ?? []
  }

  const groupedMessages = new Map<string, any[]>()
  for (const message of messageRows) {
    const list = groupedMessages.get(message.ticket_id) ?? []
    list.push(message)
    groupedMessages.set(message.ticket_id, list)
  }

  return (tickets ?? []).map((ticket) => serializeTicket(ticket, groupedMessages.get(ticket.id) ?? []))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()

    if (!session && !email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const tickets = await loadTicketsForOwner(session, email)
    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load support tickets.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser()
    const body = await request.json()

    const ticketId = String(body.ticketId ?? '').trim()
    if (ticketId) {
      const message = String(body.message ?? '').trim()
      if (!message) {
        return NextResponse.json({ error: 'Reply message is required.' }, { status: 400 })
      }

      const supabase = await createAdminClient()
      const { data: ticket, error: lookupError } = await supabase
        .from('support_tickets')
        .select('id, user_id, customer_name, customer_email, status')
        .eq('id', ticketId)
        .eq('user_id', session.userId)
        .single()

      if (lookupError || !ticket) {
        return NextResponse.json({ error: 'Ticket not found or not accessible.' }, { status: 404 })
      }

      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'customer',
        sender_name: ticket.customer_name,
        sender_email: ticket.customer_email,
        body: message,
      })

      if (error) {
        return NextResponse.json({ error: 'Unable to send your reply.' }, { status: 500 })
      }

      await supabase.from('support_tickets').update({ status: 'pending' }).eq('id', ticketId)

      return NextResponse.json({ ok: true })
    }

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
      .select(
        'id, ticket_number, user_id, customer_name, customer_email, category, order_number, subject, status, created_at, message'
      )
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Unable to submit your ticket.' }, { status: 500 })
    }

    const ticketMessage = {
      id: crypto.randomUUID(),
      sender_type: 'customer',
      sender_name: name,
      sender_email: email,
      body: message,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ ticket: serializeTicket(data, [ticketMessage]) }, { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    return NextResponse.json(
      { error: status === 401 ? 'Please sign in to submit a support ticket.' : 'Unable to submit your ticket.' },
      { status },
    )
  }
}
