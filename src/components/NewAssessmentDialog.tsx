import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calcSumSkinfolds, calcDensityPollock7, calcBodyFatSiri, calcComposition, Sex } from '@/lib/pollock';
import { useCreateAssessment } from '@/hooks/useAssessments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId: string;
}

const num = (v: string) => (v ? parseFloat(v) : null);

export const NewAssessmentDialog = ({ open, onOpenChange, studentId }: Props) => {
  const { toast } = useToast();
  const create = useCreateAssessment();

  const [f, setF] = useState({
    measuredAt: format(new Date(), 'yyyy-MM-dd'),
    sex: '' as string,
    age: '',
    weight: '',
    // skinfolds
    chest: '', axillary: '', triceps: '', subscapular: '', abdominal: '', suprailiac: '', thigh: '',
    // perimeters
    pNeck: '', pShoulder: '', pChest: '', pWaist: '', pAbdomen: '', pHip: '',
    pArmRelaxed: '', pArmContracted: '', pForearm: '', pThighProximal: '', pThighMid: '', pCalf: '',
    notes: '',
  });

  const set = (key: string, val: string) => setF(p => ({ ...p, [key]: val }));

  // Calc is optional - only computed when all 7 skinfolds + sex + age + weight are present
  const calc = useMemo(() => {
    const s = [f.chest, f.axillary, f.triceps, f.subscapular, f.abdominal, f.suprailiac, f.thigh].map(Number);
    const age = parseInt(f.age);
    const weight = parseFloat(f.weight);
    const sex = f.sex as Sex;
    if (!sex || !age || !weight || s.some(isNaN) || s.some(v => v <= 0)) return null;
    const sum = calcSumSkinfolds(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
    const dc = calcDensityPollock7(sex, age, sum);
    const fat = calcBodyFatSiri(dc);
    const comp = calcComposition(weight, fat);
    return { sum, dc: Math.round(dc * 10000) / 10000, fat: Math.round(fat * 100) / 100, ...comp };
  }, [f]);

  const canSave = !!f.measuredAt && !!f.weight && parseFloat(f.weight) > 0;

  const handleSave = async () => {
    if (!canSave) { toast({ title: 'Data e peso são obrigatórios', variant: 'destructive' }); return; }
    try {
      await create.mutateAsync({
        student_id: studentId,
        measured_at: f.measuredAt,
        sex: (f.sex as 'male' | 'female') || 'male',
        age: parseInt(f.age) || 0,
        weight: parseFloat(f.weight),
        skinfold_chest: num(f.chest), skinfold_axillary: num(f.axillary), skinfold_triceps: num(f.triceps),
        skinfold_subscapular: num(f.subscapular), skinfold_abdominal: num(f.abdominal),
        skinfold_suprailiac: num(f.suprailiac), skinfold_thigh: num(f.thigh),
        perim_neck: num(f.pNeck), perim_shoulder: num(f.pShoulder), perim_chest: num(f.pChest),
        perim_waist: num(f.pWaist), perim_abdomen: num(f.pAbdomen), perim_hip: num(f.pHip),
        perim_arm_relaxed: num(f.pArmRelaxed), perim_arm_contracted: num(f.pArmContracted),
        perim_forearm: num(f.pForearm), perim_thigh_proximal: num(f.pThighProximal),
        perim_thigh_mid: num(f.pThighMid), perim_calf: num(f.pCalf),
        body_density: calc?.dc ?? null, body_fat_pct: calc?.fat ?? null,
        fat_mass_kg: calc?.fat_mass_kg ?? null, lean_mass_kg: calc?.lean_mass_kg ?? null,
        sum_skinfolds: calc?.sum ?? null,
        notes: f.notes || null,
      });
      toast({ title: 'Avaliação salva!' });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const Field = ({ label, k, step = '0.1' }: { label: string; k: string; step?: string }) => (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Input type="number" step={step} value={(f as any)[k]} onChange={e => set(k, e.target.value)}
        className="bg-muted/50 border-border/50 rounded-xl h-10 mt-1" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nova Avaliação Física</DialogTitle>
          <DialogDescription>Protocolo Pollock 7 dobras + Perimetria</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Basic data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Data</Label>
              <Input type="date" value={f.measuredAt} onChange={e => set('measuredAt', e.target.value)}
                className="bg-muted/50 border-border/50 rounded-xl h-10 mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Sexo</Label>
              <Select value={f.sex} onValueChange={v => set('sex', v)}>
                <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-10 mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Idade" k="age" step="1" />
            <Field label="Peso (kg)" k="weight" />
          </div>

          {/* Skinfolds */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dobras Cutâneas (mm)</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peitoral" k="chest" />
              <Field label="Axilar Média" k="axillary" />
              <Field label="Tríceps" k="triceps" />
              <Field label="Subescapular" k="subscapular" />
              <Field label="Abdominal" k="abdominal" />
              <Field label="Suprailíaca" k="suprailiac" />
              <Field label="Coxa" k="thigh" />
            </div>
          </div>

          {/* Perimeters */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Perímetros (cm)</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pescoço" k="pNeck" />
              <Field label="Ombro" k="pShoulder" />
              <Field label="Tórax" k="pChest" />
              <Field label="Cintura" k="pWaist" />
              <Field label="Abdômen" k="pAbdomen" />
              <Field label="Quadril" k="pHip" />
              <Field label="Braço Relaxado" k="pArmRelaxed" />
              <Field label="Braço Contraído" k="pArmContracted" />
              <Field label="Antebraço" k="pForearm" />
              <Field label="Coxa Proximal" k="pThighProximal" />
              <Field label="Coxa Média" k="pThighMid" />
              <Field label="Panturrilha" k="pCalf" />
            </div>
          </div>

          {/* Live preview */}
          {calc && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
              <h4 className="text-xs font-semibold text-primary">Resultados em Tempo Real</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Σ Dobras: <strong>{calc.sum.toFixed(1)} mm</strong></div>
                <div>DC: <strong>{calc.dc}</strong></div>
                <div>Gordura: <strong>{calc.fat.toFixed(1)}%</strong></div>
                <div>Massa Gorda: <strong>{calc.fat_mass_kg.toFixed(1)} kg</strong></div>
                <div>Massa Magra: <strong>{calc.lean_mass_kg.toFixed(1)} kg</strong></div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs">Observações</Label>
            <Input value={f.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Observações opcionais"
              className="bg-muted/50 border-border/50 rounded-xl h-10 mt-1" />
          </div>

          <Button onClick={handleSave} disabled={create.isPending || !canSave}
            className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
            {create.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</> : 'Salvar Avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
