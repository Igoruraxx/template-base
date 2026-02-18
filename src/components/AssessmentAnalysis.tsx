import { Assessment } from '@/hooks/useAssessments';
import { TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  assessments: Assessment[];
}

export const AssessmentAnalysis = ({ assessments }: Props) => {
  if (assessments.length < 2) return null;

  const first = assessments[0];
  const last = assessments[assessments.length - 1];

  const lines: { text: string; positive: boolean }[] = [];

  if (first.body_fat_pct != null && last.body_fat_pct != null) {
    const diff = last.body_fat_pct - first.body_fat_pct;
    if (Math.abs(diff) >= 0.1) {
      lines.push({
        text: diff < 0
          ? `Seu percentual de gordura caiu de ${first.body_fat_pct.toFixed(1)}% para ${last.body_fat_pct.toFixed(1)}% 🎉`
          : `Seu percentual de gordura subiu de ${first.body_fat_pct.toFixed(1)}% para ${last.body_fat_pct.toFixed(1)}%`,
        positive: diff < 0,
      });
    }
  }

  if (first.fat_mass_kg != null && last.fat_mass_kg != null && first.lean_mass_kg != null && last.lean_mass_kg != null) {
    const fatDiff = last.fat_mass_kg - first.fat_mass_kg;
    const leanDiff = last.lean_mass_kg - first.lean_mass_kg;
    if (Math.abs(fatDiff) >= 0.1 || Math.abs(leanDiff) >= 0.1) {
      const parts: string[] = [];
      if (fatDiff < -0.1) parts.push(`perdeu ${Math.abs(fatDiff).toFixed(1)}kg de gordura`);
      if (fatDiff > 0.1) parts.push(`ganhou ${fatDiff.toFixed(1)}kg de gordura`);
      if (leanDiff > 0.1) parts.push(`ganhou ${leanDiff.toFixed(1)}kg de massa magra`);
      if (leanDiff < -0.1) parts.push(`perdeu ${Math.abs(leanDiff).toFixed(1)}kg de massa magra`);
      if (parts.length > 0) {
        lines.push({ text: `Você ${parts.join(' e ')}!`, positive: fatDiff <= 0 && leanDiff >= 0 });
      }
    }
  }

  const perimChecks: { key: keyof Assessment; label: string }[] = [
    { key: 'perim_waist', label: 'cintura' },
    { key: 'perim_abdomen', label: 'abdômen' },
    { key: 'perim_hip', label: 'quadril' },
    { key: 'perim_arm_contracted', label: 'braço contraído' },
    { key: 'perim_chest', label: 'tórax' },
  ];

  for (const { key, label } of perimChecks) {
    const v1 = first[key] as number | null;
    const v2 = last[key] as number | null;
    if (v1 != null && v2 != null) {
      const diff = v2 - v1;
      if (Math.abs(diff) >= 0.5) {
        lines.push({
          text: diff < 0
            ? `Sua ${label} reduziu ${Math.abs(diff).toFixed(1)}cm — ótimo progresso!`
            : `Sua ${label} aumentou ${diff.toFixed(1)}cm`,
          positive: ['cintura', 'abdômen', 'quadril'].includes(label) ? diff < 0 : diff > 0,
        });
      }
    }
  }

  if (lines.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 mb-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" /> Análise do Progresso
      </h3>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {line.positive ? (
              <TrendingDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            ) : (
              <TrendingUp className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            )}
            <span>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
