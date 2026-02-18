import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAssessments, useDeleteAssessment, Assessment } from '@/hooks/useAssessments';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NewAssessmentDialog } from './NewAssessmentDialog';
import { AssessmentAnalysis } from './AssessmentAnalysis';

interface Props {
  studentId: string;
}

export const AssessmentTab = ({ studentId }: Props) => {
  const { data: assessments } = useAssessments(studentId);
  const deleteAssessment = useDeleteAssessment();
  const [dialogOpen, setDialogOpen] = useState(false);

  const records = assessments || [];

  const compData = records.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'G%': r.body_fat_pct != null ? Number(r.body_fat_pct) : null,
    'Peso (kg)': Number(r.weight),
  }));

  const skinfoldData = records.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'Peitoral': r.skinfold_chest, 'Axilar': r.skinfold_axillary, 'Tríceps': r.skinfold_triceps,
    'Subescap.': r.skinfold_subscapular, 'Abdominal': r.skinfold_abdominal,
    'Suprail.': r.skinfold_suprailiac, 'Coxa': r.skinfold_thigh,
  }));

  const perimData = records.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'Pescoço': r.perim_neck, 'Ombro': r.perim_shoulder, 'Tórax': r.perim_chest,
    'Cintura': r.perim_waist, 'Abdômen': r.perim_abdomen, 'Quadril': r.perim_hip,
    'Braço Rel.': r.perim_arm_relaxed, 'Braço Cont.': r.perim_arm_contracted,
    'Antebraço': r.perim_forearm, 'Coxa Prox.': r.perim_thigh_proximal,
    'Coxa Méd.': r.perim_thigh_mid, 'Panturrilha': r.perim_calf,
  }));

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
    '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

  const chartStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: 12,
  };

  const Chart = ({ data, keys, title }: { data: any[]; keys: string[]; title: string }) => {
    if (data.length < 2) return null;
    return (
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={chartStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {keys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
                strokeWidth={2} dot={{ r: 2 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setDialogOpen(true)} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Nova Avaliação
        </Button>
      </div>

      <AssessmentAnalysis assessments={records} />

      <Chart data={compData} keys={['G%', 'Peso (kg)']} title="Composição Corporal" />
      <Chart data={perimData}
        keys={['Pescoço', 'Ombro', 'Tórax', 'Cintura', 'Abdômen', 'Quadril',
          'Braço Rel.', 'Braço Cont.', 'Antebraço', 'Coxa Prox.', 'Coxa Méd.', 'Panturrilha']}
        title="Perímetros (cm)" />
      <Chart data={skinfoldData}
        keys={['Peitoral', 'Axilar', 'Tríceps', 'Subescap.', 'Abdominal', 'Suprail.', 'Coxa']}
        title="Dobras Cutâneas (mm)" />

      <div className="space-y-2">
        {records.slice().reverse().map(r => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-3">
            <div className="flex justify-between items-start">
              <p className="text-xs text-muted-foreground font-medium">
                {format(parseISO(r.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <button onClick={() => deleteAssessment.mutate({ id: r.id, studentId })}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Stat label="Peso" value={`${Number(r.weight).toFixed(1)} kg`} />
              {r.body_fat_pct != null && <Stat label="G%" value={`${Number(r.body_fat_pct).toFixed(1)}%`} />}
              {r.fat_mass_kg != null && <Stat label="M. Gorda" value={`${Number(r.fat_mass_kg).toFixed(1)} kg`} />}
              {r.lean_mass_kg != null && <Stat label="M. Magra" value={`${Number(r.lean_mass_kg).toFixed(1)} kg`} />}
            </div>
          </motion.div>
        ))}
        {records.length === 0 && (
          <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada</p>
          </div>
        )}
      </div>

      <NewAssessmentDialog open={dialogOpen} onOpenChange={setDialogOpen} studentId={studentId} />
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-base font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);
