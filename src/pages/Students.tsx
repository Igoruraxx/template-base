import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, format, startOfWeek, getDay, nextDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useInactivateStudent } from '@/hooks/useStudents';
import { useDeleteFutureSessions, useCreateSession } from '@/hooks/useSessions';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AssessmentTab } from '@/components/AssessmentTab';
import {
  Users, Plus, Search, CreditCard,
  MoreVertical, Edit, Trash2, MessageCircle, Bell, UserX, CalendarX2,
  CalendarPlus, Copy
} from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';
import { STUDENT_COLORS } from '@/lib/constants';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { StudentLimitModal } from '@/components/StudentLimitModal';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-primary/20 text-primary' },
  inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
};

const WEEKDAYS = [
  { value: '1', label: 'Seg' },
  { value: '2', label: 'Ter' },
  { value: '3', label: 'Qua' },
  { value: '4', label: 'Qui' },
  { value: '5', label: 'Sex' },
  { value: '6', label: 'Sáb' },
];

// Map schedule_config day (1=Mon...6=Sat) to JS Day (0=Sun, 1=Mon...6=Sat)
const configDayToJsDay = (d: string): Day => {
  const n = parseInt(d);
  return (n === 7 ? 0 : n) as Day;
};

type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ScheduleEntry = { day: string; time: string };

