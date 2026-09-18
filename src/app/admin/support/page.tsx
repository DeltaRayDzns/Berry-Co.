'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, MessageSquareText, RefreshCw, Reply } from 'lucide-react'

type TicketMessage = {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'admin'
  sender_name: string
  sender_email?: string | null
  body: string
  created_at: string
}

type SupportTicket = {
  id: string
  ticket_number: string
  customer_name: string
  customer_email: string
  category: string
  order_number?: string | null
  subject: string
  status: string
  created_at: string
  message: string
  messages: TicketMessage[]
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/support', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          setTickets([])
          setSelectedTicketId(null)
          setError('Please sign in as an admin to view support tickets.')
          return
        }

        throw new Error(data.error ?? 'Unable to load tickets.')
      }

      const nextTickets: SupportTicket[] = data.tickets ?? []
      setTickets(nextTickets)
      setSelectedTicketId((current) => {
        if (nextTickets.some((ticket) => ticket.id === current)) return current
        return nextTickets[0]?.id ?? null
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load support tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
    const interval = setInterval(() => {
      void loadTickets()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0] ?? null,
    [selectedTicketId, tickets]
  )

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, message: reply.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to send reply.')
      }

      setReply('')
      await loadTickets()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send reply.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Customer Support</h1>
          <p className="text-sm text-stone-500">Review tickets and reply to customers from the admin dashboard.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadTickets()}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-300"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f3c4bc] bg-[#fff1ee] px-3 py-2 text-sm font-medium text-[#c23f32]">
            <MessageSquareText size={16} />
            {tickets.length} Ticket{tickets.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.5fr)]">
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          {loading && tickets.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center text-sm text-stone-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500">
              No support tickets yet.
            </div>
          ) : (
            tickets.map((ticket) => {
              const active = ticket.id === selectedTicket?.id
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    active ? 'border-[#d9483a] bg-[#fff4f2]' : 'border-stone-200 bg-[#fcfaf7] hover:border-[#d9483a]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-500">{ticket.ticket_number}</span>
                    <span className="rounded-full bg-[#fbe3df] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c23f32]">
                      {ticket.status}
                    </span>
                  </div>

                  <h2 className="mt-3 text-base font-bold text-stone-900">{ticket.subject}</h2>
                  <p className="mt-2 text-xs text-stone-500">{ticket.customer_name} • {ticket.customer_email}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {ticket.category} {ticket.order_number ? `• Order #${ticket.order_number}` : ''}
                  </p>
                  <p className="mt-3 text-sm text-stone-700">{ticket.message}</p>
                </button>
              )
            })
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          {!selectedTicket ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-stone-500">
              Select a ticket to begin replying.
            </div>
          ) : (
            <>
              <div className="border-b border-stone-200 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Ticket</p>
                    <h2 className="mt-1 text-xl font-black text-stone-900">{selectedTicket.subject}</h2>
                  </div>
                  <div className="rounded-full bg-[#f7f0e6] px-3 py-1 text-xs font-bold text-stone-600">
                    {selectedTicket.status}
                  </div>
                </div>
                <div className="mt-2 text-sm text-stone-500">
                  {selectedTicket.customer_name} • {selectedTicket.customer_email}
                  {selectedTicket.order_number ? ` • Order #${selectedTicket.order_number}` : ''}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {(selectedTicket.messages ?? []).map((message) => {
                  const isAdmin = message.sender_type === 'admin'
                  return (
                    <div key={message.id} className={isAdmin ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'}>
                      <div className={`mb-1 flex items-center gap-2 text-[11px] text-stone-500 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-bold text-stone-700">{message.sender_name}</span>
                        <span>•</span>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isAdmin ? 'rounded-tr-sm bg-[#d9483a] text-white' : 'rounded-tl-sm bg-[#f7f0e6] text-stone-700'}`}>
                        {message.body}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  required
                  placeholder="Type a reply to the customer..."
                  className="w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 text-sm outline-none focus:border-[#d9483a]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleReply()}
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#d9483a] px-5 py-2.5 text-sm font-black text-white hover:bg-[#b82a20] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply size={16} />}
                    {sending ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
