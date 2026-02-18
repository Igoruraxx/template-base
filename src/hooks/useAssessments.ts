import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Type since assessments table isn't in generated types yet
export interface Assessment {
  id: string;
  student_id: string;
  trainer_id: string;
  measured_at: string;
  sex: 'male' | 'female';
  age: number;
  weight: number;
  skinfold_chest: number | null;
  skinfold_axillary: number | null;
  skinfold_triceps: number | null;
  skinfold_subscapular: number | null;
  skinfold_abdominal: number | null;
  skinfold_suprailiac: number | null;
  skinfold_thigh: number | null;
  perim_neck: number | null;
  perim_shoulder: number | null;
  perim_chest: number | null;
  perim_waist: number | null;
  perim_abdomen: number | null;
  perim_hip: number | null;
  perim_arm_relaxed: number | null;
  perim_arm_contracted: number | null;
  perim_forearm: number | null;
  perim_thigh_proximal: number | null;
  perim_thigh_mid: number | null;
  perim_calf: number | null;
  body_density: number | null;
  body_fat_pct: number | null;
  fat_mass_kg: number | null;
  lean_mass_kg: number | null;
  sum_skinfolds: number | null;
  notes: string | null;
  created_at: string;
}

export function useAssessments(studentId?: string) {
  return useQuery({
    queryKey: ['assessments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments' as any)
        .select('*')
        .eq('student_id', studentId!)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data as unknown as Assessment[];
    },
    enabled: !!studentId,
  });
}

export function useCreateAssessment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Assessment, 'id' | 'trainer_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('assessments' as any)
        .insert({ ...input, trainer_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments', vars.student_id] });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { error } = await supabase.from('assessments' as any).delete().eq('id', id);
      if (error) throw error;
      return studentId;
    },
    onSuccess: (studentId) => {
      qc.invalidateQueries({ queryKey: ['assessments', studentId] });
    },
  });
}