const Students = () => {
  const { user } = useAuth();
  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const inactivateStudent = useInactivateStudent();
  const deleteFutureSessions = useDeleteFutureSessions();
  const createSession = useCreateSession();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'inactivate' | 'deleteSessions' | 'generateSessions'; student: any } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const { canAddActiveStudent, isPendingPix, slotsUsed, slotsTotal, isPremium, isNearLimit } = useTrainerSubscription();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', goal: '', plan_type: 'monthly',
    plan_value: '', sessions_per_week: '3', package_total_sessions: '',
    color: STUDENT_COLORS[0], status: 'active', is_consulting: false,
    needs_reminder: false, payment_due_day: '', notes: '',
  });
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleEntry[]>([
    { day: '1', time: '08:00' }, { day: '3', time: '08:00' }, { day: '5', time: '08:00' },
  ]);

  const resetForm = () => {
    setForm({
      name: '', phone: '', email: '', goal: '', plan_type: 'monthly',
      plan_value: '', sessions_per_week: '3', package_total_sessions: '',
      color: STUDENT_COLORS[0], status: 'active', is_consulting: false,
      needs_reminder: false, payment_due_day: '', notes: '',
    });
    setScheduleConfig([
      { day: '1', time: '08:00' }, { day: '3', time: '08:00' }, { day: '5', time: '08:00' },
    ]);
    setEditingStudent(null);
  };

  const openEdit = (student: any) => {
    setForm({
      name: student.name, phone: student.phone || '', email: student.email || '',
      goal: student.goal || '', plan_type: student.plan_type || 'monthly',
      plan_value: student.plan_value?.toString() || '', sessions_per_week: student.sessions_per_week?.toString() || '3',
      package_total_sessions: student.package_total_sessions?.toString() || '',
      color: student.color || STUDENT_COLORS[0], status: student.status || 'active',
      is_consulting: student.is_consulting || false,
      needs_reminder: (student as any).needs_reminder || false,
      payment_due_day: (student as any).payment_due_day?.toString() || '',
      notes: student.notes || '',
    });
    const config = (student as any).schedule_config;
    if (config && Array.isArray(config)) {
      setScheduleConfig(config);
    } else {
      const count = student.sessions_per_week || 3;
      setScheduleConfig(Array.from({ length: count }, (_, i) => ({
        day: String(Math.min(i * 2 + 1, 6)), time: '08:00',
      })));
    }
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleSessionsPerWeekChange = (val: string) => {
    const count = parseInt(val) || 1;
    setForm(f => ({ ...f, sessions_per_week: val }));
    setScheduleConfig(prev => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const newEntries = Array.from({ length: count - prev.length }, () => ({ day: '1', time: '08:00' }));
      return [...prev, ...newEntries];
    });
  };

  const updateScheduleEntry = (index: number, field: 'day' | 'time', value: string) => {
    setScheduleConfig(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const setAllTimesEqual = () => {
    if (scheduleConfig.length === 0) return;
    const firstTime = scheduleConfig[0].time;
    setScheduleConfig(prev => prev.map(e => ({ ...e, time: firstTime })));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast({ title: 'Nome é obrigatório', variant: 'destructive' });

    const payload: any = {
      name: form.name.trim(),
      phone: form.phone || null, email: form.email || null, goal: form.goal || null,
      plan_type: form.plan_type,
      plan_value: form.plan_value ? parseFloat(form.plan_value) : null,
      sessions_per_week: parseInt(form.sessions_per_week) || 3,
      package_total_sessions: form.plan_type === 'package' && form.package_total_sessions
        ? parseInt(form.package_total_sessions) : null,
      color: form.color, status: form.status, is_consulting: form.is_consulting,
      needs_reminder: form.needs_reminder,
      payment_due_day: form.payment_due_day ? parseInt(form.payment_due_day) : null,
      notes: form.notes || null, schedule_config: scheduleConfig,
    };

    try {
      // Check limit when creating/updating to active
      if (payload.status === 'active' && !canAddActiveStudent) {
        if (!editingStudent || editingStudent.status !== 'active') {
          setDialogOpen(false);
          setLimitModalOpen(true);
          return;
        }
      }

      if (editingStudent) {
        await updateStudent.mutateAsync({ id: editingStudent.id, ...payload });
        toast({ title: 'Aluno atualizado!' });
      } else {
        await createStudent.mutateAsync({ ...payload, trainer_id: user!.id });
        toast({ title: 'Aluno cadastrado!' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent.mutateAsync(id);
      toast({ title: 'Aluno removido!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleGenerateSessions = async (student: any) => {
    const config: ScheduleEntry[] = (student as any).schedule_config;
    if (!config || !Array.isArray(config) || config.length === 0) {
      return toast({ title: 'Configure os dias/horários do aluno primeiro', variant: 'destructive' });
    }

    setGenerating(true);
    try {
      const today = new Date();
      const sessions: { scheduled_date: string; scheduled_time: string }[] = [];

      // Generate for 4 weeks
      for (const entry of config) {
        const jsDay = configDayToJsDay(entry.day);
        let date = today;
        // Find the next occurrence of this weekday
        if (getDay(today) !== jsDay) {
          date = nextDay(today, jsDay);
        }
        // Generate 4 occurrences
        for (let w = 0; w < 4; w++) {
          const sessionDate = addDays(date, w * 7);
          sessions.push({
            scheduled_date: format(sessionDate, 'yyyy-MM-dd'),
            scheduled_time: entry.time,
          });
        }
      }

      // Create all sessions
      let created = 0;
      for (const s of sessions) {
        await createSession.mutateAsync({
          student_id: student.id,
          trainer_id: user!.id,
          scheduled_date: s.scheduled_date,
          scheduled_time: s.scheduled_time,
          duration_minutes: 60,
        });
        created++;
      }

      toast({ title: `${created} sessões criadas para as próximas 4 semanas!` });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar sessões', description: err.message, variant: 'destructive' });
    }
    setGenerating(false);
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'inactivate') {
        await inactivateStudent.mutateAsync(confirmAction.student.id);
        toast({ title: 'Aluno inativado! Cobranças pendentes removidas.' });
      } else if (confirmAction.type === 'deleteSessions') {
        await deleteFutureSessions.mutateAsync(confirmAction.student.id);
        toast({ title: 'Sessões futuras removidas!' });
      } else if (confirmAction.type === 'generateSessions') {
        await handleGenerateSessions(confirmAction.student);
        return; // already handles setConfirmAction
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setConfirmAction(null);
  };

  const filtered = students?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const activeCount = students?.filter(s => s.status === 'active').length || 0;

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isPremium ? `${slotsUsed} ativos • Ilimitado` : `${slotsUsed}/${slotsTotal} ativos`}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="icon"
            className="rounded-xl gradient-primary shadow-lg shadow-primary/25 h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50 h-11 rounded-xl" />
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((student, i) => {
              const st = STATUS_LABELS[student.status || 'active'];
              return (
                <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 relative overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all"
                  onClick={() => openEdit(student)}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: student.color || '#10b981' }} />
                  <div className="flex items-center gap-3 ml-2">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: student.color || '#10b981' }}>
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{student.name}</p>
                        {student.is_consulting && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Consultoria</span>
                        )}
                        {(student as any).needs_reminder && (
                          <Bell className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', st.className)}>{st.label}</span>
                        {student.goal && <span className="text-xs text-muted-foreground truncate">{student.goal}</span>}
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {student.phone && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone!, `Olá ${student.name}, tudo bem?`); }}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(student); }}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {student.phone && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone!, `Olá ${student.name}, tudo bem?`); }}>
                              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'generateSessions', student }); }}>
                            <CalendarPlus className="h-4 w-4 mr-2" /> Gerar sessões (4 semanas)
                          </DropdownMenuItem>
                          {student.status === 'active' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'inactivate', student }); }}>
                              <UserX className="h-4 w-4 mr-2" /> Inativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'deleteSessions', student }); }}>
                            <CalendarX2 className="h-4 w-4 mr-2" /> Excluir sessões futuras
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {student.plan_type && (
                    <div className="flex items-center gap-3 mt-3 ml-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {student.plan_type === 'monthly' ? 'Mensal' : 'Pacote'}
                        {student.plan_value && ` • R$ ${Number(student.plan_value).toFixed(0)}`}
                      </span>
                      {student.sessions_per_week && (
                        <span>{student.sessions_per_week}x/sem</span>
                      )}
                      {student.plan_type === 'package' && student.package_total_sessions && (
                        <span>{student.package_used_sessions || 0}/{student.package_total_sessions} sessões</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl p-8 flex flex-col items-center text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Confirm Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <AlertDialogContent className="glass rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.type === 'inactivate' ? 'Inativar Aluno'
                  : confirmAction?.type === 'deleteSessions' ? 'Excluir Sessões Futuras'
                  : 'Gerar Sessões Recorrentes'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === 'inactivate'
                  ? `${confirmAction.student.name} será inativado e todas as cobranças pendentes/atrasadas serão removidas. Continuar?`
                  : confirmAction?.type === 'deleteSessions'
                  ? `Todas as sessões futuras de ${confirmAction?.student.name} serão removidas. Continuar?`
                  : `Serão criadas sessões para ${confirmAction?.student.name} nas próximas 4 semanas com base nos dias/horários configurados. Continuar?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl" disabled={generating}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction} disabled={generating}
                className="rounded-xl gradient-primary text-primary-foreground">
                {generating ? 'Gerando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Student Limit Modal */}
        <StudentLimitModal open={limitModalOpen} onOpenChange={setLimitModalOpen} isPendingPix={isPendingPix} />

        {/* Student Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
              <DialogDescription>Preencha os dados do aluno</DialogDescription>
            </DialogHeader>

            {editingStudent ? (
              <Tabs defaultValue="dados" className="mt-2">
                <TabsList className="w-full bg-muted rounded-xl p-1">
                  <TabsTrigger value="dados" className="flex-1 rounded-lg text-xs">Dados</TabsTrigger>
                  <TabsTrigger value="relatorio" className="flex-1 rounded-lg text-xs">Relatório</TabsTrigger>
                </TabsList>
                <TabsContent value="dados">
                  <StudentForm form={form} setForm={setForm} scheduleConfig={scheduleConfig}
                    handleSessionsPerWeekChange={handleSessionsPerWeekChange}
                    updateScheduleEntry={updateScheduleEntry} setAllTimesEqual={setAllTimesEqual}
                    handleSave={handleSave} isEditing={true}
                    isPending={createStudent.isPending || updateStudent.isPending} />
                </TabsContent>
                <TabsContent value="relatorio">
                  <AssessmentTab studentId={editingStudent.id} studentName={editingStudent.name} />
                </TabsContent>
              </Tabs>
            ) : (
              <StudentForm form={form} setForm={setForm} scheduleConfig={scheduleConfig}
                handleSessionsPerWeekChange={handleSessionsPerWeekChange}
                updateScheduleEntry={updateScheduleEntry} setAllTimesEqual={setAllTimesEqual}
                handleSave={handleSave} isEditing={false}
                isPending={createStudent.isPending || updateStudent.isPending} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

type ScheduleEntryType = { day: string; time: string };

const StudentForm = ({ form, setForm, scheduleConfig, handleSessionsPerWeekChange, updateScheduleEntry, setAllTimesEqual, handleSave, isEditing, isPending }: {
  form: any; setForm: (f: any) => void; scheduleConfig: ScheduleEntryType[];
  handleSessionsPerWeekChange: (v: string) => void; updateScheduleEntry: (i: number, f: 'day' | 'time', v: string) => void;
  setAllTimesEqual: () => void; handleSave: () => void; isEditing: boolean; isPending: boolean;
}) => (
  <div className="space-y-4 mt-2">
    <div>
      <Label className="text-muted-foreground text-xs">Nome *</Label>
      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nome do aluno" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-muted-foreground text-xs">Telefone</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(99) 99999-9999" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">Email</Label>
        <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@..." className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
      </div>
    </div>

    <div>
      <Label className="text-muted-foreground text-xs">Objetivo</Label>
      <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
        placeholder="Ex: Hipertrofia, emagrecimento" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-muted-foreground text-xs">Plano</Label>
        <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
          <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="package">Pacote</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">Valor (R$)</Label>
        <Input type="number" value={form.plan_value}
          onChange={(e) => setForm({ ...form, plan_value: e.target.value })}
          placeholder="0" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
      </div>
    </div>

    {form.plan_type === 'package' && (
      <div>
        <Label className="text-muted-foreground text-xs">Total de sessões do pacote</Label>
        <Input type="number" value={form.package_total_sessions}
          onChange={(e) => setForm({ ...form, package_total_sessions: e.target.value })}
          className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
      </div>
    )}

    <div>
      <Label className="text-muted-foreground text-xs">Frequência semanal</Label>
      <div className="flex gap-1.5 mt-1.5">
        {['1', '2', '3', '4', '5', '6'].map(v => (
          <button key={v} type="button" onClick={() => handleSessionsPerWeekChange(v)}
            className={cn('h-10 w-10 rounded-xl text-sm font-semibold transition-all',
              form.sessions_per_week === v
                ? 'gradient-primary text-primary-foreground shadow-md'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            {v}x
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs">Dias e horários</Label>
        {scheduleConfig.length > 1 && (
          <button type="button" onClick={setAllTimesEqual}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors">
            <Copy className="h-3 w-3" /> Mesmo horário para todos
          </button>
        )}
      </div>
      {scheduleConfig.map((entry, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Select value={entry.day} onValueChange={(v) => updateScheduleEntry(idx, 'day', v)}>
            <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-10 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="time" value={entry.time}
            onChange={(e) => updateScheduleEntry(idx, 'time', e.target.value)}
            className="bg-muted/50 border-border/50 rounded-xl h-10 w-28" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-muted-foreground text-xs">Dia vencimento</Label>
        <Input type="number" min="1" max="31" value={form.payment_due_day}
          onChange={(e) => setForm({ ...form, payment_due_day: e.target.value })}
          placeholder="1-31" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch checked={form.is_consulting} onCheckedChange={(v) => setForm({ ...form, is_consulting: v })} />
        <Label className="text-xs text-muted-foreground">Consultoria</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.needs_reminder} onCheckedChange={(v) => setForm({ ...form, needs_reminder: v })} />
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <Bell className="h-3 w-3" /> Lembrar
        </Label>
      </div>
    </div>

    <div>
      <Label className="text-muted-foreground text-xs">Cor</Label>
      <div className="flex gap-2 mt-1.5 flex-wrap">
        {STUDENT_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
            className={cn('h-8 w-8 rounded-full transition-all',
              form.color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105')}
            style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties} />
        ))}
      </div>
    </div>

    <div>
      <Label className="text-muted-foreground text-xs">Observações</Label>
      <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Anotações sobre o aluno..."
        className="bg-muted/50 border-border/50 rounded-xl mt-1 min-h-[80px]" />
    </div>

    <Button onClick={handleSave} disabled={isPending}
      className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25">
      {isEditing ? 'Salvar alterações' : 'Cadastrar aluno'}
    </Button>
  </div>
);

export default Students;
