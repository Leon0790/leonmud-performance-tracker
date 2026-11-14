import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, CreditCard, BookOpen, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const CATEGORY_LABEL = {
  platform_subscription: { label: 'Subscription', icon: Wallet, className: 'bg-blue-100 text-blue-700' },
  lesson_plan: { label: 'Lesson plan', icon: BookOpen, className: 'bg-purple-100 text-purple-700' },
  legacy: { label: 'Legacy', icon: CreditCard, className: 'bg-muted text-muted-foreground' },
};

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await base44.functions.invoke('payments', { action, payment_id: id });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-licences'] });
      toast({ title: action === 'approve' ? 'Payment approved and access granted' : 'Payment rejected' });
    },
    onError: (e) => toast({ title: 'Could not update payment', description: e.message, variant: 'destructive' }),
  });

  const statusBadge = (status) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <CreditCard className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground text-sm">Every transaction, receipt and platform revenue</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">No payments yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const category = CATEGORY_LABEL[p.category || 'legacy'];
            return (
              <Card key={p.id} className="border-border/50 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.payer_email || p.teacher_email}</p>
                      <p className="text-xs text-muted-foreground">{p.notes || 'Access payment'}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.school_name ? `${p.school_name} · ` : ''}
                        {p.mpesa_code ? `M-Pesa ${p.mpesa_code} · ` : ''}
                        {p.created_date ? format(new Date(p.created_date), 'dd MMM yyyy, HH:mm') : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-sm">KSh {Number(p.amount).toLocaleString()}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${category.className}`}>{category.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(p.status)}
                    {p.receipt_no && <span className="text-[11px] text-muted-foreground font-mono">{p.receipt_no}</span>}
                  </div>

                  <div className="flex gap-2">
                    {p.status !== 'approved' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => reviewMutation.mutate({ id: p.id, action: 'approve' })}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve & grant access
                      </Button>
                    )}
                    {p.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewMutation.mutate({ id: p.id, action: 'reject' })}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}