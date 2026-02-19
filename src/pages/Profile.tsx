import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, useUpdateStudent } from '@/hooks/useStudents';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StudentLimitModal } from '@/components/StudentLimitModal';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Key, Copy, Shield, MessageCircle, Crown, Clock, Bell, BellOff } from 'lucide-react';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, updateDailySummaryHour } from '@/lib/pushNotifications';
import { openWhatsApp } from '@/lib/whatsapp';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: students } = useStudents();
  const updateStudent = useUpdateStudent();
  const { toast } = useToast();
  const { plan, isPremium, isPendingPix, slotsUsed, slotsTotal, isNearLimit, status } = useTrainerSubscription();
  const [codeDialog, setCodeDialog] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [accessCode, setAccessCode] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [summaryHour, setSummaryHour] = useState(4);

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled);
  }, []);

  const togglePush = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        toast({ title: 'Notificações desativadas' });
      } else {
        const ok = await subscribeToPush(summaryHour);
        if (ok) {
          setPushEnabled(true);
          toast({ title: 'Notificações ativadas!' });
        } else {
          toast({ title: 'Não foi possível ativar', description: 'Verifique as permissões do navegador', variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setPushLoading(false);
  };

  const handleHourChange = async (hour: number) => {
    setSummaryHour(hour);
    if (pushEnabled) {
      await updateDailySummaryHour(hour);
      toast({ title: `Resumo diário às ${hour}h` });
    }
  };

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

        {/* Subscription panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 mt-4 cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => navigate('/profile/subscription')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isPremium ? <Crown className="h-5 w-5 text-yellow-400" /> : <Shield className="h-5 w-5 text-primary" />}
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">Minha Assinatura</h2>
            </div>
            <Badge variant={isPremium ? 'default' : 'secondary'} className={isPremium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}>
              {isPremium ? 'Premium' : 'Gratuito'}
            </Badge>
          </div>

          {isPendingPix && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">Pagamento PIX em análise...</p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm mt-2">
             <span className="text-muted-foreground">{isPremium ? 'Acesso ilimitado ativado' : `${slotsUsed} de ${slotsTotal} alunos utilizados`}</span>
             <span className="font-semibold text-primary">Gerenciar &rarr;</span>
          </div>
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

        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-4 space-y-3">
          <h2 className="text-lg font-semibold">Notificações</h2>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {pushEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                <p className="font-medium text-sm">Notificações Push</p>
              </div>
              <Button variant={pushEnabled ? 'default' : 'outline'} size="sm" className="rounded-xl"
                onClick={togglePush} disabled={pushLoading}>
                {pushLoading ? 'Aguarde...' : pushEnabled ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Receba lembretes de aulas e o resumo diário da agenda
            </p>

            {pushEnabled && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <Label className="text-xs text-muted-foreground">Resumo diário às:</Label>
                <select
                  value={summaryHour}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Horário de Brasília</p>
              </div>
            )}
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
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={copyCode}>
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                    {(() => {
                      const student = students?.find(s => s.id === selectedStudent);
                      return student?.phone ? (
                        <Button variant="ghost" size="sm" onClick={() => openWhatsApp(
                          student.phone!,
                          `Olá ${student.name}! Seu acesso ao portal está pronto. Acesse: ${window.location.origin}/portal e use o código: ${accessCode}`
                        )}>
                          <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                        </Button>
                      ) : null;
                    })()}
                  </div>
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

      <StudentLimitModal open={upgradeModal} onOpenChange={setUpgradeModal} isPendingPix={isPendingPix} />
    </AppLayout>
  );
};

export default Profile;
