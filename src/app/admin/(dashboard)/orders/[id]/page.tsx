import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, Package } from 'lucide-react'
import { getOrderById, getOrderRefunds } from '@/lib/data/orders'
import OrderStatusBadge from '@/components/admin/orders/order-status-badge'
import PaymentStatusBadge from '@/components/admin/orders/payment-status-badge'
import StatusControl from '@/components/admin/orders/status-control'
import PaymentStatusControl from '@/components/admin/orders/payment-status-control'
import RefundPanel from '@/components/admin/orders/refund-panel'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, refunds] = await Promise.all([getOrderById(id), getOrderRefunds(id)])

  if (!result) notFound()
  const { order, items } = result

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{order.order_number}</h1>
          <p className="text-sm text-stone-500">
            {order.customer_name}
            {order.customer_email && ` · ${order.customer_email}`}
          </p>
          <p className="text-sm text-stone-400">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/orders/${id}/invoice`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
        >
          <FileText size={15} /> Print Invoice
        </Link>
        <Link
          href={`/admin/orders/${id}/packing-slip`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
        >
          <Package size={15} /> Print Packing Slip
        </Link>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-stone-900">Items</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-400">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">₱{Number(item.price).toLocaleString()}</td>
                <td className="py-2 text-right">
                  ₱{(Number(item.price) * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end text-sm font-semibold text-stone-900">
          Total: ₱{Number(order.total_amount).toLocaleString()}
        </div>
      </div>

      <StatusControl orderId={order.id} currentStatus={order.status} />
      <PaymentStatusControl orderId={order.id} currentPaymentStatus={order.payment_status} />

      <RefundPanel
        orderId={order.id}
        totalAmount={order.total_amount}
        paymentStatus={order.payment_status}
        refunds={refunds}
      />
    </div>
  )
}