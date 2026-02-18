import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

type BioRecord = Tables<'bioimpedance'>;

interface ProgressPhoto {
  photo_url: string;
  photo_type: string | null;
  taken_at: string;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Lado',
  back: 'Costas',
  other: 'Outro',
};

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const METRICS: { key: keyof BioRecord; label: string; unit: string; decimals: number }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg', decimals: 1 },
  { key: 'body_fat_pct', label: 'Gordura Corporal', unit: '%', decimals: 1 },
  { key: 'muscle_mass', label: 'Massa Muscular', unit: 'kg', decimals: 1 },
  { key: 'visceral_fat', label: 'Gordura Visceral', unit: '', decimals: 0 },
  { key: 'bmr', label: 'Taxa Metab. Basal', unit: 'kcal', decimals: 0 },
  { key: 'body_water_pct', label: 'Água Corporal', unit: '%', decimals: 1 },
  { key: 'bone_mass', label: 'Massa Óssea', unit: 'kg', decimals: 1 },
];

export async function generateBioimpedancePdf(
  records: BioRecord[],
  studentName: string,
  photos?: ProgressPhoto[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Load logo
  const logoBase64 = await loadImageAsBase64('/icon-192.png');

  // Header with logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, y, 18, 18);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Bioimpedância', 36, y + 7);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, 36, y + 13);
    doc.setFontSize(9);
    doc.text(format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), 36, y + 18);
    y += 26;
  } else {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Bioimpedância', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.text(format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // Divider
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Latest record data
  const latest = records[records.length - 1];
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Última Medição', 14, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(format(parseISO(latest.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), 80, y);
  y += 8;

  doc.setFontSize(10);
  for (const m of METRICS) {
    const val = latest[m.key];
    if (val != null) {
      doc.text(`${m.label}: ${Number(val).toFixed(m.decimals)}${m.unit ? ' ' + m.unit : ''}`, 14, y);
      y += 6;
    }
  }

  if (latest.notes) {
    y += 2;
    doc.setFont('helvetica', 'italic');
    doc.text(`Obs: ${latest.notes}`, 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  }

  // Comparative table
  if (records.length > 1) {
    y += 6;
    if (y > 220) { doc.addPage(); y = 20; }

    const first = records[0];
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução Comparativa', 14, y);
    y += 8;

    // Table header
    const col1 = 14;
    const col2 = 80;
    const col3 = 115;
    const col4 = 150;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Métrica', col1, y);
    doc.text(format(parseISO(first.measured_at), 'dd/MM/yy'), col2, y);
    doc.text(format(parseISO(latest.measured_at), 'dd/MM/yy'), col3, y);
    doc.text('Diferença', col4, y);
    y += 2;
    doc.setDrawColor(180);
    doc.line(col1, y, 190, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    for (const m of METRICS) {
      const firstVal = first[m.key] != null ? Number(first[m.key]) : null;
      const latestVal = latest[m.key] != null ? Number(latest[m.key]) : null;

      if (firstVal == null && latestVal == null) continue;

      doc.text(m.label, col1, y);
      doc.text(firstVal != null ? firstVal.toFixed(m.decimals) : '-', col2, y);
      doc.text(latestVal != null ? latestVal.toFixed(m.decimals) : '-', col3, y);

      if (firstVal != null && latestVal != null) {
        const diff = latestVal - firstVal;
        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
        const sign = diff > 0 ? '+' : '';
        doc.text(`${arrow} ${sign}${diff.toFixed(m.decimals)}`, col4, y);
      } else {
        doc.text('-', col4, y);
      }
      y += 6;
    }
  }

  // Progress Photos
  if (photos && photos.length > 0) {
    const grouped: Record<string, ProgressPhoto[]> = {};
    for (const p of photos) {
      const dateKey = p.taken_at;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(p);
    }

    const sortedDates = Object.keys(grouped).sort();

    for (const dateKey of sortedDates) {
      doc.addPage();
      y = 20;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const dateLabel = format(parseISO(dateKey), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.text(`Fotos de Progresso — ${dateLabel}`, 14, y);
      y += 10;

      const datePhotos = grouped[dateKey];
      const photoWidth = 55;
      const photoHeight = 75;
      const gap = 5;
      const startX = 14;

      for (let i = 0; i < datePhotos.length; i++) {
        const col = i % 3;
        if (i > 0 && col === 0) {
          y += photoHeight + 15;
          if (y + photoHeight > 280) {
            doc.addPage();
            y = 20;
          }
        }

        const x = startX + col * (photoWidth + gap);
        const base64 = await loadImageAsBase64(datePhotos[i].photo_url);
        if (base64) {
          doc.addImage(base64, 'JPEG', x, y, photoWidth, photoHeight);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const typeLabel = PHOTO_TYPE_LABELS[datePhotos[i].photo_type || 'other'] || 'Outro';
          doc.text(typeLabel, x + photoWidth / 2, y + photoHeight + 4, { align: 'center' });
        }
      }
    }
  }

  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`bioimpedancia-${safeName}.pdf`);
}
