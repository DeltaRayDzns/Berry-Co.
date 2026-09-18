'use client'

import { useState } from 'react'
import { Clock, Mail } from 'lucide-react'
import ContactSupportPanel from './contact-support-panel'

export default function ContactSupportLayout({
  user,
  supportEmail,
}: {
  user: { email: string | null } | null
  supportEmail: string
}) {
  const [activeView, setActiveView] = useState<'submit' | 'track'>('submit')

  return (
    <>
      {activeView === 'submit' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe3df] text-[#c23f32]"><Mail size={18} /></div>
            <div>
              <p className="font-medium text-stone-900">Direct Email Support</p>
              <a href={`mailto:${supportEmail}`} className="text-sm text-[#c23f32] hover:underline">{supportEmail}</a>
              <p className="mt-1 text-sm text-stone-500">Our system can automatically notify and update synchronously with ticket submissions through email.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6e3c9] text-[#a97a2e]"><Clock size={18} /></div>
            <div><p className="font-medium text-stone-900">Response time</p><p className="text-sm text-stone-500">We typically reply within 1–2 business days. For order-related questions, include your order number so we can help faster.</p></div>
          </div>
        </div>
      )}
      <ContactSupportPanel activeView={activeView} onViewChange={setActiveView} user={user} />
    </>
  )
}