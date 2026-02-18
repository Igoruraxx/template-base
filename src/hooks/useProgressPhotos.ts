import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProgressPhotos = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['progress-photos', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('student_id', studentId!)
        .order('taken_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
};

export const useUploadProgressPhoto = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      studentId, file, photoType, takenAt, notes,
    }: {
      studentId: string; file: File; photoType: string; takenAt: string; notes?: string;
    }) => {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${studentId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(path);

      const { data, error } = await supabase.from('progress_photos').insert({
        student_id: studentId,
        trainer_id: user!.id,
        photo_url: publicUrl,
        photo_type: photoType,
        taken_at: takenAt,
        notes: notes || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
};

export const useDeleteProgressPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('progress_photos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
};
