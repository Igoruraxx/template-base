import { Users, DollarSign, UserPlus, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainerOverview } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  trainers: TrainerOverview[];
}

export const SummaryCards = ({ trainers }: SummaryCardsProps) => {
  const activeTrainers = trainers.filter(t => t.sub_status === 'active').length;
  const premiumTrainers = trainers.filter(t => t.plan === 'premium' && t.sub_status === 'active').length;
  const mrr = premiumTrainers * 9.9;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newSignups = trainers.filter(t => new Date(t.created_at) >= oneWeekAgo).length;

  const cards = [
    {
      title: 'Personals Ativos',
      value: activeTrainers,
      icon: Users,
      accent: 'text-blue-500',
      bgAccent: 'bg-blue-500/10',
      description: 'Total na plataforma',
    },
    {
      title: 'Faturamento (MRR)',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr),
      icon: DollarSign,
      accent: 'text-emerald-500',
      bgAccent: 'bg-emerald-500/10',
      description: `${premiumTrainers} assinantes premium`,
    },
    {
      title: 'Novos Usuários',
      value: newSignups,
      icon: UserPlus,
      accent: 'text-amber-500',
      bgAccent: 'bg-amber-500/10',
      description: 'Últimos 7 dias',
      growth: '+12%',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="group border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-6 relative">
             <div className={cn(
               "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
               card.bgAccent
             )} />
             
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-3xl font-black tracking-tight">{card.value}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground">{card.description}</p>
                  {card.growth && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {card.growth}
                    </span>
                  )}
                </div>
              </div>
              <div className={cn(
                "p-3 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                card.bgAccent
              )}>
                <card.icon className={cn("h-6 w-6", card.accent)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
