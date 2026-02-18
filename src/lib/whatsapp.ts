import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
};

export const openWhatsApp = (phone: string, message: string) => {
  const formatted = formatPhone(phone);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${formatted}?text=${encoded}`, '_blank');
};

export const buildReminderMessage = (
  studentName: string,
  scheduledDate: string,
  scheduledTime: string,
): string => {
  const date = parseISO(scheduledDate);
  const dayOfWeek = format(date, 'EEEE', { locale: ptBR });
  const dayOfMonth = format(date, 'd');
  const time = scheduledTime.slice(0, 5);
  return `Olá ${studentName}, lembrando do seu treino de ${dayOfWeek}, dia ${dayOfMonth} às ${time}. Te espero!`;
};
