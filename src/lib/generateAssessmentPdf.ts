import { jsPDF } from 'jspdf';
import { Assessment } from '@/hooks/useAssessments';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export async function generateAssessmentPdf(
  assessment: Assessment,
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
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Avaliação Física', 36, y + 8);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, 36, y + 14);
    doc.setFontSize(10);
    doc.text(format(parseISO(assessment.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), 36, y + 19);
    y += 28;
  } else {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Avaliação Física', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.text(format(parseISO(assessment.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, y, { align: 'center' });
    y += 12;
  }
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.text(format(parseISO(assessment.measured_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Dados Gerais
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Gerais', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const sexLabel = assessment.sex === 'male' ? 'Masculino' : 'Feminino';
  const general = [
    ['Sexo', sexLabel],
    ['Idade', `${assessment.age} anos`],
    ['Peso', `${Number(assessment.weight).toFixed(1)} kg`],
  ];
  general.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 6;
  });
  y += 4;

  // Composição Corporal
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Composição Corporal', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const comp = [
    ['Densidade Corporal', assessment.body_density != null ? Number(assessment.body_density).toFixed(4) : '-'],
    ['Percentual de Gordura', assessment.body_fat_pct != null ? `${Number(assessment.body_fat_pct).toFixed(1)}%` : '-'],
    ['Massa Gorda', assessment.fat_mass_kg != null ? `${Number(assessment.fat_mass_kg).toFixed(1)} kg` : '-'],
    ['Massa Magra', assessment.lean_mass_kg != null ? `${Number(assessment.lean_mass_kg).toFixed(1)} kg` : '-'],
  ];
  comp.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 6;
  });
  y += 6;

  // Dobras Cutâneas - Table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Dobras Cutâneas (mm)', 14, y);
  y += 7;

  const skinfolds: [string, number | null][] = [
    ['Peitoral', assessment.skinfold_chest],
    ['Axilar Média', assessment.skinfold_axillary],
    ['Tríceps', assessment.skinfold_triceps],
    ['Subescapular', assessment.skinfold_subscapular],
    ['Abdominal', assessment.skinfold_abdominal],
    ['Suprailíaca', assessment.skinfold_suprailiac],
    ['Coxa Medial', assessment.skinfold_thigh],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dobra', 14, y);
  doc.text('Valor (mm)', 100, y);
  y += 2;
  doc.setDrawColor(180);
  doc.line(14, y, 140, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  skinfolds.forEach(([label, value]) => {
    doc.text(label, 14, y);
    doc.text(value != null ? String(value) : '-', 100, y);
    y += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Soma Total', 14, y);
  doc.text(assessment.sum_skinfolds != null ? String(Number(assessment.sum_skinfolds).toFixed(1)) : '-', 100, y);
  y += 10;

  // Perímetros - Table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Perímetros (cm)', 14, y);
  y += 7;

  const perimeters: [string, number | null][] = [
    ['Pescoço', assessment.perim_neck],
    ['Ombro', assessment.perim_shoulder],
    ['Tórax', assessment.perim_chest],
    ['Cintura', assessment.perim_waist],
    ['Abdômen', assessment.perim_abdomen],
    ['Quadril', assessment.perim_hip],
    ['Braço Relaxado', assessment.perim_arm_relaxed],
    ['Braço Contraído', assessment.perim_arm_contracted],
    ['Antebraço', assessment.perim_forearm],
    ['Coxa Proximal', assessment.perim_thigh_proximal],
    ['Coxa Medial', assessment.perim_thigh_mid],
    ['Panturrilha', assessment.perim_calf],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Perímetro', 14, y);
  doc.text('Valor (cm)', 100, y);
  y += 2;
  doc.line(14, y, 140, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  perimeters.forEach(([label, value]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(label, 14, y);
    doc.text(value != null ? String(value) : '-', 100, y);
    y += 6;
  });

  // Observações
  if (assessment.notes) {
    y += 6;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(assessment.notes, pageWidth - 28);
    doc.text(lines, 14, y);
  }

  // Progress Photos grouped by date
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
  const dateStr = format(parseISO(assessment.measured_at), 'yyyy-MM-dd');
  doc.save(`avaliacao-${safeName}-${dateStr}.pdf`);
}
