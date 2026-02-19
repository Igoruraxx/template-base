import { AdminLayout } from '@/components/AdminLayout';
import { BillingCharts } from '@/components/admin/BillingCharts';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Cobranças</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Gestão de faturamento e assinaturas premium.</p>
        </div>

        {trainersQuery.isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 shadow-sm">
              <BillingCharts trainers={trainers} />
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Próximos Vencimentos</CardTitle>
                <p className="text-xs text-muted-foreground">Assinaturas que expiram nos próximos 15 dias</p>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum vencimento próximo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map(s => {
                      const trainer = trainers.find(t => t.user_id === s.trainer_id);
                      return (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainer?.full_name}`} />
                              <AvatarFallback>{trainer?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{trainer?.full_name || 'Personal'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{trainer?.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-bold bg-background text-[10px] h-6 px-2 border-border/50">
                            {format(new Date(s.expires_at!), "dd 'de' MMM", { locale: ptBR })}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBilling;
