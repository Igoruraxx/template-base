import { AdminLayout } from '@/components/AdminLayout';
import { BillingCharts } from '@/components/admin/BillingCharts';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminBilling = () => {
  const { trainersQuery, subscriptionsQuery } = useAdminData();
  const trainers = trainersQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];

  const premiumSubs = subscriptions.filter(s => s.plan === 'premium' && s.expires_at);
  const upcoming = premiumSubs
    .filter(s => {
      const exp = new Date(s.expires_at!);
      const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff <= 15 && diff > 0;
    })
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime());

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cobranças</h1>
          <p className="text-sm text-muted-foreground mt-1">Faturamento e vencimentos</p>
        </div>

        {trainersQuery.isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <>
            <BillingCharts trainers={trainers} />

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Próximos Vencimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum vencimento nos próximos 15 dias.</p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(s => {
                      const trainer = trainers.find(t => t.user_id === s.trainer_id);
                      return (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium text-sm">{trainer?.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground">{trainer?.email}</p>
                          </div>
                          <Badge variant="outline">
                            {format(new Date(s.expires_at!), "dd 'de' MMM", { locale: ptBR })}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBilling;
