import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, Smartphone, CheckCircle2, Clock, AlertCircle, Loader2, Copy, Receipt } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const formatKes = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

/**
 * One M-Pesa checkout used by every purchase in the app.
 * payload: { category, plan, term, academic_year, learning_areas, target_emails }
 */
export default function MpesaCheckout({ open, onOpenChange, payload, amount, summary, onPaid }) {
  const [step, setStep] = useState('method');
  const [phone, setPhone] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [payment, setPayment] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    if (!open) {
      clearInterval(pollRef.current);
      setStep('method');
      setPhone('');
      setMpesaCode('');
      setPayment(null);
      setInstructions(null);
      setError('');
      setBusy(false);
    }
  }, [open]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const start = async (method) => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('payments', {
        action: 'initiate',
        method,
        phone,
        ...payload,
      });
      const data = res.data;
      if (data.duplicate) {
        setPayment(data.payment);
        setStep('pending');
        setError(data.message || 'This purchase is already awaiting confirmation.');
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      setPayment(data.payment);
      setInstructions({ paybill: data.paybill, amount: data.amount, reference: data.reference });
      if (data.stk) {
        setStep('stk');
        pollRef.current = setInterval(async () => {
          const status = await base44.functions.invoke('payments', { action: 'status', payment_id: data.payment.id });
          const latest = status.data?.payment;
          if (latest?.status === 'approved') {
            clearInterval(pollRef.current);
            setPayment(latest);
            setStep('done');
            onPaid?.(latest);
          } else if (latest?.status === 'rejected') {
            clearInterval(pollRef.current);
            setPayment(latest);
            setStep('failed');
          }
        }, 5000);
      } else {
        setStep('manual');
        if (data.message) setError(data.message);
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not start the payment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('payments', {
        action: 'confirmManual',
        payment_id: payment.id,
        mpesa_code: mpesaCode,
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      setPayment(res.data.payment);
      setStep('pending');
      toast({ title: 'Payment submitted', description: 'It will be confirmed shortly.' });
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not submit that code.');
    } finally {
      setBusy(false);
    }
  };

  const copy = (value) => {
    navigator.clipboard?.writeText(value);
    toast({ title: 'Copied' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-auto max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Pay {formatKes(amount)}
          </DialogTitle>
          {summary && <DialogDescription>{summary}</DialogDescription>}
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">M-Pesa phone number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                inputMode="tel"
              />
            </div>
            <Button className="w-full gap-2 h-11" disabled={busy || !phone.trim()} onClick={() => start('mpesa_stk')}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Pay with M-Pesa
            </Button>
            <Button variant="outline" className="w-full h-11" disabled={busy} onClick={() => start('manual')}>
              Pay manually, then enter the code
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Every payment is verified before access is activated. No duplicate charges.
            </p>
          </div>
        )}

        {step === 'stk' && (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold">Check your phone</p>
            <p className="text-sm text-muted-foreground">
              Enter your M-Pesa PIN to approve {formatKes(amount)}. This screen updates automatically.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for confirmation…
            </div>
          </div>
        )}

        {step === 'manual' && instructions && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Pay via M-Pesa
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p>Paybill / Till: <strong className="text-foreground">{instructions.paybill || 'See school office'}</strong></p>
                <p>Amount: <strong className="text-foreground">{formatKes(instructions.amount)}</strong></p>
                <p className="flex items-center gap-2">
                  Account / Reference: <strong className="text-foreground font-mono">{instructions.reference}</strong>
                  <button onClick={() => copy(instructions.reference)} className="text-primary"><Copy className="w-3.5 h-3.5" /></button>
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">M-Pesa transaction code</Label>
              <Input
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. QGX1234ABC"
                maxLength={10}
                className="font-mono tracking-widest text-center"
              />
            </div>
            <Button className="w-full h-11" disabled={busy || mpesaCode.trim().length < 10} onClick={submitCode}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit code'}
            </Button>
          </div>
        )}

        {step === 'pending' && (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <p className="font-semibold">Payment received, awaiting confirmation</p>
            <p className="text-sm text-muted-foreground">
              Access is activated as soon as the payment is verified. Reference{' '}
              <span className="font-mono">{payment?.reference}</span>
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
            <p className="font-semibold">Payment confirmed</p>
            <p className="text-sm text-muted-foreground">Your purchase is now active.</p>
            {payment?.receipt_no && <Badge variant="outline" className="font-mono text-xs">{payment.receipt_no}</Badge>}
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="text-center space-y-3 py-4">
            <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
            <p className="font-semibold">Payment was not completed</p>
            <p className="text-sm text-muted-foreground">{payment?.notes || 'The M-Pesa request was cancelled or declined.'}</p>
            <Button className="w-full" onClick={() => setStep('method')}>Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}