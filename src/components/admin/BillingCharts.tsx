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

  const mrrEstimate = premium * 9.9;

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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">MRR Atual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[250px]">
          <p className="text-4xl font-black text-emerald-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrrEstimate)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{premium} assinantes × R$ 9,90</p>
          <Badge variant="secondary" className="mt-3 text-[10px]">Estimativa baseada em assinantes ativos</Badge>
        </CardContent>
      </Card>
    </div>
  );
};
