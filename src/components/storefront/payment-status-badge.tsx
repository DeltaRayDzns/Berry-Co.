type PaymentStatusBadgeProps = {
  status: string
}

const styles: Record<string, string> = {
  pending: 'bg-stone-100 text-stone-700 border border-stone-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  refunded: 'bg-[#fbe3df] text-[#c23f32] border border-[#f3c4bc]',
}

const labels: Record<string, string> = {
  pending: 'Payment Pending',
  paid: 'Paid',
  refunded: 'Refunded',
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const normalized = String(status ?? '').toLowerCase()
  const tone = styles[normalized] ?? 'bg-stone-100 text-stone-700 border border-stone-200'
  const label = labels[normalized] ?? (status || 'Pending')

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tone}`}>
      {label}
    </span>
  )
}
