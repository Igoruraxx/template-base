import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useSessions } from '@/hooks/useSessions';
import { usePayments } from '@/hooks/usePayments';
import { AppLayout } from '@/components/AppLayout';
import { Users, Calendar, DollarSign, TrendingUp, Dumbbell, AlertTriangle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { AIChatAgent } from '@/components/AIChatAgent';

const Index = () => {
  const { user } = useAuth();
  const { data: students } = useStudents();
  const { data: todaySessions } = useSessions(format(new Date(), 'yyyy-MM-dd'));
  const { data: payments } = usePayments();
  const navigate = useNavigate();
  const { isPremium, slotsUsed, slotsTotal, isNearLimit } = useTrainerSubscription();

  const activeStudents = students?.filter(s => s.status === 'active').length || 0;
  const todayCount = todaySessions?.length || 0;
  const completedToday = todaySessions?.filter((s: any) => s.status === 'completed').length || 0;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthRevenue = payments
    ?.filter((p: any) => p.reference_month === currentMonth && p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const pendingPayments = payments
    ?.filter((p: any) => p.status === 'pending').length || 0;

  // Consulting alerts: 3 days before payment_due_day
  const consultingAlerts = useMemo(() => {
    if (!students) return [];
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const dueDay = in3Days.getDate();
    return students.filter((s: any) => s.is_consulting && s.status === 'active' && s.payment_due_day === dueDay);
  }, [students]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Treinador';

  const slotsLabel = isPremium ? `${slotsUsed} • ∞` : `${slotsUsed}/${slotsTotal}`;

  const stats = [
    { label: 'Alunos ativos', value: slotsLabel, icon: isPremium ? Crown : Users, color: isPremium ? 'text-amber-400' : 'text-primary', route: '/students' },
    { label: 'Sessões hoje', value: `${completedToday}/${todayCount}`, icon: Calendar, color: 'text-blue-400', route: '/schedule' },
    { label: 'Receita mês', value: `R$ ${monthRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400', route: '/finance' },
    { label: 'Pendentes', value: pendingPayments, icon: TrendingUp, color: 'text-amber-400', route: '/finance' },
  ];

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Olá, <span className="text-gradient">{firstName}</span> 👋
          </h1>
        </motion.div>

        {/* Consulting alerts */}
        {consultingAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mt-4 space-y-1.5">
            {consultingAlerts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <AlertTriangle className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-xs text-blue-300 font-medium">Atualizar treino de {s.name} — vencimento em 3 dias</span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          {stats.map((stat, i) => (
            <motion.button key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }} onClick={() => navigate(stat.route)}
              className="glass rounded-2xl p-4 text-left hover:scale-[1.02] transition-transform">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Sessões de hoje</h2>
          {todaySessions && todaySessions.length > 0 ? (
            <div className="space-y-2">
              {todaySessions.map((session: any) => (
                <div key={session.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: session.students?.color || '#10b981' }}>
                    {(session.students?.name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.students?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.scheduled_time?.slice(0, 5)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    session.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {session.status === 'completed' ? 'Concluída' : 'Agendada'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <Dumbbell className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma sessão hoje</p>
            </div>
          )}
        </motion.div>
      </div>
      <AIChatAgent />
    </AppLayout>
  );
};


export default Index;
