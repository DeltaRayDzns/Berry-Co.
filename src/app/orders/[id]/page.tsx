import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrderByIdForUser } from '@/lib/data/storefront'
import CancelOrderButton from '@/components/storefront/cancel-order-button'
import PaymentStatusBadge from '@/components/storefront/payment-status-badge'

function formatPaymentStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

type ShippingAddressDetails = {
  fullName?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
}

function getShippingAddress(value: string | null): ShippingAddressDetails | null {
  if (!value) return null

  try {
    return JSON.parse(value) as ShippingAddressDetails
  } catch {
    return { address: value }
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const order = await getOrderByIdForUser(user.id, id)
  if (!order) redirect('/orders')

  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingAddress = getShippingAddress(order.order.shipping_address)
  const canCancel = ['pending', 'processing'].includes(order.order.status.toLowerCase())

  return (
    <main className="page-shell">
      <div className="page-container max-w-4xl">
        <div className="content-panel space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Order</p>
              <h1 className="mt-2 text-3xl font-black text-dark">{order.order.order_number}</h1>
            </div>
            <div className="rounded-full bg-cream px-3 py-2 text-sm font-black text-dark">
              {order.order.status}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-dark/10 bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-dark/50">Order total</p>
              <p className="mt-2 text-3xl font-black text-dark">₱{Number(order.order.total_amount).toLocaleString('en-PH')}</p>
            </div>
            <div className="rounded-[1.5rem] border border-dark/10 bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-dark/50">Payment status</p>
              <div className="mt-3">
                <PaymentStatusBadge status={order.order.payment_status} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dark/10 bg-paper p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-dark/50">Shipping address</p>
            <div className="mt-3 space-y-1 text-sm font-bold leading-relaxed text-dark">
              <p>Customer Name: {shippingAddress?.fullName || order.order.customer_name || 'Not provided'}</p>
              <p>Contact No.: {shippingAddress?.phone || 'Not provided'}</p>
              <p>Address: {[shippingAddress?.address, shippingAddress?.city, shippingAddress?.province, shippingAddress?.postalCode].filter(Boolean).join(', ') || 'Not provided'}</p>
              <p>Order Date: {new Date(order.order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-dark/50">Items</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-[1.5rem] border border-dark/10 bg-paper p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream text-[9px] font-black text-dark/50">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-contain" />
                    ) : (
                      'ITEM'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-dark">{item.product_name}</p>
                  <p className="text-sm font-semibold text-dark/60">Qty {item.quantity}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-dark">₱{(item.price * item.quantity).toLocaleString('en-PH')}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-dark/10 bg-cream/40 p-4 text-right">
            <p className="text-sm font-semibold text-dark/60">Subtotal</p>
            <p className="text-2xl font-black text-dark">₱{total.toLocaleString('en-PH')}</p>
          </div>

          <CancelOrderButton orderId={order.order.id} canCancel={canCancel} />
        </div>
      </div>
    </main>
  )
}
