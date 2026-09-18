'use client'

import { FormEvent, useState } from 'react'
import { HelpCircle, MessageSquareText, Search, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Ticket = {
  id: string
  ticket_number: string
  subject: string
  category: string
  status: string
  created_at: string
  order_number?: string
  messages: { author: string; body: string; created_at: string; isCustomer: boolean }[]
}

const placeholderTickets: Ticket[] = [
  {
    id: 'placeholder-8021',
    ticket_number: 'TICK-8021',
    subject: 'When will my Pokémon Scarlet & Violet Booster Box ship?',
    category: 'Order Status / Shipping',
    status: 'Open',
    order_number: 'BC-98421',
    created_at: '2026-09-18T10:30:00.000Z',
    messages: [
      { author: 'Juan Dela Cruz', body: 'Hi support team! I placed order #BC-98421 yesterday. Just wanted to confirm if it has been dispatched from your Quezon City warehouse?', created_at: '2026-09-18T10:30:00.000Z', isCustomer: true },
      { author: 'Berry Co. Support', body: 'Thanks for reaching out, Juan. We are checking this with our fulfillment team and will update you shortly.', created_at: '2026-09-18T11:05:00.000Z', isCustomer: false },
    ],
  },
  {
    id: 'placeholder-7994',
    ticket_number: 'TICK-7994',
    subject: 'Query regarding One Piece OP-05 singles',
    category: 'Product / Card Condition',
    status: 'Pending',
    order_number: 'BC-97102',
    created_at: '2026-09-16T08:15:00.000Z',
    messages: [{ author: 'Juan Dela Cruz', body: 'Could you share a few close-up photos of the card condition before I place an order?', created_at: '2026-09-16T08:15:00.000Z', isCustomer: true }],
  },
  {
    id: 'placeholder-7810',
    ticket_number: 'TICK-7810',
    subject: 'Do you accept store pick-ups in Quezon City?',
    category: 'General Question',
    status: 'Resolved',
    created_at: '2026-09-10T04:20:00.000Z',
    messages: [{ author: 'Berry Co. Support', body: 'Yes, store pick-ups are available in Quezon City after your order is confirmed.', created_at: '2026-09-10T05:00:00.000Z', isCustomer: false }],
  },
]

type Props = { user: { email: string | null } | null }

type SupportView = 'submit' | 'track'

export default function ContactSupportPanel({
  user,
  activeView,
  onViewChange,
}: Props & { activeView: SupportView; onViewChange: (view: SupportView) => void }) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>(placeholderTickets)
  const [selectedTicketId, setSelectedTicketId] = useState(placeholderTickets[0].id)
  const [trackEmail, setTrackEmail] = useState(user?.email ?? '')
  const [trackMessage, setTrackMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function loadTickets(email?: string) {
    setLoading(true)
    setTrackMessage('')
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    const response = await fetch(`/api/support-tickets${query}`)
    const data = await response.json()
    if (response.ok) {
      if (data.tickets.length > 0) {
        setTickets(data.tickets)
        setSelectedTicketId(data.tickets[0].id)
      } else {
        setTickets([])
        setSelectedTicketId('')
      }
    }
    if (!response.ok) setTrackMessage(data.error ?? 'Unable to load tickets.')
    setLoading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      router.push('/login?redirectTo=/contact')
      return
    }

    setSubmitting(true)
    const response = await fetch('/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    })
    const data = await response.json()
    setSubmitting(false)

    if (response.status === 401) {
      router.push('/login?redirectTo=/contact')
      return
    }
    if (!response.ok) {
      setTrackMessage(data.error ?? 'Unable to submit your ticket.')
      return
    }
    setSubmitted(true)
    const newTicket = { ...data.ticket, messages: data.ticket.messages ?? [] }
    setTickets((current) => [newTicket, ...current])
    setSelectedTicketId(newTicket.id)
  }

  async function handleTicketReply() {
    if (!selectedTicketId || !user) return

    const replyText = trackMessage.trim()
    if (!replyText) return

    const response = await fetch('/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: selectedTicketId, message: replyText }),
    })
    const data = await response.json()

    if (!response.ok) {
      setTrackMessage(data.error ?? 'Unable to send your reply.')
      return
    }

    setTrackMessage('')
    await loadTickets()
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 border-b border-stone-200 bg-[#f7f0e6] p-1.5" role="tablist" aria-label="Support options">
        <button type="button" role="tab" aria-selected={activeView === 'submit'} onClick={() => { onViewChange('submit'); setSubmitted(false) }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors sm:px-5 ${activeView === 'submit' ? 'bg-[#d9483a] text-white shadow-sm' : 'text-stone-600 hover:bg-white hover:text-stone-900'}`}><MessageSquareText size={17} /> Submit Support Ticket</button>
        <button type="button" role="tab" aria-selected={activeView === 'track'} onClick={() => { onViewChange('track'); if (user) void loadTickets() }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors sm:px-5 ${activeView === 'track' ? 'bg-[#d9483a] text-white shadow-sm' : 'text-stone-600 hover:bg-white hover:text-stone-900'}`}><Search size={17} /> Track Tickets</button>
      </div>

      <div className="p-6 sm:p-8">
        {activeView === 'submit' ? (
          !user ? (
            <div className="py-8 text-center"><h2 className="text-xl font-black text-stone-900">Sign in to submit a ticket</h2><p className="mt-2 text-sm text-stone-500">Please sign in so we can link your support conversation to your account.</p><button type="button" onClick={() => router.push('/login?redirectTo=/contact')} className="mt-5 rounded-full bg-[#d9483a] px-6 py-3 text-sm font-black text-white hover:bg-[#b82a20]">Sign in to continue</button></div>
          ) : submitted ? (
            <div className="py-8 text-center" role="status"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Send size={20} /></div><h2 className="mt-4 text-xl font-black text-stone-900">Ticket submitted</h2><p className="mt-2 text-sm text-stone-500">Our support team will reply within 1–2 business days.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-5 rounded-full bg-[#d9483a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b82a20]">Submit another ticket</button></div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div><h2 className="text-xl font-black text-stone-900">Submit Support Ticket</h2><p className="mt-1 text-sm text-stone-500">Tell us how we can help and we will get back to you by email.</p></div>
              <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-stone-700">Full name<input required name="name" className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]" placeholder="Juan Dela Cruz" /></label><label className="text-sm font-bold text-stone-700">Email address<input required type="email" name="email" defaultValue={user.email ?? ''} className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]" placeholder="juan@example.com" /></label></div>
              <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-stone-700">Inquiry category<select required name="category" defaultValue="" className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]"><option value="" disabled>Select a category</option><option value="order-status">Order status / Shipping</option><option value="product">Product / Card condition</option><option value="payment">Payment / Checkout</option><option value="general">General question</option></select></label><label className="text-sm font-bold text-stone-700"><span className="flex items-center gap-1.5">Attach order number <span className="font-normal text-stone-400">(Optional)</span><span title="Attach the number of your order located in your item in the Order Page" aria-label="Attach the number of your order located in your item in the Order Page" className="inline-flex cursor-help text-stone-400"><HelpCircle size={15} /></span></span><input name="orderNumber" className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]" placeholder="e.g. BC-98421" /></label></div>
              <label className="block text-sm font-bold text-stone-700">Subject<input required name="subject" className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]" placeholder="How can we help?" /></label><label className="block text-sm font-bold text-stone-700">Message<textarea required name="message" rows={5} className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 font-normal outline-none focus:border-[#d9483a]" placeholder="Describe your question or issue..." /></label>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-[#d9483a] px-6 py-3 text-sm font-black text-white hover:bg-[#b82a20] disabled:opacity-60"><Send size={16} />{submitting ? 'Sending...' : 'Send ticket'}</button>
            </form>
          )
        ) : (
          <div className="py-4">
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbe3df] text-[#c23f32]"><Search size={20} /></div>
              <h2 className="mt-4 text-xl font-black text-stone-900">{user ? 'Your submitted tickets' : 'Track your tickets'}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{user ? 'View the status and live conversation history of your inquiries.' : 'Enter the email address used for your support request to view its latest status.'}</p>
            </div>
            {!user && <form className="mx-auto mb-6 flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void loadTickets(trackEmail) }}><input required type="email" value={trackEmail} onChange={(event) => setTrackEmail(event.target.value)} aria-label="Support email address" className="min-w-0 flex-1 rounded-full border border-stone-200 bg-[#fcfaf7] px-4 py-3 text-sm outline-none focus:border-[#d9483a]" placeholder="you@example.com" /><button type="submit" className="rounded-full bg-[#d9483a] px-5 py-3 text-sm font-black text-white hover:bg-[#b82a20]">Find tickets</button></form>}
            {trackMessage && <p className="mb-5 text-center text-sm font-semibold text-[#c23f32]">{trackMessage}</p>}
            {loading ? <p className="mt-8 text-center text-sm text-stone-500">Loading tickets...</p> : <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.5fr)]">
              <div className="space-y-3">
                {tickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedTicketId === ticket.id ? 'border-[#d9483a] bg-[#fff4f2]' : 'border-stone-200 bg-[#fcfaf7] hover:border-[#d9483a]/50'}`}><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold text-stone-500">{ticket.ticket_number}</p><span className="rounded-full bg-[#fbe3df] px-2.5 py-1 text-[11px] font-bold capitalize text-[#c23f32]">{ticket.status}</span></div><p className="mt-2 line-clamp-2 text-sm font-bold text-stone-900">{ticket.subject}</p><p className="mt-3 text-xs text-stone-500">{ticket.category}</p>{ticket.order_number && <p className="mt-2 text-xs font-bold text-stone-600">Order #{ticket.order_number}</p>}</button>)}
              </div>
              {(() => {
                const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0]
                if (!selectedTicket) return <div className="flex min-h-80 items-center justify-center rounded-xl border border-stone-200 text-sm text-stone-500">No tickets found.</div>
                return <div className="flex min-h-80 flex-col rounded-xl border border-stone-200 bg-white"><div className="border-b border-stone-200 p-5"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-stone-500">{selectedTicket.ticket_number}</span><span className="rounded-full bg-[#fbe3df] px-2.5 py-1 text-[11px] font-bold capitalize text-[#c23f32]">{selectedTicket.status}</span>{selectedTicket.order_number && <span className="rounded-full bg-[#f7f0e6] px-2.5 py-1 text-[11px] font-bold text-stone-600">Order #{selectedTicket.order_number}</span>}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><h3 className="text-lg font-black text-stone-900">{selectedTicket.subject}</h3><p className="text-sm text-stone-500 sm:text-right">Category: {selectedTicket.category}</p></div></div><div className="flex-1 space-y-4 p-5">{selectedTicket.messages.length > 0 ? selectedTicket.messages.map((message) => <div key={`${message.author}-${message.created_at}`} className={message.isCustomer ? 'ml-auto max-w-[90%]' : 'max-w-[90%]'}><div className={`mb-1 flex items-center gap-2 text-xs text-stone-500 ${message.isCustomer ? 'justify-end' : 'justify-start'}`}><span className="font-bold text-stone-700">{message.author}</span><span>·</span><span>{new Date(message.created_at).toLocaleString()}</span></div><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.isCustomer ? 'rounded-tr-sm bg-[#d9483a] text-white' : 'rounded-tl-sm bg-[#f7f0e6] text-stone-700'}`}>{message.body}</div></div>) : <p className="text-sm text-stone-500">No messages yet. Our team will reply soon.</p>}</div><div className="border-t border-stone-200 p-4"><div className="flex gap-2"><input value={trackMessage} onChange={(event) => setTrackMessage(event.target.value)} aria-label="Reply to support ticket" className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-[#fcfaf7] px-4 py-3 text-sm text-stone-700 outline-none focus:border-[#d9483a]" placeholder="Type a reply to Berry Co. support..." /><button type="button" onClick={() => { void handleTicketReply() }} className="rounded-xl bg-[#d9483a] px-5 py-3 text-sm font-black text-white hover:bg-[#b82a20]">Reply</button></div><p className="mt-2 text-xs text-stone-400">Replies will be available when support messaging is connected.</p></div></div>
              })()}
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}
