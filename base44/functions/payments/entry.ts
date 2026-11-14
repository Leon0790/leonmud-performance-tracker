import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { pricePurchase, fulfillPayment, normalizePhone, receiptNumber, PRICES } from '../../shared/fulfillment.ts';

function darajaBase() {
  const env = (secrets.get('MPESA_ENV') || 'sandbox').toLowerCase();
  return env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function stkPush({ phone, amount, reference, description, callbackUrl }) {
  const key = secrets.get('MPESA_CONSUMER_KEY');
  const secret = secrets.get('MPESA_CONSUMER_SECRET');
  const shortcode = secrets.get('MPESA_SHORTCODE');
  const passkey = secrets.get('MPESA_PASSKEY');
  if (!key || !secret || !shortcode || !passkey) return { ok: false, reason: 'M-Pesa STK Push is not configured yet' };

  const credentials = btoa(`${key}:${secret}`);
  const tokenRes = await fetch(`${darajaBase()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenRes.ok) return { ok: false, reason: 'Could not authenticate with M-Pesa' };
  const { access_token: accessToken } = await tokenRes.json();

  const ts = timestamp();
  const password = btoa(`${shortcode}${passkey}${ts}`);
  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: reference,
    TransactionDesc: description.slice(0, 60),
  };

  const pushRes = await fetch(`${darajaBase()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = await pushRes.json().catch(() => ({}));
  if (!pushRes.ok || data.ResponseCode !== '0') {
    return { ok: false, reason: data.errorMessage || data.ResponseDescription || 'M-Pesa rejected the request' };
  }
  return { ok: true, checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const sr = base44.asServiceRole;

    // ---- M-Pesa confirmation webhook (called by Safaricom, shared-secret protected) ----
    if (action === 'callback') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token') || '';
      const expected = secrets.get('MPESA_CALLBACK_TOKEN') || '';
      if (!expected || token !== expected) return Response.json({ error: 'Invalid callback token' }, { status: 403 });

      const callback = body.body?.stkCallback || body.Body?.stkCallback || {};
      const checkoutId = callback.CheckoutRequestID;
      if (!checkoutId) return Response.json({ error: 'Missing CheckoutRequestID' }, { status: 400 });

      const found = await sr.entities.Payment.filter({ checkout_request_id: checkoutId }, undefined, 5);
      const payment = (found.items || found)[0];
      if (!payment) return Response.json({ ResultCode: 0, ResultDesc: 'No matching payment' });
      if (payment.status === 'approved') return Response.json({ ResultCode: 0, ResultDesc: 'Already processed' });

      if (Number(callback.ResultCode) !== 0) {
        await sr.entities.Payment.update(payment.id, {
          status: 'rejected',
          notes: `${payment.notes || ''} · ${callback.ResultDesc || 'Payment cancelled'}`.trim(),
        });
        return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const items = callback.CallbackMetadata?.Item || [];
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value || '';
      const paidAmount = Number(items.find((i) => i.Name === 'Amount')?.Value || 0);
      if (paidAmount && paidAmount < Number(payment.amount)) {
        await sr.entities.Payment.update(payment.id, { status: 'rejected', notes: 'Amount paid was less than the amount due' });
        return Response.json({ ResultCode: 0, ResultDesc: 'Amount mismatch' });
      }

      const approved = await sr.entities.Payment.update(payment.id, {
        status: 'approved',
        mpesa_code: receipt,
        mpesa_receipt: receipt,
        receipt_no: receiptNumber(),
        confirmed_at: new Date().toISOString(),
        approved_by: 'mpesa-callback',
      });
      await fulfillPayment(sr, { ...payment, ...approved });
      return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // ---- every other action needs a signed-in user ----
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userRecords = await sr.entities.User.filter({ email: user.email });
    const profile = (userRecords.items || userRecords)[0] || {};

    if (action === 'status') {
      if (!body.payment_id) return Response.json({ error: 'payment_id is required' }, { status: 400 });
      const payment = await sr.entities.Payment.get(body.payment_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 });
      return Response.json({ payment });
    }

    if (action === 'initiate') {
      const targets = Array.isArray(body.target_emails) && body.target_emails.length ? body.target_emails : [user.email];
      const priced = pricePurchase({ ...body, target_emails: targets });
      if (priced.error) return Response.json({ error: priced.error }, { status: 400 });

      const isAdmin = user.role === 'admin' || profile.user_type === 'super_admin';
      const isHeadteacher = profile.user_type === 'headteacher';

      // Teachers may only buy for themselves; headteachers only for their own school.
      if (!isAdmin && !isHeadteacher && targets.some((t) => t !== user.email)) {
        return Response.json({ error: 'You can only pay for your own learning areas' }, { status: 403 });
      }
      if (isHeadteacher) {
        if (!profile.school_id) return Response.json({ error: 'Your account is not linked to a school' }, { status: 400 });
        const staff = await sr.entities.TeacherProfile.filter({ school_id: profile.school_id }, undefined, 300);
        const emails = (staff.items || staff).map((s) => s.teacher_email);
        if (targets.some((t) => !emails.includes(t))) {
          return Response.json({ error: 'You can only buy for teachers in your school' }, { status: 403 });
        }
      }

      // Prevent duplicate submissions while an identical payment is still pending.
      const pending = await sr.entities.Payment.filter({
        payer_email: user.email,
        category: priced.category,
        status: 'pending',
        term: priced.category === 'lesson_plan' ? body.term : '',
      }, '-created_date', 10);
      const duplicate = (pending.items || pending).find((p) => {
        if (priced.category !== 'lesson_plan') return false;
        const sameAreas = (p.learning_areas || []).sort().join('|') === priced.areas.slice().sort().join('|');
        const sameTargets = (p.target_emails || []).sort().join('|') === priced.targets.slice().sort().join('|');
        return sameAreas && sameTargets && p.academic_year === String(body.academic_year || '');
      });
      if (duplicate) {
        return Response.json({ duplicate: true, payment: duplicate, message: 'This purchase is already awaiting payment confirmation' });
      }

      const reference = `LM${Date.now().toString().slice(-8)}`;
      const phone = normalizePhone(body.phone);
      const method = body.method === 'mpesa_stk' ? 'mpesa_stk' : 'manual';

      const payment = await sr.entities.Payment.create({
        teacher_email: user.email,
        payer_email: user.email,
        beneficiary_email: priced.targets[0],
        target_emails: priced.targets,
        school_id: profile.school_id || '',
        school_name: profile.school_name || '',
        category: priced.category,
        plan: priced.plan,
        amount: priced.amount,
        quantity: priced.quantity,
        learning_area: priced.areas[0] || '',
        learning_areas: priced.areas,
        term: priced.category === 'lesson_plan' ? body.term : '',
        academic_year: priced.category === 'lesson_plan' ? String(body.academic_year) : '',
        notes: priced.notes,
        reference,
        gateway: method,
        phone: phone || body.phone || '',
        status: 'pending',
      });

      if (method === 'mpesa_stk') {
        const origin = req.headers.get('X-Base44-App-Url') || 'https://leon-track-grade.base44.app';
        const callbackToken = secrets.get('MPESA_CALLBACK_TOKEN') || '';
        const push = await stkPush({
          phone,
          amount: priced.amount,
          reference,
          description: priced.notes,
          callbackUrl: `${origin}/functions/payments?token=${callbackToken}`,
        });
        if (push.ok) {
          await sr.entities.Payment.update(payment.id, {
            checkout_request_id: push.checkoutRequestId,
            merchant_request_id: push.merchantRequestId,
          });
          return Response.json({ payment: { ...payment, checkout_request_id: push.checkoutRequestId }, stk: true });
        }
        return Response.json({ payment, stk: false, message: push.reason });
      }

      const paybill = secrets.get('MPESA_PAYBILL') || secrets.get('MPESA_SHORTCODE') || '';
      return Response.json({ payment, stk: false, paybill, amount: priced.amount, reference, priceGuide: PRICES });
    }

    if (action === 'confirmManual') {
      const { payment_id, mpesa_code } = body;
      if (!payment_id || !mpesa_code) return Response.json({ error: 'payment_id and mpesa_code are required' }, { status: 400 });
      const code = String(mpesa_code).trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9]{9}$/.test(code)) return Response.json({ error: 'Enter a valid 10-character M-Pesa code' }, { status: 400 });

      const payment = await sr.entities.Payment.get(payment_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 });
      if (payment.payer_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const used = await sr.entities.Payment.filter({ mpesa_code: code }, undefined, 5);
      if ((used.items || used).length) return Response.json({ error: 'That M-Pesa code has already been used' }, { status: 409 });

      const updated = await sr.entities.Payment.update(payment_id, { mpesa_code: code, gateway: 'manual' });
      return Response.json({ payment: updated });
    }

    if (action === 'approve' || action === 'reject') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const payment = await sr.entities.Payment.get(body.payment_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 });
      if (action === 'reject') {
        const rejected = await sr.entities.Payment.update(payment.id, { status: 'rejected', approved_by: user.email });
        return Response.json({ payment: rejected });
      }
      if (payment.status === 'approved') return Response.json({ payment, alreadyApproved: true });

      const approved = await sr.entities.Payment.update(payment.id, {
        status: 'approved',
        receipt_no: receiptNumber(),
        confirmed_at: new Date().toISOString(),
        approved_by: user.email,
      });
      const granted = await fulfillPayment(sr, { ...payment, ...approved });
      return Response.json({ payment: approved, granted });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}