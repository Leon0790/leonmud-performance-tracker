import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, Phone, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentGate({ user, children }) {
  if (!user) return children; // Not yet loaded, let App handle auth state
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mpesaCode, setMpesaCode] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const payment = payments[0] || null;

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.Payment.create({
      teacher_email: user.email,
      mpesa_code: mpesaCode.trim().toUpperCase(),
      status: 'pending',
      amount: 200,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', user?.email] });
      toast({ title: 'Payment submitted! Awaiting admin approval.' });
      setMpesaCode('');
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Admin bypass - admins don't need to pay
  if (user?.role === 'admin') return children;

  // Approved - let them through
  if (payment?.status === 'approved') return children;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">LeonMud Tracker</h1>
          <p className="text-muted-foreground mt-1">Performance Tracking System</p>
        </div>

        {payment?.status === 'pending' ? (
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-muted-foreground">
                Your M-Pesa code <span className="font-bold text-foreground">{payment.mpesa_code}</span> has been submitted and is awaiting admin approval.
              </p>
              <p className="text-sm text-muted-foreground">Please contact the administrator if approval is delayed.</p>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">Admin Contact</p>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> 0700938979 – Leonard Mudinyu
                </p>
              </div>
            </CardContent>
          </Card>
        ) : payment?.status === 'rejected' ? (
          <Card className="shadow-xl border-destructive/30">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-lg text-destructive">Payment Rejected</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">Your payment code was rejected. Please make payment and submit a valid M-Pesa code.</p>
              <PaymentForm
                mpesaCode={mpesaCode}
                setMpesaCode={setMpesaCode}
                onSubmit={() => submitMutation.mutate()}
                isSubmitting={submitMutation.isPending}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-center">Access Payment Required</CardTitle>
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
                  <li>Copy the <strong>M-Pesa transaction code</strong> sent via SMS</li>
                  <li>Paste it below and submit</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-primary/20 text-sm">
                  <p className="font-medium text-foreground">Paybill Name: <span className="text-primary">Leonard Mudinyu</span></p>
                  <p className="font-medium text-foreground">Phone: <span className="text-primary">0700938979</span></p>
                </div>
              </div>
              <PaymentForm
                mpesaCode={mpesaCode}
                setMpesaCode={setMpesaCode}
                onSubmit={() => submitMutation.mutate()}
                isSubmitting={submitMutation.isPending}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PaymentForm({ mpesaCode, setMpesaCode, onSubmit, isSubmitting }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>M-Pesa Transaction Code</Label>
        <Input
          placeholder="e.g. QGH3X7ABCD"
          value={mpesaCode}
          onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
          className="font-mono tracking-wider mt-1"
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={!mpesaCode.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Payment Code'}
      </Button>
    </div>
  );
}