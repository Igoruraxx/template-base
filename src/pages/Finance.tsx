import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStudents } from '@/hooks/useStudents';
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment, useAutoGeneratePayments, useMarkOverdue } from '@/hooks/usePayments';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, Check, Clock, AlertTriangle, Trash2, MessageCircle, ChevronLeft, ChevronRight, Bell, Send } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; icon: any; className: string }> = {
  paid: { label: 'Pago', icon: Check, className: 'text-primary bg-primary/10' },
  pending: { label: 'Pendente', icon: Clock, className: 'text-amber-400 bg-amber-400/10' },
  overdue: { label: 'Atrasado', icon: AlertTriangle, className: 'text-destructive bg-destructive/10' },
};

const Finance = () => {
  const { data: students } = useStudents();
  const { data: payments } = usePayments();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMonth, setViewMonth] = useState(new Date());
  const viewMonthStr = format(viewMonth, 'yyyy-MM');
  const [form, setForm] = useState({
    student_id: '', amount: '', reference_month: format(new Date(), 'yyyy-MM'),
    status: 'pending', payment_method: '', notes: '',
  });

  // Auto-generate & mark overdue
  useAutoGeneratePayments(viewMonthStr, students, payments);
  useMarkOverdue(viewMonthStr, payments, students);

  const today = new Date().getDate();

  // Students due today
  const dueTodayStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => s.status === 'active' && s.payment_due_day === today);
  }, [students, today]);

  // Month payments
  const monthPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p: any) => p.reference_month === viewMonthStr);
  }, [payments, viewMonthStr]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return monthPayments;
    return monthPayments.filter((p: any) => p.status === filterStatus);
  }, [monthPayments, filterStatus]);

  // Expected from active students
  const expectedTotal = useMemo(() => {
    if (!students) return 0;
    return students
      .filter(s => s.status === 'active' && s.plan_value)
      .reduce((sum, s) => sum + Number(s.plan_value || 0), 0);
  }, [students]);

  const receivedTotal = useMemo(() => {
    return monthPayments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  }, [monthPayments]);

  const pendingTotal = useMemo(() => {
    return monthPayments
      .filter((p: any) => p.status !== 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  }, [monthPayments]);

  const progressPct = expectedTotal > 0 ? Math.min((receivedTotal / expectedTotal) * 100, 100) : 0;

  // Pending/overdue for bulk WhatsApp
  const pendingPayments = useMemo(() => {
    return monthPayments.filter((p: any) => p.status !== 'paid' && p.students?.phone);
  }, [monthPayments]);

  const handleBulkWhatsApp = () => {
    pendingPayments.forEach((p: any, i: number) => {
      setTimeout(() => {
        openWhatsApp(
          p.students.phone,
          `Olá ${p.students.name}, seu pagamento de R$ ${Number(p.amount).toFixed(2)} referente a ${format(new Date(viewMonthStr + '-01'), 'MMMM/yyyy', { locale: ptBR })} está ${p.status === 'overdue' ? 'atrasado' : 'pendente'}. Podemos resolver?`
        );
      }, i * 1500);
    });
    toast({ title: `Abrindo WhatsApp para ${pendingPayments.length} aluno(s)` });
  };

  // Auto-fill amount when student selected
  const handleStudentSelect = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    setForm(prev => ({
      ...prev,
      student_id: studentId,
      amount: student?.plan_value ? String(student.plan_value) : prev.amount,
    }));
  };

  const handleSave = async () => {
    if (!form.student_id || !form.amount) return toast({ title: 'Preencha aluno e valor', variant: 'destructive' });
    try {
      await createPayment.mutateAsync({
        student_id: form.student_id,
        amount: parseFloat(form.amount),
        reference_month: form.reference_month,
        status: form.status,
        payment_method: form.payment_method || undefined,
        notes: form.notes || undefined,
      });
      toast({ title: 'Pagamento registrado!' });
      setDialogOpen(false);
      setForm({ student_id: '', amount: '', reference_month: format(new Date(), 'yyyy-MM'), status: 'pending', payment_method: '', notes: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const togglePaid = async (payment: any) => {
    const newStatus = payment.status === 'paid' ? 'pending' : 'paid';
    try {
      await updatePayment.mutateAsync({ id: payment.id, status: newStatus });
      toast({ title: newStatus === 'paid' ? 'Marcado como pago!' : 'Marcado como pendente' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // Visual highlight helper
  const getPaymentHighlight = (payment: any) => {
    const student = students?.find(s => s.id === payment.student_id);
    if (!student?.payment_due_day || payment.status === 'paid') return '';
    if (payment.status === 'overdue') return 'ring-1 ring-destructive/30';
    if (student.payment_due_day === today) return 'ring-1 ring-amber-400/40';
    return '';
  };

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Controle de pagamentos</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="icon" className="rounded-xl gradient-primary shadow-lg shadow-primary/25 h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Due today banner */}
        {dueTodayStudents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 mb-4 border border-amber-400/30 bg-amber-400/5">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold">Hoje é dia de recebimento de {dueTodayStudents.length} aluno(s)</p>
            </div>
            <div className="space-y-1">
              {dueTodayStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor: s.color || '#10b981' }}>
                      {s.name.slice(0, 1)}
                    </div>
                    <span>{s.name}</span>
                  </div>
                  <span className="text-muted-foreground">R$ {Number(s.plan_value || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button onClick={() => setViewMonth(new Date())}
            className="text-sm font-semibold px-3 py-1 rounded-lg hover:bg-muted transition-colors capitalize">
            {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(prev => addMonths(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Recebido vs Previsto</p>
            <p className="text-sm font-bold">{progressPct.toFixed(0)}%</p>
          </div>
          <Progress value={progressPct} className="h-2.5 mb-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold text-primary">R$ {receivedTotal.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Recebido</p>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-400">R$ {pendingTotal.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Pendente</p>
            </div>
            <div>
              <p className="text-sm font-bold">R$ {expectedTotal.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Previsto</p>
            </div>
          </div>
        </motion.div>

        {/* Filter + bulk action */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {['all', 'paid', 'pending', 'overdue'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  filterStatus === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}>
                {s === 'all' ? 'Todos' : STATUS_MAP[s].label}
              </button>
            ))}
          </div>
          {pendingPayments.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={handleBulkWhatsApp}>
              <Send className="h-3.5 w-3.5" /> Cobrar
            </Button>
          )}
        </div>

        {/* Payments list */}
        <div className="space-y-2">
          {filtered.map((payment: any, i: number) => {
            const st = STATUS_MAP[payment.status || 'pending'];
            const Icon = st.icon;
            const highlight = getPaymentHighlight(payment);
            return (
              <motion.div key={payment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }} className={cn('glass rounded-xl p-3', highlight)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePaid(payment)}
                      className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', st.className)}>
                      <Icon className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="font-semibold text-sm">{payment.students?.name || 'Aluno'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {payment.students?.payment_due_day ? `Vence dia ${payment.students.payment_due_day}` : payment.reference_month}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">R$ {Number(payment.amount).toFixed(0)}</p>
                    {payment.status !== 'paid' && payment.students?.phone && (
                      <button onClick={() => openWhatsApp(
                        payment.students.phone,
                        `Olá ${payment.students.name}, seu pagamento de R$ ${Number(payment.amount).toFixed(2)} referente a ${payment.reference_month} está ${payment.status === 'overdue' ? 'atrasado' : 'pendente'}. Podemos resolver?`
                      )} className="text-muted-foreground hover:text-primary">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => deletePayment.mutate(payment.id)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum pagamento neste mês</p>
            </div>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Pagamento</DialogTitle>
              <DialogDescription>Registre um pagamento de aluno</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Aluno *</Label>
                <Select value={form.student_id} onValueChange={handleStudentSelect}>
                  <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {students?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Valor (R$) *</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Mês ref.</Label>
                  <Input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label className="text-muted-foreground text-xs">Método</Label>
                  <Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    placeholder="Pix, cartão..." className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
              </div>
              <Button onClick={handleSave} disabled={createPayment.isPending}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                Registrar pagamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Finance;
