import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BodyCompositionRecord {
  id: string;
  student_id: string;
  trainer_id: string;
  image_path: string;
  measured_at: string;
  weight: number | null;
  body_fat_pct: number | null;
  muscle_mass: number | null;
  visceral_fat: number | null;
  bmr: number | null;
  notes: string | null;
  created_at: string;
}

export const useBodyComposition = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['body-composition', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_composition_images')
        .select('*')
        .eq('student_id', studentId!)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data as BodyCompositionRecord[];
    },
    enabled: !!studentId,
  });
};

export const useCreateBodyComposition = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      studentId: string;
      imageFile: File;
      measuredAt: string;
      weight?: number;
      bodyFatPct?: number;
      muscleMass?: number;
      visceralFat?: number;
      bmr?: number;
      notes?: string;
    }) => {
      const ext = record.imageFile.name.split('.').pop() || 'jpg';
      const path = `${user!.id}/${record.studentId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('bioimpedance-reports')
        .upload(path, record.imageFile);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('body_composition_images')
        .insert({
          student_id: record.studentId,
          trainer_id: user!.id,
          image_path: path,
          measured_at: record.measuredAt,
          weight: record.weight || null,
          body_fat_pct: record.bodyFatPct || null,
          muscle_mass: record.muscleMass || null,
          visceral_fat: record.visceralFat || null,
          bmr: record.bmr || null,
          notes: record.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-composition'] }),
  });
};

export const useDeleteBodyComposition = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string }) => {
      await supabase.storage.from('bioimpedance-reports').remove([imagePath]);
      const { error } = await supabase
        .from('body_composition_images')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-composition'] }),
  });
};
