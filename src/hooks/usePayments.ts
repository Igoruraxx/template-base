import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePayments = (studentId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payments', user?.id, studentId],
    queryFn: async () => {
      let query = supabase.from('payments').select('*, students(name, color)').order('reference_month', { ascending: false });
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreatePayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: {
      student_id: string; amount: number; reference_month: string;
      status?: string; payment_method?: string; notes?: string;
    }) => {
      const { data, error } = await supabase.from('payments').insert({
        ...payment,
        trainer_id: user!.id,
        paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useUpdatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; amount?: number; notes?: string; payment_method?: string }) => {
      const payload: any = { ...updates };
      if (updates.status === 'paid') payload.paid_at = new Date().toISOString();
      const { data, error } = await supabase.from('payments').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useDeletePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};
