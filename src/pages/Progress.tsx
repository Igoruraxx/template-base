import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudents } from '@/hooks/useStudents';
import { useProgressPhotos, useDeleteProgressPhoto } from '@/hooks/useProgressPhotos';
import { useBioimpedance, useCreateBioimpedance, useDeleteBioimpedance } from '@/hooks/useBioimpedance';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, TrendingUp, Trash2, X, Image, FileText, Plus, Loader2, Upload, ArrowLeftRight, ClipboardList, FileDown, Search, User, ArrowLeft, ChevronRight, Activity, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MultiPhotoUpload } from '@/components/MultiPhotoUpload';
import { fileToBase64 } from '@/lib/imageUtils';
import { supabase } from '@/integrations/supabase/client';
import { BeforeAfterComparison } from '@/components/BeforeAfterComparison';
import { AssessmentTab } from '@/components/AssessmentTab';
import { generateBioimpedancePdf } from '@/lib/generateBioimpedancePdf';
import { SignedImage } from '@/components/SignedImage';
import { getSignedUrl } from '@/lib/storageUtils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('photos');
  const [multiPhotoOpen, setMultiPhotoOpen] = useState(false);
  const [bioDialog, setBioDialog] = useState(false);
  const [ocrDialog, setOcrDialog] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: photos } = useProgressPhotos(selectedStudent || undefined);
  const { data: bioRecords } = useBioimpedance(selectedStudent || undefined);
  const deletePhoto = useDeleteProgressPhoto();
  const createBio = useCreateBioimpedance();
  const deleteBio = useDeleteBioimpedance();

  // Bio form
  const [bioForm, setBioForm] = useState({
    measuredAt: format(new Date(), 'yyyy-MM-dd'),
    weight: '', bodyFatPct: '', muscleMass: '', visceralFat: '',
    bmr: '', bodyWaterPct: '', boneMass: '', reportFile: null as File | null, notes: '',
  });

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState(false);

  const handleOcrExtract = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    try {
      const base64 = await fileToBase64(ocrFile);
      const { data, error } = await supabase.functions.invoke('extract-bioimpedance', {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const d = data?.data || {};
      setBioForm(prev => ({
        ...prev,
        weight: d.weight?.toString() || prev.weight,
        bodyFatPct: d.body_fat_pct?.toString() || prev.bodyFatPct,
        muscleMass: d.muscle_mass?.toString() || prev.muscleMass,
        visceralFat: d.visceral_fat?.toString() || prev.visceralFat,
        bmr: d.bmr?.toString() || prev.bmr,
        bodyWaterPct: d.body_water_pct?.toString() || prev.bodyWaterPct,
        boneMass: d.bone_mass?.toString() || prev.boneMass,
        reportFile: ocrFile,
      }));
      setOcrExtracted(true);
      toast({ title: 'Valores extraídos! Revise e confirme.' });
    } catch (err: any) {
      toast({ title: 'Erro na extração', description: err.message, variant: 'destructive' });
    } finally {
      setOcrLoading(false);
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
      setOcrDialog(false);
      resetBioForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const resetBioForm = () => {
    setBioForm({ measuredAt: format(new Date(), 'yyyy-MM-dd'), weight: '', bodyFatPct: '', muscleMass: '', visceralFat: '', bmr: '', bodyWaterPct: '', boneMass: '', reportFile: null, notes: '' });
    setOcrFile(null);
    setOcrPreview(null);
    setOcrExtracted(false);
  };

  const chartData = bioRecords?.map(r => ({
    date: format(parseISO(r.measured_at), 'dd/MM', { locale: ptBR }),
    'Peso (kg)': r.weight ? Number(r.weight) : null,
    'Gordura (%)': r.body_fat_pct ? Number(r.body_fat_pct) : null,
    'Massa Musc. (kg)': r.muscle_mass ? Number(r.muscle_mass) : null,
  })) || [];

  const availableStudents = students?.filter(s => s.status !== 'inactive') || [];

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
            
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2" style={{ borderColor: availableStudents.find(s => s.id === selectedStudent)?.color || '#10b981' }}>
                <AvatarImage src={availableStudents.find(s => s.id === selectedStudent)?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {availableStudents.find(s => s.id === selectedStudent)?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{availableStudents.find(s => s.id === selectedStudent)?.name}</h1>
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
                <TabsTrigger value="bio" className="flex-1 rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" /> Bio
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

              <TabsContent value="bio" className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm">Histórico Corporal</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => { resetBioForm(); setOcrDialog(true); }} size="icon" variant="outline" className="rounded-full h-9 w-9">
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => { resetBioForm(); setBioDialog(true); }} size="sm" className="rounded-full gradient-primary text-primary-foreground">
                      <Plus className="h-4 w-4 mr-1" /> Manual
                    </Button>
                  </div>
                </div>

                {chartData.length > 1 && (
                  <div className="glass rounded-2xl p-4 mb-5 border border-border/50 shadow-sm">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} iconType="circle" />
                        <Line type="monotone" dataKey="Peso (kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Gordura (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Massa Musc. (kg)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-3 pb-20">
                  {bioRecords?.slice().reverse().map((record, index, arr) => {
                    // Cálculo simples para ver se subiu ou desceu (comparando com o anterior histórico, que no array invertido é index + 1)
                    const prevRecord = arr[index + 1];
                    const weightDiff = prevRecord && record.weight && prevRecord.weight ? (Number(record.weight) - Number(prevRecord.weight)).toFixed(1) : null;
                    const fatDiff = prevRecord && record.body_fat_pct && prevRecord.body_fat_pct ? (Number(record.body_fat_pct) - Number(prevRecord.body_fat_pct)).toFixed(1) : null;
                    const muscleDiff = prevRecord && record.muscle_mass && prevRecord.muscle_mass ? (Number(record.muscle_mass) - Number(prevRecord.muscle_mass)).toFixed(1) : null;

                    return (
                    <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-xl p-4 border border-border/50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                             <Activity className="h-4 w-4 text-primary" />
                           </div>
                           <p className="text-sm font-semibold">
                             {format(parseISO(record.measured_at), "dd MMM yyyy", { locale: ptBR })}
                           </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (bioRecords) {
                                const studentName = availableStudents.find(s => s.id === selectedStudent)?.name || 'Aluno';
                                generateBioimpedancePdf(bioRecords, studentName, photos || undefined);
                              }
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title="Baixar Relatório Completo"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteBio.mutate(record.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-1">
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
                      </div>
                      
                      {record.report_url && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                           <button onClick={async () => { const url = await getSignedUrl('bioimpedance-reports', record.report_url); window.open(url, '_blank'); }}
                             className="flex items-center justify-center w-full gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 py-2 rounded-lg">
                             <FileText className="h-3.5 w-3.5" /> Ver PDF Original do Exame
                           </button>
                        </div>
                      )}
                    </motion.div>
                  )})}
                  {(!bioRecords || bioRecords.length === 0) && (
                    <div className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-4">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                         <TrendingUp className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium">Sem dados corporais</p>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">Mantenha o histórico do aluno atualizado.</p>
                      <Button onClick={() => setBioDialog(true)} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
                         Lançar primeira avaliação
                      </Button>
                    </div>
                  )}
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

        {/* OCR Bio Dialog */}
        <Dialog open={ocrDialog} onOpenChange={(o) => { setOcrDialog(o); if (!o) resetBioForm(); }}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Bioimpedância por Arquivo
              </DialogTitle>
              <DialogDescription>Envie o laudo da balança (PDF ou imagem) para extrair os dados automaticamente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Data</Label>
                <Input type="date" value={bioForm.measuredAt}
                  onChange={(e) => setBioForm({ ...bioForm, measuredAt: e.target.value })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
              </div>

              {!ocrExtracted ? (
                <>
                  <div
                    onClick={() => document.getElementById('ocr-input')?.click()}
                    className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    {ocrFile ? (
                      ocrFile.type === 'application/pdf' ? (
                        <div className="flex flex-col items-center gap-1">
                          <FileText className="h-10 w-10 text-primary" />
                          <p className="text-sm text-foreground font-medium">{ocrFile.name}</p>
                        </div>
                      ) : (
                        <img src={ocrPreview!} alt="Preview" className="max-h-48 rounded-lg object-contain" />
                      )
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para enviar o laudo ou imagem</p>
                      </>
                    )}
                    <input id="ocr-input" type="file" accept="image/*,.pdf" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setOcrFile(f);
                          if (f.type !== 'application/pdf') {
                            setOcrPreview(URL.createObjectURL(f));
                          } else {
                            setOcrPreview(null);
                          }
                        }
                      }} />
                  </div>
                  <Button onClick={handleOcrExtract} disabled={!ocrFile || ocrLoading}
                    className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                    {ocrLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Extraindo...</> : 'Extrair valores'}
                  </Button>
                </>
              ) : (
                <>
                  {ocrPreview && (
                    <img src={ocrPreview} alt="Scale" className="max-h-32 rounded-lg object-contain mx-auto" />
                  )}
                  <BioFormFields bioForm={bioForm} setBioForm={setBioForm} />
                  <Button onClick={handleCreateBio} disabled={createBio.isPending}
                    className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                    {createBio.isPending ? 'Salvando...' : 'Confirmar e salvar'}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Bio Dialog */}
        <Dialog open={bioDialog} onOpenChange={(o) => { setBioDialog(o); if (!o) resetBioForm(); }}>
          <DialogContent className="glass max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Registro Manual</DialogTitle>
              <DialogDescription>Dados da bioimpedância</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Data</Label>
                <Input type="date" value={bioForm.measuredAt}
                  onChange={(e) => setBioForm({ ...bioForm, measuredAt: e.target.value })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
              </div>
              <BioFormFields bioForm={bioForm} setBioForm={setBioForm} />
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

// Extracted bio form fields to avoid duplication
const BioFormFields = ({ bioForm, setBioForm }: { bioForm: any; setBioForm: (fn: any) => void }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div><Label className="text-muted-foreground text-xs">Peso (kg)</Label>
        <Input type="number" step="0.1" value={bioForm.weight} onChange={(e) => setBioForm((p: any) => ({ ...p, weight: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
      <div><Label className="text-muted-foreground text-xs">Gordura (%)</Label>
        <Input type="number" step="0.1" value={bioForm.bodyFatPct} onChange={(e) => setBioForm((p: any) => ({ ...p, bodyFatPct: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div><Label className="text-muted-foreground text-xs">Massa Muscular (kg)</Label>
        <Input type="number" step="0.1" value={bioForm.muscleMass} onChange={(e) => setBioForm((p: any) => ({ ...p, muscleMass: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
      <div><Label className="text-muted-foreground text-xs">Gordura Visceral</Label>
        <Input type="number" step="0.1" value={bioForm.visceralFat} onChange={(e) => setBioForm((p: any) => ({ ...p, visceralFat: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div><Label className="text-muted-foreground text-xs">TMB (kcal)</Label>
        <Input type="number" value={bioForm.bmr} onChange={(e) => setBioForm((p: any) => ({ ...p, bmr: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
      <div><Label className="text-muted-foreground text-xs">Água (%)</Label>
        <Input type="number" step="0.1" value={bioForm.bodyWaterPct} onChange={(e) => setBioForm((p: any) => ({ ...p, bodyWaterPct: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
      <div><Label className="text-muted-foreground text-xs">M. Óssea (kg)</Label>
        <Input type="number" step="0.1" value={bioForm.boneMass} onChange={(e) => setBioForm((p: any) => ({ ...p, boneMass: e.target.value }))} className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" /></div>
    </div>
  </>
);

export default Progress;
