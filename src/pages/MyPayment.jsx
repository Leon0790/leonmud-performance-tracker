import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle2, Clock, Receipt } from 'lucide-react';
import { useAccount } from '@/hooks/use-account';
import { usePremium } from '@/hooks/use-premium';
import { format } from 'date-fns';

export default function MyPayment() {
  const { user } = useAccount();
  const { isPremium, isInTrial, trialDaysLeft, licence, subDaysLeft, subExpiry } = usePremium();

  const { data: payments = [] } = useQuery({
    queryKey: ['my-all-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ payer_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My payment & subscription</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your access status, receipts and history</p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              {isPremium ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
              {licence
                ? `${licence.plan} subscription active`
                : isInTrial
                  ? `Free trial — ${trialDaysLeft} day(s) left`
                  : 'No active subscription'}
            </p>
            <p className="text-xs text-muted-foreground">
              {subExpiry ? `Renews / expires ${format(new Date(subExpiry), 'd MMM yyyy')}` : 'Subscribe to unlock every feature'}
              {licence && subDaysLeft > 0 ? ` · ${subDaysLeft} days left` : ''}
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link to="/subscribe"><CreditCard className="w-4 h-4" /> {isPremium ? 'Renew' : 'Subscribe'}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Receipts</p>
          {payments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No payments yet.</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-xs border-b last:border-0 py-1.5">
                <div className="min-w-0">
                  <p className="truncate">{p.notes || 'Access payment'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.created_date ? format(new Date(p.created_date), 'd MMM yyyy, HH:mm') : ''}
                    {p.mpesa_code ? ` · ${p.mpesa_code}` : ''}
                    {p.receipt_no ? ` · ${p.receipt_no}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">KSh {Number(p.amount).toLocaleString()}</p>
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}