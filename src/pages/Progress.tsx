import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudents } from '@/hooks/useStudents';
import { useProgressPhotos, useUploadProgressPhoto, useDeleteProgressPhoto } from '@/hooks/useProgressPhotos';
import { useBioimpedance, useCreateBioimpedance, useDeleteBioimpedance } from '@/hooks/useBioimpedance';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, TrendingUp, Trash2, X, Image, FileText, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PHOTO_TYPES = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Lado' },
  { value: 'back', label: 'Costas' },
  { value: 'other', label: 'Outro' },
];

const Progress = () => {
  const { user } = useAuth();
  const { data: students } = useStudents();
  const { toast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [tab, setTab] = useState('photos');
  const [photoDialog, setPhotoDialog] = useState(false);
  const [bioDialog, setBioDialog] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: photos } = useProgressPhotos(selectedStudent || undefined);
  const { data: bioRecords } = useBioimpedance(selectedStudent || undefined);
  const uploadPhoto = useUploadProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();
  const createBio = useCreateBioimpedance();
  const deleteBio = useDeleteBioimpedance();

  // Photo form
  const [photoForm, setPhotoForm] = useState({
    file: null as File | null,
    photoType: 'front',
    takenAt: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  // Bio form
  const [bioForm, setBioForm] = useState({
    measuredAt: format(new Date(), 'yyyy-MM-dd'),
    weight: '', bodyFatPct: '', muscleMass: '', visceralFat: '',
    bmr: '', bodyWaterPct: '', boneMass: '', reportFile: null as File | null, notes: '',
  });

  const handleUploadPhoto = async () => {
    if (!photoForm.file || !selectedStudent) return;
    try {
      await uploadPhoto.mutateAsync({
        studentId: selectedStudent,
        file: photoForm.file,
        photoType: photoForm.photoType,
        takenAt: photoForm.takenAt,
        notes: photoForm.notes,
      });
      toast({ title: 'Foto enviada!' });
      setPhotoDialog(false);
      setPhotoForm({ file: null, photoType: 'front', takenAt: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateBio = async () => {
    if (!selectedStudent) return;
    try {
      await createBio.mutateAsync({
        studentId: selectedStudent,
        measuredAt: bioForm.measuredAt,
        weight: bioForm.weight ? parseFloat(bioForm.weight) : undefined,
        bodyFatPct: bioForm.bodyFatPct ? parseFloat(bioForm.bodyFatPct) : undefined,
        muscleMass: bioForm.muscleMass ? parseFloat(bioForm.muscleMass) : undefined,
        visceralFat: bioForm.visceralFat ? parseFloat(bioForm.visceralFat) : undefined,
        bmr: bioForm.bmr ? parseFloat(bioForm.bmr) : undefined,
        bodyWaterPct: bioForm.bodyWaterPct ? parseFloat(bioForm.bodyWaterPct) : undefined,
        boneMass: bioForm.boneMass ? parseFloat(bioForm.boneMass) : undefined,
        reportFile: bioForm.reportFile || undefined,
        notes: bioForm.notes,
      });
      toast({ title: 'Registro salvo!' });
      setBioDialog(false);
      setBioForm({ measuredAt: format(new Date(), 'yyyy-MM-dd'), weight: '', bodyFatPct: '', muscleMass: '', visceralFat: '', bmr: '', bodyWaterPct: '', boneMass: '', reportFile: null, notes: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const chartData = bioRecords?.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'Peso (kg)': r.weight ? Number(r.weight) : null,
    'Gordura (%)': r.body_fat_pct ? Number(r.body_fat_pct) : null,
    'Massa Musc. (kg)': r.muscle_mass ? Number(r.muscle_mass) : null,
  })) || [];

  const activeStudents = students?.filter(s => s.status === 'active') || [];

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight">Progresso</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Fotos e bioimpedância</p>
        </motion.div>

        {/* Student selector */}
        <div className="mt-4 mb-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
              <SelectValue placeholder="Selecione um aluno" />
            </SelectTrigger>
            <SelectContent>
              {activeStudents.map(s => (
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

        {selectedStudent ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full bg-muted rounded-xl p-1 mb-4">
              <TabsTrigger value="photos" className="flex-1 rounded-lg text-xs">
                <Camera className="h-3.5 w-3.5 mr-1" /> Fotos
              </TabsTrigger>
              <TabsTrigger value="bio" className="flex-1 rounded-lg text-xs">
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> Bioimpedância
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              <div className="flex justify-end mb-3">
                <Button onClick={() => setPhotoDialog(true)} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
                  <Upload className="h-4 w-4 mr-1" /> Enviar foto
                </Button>
              </div>

              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-xl overflow-hidden aspect-[3/4] cursor-pointer"
                      onClick={() => setLightboxUrl(photo.photo_url)}>
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-[10px]">
                            {PHOTO_TYPES.find(t => t.value === photo.photo_type)?.label} • {format(parseISO(photo.taken_at), 'dd/MM/yy')}
                          </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deletePhoto.mutate(photo.id); }}
                          className="absolute top-2 right-2 text-white/80 hover:text-white">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
                  <Image className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma foto de progresso</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bio">
              <div className="flex justify-end mb-3">
                <Button onClick={() => setBioDialog(true)} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Novo registro
                </Button>
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="glass rounded-2xl p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-3">Evolução</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Gordura (%)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Massa Musc. (kg)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Records */}
              <div className="space-y-2">
                {bioRecords?.slice().reverse().map(record => (
                  <motion.div key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-muted-foreground font-medium">
                        {format(parseISO(record.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <button onClick={() => deleteBio.mutate(record.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {record.weight && <div><p className="text-lg font-bold">{Number(record.weight).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Peso (kg)</p></div>}
                      {record.body_fat_pct && <div><p className="text-lg font-bold">{Number(record.body_fat_pct).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Gordura (%)</p></div>}
                      {record.muscle_mass && <div><p className="text-lg font-bold">{Number(record.muscle_mass).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">M. Muscular</p></div>}
                    </div>
                    {record.report_url && (
                      <a href={record.report_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                        <FileText className="h-3 w-3" /> Ver laudo
                      </a>
                    )}
                  </motion.div>
                ))}
                {(!bioRecords || bioRecords.length === 0) && (
                  <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum registro de bioimpedância</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-4">
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Selecione um aluno para ver o progresso</p>
          </div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxUrl && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightboxUrl(null)}>
              <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
                <X className="h-6 w-6" />
              </button>
              <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo upload dialog */}
        <Dialog open={photoDialog} onOpenChange={setPhotoDialog}>
          <DialogContent className="glass max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Enviar Foto</DialogTitle>
              <DialogDescription>Adicione uma foto de progresso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Foto *</Label>
                <Input type="file" accept="image/*"
                  onChange={(e) => setPhotoForm({ ...photoForm, file: e.target.files?.[0] || null })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo</Label>
                  <Select value={photoForm.photoType} onValueChange={(v) => setPhotoForm({ ...photoForm, photoType: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <Input type="date" value={photoForm.takenAt}
                    onChange={(e) => setPhotoForm({ ...photoForm, takenAt: e.target.value })}
                    className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                </div>
              </div>
              <Button onClick={handleUploadPhoto} disabled={uploadPhoto.isPending || !photoForm.file}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                {uploadPhoto.isPending ? 'Enviando...' : 'Enviar foto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bioimpedance dialog */}
        <Dialog open={bioDialog} onOpenChange={setBioDialog}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Registro</DialogTitle>
              <DialogDescription>Dados da bioimpedância</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Data</Label>
                <Input type="date" value={bioForm.measuredAt}
                  onChange={(e) => setBioForm({ ...bioForm, measuredAt: e.target.value })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Peso (kg)</Label>
                  <Input type="number" step="0.1" value={bioForm.weight} onChange={(e) => setBioForm({ ...bioForm, weight: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Gordura (%)</Label>
                  <Input type="number" step="0.1" value={bioForm.bodyFatPct} onChange={(e) => setBioForm({ ...bioForm, bodyFatPct: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Massa Muscular (kg)</Label>
                  <Input type="number" step="0.1" value={bioForm.muscleMass} onChange={(e) => setBioForm({ ...bioForm, muscleMass: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Gordura Visceral</Label>
                  <Input type="number" step="0.1" value={bioForm.visceralFat} onChange={(e) => setBioForm({ ...bioForm, visceralFat: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-muted-foreground text-xs">TMB (kcal)</Label>
                  <Input type="number" value={bioForm.bmr} onChange={(e) => setBioForm({ ...bioForm, bmr: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Água (%)</Label>
                  <Input type="number" step="0.1" value={bioForm.bodyWaterPct} onChange={(e) => setBioForm({ ...bioForm, bodyWaterPct: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">M. Óssea (kg)</Label>
                  <Input type="number" step="0.1" value={bioForm.boneMass} onChange={(e) => setBioForm({ ...bioForm, boneMass: e.target.value })} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Laudo (PDF/imagem)</Label>
                <Input type="file" accept=".pdf,image/*"
                  onChange={(e) => setBioForm({ ...bioForm, reportFile: e.target.files?.[0] || null })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
              </div>
              <Button onClick={handleCreateBio} disabled={createBio.isPending}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                {createBio.isPending ? 'Salvando...' : 'Salvar registro'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Progress;
