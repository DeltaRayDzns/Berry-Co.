'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  return { error: null }
}

export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/orders')
  return { error: null }
}

export type RefundState = { error: string | null; success?: boolean }

/** Bind the order id first: `processRefund.bind(null, orderId)`. Logs the
 * refund in order_refunds and marks the order's payment_status refunded. */
export async function processRefund(
  orderId: string,
  _prevState: RefundState,
  formData: FormData
): Promise<RefundState> {
  const amount = Number(formData.get('amount') ?? 0)
  const reason = String(formData.get('reason') ?? '').trim()

  if (Number.isNaN(amount) || amount <= 0) return { error: 'Enter a valid refund amount.' }

  const supabase = await createClient()

  const { error: refundError } = await supabase
    .from('order_refunds')
    .insert({ order_id: orderId, amount, reason: reason || null })

  if (refundError) return { error: refundError.message }

  const { error: statusError } = await supabase
    .from('orders')
    .update({ payment_status: 'refunded' })
    .eq('id', orderId)

  if (statusError) return { error: statusError.message }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { error: null, success: true }
}