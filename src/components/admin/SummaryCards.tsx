import { Users, DollarSign, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainerOverview } from '@/hooks/useAdminData';

interface SummaryCardsProps {
  trainers: TrainerOverview[];
}

export const SummaryCards = ({ trainers }: SummaryCardsProps) => {
  const activeTrainers = trainers.filter(t => t.sub_status === 'active').length;
  const mrr = trainers.filter(t => t.plan === 'premium' && t.sub_status === 'active').length * 9.9;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newSignups = trainers.filter(t => new Date(t.created_at) >= oneWeekAgo).length;

  const cards = [
    {
      title: 'Personals Ativos',
      value: activeTrainers,
      icon: Users,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
    },
    {
      title: 'Faturamento (MRR)',
      value: `R$ ${mrr.toFixed(2)}`,
      icon: DollarSign,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
    },
    {
      title: 'Novos esta semana',
      value: newSignups,
      icon: UserPlus,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgAccent}`}>
                <card.icon className={`h-5 w-5 ${card.accent}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
