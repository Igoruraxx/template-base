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
import { DollarSign, Plus, Check, Clock, AlertTriangle, Trash2, MessageCircle, ChevronLeft, ChevronRight, Bell, Send, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  // Chart data (Entradas por dia do mês)
  const chartData = useMemo(() => {
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      total: 0
    }));

    monthPayments.filter((p: any) => p.status === 'paid' && p.paid_at).forEach((p: any) => {
      const day = new Date(p.paid_at).getDate();
      if (day >= 1 && day <= daysInMonth) {
        data[day - 1].total += Number(p.amount);
      }
    });

    return data;
  }, [monthPayments, viewMonth]);

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
        <div className="flex items-center justify-between mb-6 bg-muted/30 p-1.5 rounded-2xl glass border border-border/50">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl hover:bg-background" onClick={() => setViewMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <button onClick={() => setViewMonth(new Date())}
            className="text-base font-bold px-4 py-2 rounded-xl hover:bg-background transition-colors capitalize flex-1 text-center">
            {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
          </button>
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl hover:bg-background" onClick={() => setViewMonth(prev => addMonths(prev, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 border border-emerald-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
              <ArrowUpCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Entradas</p>
            <p className="text-2xl font-black text-emerald-500 tracking-tight">R$ {receivedTotal.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">No botão até agora</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-4 border border-border/50 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ArrowRightCircle className="h-12 w-12 text-foreground" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">A Receber</p>
            <p className="text-2xl font-black tracking-tight">R$ {pendingTotal.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Previsão no mês: R$ {expectedTotal.toFixed(0)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 border border-rose-500/20 col-span-2 flex items-center justify-between">
            <div>
               <p className="text-xs font-semibold text-rose-500/80 mb-0.5 uppercase tracking-wider flex items-center gap-1">
                 <AlertTriangle className="h-3 w-3" /> Atrasados
               </p>
               <p className="text-xl font-bold text-rose-500">${monthPayments.filter((p:any) => p.status === 'overdue').reduce((sum:number, p:any) => sum + Number(p.amount), 0).toFixed(0)}</p>
            </div>
            {pendingPayments.length > 0 && (
              <Button onClick={handleBulkWhatsApp} size="sm" className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 h-9">
                <Send className="h-3.5 w-3.5 mr-1.5" /> Cobrar Atrasos
              </Button>
            )}
          </motion.div>
        </div>

        {/* Daily Income Chart */}
        {receivedTotal > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 mb-6 border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Ritmo de Entradas</h3>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Recebido']}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#10b981' : 'hsl(var(--muted))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
            {['all', 'paid', 'pending', 'overdue'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn('px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap',
                  filterStatus === s ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground bg-muted/50 hover:bg-muted')}>
                {s === 'all' ? 'Todos os Lançamentos' : STATUS_MAP[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Payments list */}
        <div className="space-y-3 pb-24">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Histórico de Lançamentos</h3>
          
          {filtered.map((payment: any, i: number) => {
            const st = STATUS_MAP[payment.status || 'pending'];
            const Icon = st.icon;
            const highlight = getPaymentHighlight(payment);
            return (
              <motion.div key={payment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className={cn('glass rounded-2xl p-4 border border-border/50 transition-all hover:bg-muted/10', highlight)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-12 w-12 rounded-full flex items-center justify-center shrink-0', st.className)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base leading-tight">{payment.students?.name || 'Aluno Excluído'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {payment.students?.payment_due_day ? `Vencimento: dia ${payment.students.payment_due_day}` : payment.reference_month}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">R$ {Number(payment.amount).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                       <button onClick={() => deletePayment.mutate(payment.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1.5 rounded-full hover:bg-destructive/10" title="Apagar Lançamento">
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>

                    {payment.status !== 'paid' ? (
                      <div className="flex items-center gap-2 mt-auto">
                        {payment.students?.phone && (
                          <button onClick={() => openWhatsApp(
                            payment.students.phone,
                            `Olá ${payment.students.name}, seu pagamento de R$ ${Number(payment.amount).toFixed(2)} referente a ${payment.reference_month} está ${payment.status === 'overdue' ? 'atrasado' : 'pendente'}. Podemos resolver?`
                          )} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 p-2 rounded-xl transition-all" title="Cobrar no WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        <Button 
                          onClick={() => togglePaid(payment)}
                          className="h-9 px-4 rounded-xl gradient-primary text-white shadow-md shadow-primary/20 text-xs font-bold"
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Dar Baixa
                        </Button>
                      </div>
                    ) : (
                       <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl text-xs font-bold mt-auto border border-emerald-500/20">
                          <Check className="h-3.5 w-3.5" /> Concluído
                       </div>
                    )}
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
