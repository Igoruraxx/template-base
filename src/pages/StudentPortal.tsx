import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, User, Calendar, Camera, TrendingUp } from 'lucide-react';
import logo from '@/assets/logo.png';
import { MuscleGroupBadges } from '@/components/MuscleGroupSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentPortal = () => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [bioRecords, setBioRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'sessions' | 'photos' | 'bio'>('sessions');

  const handleAccess = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      // Use the security definer function
      const { data: students, error } = await supabase.rpc('get_student_by_code', { _code: code.trim() });
      if (error) throw error;
      if (!students || students.length === 0) {
        toast({ title: 'Código inválido', description: 'Verifique o código com seu treinador.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const s = students[0];
      setStudent(s);

      // Fetch data via security definer RPCs (works without auth)
      const [sessRes, photoRes, bioRes] = await Promise.all([
        supabase.rpc('get_student_sessions', { _student_id: s.id }),
        supabase.rpc('get_student_photos', { _student_id: s.id }),
        supabase.rpc('get_student_bio', { _student_id: s.id }),
      ]);
      setSessions(sessRes.data || []);
      setPhotos(photoRes.data || []);
      setBioRecords(bioRes.data || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const chartData = bioRecords.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM'),
    Peso: r.weight ? Number(r.weight) : null,
    'Gordura %': r.body_fat_pct ? Number(r.body_fat_pct) : null,
  }));

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="IFT Trainer" className="h-14 w-14 rounded-2xl mb-4 shadow-lg shadow-primary/25" />
            <h1 className="text-2xl font-bold">Portal do Aluno</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesse seus dados de treino</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Código de acesso</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="Digite seu código"
                    className="pl-10 bg-muted/50 border-border/50 h-12 rounded-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleAccess()} />
                </div>
              </div>
              <Button onClick={handleAccess} disabled={loading}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
                {loading ? 'Acessando...' : 'Acessar'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-8 pb-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: student.color || '#10b981' }}>
            {student.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-xs text-muted-foreground">{student.goal || 'Portal do Aluno'}</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => { setStudent(null); setCode(''); }}>
            Sair
          </Button>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-4">
          {(['sessions', 'photos', 'bio'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              {t === 'sessions' && <><Calendar className="h-3.5 w-3.5" /> Sessões</>}
              {t === 'photos' && <><Camera className="h-3.5 w-3.5" /> Fotos</>}
              {t === 'bio' && <><TrendingUp className="h-3.5 w-3.5" /> Bio</>}
            </button>
          ))}
        </div>

        {/* Sessions */}
        {tab === 'sessions' && (
          <div className="space-y-2">
            {sessions.length > 0 ? sessions.map(s => (
              <div key={s.id} className="glass rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    {format(parseISO(s.scheduled_date), "d 'de' MMM", { locale: ptBR })}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    s.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {s.status === 'completed' ? 'Concluída' : s.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                  </span>
                </div>
                {s.muscle_groups?.length > 0 && (
                  <div className="mt-1.5"><MuscleGroupBadges groups={s.muscle_groups} size="xs" /></div>
                )}
                {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
              </div>
            )) : (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {tab === 'photos' && (
          photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden aspect-[3/4]">
                  <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma foto de progresso</p>
            </div>
          )
        )}

        {/* Bio */}
        {tab === 'bio' && (
          <div>
            {chartData.length > 1 && (
              <div className="glass rounded-2xl p-4 mb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                    <Line type="monotone" dataKey="Peso" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Gordura %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {bioRecords.slice().reverse().map(r => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(parseISO(r.measured_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {r.weight && <div><p className="text-lg font-bold">{Number(r.weight).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Peso</p></div>}
                    {r.body_fat_pct && <div><p className="text-lg font-bold">{Number(r.body_fat_pct).toFixed(1)}%</p><p className="text-[10px] text-muted-foreground">Gordura</p></div>}
                    {r.muscle_mass && <div><p className="text-lg font-bold">{Number(r.muscle_mass).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">M. Muscular</p></div>}
                  </div>
                </div>
              ))}
              {bioRecords.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum registro</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
