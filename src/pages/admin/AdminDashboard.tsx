import { AdminLayout } from '@/components/AdminLayout';
import { SummaryCards } from '@/components/admin/SummaryCards';
import { BillingCharts } from '@/components/admin/BillingCharts';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserPlus, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { trainersQuery, recentTrainersQuery, recentStudentsQuery } = useAdminData();
  const trainers = trainersQuery.data ?? [];
  const recentTrainers = recentTrainersQuery.data ?? [];
  const recentStudents = recentStudentsQuery.data ?? [];

  const handleRefresh = () => {
    trainersQuery.refetch();
    recentTrainersQuery.refetch();
    recentStudentsQuery.refetch();
  };

  const isLoading = trainersQuery.isLoading || recentTrainersQuery.isLoading || recentStudentsQuery.isLoading;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Bem-vindo de volta ao centro de operações.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl border-border/50 bg-card/50">
              Atualizar
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/users')} className="rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
              Gerenciar Personals
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            <SummaryCards trainers={trainers} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <BillingCharts trainers={trainers} />
              </div>

              <div className="space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-blue-500" /> Novos Personals
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-wider" onClick={() => navigate('/admin/users')}>
                      Ver todos
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentTrainers.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.full_name}`} />
                            <AvatarFallback>{t.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{t.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-500" /> Alunos Recentes
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-wider" onClick={() => navigate('/admin/students')}>
                      Ver todos
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentStudents.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={s.avatar_url} />
                            <AvatarFallback>{s.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              via {trainers.find(tr => tr.user_id === s.trainer_id)?.full_name?.split(' ')[0] || '—'} • {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
