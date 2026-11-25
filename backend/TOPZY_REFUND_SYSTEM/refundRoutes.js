import { Router } from 'express';
import { adminDb } from '../supabase.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';

const router = Router();
const allowedReasons = new Set([
  'duplicate_payment', 'order_cancelled', 'item_unavailable', 'wrong_item', 'other'
]);

// Customer requests a refund for their own order. This does not send money.
router.post('/orders/:orderId/refunds', requireUser, async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  const details = String(req.body?.details || '').trim().slice(0, 1000);
  if (!allowedReasons.has(reason)) {
    return res.status(400).json({ error: 'Choose a valid refund reason' });
  }

  const { data: order, error: orderError } = await adminDb
    .from('orders')
    .select('id,user_id,total_amount,status')
    .eq('id', req.params.orderId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (orderError) return res.status(500).json({ error: 'Could not check order' });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (['cancelled', 'failed'].includes(order.status)) {
    // A refund can still be requested for an already-paid cancelled/failed order.
    // Admin must check the actual payment record before approving.
  }

  const { data: existing, error: existingError } = await adminDb
    .from('topzy_refunds')
    .select('id,status,amount,created_at')
    .eq('order_id', order.id)
    .in('status', ['requested', 'approved', 'processing'])
    .maybeSingle();

  if (existingError) return res.status(500).json({ error: 'Could not check existing refund' });
  if (existing) return res.status(409).json({ error: 'An active refund request already exists', refund: existing });

  const { data, error } = await adminDb
    .from('topzy_refunds')
    .insert({
      order_id: order.id,
      user_id: req.user.id,
      amount: order.total_amount,
      reason,
      details: details || null,
      status: 'requested'
    })
    .select('id,order_id,amount,reason,details,status,created_at')
    .single();

  if (error) return res.status(500).json({ error: 'Could not create refund request' });
  res.status(201).json({ message: 'Refund request submitted for admin review', refund: data });
});

// Customer sees only their own refund requests.
router.get('/my-refunds', requireUser, async (req, res) => {
  const { data, error } = await adminDb
    .from('topzy_refunds')
    .select('id,order_id,amount,reason,details,status,admin_note,created_at,updated_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: 'Could not load refund requests' });
  res.json({ refunds: data || [] });
});

// Admin review queue.
router.get('/admin/refunds', requireUser, requireAdmin, async (_req, res) => {
  const { data, error } = await adminDb
    .from('topzy_refunds')
    .select('id,order_id,user_id,amount,reason,details,status,created_at')
    .in('status', ['requested', 'approved', 'processing'])
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return res.status(500).json({ error: 'Could not load refund queue' });
  res.json({ refunds: data || [] });
});

// Admin may approve or reject. Approval is NOT proof that money has been sent.
router.patch('/admin/refunds/:refundId/review', requireUser, requireAdmin, async (req, res) => {
  const action = req.body?.action;
  const note = String(req.body?.adminNote || '').trim().slice(0, 1000);
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be approve or reject' });
  }

  const { data, error } = await adminDb
    .from('topzy_refunds')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      admin_note: note || null,
      reviewed_by: req.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.refundId)
    .eq('status', 'requested')
    .select('id,status,admin_note,updated_at')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Could not review refund' });
  if (!data) return res.status(409).json({ error: 'Refund is missing or no longer awaiting review' });
  res.json({ message: `Refund ${action}d`, refund: data });
});

// Admin marks refunded only AFTER independently verifying the bank transfer was sent.
router.post('/admin/refunds/:refundId/mark-sent', requireUser, requireAdmin, async (req, res) => {
  const reference = String(req.body?.transferReference || '').trim().slice(0, 120);
  if (reference.length < 4) {
    return res.status(400).json({ error: 'Enter the bank transfer reference after sending the refund' });
  }

  const { data, error } = await adminDb.rpc('topzy_mark_refund_sent', {
    p_refund_id: req.params.refundId,
    p_admin_id: req.user.id,
    p_transfer_reference: reference
  });

  if (error) return res.status(400).json({ error: error.message || 'Could not mark refund as sent' });
  res.json({ message: 'Refund recorded as sent. Keep the bank transfer proof.', refund: data });
});

export default router;
