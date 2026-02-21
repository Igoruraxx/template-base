import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TrainerOverview } from '@/hooks/useAdminData';

interface BillingChartsProps {
  trainers: TrainerOverview[];
}

export const BillingCharts = ({ trainers }: BillingChartsProps) => {
  const free = trainers.filter(t => t.plan === 'free').length;
  const premium = trainers.filter(t => t.plan === 'premium').length;

  const planData = [
    { name: 'Gratuito', value: free, fill: 'hsl(220 10% 50%)' },
    { name: 'Assinante', value: premium, fill: 'hsl(160 84% 39%)' },
  ];

  // Simulate MRR growth (last 6 months)
  const months = ['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'];
  const mrrData = months.map((m, i) => ({
    name: m,
    mrr: Math.max(0, premium - (5 - i)) * 9.9,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Gratuitos vs Assinantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={planData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15%)" />
              <XAxis dataKey="name" stroke="hsl(220 10% 50%)" fontSize={12} />
              <YAxis stroke="hsl(220 10% 50%)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(225 20% 9%)',
                  border: '1px solid hsl(225 15% 15%)',
                  borderRadius: '8px',
                  color: 'hsl(210 20% 95%)',
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Faturamento Atual (MRR)
            <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5">Estimativa</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="text-5xl font-black tracking-tighter text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(premium * 9.9)}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Baseado em {premium} assinantes ativos</p>
          <div className="w-full h-2 bg-emerald-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (premium / (free + premium || 1)) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground italic text-center text-balance">
            * O valor real pode variar dependendo de taxas de processamento e períodos de teste.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
