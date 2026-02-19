import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBioimpedance = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['bioimpedance', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bioimpedance')
        .select('*')
        .eq('student_id', studentId!)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
};

export const useCreateBioimpedance = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      studentId: string; measuredAt: string; weight?: number; bodyFatPct?: number;
      muscleMass?: number; visceralFat?: number; bmr?: number;
      bodyWaterPct?: number; boneMass?: number; reportFile?: File; notes?: string;
    }) => {
      let reportUrl: string | null = null;

      if (record.reportFile) {
        const ext = record.reportFile.name.split('.').pop();
        const path = `${user!.id}/${record.studentId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('bioimpedance-reports')
          .upload(path, record.reportFile);
        if (uploadError) throw uploadError;
        reportUrl = path;
      }

      const { data, error } = await supabase.from('bioimpedance').insert({
        student_id: record.studentId,
        trainer_id: user!.id,
        measured_at: record.measuredAt,
        weight: record.weight || null,
        body_fat_pct: record.bodyFatPct || null,
        muscle_mass: record.muscleMass || null,
        visceral_fat: record.visceralFat || null,
        bmr: record.bmr || null,
        body_water_pct: record.bodyWaterPct || null,
        bone_mass: record.boneMass || null,
        report_url: reportUrl,
        notes: record.notes || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bioimpedance'] }),
  });
};

export const useDeleteBioimpedance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bioimpedance').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bioimpedance'] }),
  });
};
