export const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Peito', color: '#3b82f6', emoji: '🟦' },
  { id: 'back', label: 'Costas', color: '#8b5cf6', emoji: '🟪' },
  { id: 'shoulders', label: 'Ombros', color: '#f59e0b', emoji: '🟨' },
  { id: 'biceps', label: 'Bíceps', color: '#ef4444', emoji: '🟥' },
  { id: 'triceps', label: 'Tríceps', color: '#10b981', emoji: '🟩' },
  { id: 'quads', label: 'Quadríceps', color: '#06b6d4', emoji: '🔵' },
  { id: 'hamstrings', label: 'Posterior', color: '#ec4899', emoji: '🩷' },
  { id: 'glutes', label: 'Glúteos', color: '#f97316', emoji: '🟧' },
  { id: 'calves', label: 'Panturrilha', color: '#14b8a6', emoji: '🩵' },
  { id: 'abs', label: 'Abdômen', color: '#a855f7', emoji: '💜' },
  { id: 'cardio', label: 'Cardio', color: '#22c55e', emoji: '💚' },
] as const;

export type MuscleGroupId = typeof MUSCLE_GROUPS[number]['id'];

export const getMuscleGroup = (id: string) =>
  MUSCLE_GROUPS.find((g) => g.id === id);

export const STUDENT_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
];
