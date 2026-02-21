import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

type BioRecord = Tables<'bioimpedance'>;

interface ProgressPhoto {
  photo_url: string;
  photo_type: string | null;
  taken_at: string;
  notes?: string | null;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Lado',
  back: 'Costas',
  other: 'Outro',
};

async function loadImageAsBase64(url: string, maxSize = 800): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
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
  photos?: ProgressPhoto[],
  chartBase64?: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 0;

  // -- FUNÇÕES DE DESENHO AUXILIARES --
  const drawHeader = async () => {
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo se existir - Agora com tratamento silencioso para não quebrar o PDF
    try {
      const logoBase64 = await loadImageAsBase64('/icon-192.png');
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
      }
    } catch (e) {
      console.warn('Falha ao carregar logo para o PDF, continuando sem imagem.');
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Progresso', 40, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Aluno: ${studentName}`, 40, 28);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 14, 20, { align: 'right' });
    y = 50;
  };

  await drawHeader();

  // Se não houver records, desenhar capa de fotos apenas
  if (!records || records.length === 0) {
     doc.setTextColor(0, 0, 0);
     doc.setFontSize(14);
     doc.text('Nenhum dado de bioimpedância registrado.', 14, y);
     y += 10;
  } else {
      // -- RESUMO EXECUTIVO (HIGHLIGHTS) --
      const first = records[0];
      const latest = records[records.length - 1];
      const firstDate = format(parseISO(first.measured_at), 'dd/MM/yyyy');
      const latestDate = format(parseISO(latest.measured_at), 'dd/MM/yyyy');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Executivo', 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Comparativo entre ${firstDate} e ${latestDate}`, 14, y);
      y += 8;

      if (records.length > 1) {
          const drawHighlightCard = (label: string, valueStr: string, diffStr: string, isPositive: boolean, vx: number) => {
             doc.setFillColor(248, 250, 252); // slate-50
             doc.setDrawColor(226, 232, 240); // slate-200
             doc.roundedRect(vx, y, 55, 22, 2, 2, 'FD');

             doc.setFontSize(9);
             doc.setTextColor(100, 116, 139); // slate-500
             doc.text(label, vx + 5, y + 6);

             doc.setFontSize(14);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(15, 23, 42); // slate-900
             doc.text(valueStr, vx + 5, y + 14);

             if (diffStr) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                if (isPositive) doc.setTextColor(16, 185, 129); // emerald-500
                else doc.setTextColor(244, 63, 94); // rose-500
                doc.text(diffStr, vx + 55 - 5, y + 14, { align: 'right' });
             }
          };

          const calcDiff = (key: keyof BioRecord, invertPositive = false) => {
             const f = first[key];
             const l = latest[key];
             if (f == null || l == null) return null;
             const diff = Number(l) - Number(f);
             if (diff === 0) return null;
             const isPositive = invertPositive ? diff <= 0 : diff >= 0; // Ex: perder gordura = positivo
             const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
             return { diffStr, isPositive };
          };

          const weightDiff = calcDiff('weight', true); // Perder peso eh positivo/neutro dependendo
          const fatDiff = calcDiff('body_fat_pct', true); // Perder gordura = verde
          const muscleDiff = calcDiff('muscle_mass', false); // Ganhar musculo = verde

          if (latest.weight) drawHighlightCard('Peso Atual', `${Number(latest.weight).toFixed(1)}kg`, weightDiff?.diffStr || '', weightDiff?.isPositive || false, 14);
          if (latest.body_fat_pct) drawHighlightCard('Gordura (%)', `${Number(latest.body_fat_pct).toFixed(1)}%`, fatDiff?.diffStr || '', fatDiff?.isPositive || false, 75);
          if (latest.muscle_mass) drawHighlightCard('Massa Magra', `${Number(latest.muscle_mass).toFixed(1)}kg`, muscleDiff?.diffStr || '', muscleDiff?.isPositive || false, 136);
          
          y += 32;
      } else {
         // Só tem uma medição, desenhar apenas os dados dela
         doc.setTextColor(15, 23, 42);
         doc.text('Primeira e única medição registrada até o momento.', 14, y);
         y += 10;
      }

      // -- GRÁFICO (Chart) --
      if (chartBase64) {
         doc.setTextColor(30, 41, 59);
         doc.setFontSize(14);
         doc.setFont('helvetica', 'bold');
         doc.text('Evolução Gráfica', 14, y);
         y += 6;
         
         // Injeta o chart
         // Proporção base do gráfico é em geral 100% por 220px: vamos adaptar para PDF
         const chartWidth = 180;
         const chartHeight = 65;
         
         // Fundo cinza suave pra destacar
         doc.setFillColor(252, 252, 253);
         doc.setDrawColor(226, 232, 240);
         doc.roundedRect(14, y, chartWidth, chartHeight, 3, 3, 'FD');
         
         doc.addImage(chartBase64, 'PNG', 14, y, chartWidth, chartHeight);
         y += chartHeight + 12;
      }

      // -- TABELA DE HISTÓRICO --
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico Completo', 14, y);
      y += 8;

      // Header da Tabela
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Data', 16, y + 5.5);
      doc.text('Peso', 45, y + 5.5);
      doc.text('Gordura', 75, y + 5.5);
      doc.text('M.Magra', 105, y + 5.5);
      doc.text('V. Visc.', 135, y + 5.5);
      doc.text('Água', 160, y + 5.5);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      // Inverter registros para mostrar sempre o mais novo antes, assim como no app
      const reversedRecords = [...records].reverse();

      for (const record of reversedRecords) {
         if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
         }

         doc.text(format(parseISO(record.measured_at), 'dd/MM/yy'), 16, y + 6);
         doc.text(record.weight ? `${Number(record.weight).toFixed(1)}kg` : '-', 45, y + 6);
         doc.text(record.body_fat_pct ? `${Number(record.body_fat_pct).toFixed(1)}%` : '-', 75, y + 6);
         doc.text(record.muscle_mass ? `${Number(record.muscle_mass).toFixed(1)}kg` : '-', 105, y + 6);
         doc.text(record.visceral_fat ? `${Number(record.visceral_fat).toFixed(0)}` : '-', 135, y + 6);
         doc.text(record.body_water_pct ? `${Number(record.body_water_pct).toFixed(1)}%` : '-', 160, y + 6);
         
         // Linha separadora
         doc.setDrawColor(226, 232, 240);
         doc.line(14, y + 9, pageWidth - 14, y + 9);
         
         y += 9;
         
         // Exibe notas se existir
         if (record.notes) {
             doc.setFontSize(8);
             doc.setTextColor(100, 116, 139);
             doc.text(`Obs: ${record.notes}`, 16, y + 4);
             y += 6;
             doc.setFontSize(9);
             doc.setTextColor(15, 23, 42);
         }
      }
  }

  // -- FOTOS DE PROGRESSO --
  if (photos && photos.length > 0) {
    // Agrupa fotos por data
    const grouped: Record<string, ProgressPhoto[]> = {};
    for (const p of photos) {
      if (!grouped[p.taken_at]) grouped[p.taken_at] = [];
      grouped[p.taken_at].push(p);
    }

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (const dateKey of sortedDates) {
      doc.addPage();
      y = 15;

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const dateLabel = format(parseISO(dateKey), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.text(`Evolução Visual — ${dateLabel}`, 14, y);
      
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(1);
      doc.line(14, y + 3, 50, y + 3);
      doc.setLineWidth(0.2); // volta pro padrao
      y += 15;

      const datePhotos = grouped[dateKey];
      // Ordena por tipo: frente, lado, costas
      const typeOrder = { 'front': 1, 'side': 2, 'back': 3, 'other': 4 };
      datePhotos.sort((a, b) => (typeOrder[a.photo_type || 'other'] || 9) - (typeOrder[b.photo_type || 'other'] || 9));

      const photoWidth = 55;
      const photoHeight = 75; // Proporcao 3/4
      const gap = 6;
      const startX = 14;

      for (let i = 0; i < datePhotos.length; i++) {
        const col = i % 3;
        if (i > 0 && col === 0) {
          y += photoHeight + 15;
          if (y + photoHeight > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
        }

        const x = startX + col * (photoWidth + gap);
        const base64 = await loadImageAsBase64(datePhotos[i].photo_url, 1000); // 1000px qualidade boa p/ foto corpo
        if (base64) {
          // Borda bonita ao redor da foto
          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(x, y, photoWidth, photoHeight, 2, 2, 'FD');
          
          doc.addImage(base64, 'JPEG', x, y, photoWidth, photoHeight);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          const typeLabel = PHOTO_TYPE_LABELS[datePhotos[i].photo_type || 'other'] || 'Outro';
          
          // Badge text centrado abaixo da foto
          doc.text(typeLabel, x + photoWidth / 2, y + photoHeight + 6, { align: 'center' });
        }
      }
      y += photoHeight + 20; // Espaçamento proximo grupo
    }
  }

  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Progresso_${safeName}.pdf`);
}
