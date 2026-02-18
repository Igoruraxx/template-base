import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight, Image } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string | null;
  taken_at: string;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Lateral',
  back: 'Costas',
  other: 'Outro',
};

interface Props {
  photos: Photo[];
  onPhotoClick: (url: string) => void;
}

export const BeforeAfterComparison = ({ photos, onPhotoClick }: Props) => {
  const [beforeDate, setBeforeDate] = useState('');
  const [afterDate, setAfterDate] = useState('');
  const [photoType, setPhotoType] = useState('front');

  // Get unique dates sorted ascending
  const dates = useMemo(() => {
    const unique = [...new Set(photos.map(p => p.taken_at))].sort();
    return unique;
  }, [photos]);

  // Auto-select first and last dates when photos change
  useEffect(() => {
    if (dates.length >= 2) {
      setBeforeDate(dates[0]);
      setAfterDate(dates[dates.length - 1]);
    } else if (dates.length === 1) {
      setBeforeDate(dates[0]);
      setAfterDate('');
    } else {
      setBeforeDate('');
      setAfterDate('');
    }
  }, [dates]);

  const beforePhotos = useMemo(
    () => photos.filter(p => p.taken_at === beforeDate && p.photo_type === photoType),
    [photos, beforeDate, photoType]
  );

  const afterPhotos = useMemo(
    () => photos.filter(p => p.taken_at === afterDate && p.photo_type === photoType),
    [photos, afterDate, photoType]
  );

  const beforePhoto = beforePhotos[0];
  const afterPhoto = afterPhotos[0];

  // Available types for selected dates
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    photos.forEach(p => {
      if ((p.taken_at === beforeDate || p.taken_at === afterDate) && p.photo_type) {
        types.add(p.photo_type);
      }
    });
    return [...types];
  }, [photos, beforeDate, afterDate]);

  if (photos.length < 2) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
        <ArrowLeftRight className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Precisa de pelo menos 2 fotos em datas diferentes para comparar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-1.5 justify-center">
        {['front', 'side', 'back'].map(type => (
          <button
            key={type}
            onClick={() => setPhotoType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              photoType === type
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Date selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Antes</Label>
          <Select value={beforeDate} onValueChange={setBeforeDate}>
            <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-9 mt-1 text-xs">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              {dates.map(d => (
                <SelectItem key={d} value={d} className="text-xs">
                  {format(parseISO(d), "dd/MM/yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Depois</Label>
          <Select value={afterDate} onValueChange={setAfterDate}>
            <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-9 mt-1 text-xs">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              {dates.map(d => (
                <SelectItem key={d} value={d} className="text-xs">
                  {format(parseISO(d), "dd/MM/yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-2">
        <PhotoCard
          photo={beforePhoto}
          label="Antes"
          date={beforeDate}
          onClick={onPhotoClick}
        />
        <PhotoCard
          photo={afterPhoto}
          label="Depois"
          date={afterDate}
          onClick={onPhotoClick}
        />
      </div>

      {/* Notes comparison */}
      {(beforePhoto?.notes || afterPhoto?.notes) && (
        <div className="grid grid-cols-2 gap-2">
          {beforePhoto?.notes && (
            <div className="glass rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">{beforePhoto.notes}</p>
            </div>
          )}
          {afterPhoto?.notes && (
            <div className="glass rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">{afterPhoto.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PhotoCard = ({
  photo,
  label,
  date,
  onClick,
}: {
  photo?: Photo;
  label: string;
  date: string;
  onClick: (url: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col"
  >
    <p className="text-[10px] font-medium text-muted-foreground mb-1 text-center">{label}</p>
    {photo ? (
      <div
        className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-border/30"
        onClick={() => onClick(photo.photo_url)}
      >
        <img
          src={photo.photo_url}
          alt={label}
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center bg-muted/20">
        <Image className="h-6 w-6 text-muted-foreground/50 mb-1" />
        <p className="text-[10px] text-muted-foreground/50">
          {date ? 'Sem foto nesta data' : 'Selecione uma data'}
        </p>
      </div>
    )}
    {date && (
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {format(parseISO(date), "dd/MM/yy")}
      </p>
    )}
  </motion.div>
);
