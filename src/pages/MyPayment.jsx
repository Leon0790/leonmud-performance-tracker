import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, XCircle, CreditCard, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const isValidMpesaFormat = (code) => /^[A-Z][A-Z0-9]{9}$/.test(code);

export default function MyPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mpesaCode, setMpesaCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['all-payments-check'],
    queryFn: () => base44.entities.Payment.list(),
    enabled: !!user?.email,
  });

  const payment = payments[0] || null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const code = mpesaCode.trim().toUpperCase();
      setCodeError('');

      if (!isValidMpesaFormat(code)) {
        setCodeError('Invalid M-Pesa code format. It must be exactly 10 characters (e.g. QGH3X7ABCD).');
        throw new Error('invalid_format');
      }

      const alreadyUsed = allPayments.some(p => p.mpesa_code === code);
      if (alreadyUsed) {
        setCodeError('This M-Pesa code has already been used. Please use a new transaction code.');
        throw new Error('duplicate_code');
      }

      return base44.entities.Payment.create({
        teacher_email: user.email,
        mpesa_code: code,
        status: 'approved',
        amount: 200,
        approved_by: 'system',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', user?.email] });
      toast({ title: 'Payment verified! Access granted.' });
      setMpesaCode('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Payment</h1>
          <p className="text-muted-foreground text-sm">Manage your access payment</p>
        </div>
      </div>

      {payment?.status === 'approved' ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Payment Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">Your payment has been verified and your access is active.</p>
            <div className="bg-white rounded-lg p-3 text-sm border border-green-200">
              <p className="font-medium">M-Pesa Code</p>
              <p className="font-mono text-green-700 font-bold text-lg mt-1">{payment.mpesa_code}</p>
              <p className="text-xs text-muted-foreground mt-1">Amount: KES {payment.amount || 200}</p>
            </div>
          </CardContent>
        </Card>
      ) : payment?.status === 'pending' ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-700">Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Your code <span className="font-mono font-bold text-foreground">{payment.mpesa_code}</span> is under review.
            </p>
            <div className="bg-white rounded-lg p-3 text-sm border border-amber-200">
              <p className="font-medium flex items-center justify-center gap-1"><Phone className="w-3.5 h-3.5" /> Admin Contact</p>
              <p className="text-muted-foreground mt-1">0700938979 – Leonard Mudinyu</p>
            </div>
          </CardContent>
        </Card>
      ) : payment?.status === 'rejected' ? (
        <Card className="border-destructive/30">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Payment Rejected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">Your code was rejected. Please submit a new valid M-Pesa code.</p>
            <PaymentForm mpesaCode={mpesaCode} setMpesaCode={setMpesaCode} onSubmit={() => submitMutation.mutate()} isSubmitting={submitMutation.isPending} codeError={codeError} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-sm text-primary">Payment Instructions</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to M-Pesa on your phone</li>
                <li>Select <strong>Send Money</strong></li>
                <li>Enter number: <strong>0700938979</strong></li>
                <li>Enter amount: <strong>KES 200</strong></li>
                <li>Enter your PIN and confirm</li>
                <li>Copy the <strong>M-Pesa transaction code</strong> from SMS</li>
                <li>Paste it below and submit</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-primary/20 text-sm">
                <p className="font-medium text-foreground">Payee: <span className="text-primary">Leonard Mudinyu</span></p>
                <p className="font-medium text-foreground">Phone: <span className="text-primary">0700938979</span></p>
              </div>
            </div>
            <PaymentForm mpesaCode={mpesaCode} setMpesaCode={setMpesaCode} onSubmit={() => submitMutation.mutate()} isSubmitting={submitMutation.isPending} codeError={codeError} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PaymentForm({ mpesaCode, setMpesaCode, onSubmit, isSubmitting, codeError }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>M-Pesa Transaction Code</Label>
        <Input
          placeholder="e.g. QGH3X7ABCD"
          value={mpesaCode}
          onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
          className={`font-mono tracking-wider mt-1 ${codeError ? 'border-destructive' : ''}`}
          maxLength={10}
        />
        {codeError && <p className="text-xs text-destructive mt-1">{codeError}</p>}
      </div>
      <Button onClick={onSubmit} disabled={!mpesaCode.trim() || isSubmitting} className="w-full">
        {isSubmitting ? 'Verifying...' : 'Submit Payment Code'}
      </Button>
    </div>
  );
}