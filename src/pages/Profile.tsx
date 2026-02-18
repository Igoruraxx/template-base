import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, useUpdateStudent } from '@/hooks/useStudents';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Key, Copy, Shield, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: students } = useStudents();
  const updateStudent = useUpdateStudent();
  const { toast } = useToast();
  const [codeDialog, setCodeDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [accessCode, setAccessCode] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleGenerateCode = async () => {
    if (!selectedStudent) return;
    const code = generateCode();
    try {
      await updateStudent.mutateAsync({ id: selectedStudent, access_code: code } as any);
      setAccessCode(code);
      toast({ title: 'Código gerado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast({ title: 'Código copiado!' });
  };

  const generatePDF = async (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    if (!student) return;

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('scheduled_date', { ascending: false })
      .limit(30);

    const { data: bioRecords } = await supabase
      .from('bioimpedance')
      .select('*')
      .eq('student_id', studentId)
      .order('measured_at', { ascending: false })
      .limit(10);

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text('IFT Trainer — Relatório do Aluno', 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text(student.name, 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Objetivo: ${student.goal || '—'}`, 20, y); y += 6;
    doc.text(`Status: ${student.status}`, 20, y); y += 6;
    doc.text(`Plano: ${student.plan_type === 'monthly' ? 'Mensal' : 'Pacote'} — R$ ${Number(student.plan_value || 0).toFixed(2)}`, 20, y);
    y += 12;

    if (bioRecords && bioRecords.length > 0) {
      doc.setFontSize(12);
      doc.text('Bioimpedância', 20, y); y += 8;
      doc.setFontSize(9);
      bioRecords.forEach(r => {
        const line = `${r.measured_at} — Peso: ${r.weight || '—'}kg | Gordura: ${r.body_fat_pct || '—'}% | Musc: ${r.muscle_mass || '—'}kg`;
        doc.text(line, 20, y); y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 5;
    }

    if (sessions && sessions.length > 0) {
      doc.setFontSize(12);
      doc.text('Últimas Sessões', 20, y); y += 8;
      doc.setFontSize(9);
      sessions.forEach(s => {
        const groups = s.muscle_groups?.join(', ') || '';
        const line = `${s.scheduled_date} ${s.scheduled_time?.slice(0, 5)} — ${s.status} ${groups ? `(${groups})` : ''}`;
        doc.text(line, 20, y); y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    doc.save(`relatorio-${student.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast({ title: 'PDF gerado!' });
  };

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configurações e ferramentas</p>
        </motion.div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{user?.user_metadata?.full_name || 'Treinador'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button variant="outline" onClick={signOut}
            className="w-full rounded-xl h-11 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sair da conta
          </Button>
        </motion.div>

        {/* Tools */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-4 space-y-3">
          <h2 className="text-lg font-semibold">Ferramentas</h2>

          {/* Access code generator */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">Código do Aluno</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Gere um código de acesso para o aluno acessar o portal
            </p>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCodeDialog(true)}>
              Gerar código
            </Button>
          </div>

          {/* PDF generator */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">Relatório PDF</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Gere um relatório completo com dados do aluno
            </p>
            <div className="flex flex-wrap gap-2">
              {students?.filter(s => s.status === 'active').slice(0, 6).map(s => (
                <Button key={s.id} variant="outline" size="sm" className="rounded-xl text-xs"
                  onClick={() => generatePDF(s.id)}>
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Code Dialog */}
        <Dialog open={codeDialog} onOpenChange={setCodeDialog}>
          <DialogContent className="glass max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Código de Acesso</DialogTitle>
              <DialogDescription>Selecione o aluno e gere um código</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Aluno</Label>
                <select value={selectedStudent} onChange={(e) => { setSelectedStudent(e.target.value); setAccessCode(''); }}
                  className="w-full mt-1 h-11 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm">
                  <option value="">Selecione</option>
                  {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {accessCode ? (
                <div className="text-center">
                  <p className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">{accessCode}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={copyCode}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerateCode} disabled={!selectedStudent}
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                  Gerar código
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Profile;
