import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    const { data: tickets, error: ticketError } = await supabase
      .from('support_tickets')
      .select(
        'id, ticket_number, customer_name, customer_email, category, order_number, subject, status, created_at, message'
      )
      .order('created_at', { ascending: false })

    if (ticketError) {
      return NextResponse.json({ error: 'Unable to load tickets.' }, { status: 500 })
    }

    const ticketIds = (tickets ?? []).map((ticket) => ticket.id)
    let messages: any[] = []

    if (ticketIds.length > 0) {
      const { data, error: messageError } = await supabase
        .from('support_ticket_messages')
        .select('id, ticket_id, sender_type, sender_name, sender_email, body, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true })

      if (messageError) {
        return NextResponse.json({ error: 'Unable to load ticket messages.' }, { status: 500 })
      }

      messages = data ?? []
    }

    const grouped = new Map<string, any[]>()
    for (const message of messages) {
      const list = grouped.get(message.ticket_id) ?? []
      list.push(message)
      grouped.set(message.ticket_id, list)
    }

    return NextResponse.json({
      tickets: (tickets ?? []).map((ticket) => ({
        ...ticket,
        messages: grouped.get(ticket.id) ?? [],
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load support tickets.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''
    const payload = contentType.includes('application/json')
      ? await request.json()
      : await request.formData()

    const ticketId = String((payload as any).ticketId ?? (payload as FormData).get('ticketId') ?? '').trim()
    const message = String((payload as any).message ?? (payload as FormData).get('message') ?? '').trim()

    if (!ticketId || !message) {
      return NextResponse.json({ error: 'Ticket ID and message are required.' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    }

    const { error } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      sender_name: admin.profile.full_name || admin.user.email || 'Admin',
      sender_email: admin.user.email,
      body: message,
    })

    if (error) {
      return NextResponse.json({ error: 'Unable to send reply.' }, { status: 500 })
    }

    await supabase
      .from('support_tickets')
      .update({ status: 'pending' })
      .eq('id', ticketId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to send support reply.' }, { status: 500 })
  }
}
