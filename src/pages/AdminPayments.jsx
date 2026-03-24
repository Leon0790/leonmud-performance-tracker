import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Payment.update(id, { status, approved_by: user?.email }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      toast({ title: status === 'approved' ? 'Payment approved!' : 'Payment rejected.' });
    },
  });

  const statusBadge = (status) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <CreditCard className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payment Approvals</h1>
          <p className="text-muted-foreground text-sm">Manage teacher access payments (KES 200)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">
            No payment submissions yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{p.teacher_email}</p>
                  <p className="text-muted-foreground text-sm">
                    M-Pesa Code: <span className="font-mono font-bold text-foreground">{p.mpesa_code}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {p.created_date ? format(new Date(p.created_date), 'dd MMM yyyy, HH:mm') : '—'}
                  </p>
                  <div className="flex items-center gap-2">
                    {statusBadge(p.status)}
                    {p.approved_by === 'system' && <span className="text-xs text-muted-foreground">(auto-verified)</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateMutation.mutate({ id: p.id, status: 'approved' })}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}
                  {p.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateMutation.mutate({ id: p.id, status: 'rejected' })}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}