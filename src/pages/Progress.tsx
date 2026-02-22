import { useState, useRef } from 'react';
import { ocrService } from '@/lib/ocrService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudents } from '@/hooks/useStudents';
import { useProgressPhotos, useDeleteProgressPhoto } from '@/hooks/useProgressPhotos';
import { useBodyComposition, useCreateBodyComposition, useDeleteBodyComposition } from '@/hooks/useBodyComposition';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, TrendingUp, Trash2, X, Image, Plus, Loader2, Upload, ArrowLeftRight, ClipboardList, Search, User, ArrowLeft, ChevronRight, Activity, Scale, ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MultiPhotoUpload } from '@/components/MultiPhotoUpload';
import { compressImage } from '@/lib/imageUtils';
import { BeforeAfterComparison } from '@/components/BeforeAfterComparison';
import { AssessmentTab } from '@/components/AssessmentTab';
import { SignedImage } from '@/components/SignedImage';
import { getSignedUrl } from '@/lib/storageUtils';

const Progress = () => {
  const { user } = useAuth();
  const { data: students } = useStudents();
  const { toast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('photos');
  const [multiPhotoOpen, setMultiPhotoOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Body composition state
  const [bodyCompDialog, setBodyCompDialog] = useState(false);
  const [bcImageFile, setBcImageFile] = useState<File | null>(null);
  const [bcImagePreview, setBcImagePreview] = useState<string | null>(null);
  const [bcOcrLoading, setBcOcrLoading] = useState(false);
  const [bcExtracted, setBcExtracted] = useState(false);
  const [bcForm, setBcForm] = useState({
    measuredAt: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFatPct: '',
    muscleMass: '',
    visceralFat: '',
    bmr: '',
  });

  const { data: photos } = useProgressPhotos(selectedStudent || undefined);
  const { data: bodyCompRecords } = useBodyComposition(selectedStudent || undefined);
  const deletePhoto = useDeleteProgressPhoto();
  const createBodyComp = useCreateBodyComposition();
  const deleteBodyComp = useDeleteBodyComposition();

  const availableStudents = students?.filter(s => s.status !== 'inactive') || [];

  const resetBodyCompForm = () => {
    setBcImageFile(null);
    setBcImagePreview(null);
    setBcExtracted(false);
    setBcOcrLoading(false);
    setBcForm({
      measuredAt: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      bodyFatPct: '',
      muscleMass: '',
      visceralFat: '',
      bmr: '',
    });
  };

  const handleImageSelect = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const preview = URL.createObjectURL(compressed);
      setBcImageFile(compressed);
      setBcImagePreview(preview);
      setBcExtracted(false);
    } catch {
      toast({ title: 'Erro ao processar imagem', variant: 'destructive' });
    }
  };

  const handleOcrExtract = async () => {
    if (!bcImageFile) return;
    setBcOcrLoading(true);
    try {
      const data = await ocrService.extractFromImage(bcImageFile);
      setBcForm(prev => ({
        ...prev,
        weight: data.weight?.toString() || prev.weight,
        bodyFatPct: data.bodyFatPct?.toString() || prev.bodyFatPct,
        muscleMass: data.muscleMass?.toString() || prev.muscleMass,
        visceralFat: data.visceralFat?.toString() || prev.visceralFat,
        bmr: data.bmr?.toString() || prev.bmr,
      }));
      setBcExtracted(true);
      toast({ title: 'Dados extraídos! Revise e confirme.' });
    } catch (err: any) {
      toast({ title: 'Erro na extração', description: err.message, variant: 'destructive' });
      setBcExtracted(true);
    } finally {
      setBcOcrLoading(false);
    }
  };

  const handleSaveBodyComp = async () => {
    if (!selectedStudent || !bcImageFile) return;
    try {
      await createBodyComp.mutateAsync({
        studentId: selectedStudent,
        imageFile: bcImageFile,
        measuredAt: bcForm.measuredAt,
        weight: bcForm.weight ? parseFloat(bcForm.weight) : undefined,
        bodyFatPct: bcForm.bodyFatPct ? parseFloat(bcForm.bodyFatPct) : undefined,
        muscleMass: bcForm.muscleMass ? parseFloat(bcForm.muscleMass) : undefined,
        visceralFat: bcForm.visceralFat ? parseFloat(bcForm.visceralFat) : undefined,
        bmr: bcForm.bmr ? parseFloat(bcForm.bmr) : undefined,
      });
      toast({ title: 'Composição corporal salva!' });
      setBodyCompDialog(false);
      resetBodyCompForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // Chart data for body composition
  const bodyCompChartData = bodyCompRecords?.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'Peso (kg)': r.weight ? Number(r.weight) : null,
    'Gordura (%)': r.body_fat_pct ? Number(r.body_fat_pct) : null,
    'Músculo (kg)': r.muscle_mass ? Number(r.muscle_mass) : null,
    'G. Visceral': r.visceral_fat ? Number(r.visceral_fat) : null,
    'TMB (kcal)': r.bmr ? Number(r.bmr) : null,
  })) || [];

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        {!selectedStudent && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold tracking-tight">Progresso</h1>
            <p className="text-muted-foreground text-sm mt-0.5 mb-6">Selecione um aluno para acompanhar avaliações</p>
          </motion.div>
        )}

        {!selectedStudent ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                className="pl-9 bg-muted/50 rounded-xl border-border/50 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2 pb-20">
              {availableStudents
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(s => (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id)}
                    className="flex justify-between items-center p-3.5 glass rounded-xl cursor-pointer active:scale-95 transition-all border border-border/50 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border" style={{ borderColor: s.color || '#10b981' }}>
                        <AvatarImage src={s.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {s.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Ver resultados
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              {availableStudents.length > 0 && availableStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum aluno encontrado.</p>
              )}
              {availableStudents.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium text-muted-foreground">Você ainda não tem alunos ativos.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setSelectedStudent('')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-16 w-16 border-2" style={{ borderColor: availableStudents.find(s => s.id === selectedStudent)?.color || '#10b981' }}>
                <AvatarImage src={availableStudents.find(s => s.id === selectedStudent)?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {availableStudents.find(s => s.id === selectedStudent)?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-xl font-bold line-clamp-1">{availableStudents.find(s => s.id === selectedStudent)?.name}</h1>
                <p className="text-sm text-muted-foreground">Dashboard de Progresso</p>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full bg-muted rounded-xl p-1 mb-4 flex">
                <TabsTrigger value="photos" className="flex-1 rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Camera className="h-3.5 w-3.5 mr-1" /> Fotos
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex-1 rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Comparar
                </TabsTrigger>
                <TabsTrigger value="body" className="flex-1 rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Scale className="h-3.5 w-3.5 mr-1" /> Composição
                </TabsTrigger>
                <TabsTrigger value="assessment" className="flex-1 rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ClipboardList className="h-3.5 w-3.5 mr-1" /> Avaliação
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="mt-0">
                {photos && photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pb-24">
                    {photos.map(photo => (
                      <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative group rounded-xl overflow-hidden aspect-[3/4] cursor-pointer shadow-sm border border-border/30"
                        onClick={async () => { const url = await getSignedUrl('progress-photos', photo.photo_url); setLightboxUrl(url); }}>
                        <SignedImage bucket="progress-photos" storagePath={photo.photo_url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white font-medium text-[10px] bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm inline-block">
                              {format(parseISO(photo.taken_at), 'dd/MMM', { locale: ptBR })}
                            </p>
                            {photo.notes && <p className="text-white/80 text-[9px] mt-1 truncate">{photo.notes}</p>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deletePhoto.mutate(photo.id); }}
                            className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/40 p-1 rounded-full backdrop-blur-sm">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-4">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium">Nenhuma foto ainda</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Acompanhe a evolução tirando a primeira foto.</p>
                    <Button onClick={() => setMultiPhotoOpen(true)} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
                      Tirar foto agora
                    </Button>
                  </div>
                )}

                {photos && photos.length > 0 && (
                  <div className="fixed bottom-20 right-4 z-40">
                    <Button
                      onClick={() => setMultiPhotoOpen(true)}
                      size="icon"
                      className="h-14 w-14 rounded-full gradient-primary shadow-lg shadow-primary/30 text-white"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compare" className="mt-0">
                <BeforeAfterComparison
                  photos={photos || []}
                  onPhotoClick={(url) => setLightboxUrl(url)}
                />
              </TabsContent>

              <TabsContent value="body" className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm">Composição Corporal</h3>
                  <Button
                    onClick={() => { resetBodyCompForm(); setBodyCompDialog(true); }}
                    size="sm"
                    className="rounded-full gradient-primary text-primary-foreground"
                  >
                    <Upload className="h-4 w-4 mr-1" /> Enviar Imagem
                  </Button>
                </div>

                {bodyCompRecords && bodyCompRecords.length === 0 && (
                  <div className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Scale className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium">Sem registros ainda</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Envie a foto do relatório da balança de bioimpedância para extrair os dados automaticamente.
                    </p>
                    <Button onClick={() => { resetBodyCompForm(); setBodyCompDialog(true); }} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
                      Enviar primeira imagem
                    </Button>
                  </div>
                )}

                {bodyCompRecords && bodyCompRecords.length >= 2 && (
                  <div className="glass rounded-2xl p-4 mb-5 border border-border/50 shadow-sm bg-background/95">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comparativo Gráfico</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={bodyCompChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} iconType="circle" />
                        <Line type="monotone" dataKey="Peso (kg)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} connectNulls />
                        <Line type="monotone" dataKey="Gordura (%)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} connectNulls />
                        <Line type="monotone" dataKey="Músculo (kg)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} connectNulls />
                        <Line type="monotone" dataKey="G. Visceral" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} connectNulls />
                        <Line type="monotone" dataKey="TMB (kcal)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-3 pb-20">
                  {bodyCompRecords?.slice().reverse().map((record, index, arr) => {
                    const prevRecord = arr[index + 1];
                    const weightDiff = prevRecord && record.weight && prevRecord.weight
                      ? (Number(record.weight) - Number(prevRecord.weight)).toFixed(1) : null;
                    const fatDiff = prevRecord && record.body_fat_pct && prevRecord.body_fat_pct
                      ? (Number(record.body_fat_pct) - Number(prevRecord.body_fat_pct)).toFixed(1) : null;
                    const muscleDiff = prevRecord && record.muscle_mass && prevRecord.muscle_mass
                      ? (Number(record.muscle_mass) - Number(prevRecord.muscle_mass)).toFixed(1) : null;

                    return (
                      <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 border border-border/50">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Scale className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-sm font-semibold">
                              {format(parseISO(record.measured_at), "dd MMM yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const url = await getSignedUrl('bioimpedance-reports', record.image_path);
                                setLightboxUrl(url);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors p-1"
                              title="Ver imagem original"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteBodyComp.mutate({ id: record.id, imagePath: record.image_path })}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Remover registro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {record.weight && (
                            <div className="bg-muted/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Peso</p>
                              <p className="text-lg font-bold mt-0.5">{Number(record.weight).toFixed(1)}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">kg</span></p>
                              {weightDiff && Number(weightDiff) !== 0 && (
                                <p className={`text-[10px] mt-0.5 font-medium ${Number(weightDiff) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {Number(weightDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(weightDiff))}
                                </p>
                              )}
                            </div>
                          )}
                          {record.body_fat_pct && (
                            <div className="bg-muted/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gordura</p>
                              <p className="text-lg font-bold mt-0.5">{Number(record.body_fat_pct).toFixed(1)}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">%</span></p>
                              {fatDiff && Number(fatDiff) !== 0 && (
                                <p className={`text-[10px] mt-0.5 font-medium ${Number(fatDiff) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {Number(fatDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(fatDiff))}
                                </p>
                              )}
                            </div>
                          )}
                          {record.muscle_mass && (
                            <div className="bg-muted/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Músculo</p>
                              <p className="text-lg font-bold mt-0.5">{Number(record.muscle_mass).toFixed(1)}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">kg</span></p>
                              {muscleDiff && Number(muscleDiff) !== 0 && (
                                <p className={`text-[10px] mt-0.5 font-medium ${Number(muscleDiff) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {Number(muscleDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(muscleDiff))}
                                </p>
                              )}
                            </div>
                          )}
                          {record.visceral_fat && (
                            <div className="bg-muted/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">G. Visceral</p>
                              <p className="text-lg font-bold mt-0.5">{Number(record.visceral_fat).toFixed(0)}</p>
                            </div>
                          )}
                          {record.bmr && (
                            <div className="bg-muted/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TMB</p>
                              <p className="text-lg font-bold mt-0.5">{Number(record.bmr).toFixed(0)}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">kcal</span></p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="assessment" className="mt-0">
                <AssessmentTab studentId={selectedStudent} studentName={availableStudents.find(s => s.id === selectedStudent)?.name} />
              </TabsContent>
            </Tabs>
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

        {/* Multi photo upload */}
        {selectedStudent && (
          <MultiPhotoUpload open={multiPhotoOpen} onOpenChange={setMultiPhotoOpen} studentId={selectedStudent} />
        )}

        {/* Body Composition Dialog */}
        <Dialog open={bodyCompDialog} onOpenChange={(o) => { setBodyCompDialog(o); if (!o) resetBodyCompForm(); }}>
          <DialogContent className="glass max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" /> Composição Corporal
              </DialogTitle>
              <DialogDescription>
                Envie a foto do relatório da balança para extrair os dados automaticamente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Data da medição</Label>
                <Input
                  type="date"
                  value={bcForm.measuredAt}
                  onChange={(e) => setBcForm(p => ({ ...p, measuredAt: e.target.value }))}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1"
                />
              </div>

              {/* Image upload area */}
              <div
                onClick={() => !bcImageFile && document.getElementById('bc-image-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors ${bcImageFile ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
              >
                {bcImagePreview ? (
                  <div className="relative w-full">
                    <img src={bcImagePreview} alt="Relatório" className="max-h-48 rounded-lg object-contain mx-auto" />
                    <button
                      onClick={(e) => { e.stopPropagation(); resetBodyCompForm(); }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">Clique para enviar a foto do relatório</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WEBP</p>
                  </>
                )}
                <input
                  id="bc-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageSelect(f);
                    e.target.value = '';
                  }}
                />
              </div>

              {bcImageFile && !bcExtracted && (
                <Button
                  onClick={handleOcrExtract}
                  disabled={bcOcrLoading}
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold"
                >
                  {bcOcrLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extraindo dados...</>
                  ) : (
                    'Extrair Dados Automaticamente'
                  )}
                </Button>
              )}

              {(bcExtracted || bcImageFile) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Peso (kg)</Label>
                      <Input type="number" step="0.1" value={bcForm.weight}
                        onChange={(e) => setBcForm(p => ({ ...p, weight: e.target.value }))}
                        className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">% Gordura Corporal</Label>
                      <Input type="number" step="0.1" value={bcForm.bodyFatPct}
                        onChange={(e) => setBcForm(p => ({ ...p, bodyFatPct: e.target.value }))}
                        className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Massa Muscular (kg)</Label>
                      <Input type="number" step="0.1" value={bcForm.muscleMass}
                        onChange={(e) => setBcForm(p => ({ ...p, muscleMass: e.target.value }))}
                        className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Gordura Visceral</Label>
                      <Input type="number" step="0.1" value={bcForm.visceralFat}
                        onChange={(e) => setBcForm(p => ({ ...p, visceralFat: e.target.value }))}
                        className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Gasto Calórico Basal (kcal)</Label>
                    <Input type="number" value={bcForm.bmr}
                      onChange={(e) => setBcForm(p => ({ ...p, bmr: e.target.value }))}
                      className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
                  </div>
                  <Button
                    onClick={handleSaveBodyComp}
                    disabled={createBodyComp.isPending || !bcImageFile}
                    className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold"
                  >
                    {createBodyComp.isPending ? 'Salvando...' : 'Salvar Registro'}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Progress;
