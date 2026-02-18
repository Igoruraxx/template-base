import { useState, useMemo } from 'react';
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
  Check, MoreVertical, Edit, Trash2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const Schedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: students } = useStudents();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<any>(null);
  const [editingSession, setEditingSession] = useState<any>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const { data: sessions } = useSessions(viewMode === 'day' ? dateStr : undefined);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  // For week view, filter by range client-side or use dateStr sessions
  const displaySessions = useMemo(() => {
    if (!sessions) return [];
    if (viewMode === 'day') return sessions;
    return sessions.filter((s: any) => {
      const d = s.scheduled_date;
      return d >= startStr && d <= endStr;
    });
  }, [sessions, viewMode, startStr, endStr]);

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

  const openNew = () => {
    resetForm();
    setForm(f => ({ ...f, scheduled_date: dateStr }));
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
      student_id: form.student_id,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      location: form.location || null,
      notes: form.notes || null,
      muscle_groups: form.muscle_groups,
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

  // Group sessions by date for week view
  const sessionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    displaySessions.forEach((s: any) => {
      if (!map[s.scheduled_date]) map[s.scheduled_date] = [];
      map[s.scheduled_date].push(s);
    });
    return map;
  }, [displaySessions]);

  const renderSessionCard = (session: any) => {
    const student = session.students;
    const isCompleted = session.status === 'completed';
    const isCancelled = session.status === 'cancelled';

    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'glass rounded-xl p-3 relative overflow-hidden cursor-pointer',
          isCompleted && 'opacity-70',
          isCancelled && 'opacity-40'
        )}
        onClick={() => setDetailSession(session)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: student?.color || '#10b981' }} />

        <div className="ml-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{student?.name || 'Aluno'}</span>
              {isCompleted && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <span className="text-xs text-muted-foreground">
              {session.scheduled_time?.slice(0, 5)}
            </span>
          </div>

          {session.muscle_groups && session.muscle_groups.length > 0 && (
            <div className="mt-1.5">
              <MuscleGroupBadges groups={session.muscle_groups} size="xs" />
            </div>
          )}

          {session.location && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" /> {session.location}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <Button onClick={openNew} size="icon"
            className="rounded-xl gradient-primary shadow-lg shadow-primary/25 h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* View toggle + nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-muted rounded-xl p-1">
            <button onClick={() => setViewMode('day')}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                viewMode === 'day' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              Dia
            </button>
            <button onClick={() => setViewMode('week')}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                viewMode === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              Semana
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button onClick={() => setCurrentDate(new Date())}
              className="text-sm font-medium px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              {viewMode === 'day'
                ? format(currentDate, "d 'de' MMMM", { locale: ptBR })
                : `${format(weekStart, 'd MMM', { locale: ptBR })} — ${format(addDays(weekStart, 6), 'd MMM', { locale: ptBR })}`
              }
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week day selector */}
        {viewMode === 'day' && (
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {weekDays.map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === dateStr;
              const dayIsToday = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  className={cn(
                    'flex flex-col items-center py-2 px-3 rounded-xl min-w-[48px] transition-all',
                    isSelected ? 'gradient-primary text-primary-foreground shadow-md' :
                      dayIsToday ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <span className="text-[10px] uppercase font-medium">
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sessions */}
        {viewMode === 'day' ? (
          <div className="space-y-2">
            {displaySessions.length > 0 ? (
              displaySessions.map(renderSessionCard)
            ) : (
              <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dayStr] || [];
              return (
                <div key={dayStr}>
                  <p className={cn(
                    'text-xs font-semibold uppercase mb-2',
                    isToday(day) ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {format(day, "EEEE, d", { locale: ptBR })}
                    {isToday(day) && ' • Hoje'}
                  </p>
                  {daySessions.length > 0 ? (
                    <div className="space-y-2">{daySessions.map(renderSessionCard)}</div>
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
