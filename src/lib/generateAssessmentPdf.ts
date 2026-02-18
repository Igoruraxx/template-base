import { jsPDF } from 'jspdf';
import { Assessment } from '@/hooks/useAssessments';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function generateAssessmentPdf(assessment: Assessment, studentName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
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

  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = format(parseISO(assessment.measured_at), 'yyyy-MM-dd');
  doc.save(`avaliacao-${safeName}-${dateStr}.pdf`);
}
