import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { compressImage } from '@/lib/imageUtils';
import { useUploadProgressPhoto } from '@/hooks/useProgressPhotos';
import { useToast } from '@/hooks/use-toast';

const SLOTS = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lateral' },
  { key: 'back', label: 'Costas' },
] as const;

interface PhotoSlot {
  file: File | null;
  preview: string | null;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export const MultiPhotoUpload = ({ open, onOpenChange, studentId }: Props) => {
  const { toast } = useToast();
  const uploadPhoto = useUploadProgressPhoto();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Record<string, PhotoSlot>>({
    front: { file: null, preview: null, notes: '' },
    side: { file: null, preview: null, notes: '' },
    back: { file: null, preview: null, notes: '' },
  });

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (key: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      const preview = URL.createObjectURL(compressed);
      setSlots(prev => ({ ...prev, [key]: { ...prev[key], file: compressed, preview } }));
    } catch {
      toast({ title: 'Erro ao processar imagem', variant: 'destructive' });
    }
  };

  const removePhoto = (key: string) => {
    if (slots[key].preview) URL.revokeObjectURL(slots[key].preview!);
    setSlots(prev => ({ ...prev, [key]: { file: null, preview: null, notes: prev[key].notes } }));
  };

  const hasAnyPhoto = Object.values(slots).some(s => s.file);

  const handleSave = async () => {
    if (!hasAnyPhoto) return;
    setSaving(true);
    try {
      const uploads = Object.entries(slots)
        .filter(([, s]) => s.file)
        .map(([key, s]) =>
          uploadPhoto.mutateAsync({
            studentId,
            file: s.file!,
            photoType: key,
            takenAt: date,
            notes: [s.notes, weight ? `Peso: ${weight}kg` : ''].filter(Boolean).join(' | ') || undefined,
          })
        );
      await Promise.all(uploads);
      toast({ title: `${uploads.length} foto(s) salva(s)!` });
      onOpenChange(false);
      // Reset
      setSlots({
        front: { file: null, preview: null, notes: '' },
        side: { file: null, preview: null, notes: '' },
        back: { file: null, preview: null, notes: '' },
      });
      setWeight('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Nova Medição Visual
          </DialogTitle>
          <DialogDescription>Envie até 3 fotos (frente, lateral, costas)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Peso atual (kg)</Label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                placeholder="Opcional" className="bg-muted/50 border-border/50 rounded-xl h-11 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <p className="text-xs font-medium text-center text-muted-foreground">{label}</p>
                <div className="relative">
                  <label
                    htmlFor={`photo-input-${key}`}
                    className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-colors cursor-pointer flex items-center justify-center overflow-hidden ${
                      slots[key].file ? 'border-primary/50' : 'border-border/50 hover:border-primary/30 bg-muted/30'
                    }`}
                    style={{ display: 'flex' }}
                  >
                    {slots[key].preview ? (
                      <>
                        <img src={slots[key].preview!} alt={label} className="w-full h-full object-cover" />
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 p-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground text-center">Clique para enviar</span>
                      </div>
                    )}
                  </label>
                  {slots[key].preview && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(key); }}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <input
                    id={`photo-input-${key}`}
                    ref={el => { inputRefs.current[key] = el; }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(key, f);
                      e.target.value = '';
                    }}
                  />
                </div>
                <Textarea
                  value={slots[key].notes}
                  onChange={(e) => setSlots(prev => ({ ...prev, [key]: { ...prev[key], notes: e.target.value } }))}
                  placeholder="Anotação..."
                  className="bg-muted/50 border-border/50 rounded-lg text-[11px] min-h-[48px] resize-none"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving || !hasAnyPhoto}
            className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
            {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</> : 'Salvar medição'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
