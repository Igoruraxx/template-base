import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Plus, Search, Phone, Target, CreditCard, User,
  MoreVertical, Edit, Trash2, X, MessageCircle
} from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';
import { STUDENT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-primary/20 text-primary' },
  inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
  forgotten: { label: 'Esquecido', className: 'bg-amber-500/20 text-amber-400' },
};

const Students = () => {
  const { user } = useAuth();
  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', phone: '', email: '', goal: '', plan_type: 'monthly',
    plan_value: '', sessions_per_week: '3', package_total_sessions: '',
    color: STUDENT_COLORS[0], status: 'active', is_consulting: false, notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '', phone: '', email: '', goal: '', plan_type: 'monthly',
      plan_value: '', sessions_per_week: '3', package_total_sessions: '',
      color: STUDENT_COLORS[0], status: 'active', is_consulting: false, notes: '',
    });
    setEditingStudent(null);
  };

  const openEdit = (student: any) => {
    setForm({
      name: student.name, phone: student.phone || '', email: student.email || '',
      goal: student.goal || '', plan_type: student.plan_type || 'monthly',
      plan_value: student.plan_value?.toString() || '', sessions_per_week: student.sessions_per_week?.toString() || '3',
      package_total_sessions: student.package_total_sessions?.toString() || '',
      color: student.color || STUDENT_COLORS[0], status: student.status || 'active',
      is_consulting: student.is_consulting || false, notes: student.notes || '',
    });
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast({ title: 'Nome é obrigatório', variant: 'destructive' });

    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      goal: form.goal || null,
      plan_type: form.plan_type,
      plan_value: form.plan_value ? parseFloat(form.plan_value) : null,
      sessions_per_week: parseInt(form.sessions_per_week) || 3,
      package_total_sessions: form.plan_type === 'package' && form.package_total_sessions
        ? parseInt(form.package_total_sessions) : null,
      color: form.color,
      status: form.status,
      is_consulting: form.is_consulting,
      notes: form.notes || null,
    };

    try {
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
            <p className="text-muted-foreground text-sm mt-0.5">{activeCount} ativos</p>
          </div>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            size="icon"
            className="rounded-xl gradient-primary shadow-lg shadow-primary/25 h-10 w-10"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50 h-11 rounded-xl"
          />
        </motion.div>

        {/* Students List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((student, i) => {
              const st = STATUS_LABELS[student.status || 'active'];
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: student.color || '#10b981' }} />

                  <div className="flex items-center gap-3 ml-2">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: student.color || '#10b981' }}
                    >
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{student.name}</p>
                        {student.is_consulting && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                            Consultoria
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', st.className)}>
                          {st.label}
                        </span>
                        {student.goal && (
                          <span className="text-xs text-muted-foreground truncate">
                            {student.goal}
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(student)}>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        {student.phone && (
                          <DropdownMenuItem onClick={() => openWhatsApp(student.phone!, `Olá ${student.name}, tudo bem?`)}>
                            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {student.plan_type && (
                    <div className="flex items-center gap-3 mt-3 ml-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {student.plan_type === 'monthly' ? 'Mensal' : 'Pacote'}
                        {student.plan_value && ` • R$ ${Number(student.plan_value).toFixed(0)}`}
                      </span>
                      {student.plan_type === 'package' && student.package_total_sessions && (
                        <span>
                          {student.package_used_sessions || 0}/{student.package_total_sessions} sessões
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-8 flex flex-col items-center text-center"
            >
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
              <DialogDescription>Preencha os dados do aluno</DialogDescription>
            </DialogHeader>

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
                    <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1">
                      <SelectValue />
                    </SelectTrigger>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Total de sessões</Label>
                    <Input type="number" value={form.package_total_sessions}
                      onChange={(e) => setForm({ ...form, package_total_sessions: e.target.value })}
                      className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Frequência/semana</Label>
                    <Input type="number" value={form.sessions_per_week}
                      onChange={(e) => setForm({ ...form, sessions_per_week: e.target.value })}
                      className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="forgotten">Esquecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.is_consulting}
                    onCheckedChange={(v) => setForm({ ...form, is_consulting: v })} />
                  <Label className="text-xs text-muted-foreground">Consultoria</Label>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <Label className="text-muted-foreground text-xs">Cor</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {STUDENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={cn(
                        'h-8 w-8 rounded-full transition-all',
                        form.color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anotações sobre o aluno..."
                  className="bg-muted/50 border-border/50 rounded-xl mt-1 min-h-[80px]" />
              </div>

              <Button
                onClick={handleSave}
                disabled={createStudent.isPending || updateStudent.isPending}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                {editingStudent ? 'Salvar alterações' : 'Cadastrar aluno'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Students;
