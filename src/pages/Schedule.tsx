import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useSessions, useCreateSession, useUpdateSession, useDeleteSession } from '@/hooks/useSessions';
import { useStudents } from '@/hooks/useStudents';
import { AppLayout } from '@/components/AppLayout';
import { MuscleGroupSelector, MuscleGroupBadges } from '@/components/MuscleGroupSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin,
  Check, Edit, Trash2, Bell, DollarSign, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { openWhatsApp, buildReminderMessage } from '@/lib/whatsapp';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5-22

const Schedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: students } = useStudents();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'hour'>('hour');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<any>(null);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: sessions } = useSessions(viewMode === 'day' || viewMode === 'hour' ? dateStr : undefined);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const displaySessions = useMemo(() => {
    if (!sessions) return [];
    if (viewMode === 'day' || viewMode === 'hour') return sessions;
    return sessions.filter((s: any) => s.scheduled_date >= startStr && s.scheduled_date <= endStr);
  }, [sessions, viewMode, startStr, endStr]);

  // Payment due day alerts for today
  const paymentAlerts = useMemo(() => {
    if (!students) return [];
    const today = new Date().getDate();
    return students.filter((s: any) => s.status === 'active' && s.payment_due_day === today);
  }, [students]);

  // Consulting alerts (3 days before due)
  const consultingAlerts = useMemo(() => {
    if (!students) return [];
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const dueDay = in3Days.getDate();
    return students.filter((s: any) => s.is_consulting && s.status === 'active' && s.payment_due_day === dueDay);
  }, [students]);

  const [form, setForm] = useState({
    student_id: '', scheduled_date: dateStr, scheduled_time: '08:00',
    duration_minutes: '60', location: '', notes: '', muscle_groups: [] as string[],
  });

  const resetForm = () => {
    setForm({
      student_id: '', scheduled_date: dateStr, scheduled_time: '08:00',
      duration_minutes: '60', location: '', notes: '', muscle_groups: [],
    });
    setEditingSession(null);
  };

  const openNew = (presetTime?: string) => {
    resetForm();
    setForm(f => ({ ...f, scheduled_date: dateStr, scheduled_time: presetTime || '08:00' }));
    setDialogOpen(true);
  };

  const openEdit = (session: any) => {
    setForm({
      student_id: session.student_id,
      scheduled_date: session.scheduled_date,
      scheduled_time: session.scheduled_time?.slice(0, 5) || '08:00',
      duration_minutes: session.duration_minutes?.toString() || '60',
      location: session.location || '',
      notes: session.notes || '',
      muscle_groups: session.muscle_groups || [],
    });
    setEditingSession(session);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.student_id) return toast({ title: 'Selecione um aluno', variant: 'destructive' });
    const payload = {
      student_id: form.student_id, scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time, duration_minutes: parseInt(form.duration_minutes) || 60,
      location: form.location || null, notes: form.notes || null, muscle_groups: form.muscle_groups,
    };
    try {
      if (editingSession) {
        await updateSession.mutateAsync({ id: editingSession.id, ...payload });
        toast({ title: 'Sessão atualizada!' });
      } else {
        await createSession.mutateAsync({ ...payload, trainer_id: user!.id });
        toast({ title: 'Sessão agendada!' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleComplete = async (session: any) => {
    try {
      await updateSession.mutateAsync({ id: session.id, status: 'completed' });
      toast({ title: 'Sessão concluída! ✅' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession.mutateAsync(id);
      toast({ title: 'Sessão removida!' });
      setDetailSession(null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const toggleMuscleGroup = (id: string) => {
    setForm(f => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(id)
        ? f.muscle_groups.filter(g => g !== id)
        : [...f.muscle_groups, id],
    }));
  };

  const navigateDate = (dir: number) => {
    setCurrentDate(prev => addDays(prev, viewMode === 'week' ? dir * 7 : dir));
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, session: any) => {
    e.stopPropagation();
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverHour(hour);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverHour(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    const sessionId = e.dataTransfer.getData('sessionId');
    if (!sessionId) return;
    const newTime = `${String(hour).padStart(2, '0')}:00`;
    try {
      await updateSession.mutateAsync({ id: sessionId, scheduled_time: newTime });
      toast({ title: `Sessão remarcada para ${newTime}` });
    } catch (err: any) {
      toast({ title: 'Erro ao remarcar', description: err.message, variant: 'destructive' });
    }
  }, [updateSession, toast]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    displaySessions.forEach((s: any) => {
      if (!map[s.scheduled_date]) map[s.scheduled_date] = [];
      map[s.scheduled_date].push(s);
    });
    return map;
  }, [displaySessions]);

  const sessionsByHour = useMemo(() => {
    const map: Record<number, any[]> = {};
    displaySessions.forEach((s: any) => {
      const hour = parseInt(s.scheduled_time?.slice(0, 2) || '0');
      if (!map[hour]) map[hour] = [];
      map[hour].push(s);
    });
    return map;
  }, [displaySessions]);

  // Check if today has a payment due
  const todayHasPaymentDue = paymentAlerts.length > 0 && dateStr === format(new Date(), 'yyyy-MM-dd');

  const renderSessionCard = (session: any, draggable = false) => {
    const student = session.students;
    const isCompleted = session.status === 'completed';
    const isCancelled = session.status === 'cancelled';
    const hasReminder = student?.needs_reminder && student?.phone;

    return (
      <div
        key={session.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => {
          e.stopPropagation();
          handleDragStart(e, session);
        } : undefined}
        onClick={() => setDetailSession(session)}
        className={cn(
          draggable && 'cursor-grab active:cursor-grabbing'
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'glass rounded-xl p-3 relative overflow-hidden',
            isCompleted && 'opacity-70',
            isCancelled && 'opacity-40'
          )}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{ backgroundColor: student?.color || '#10b981' }} />
          <div className="ml-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{student?.name || 'Aluno'}</span>
                {isCompleted && <Check className="h-3.5 w-3.5 text-primary" />}
                {hasReminder && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp(student.phone, buildReminderMessage(student.name, session.scheduled_date, session.scheduled_time));
                  }} className="text-amber-400 hover:text-amber-300">
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {student?.phone && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp(student.phone, `Olá ${student.name}, tudo bem?`);
                  }} className="text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="text-xs text-muted-foreground">{session.scheduled_time?.slice(0, 5)}</span>
              </div>
            </div>
            {session.muscle_groups && session.muscle_groups.length > 0 && (
              <div className="mt-1.5"><MuscleGroupBadges groups={session.muscle_groups} size="xs" /></div>
            )}
            {session.location && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" /> {session.location}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <Button onClick={() => openNew()} size="icon"
            className="rounded-xl gradient-primary shadow-lg shadow-primary/25 h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Alerts */}
        {todayHasPaymentDue && (
          <div className="mb-3 space-y-1">
            {paymentAlerts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-300 font-medium">{s.name} precisa efetuar pagamento hoje</span>
              </div>
            ))}
          </div>
        )}
        {consultingAlerts.length > 0 && (
          <div className="mb-3 space-y-1">
            {consultingAlerts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-blue-300 font-medium">Atualizar treino de {s.name} — vencimento em 3 dias</span>
              </div>
            ))}
          </div>
        )}

        {/* View toggle + nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-muted rounded-xl p-1">
            {(['day', 'week', 'hour'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Horário'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button onClick={() => setCurrentDate(new Date())}
              className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              {viewMode === 'week'
                ? `${format(weekStart, 'd MMM', { locale: ptBR })} — ${format(addDays(weekStart, 6), 'd MMM', { locale: ptBR })}`
                : format(currentDate, "d 'de' MMMM", { locale: ptBR })
              }
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week day selector (day/hour views) */}
        {(viewMode === 'day' || viewMode === 'hour') && (
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {weekDays.map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === dateStr;
              const dayIsToday = isToday(day);
              const hasDue = students?.some((s: any) => s.status === 'active' && s.payment_due_day === day.getDate());
              return (
                <button key={day.toISOString()} onClick={() => setCurrentDate(day)}
                  className={cn(
                    'flex flex-col items-center py-2 px-3 rounded-xl min-w-[48px] transition-all relative',
                    isSelected ? 'gradient-primary text-primary-foreground shadow-md' :
                      dayIsToday ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50',
                  )}>
                  <span className="text-[10px] uppercase font-medium">{format(day, 'EEE', { locale: ptBR })}</span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                  {hasDue && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Hourly grid view */}
        {viewMode === 'hour' && (
          <div className="space-y-0.5">
            {HOURS.map(hour => {
              const hourSessions = sessionsByHour[hour] || [];
              const timeStr = `${String(hour).padStart(2, '0')}:00`;
              const isDragTarget = dragOverHour === hour;
              return (
                <div key={hour}
                  onDragOver={(e) => handleDragOver(e, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, hour)}
                  className={cn(
                    'flex gap-2 min-h-[52px] rounded-lg transition-colors px-1',
                    isDragTarget && 'bg-primary/10 ring-1 ring-primary/30'
                  )}>
                  <span className="text-[10px] text-muted-foreground w-10 pt-2 shrink-0 text-right">{timeStr}</span>
                  <div className="flex-1 border-t border-border/30 pt-1 pb-1">
                    {hourSessions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {hourSessions.map((s: any) => (
                          <div key={s.id} className={hourSessions.length > 1 ? 'flex-1 min-w-0' : 'w-full'}>
                            {renderSessionCard(s, true)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => openNew(timeStr)}
                        className="w-full h-full min-h-[40px] rounded-lg hover:bg-muted/30 transition-colors flex items-center justify-center">
                        <Plus className="h-3 w-3 text-muted-foreground/30" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day view */}
        {viewMode === 'day' && (
          <div className="space-y-2">
            {displaySessions.length > 0 ? (
              displaySessions.map((s: any) => renderSessionCard(s))
            ) : (
              <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia</p>
              </div>
            )}
          </div>
        )}

        {/* Week view */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dayStr] || [];
              return (
                <div key={dayStr}>
                  <p className={cn('text-xs font-semibold uppercase mb-2',
                    isToday(day) ? 'text-primary' : 'text-muted-foreground')}>
                    {format(day, "EEEE, d", { locale: ptBR })}
                    {isToday(day) && ' • Hoje'}
                  </p>
                  {daySessions.length > 0 ? (
                    <div className="space-y-2">{daySessions.map((s: any) => renderSessionCard(s))}</div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 mb-2">—</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Session Detail Dialog */}
        <Dialog open={!!detailSession} onOpenChange={(open) => !open && setDetailSession(null)}>
          <DialogContent className="glass max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Sessão</DialogTitle>
              <DialogDescription>Informações completas da sessão</DialogDescription>
            </DialogHeader>
            {detailSession && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: detailSession.students?.color || '#10b981' }}>
                    {(detailSession.students?.name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{detailSession.students?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(detailSession.scheduled_date), "d 'de' MMMM", { locale: ptBR })} às {detailSession.scheduled_time?.slice(0, 5)}
                    </p>
                  </div>
                </div>
                {detailSession.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {detailSession.location}
                  </p>
                )}
                {detailSession.muscle_groups?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Grupos musculares</p>
                    <MuscleGroupBadges groups={detailSession.muscle_groups} size="sm" />
                  </div>
                )}
                {detailSession.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Anotações</p>
                    <p className="text-sm">{detailSession.notes}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {detailSession.status !== 'completed' && (
                    <Button onClick={() => { handleComplete(detailSession); setDetailSession(null); }}
                      className="flex-1 rounded-xl gradient-primary text-primary-foreground">
                      <Check className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                  )}
                  {detailSession.students?.phone && (
                    <Button variant="outline" size="icon" className="rounded-xl"
                      onClick={() => openWhatsApp(detailSession.students.phone, `Olá ${detailSession.students.name}, tudo bem?`)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { setDetailSession(null); openEdit(detailSession); }}
                    className="flex-1 rounded-xl">
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl text-destructive"
                    onClick={() => handleDelete(detailSession.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New/Edit Session Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
              <DialogDescription>Configure os detalhes da sessão</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Aluno *</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                  <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.filter(s => s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || '#10b981' }} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <Input type="date" value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Horário</Label>
                  <Input type="time" value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Duração (min)</Label>
                  <Input type="number" value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Local</Label>
                  <Input value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex: Academia X" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">Grupos Musculares</Label>
                <MuscleGroupSelector selected={form.muscle_groups} onToggle={toggleMuscleGroup} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Anotações</Label>
                <Textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observações da sessão..."
                  className="bg-muted/50 border-border/50 rounded-xl mt-1 min-h-[60px]" />
              </div>
              <Button onClick={handleSave}
                disabled={createSession.isPending || updateSession.isPending}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25">
                {editingSession ? 'Salvar alterações' : 'Agendar sessão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Schedule;
