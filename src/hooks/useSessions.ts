import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Session = Tables<'sessions'>;
type SessionInsert = TablesInsert<'sessions'>;
type SessionUpdate = TablesUpdate<'sessions'>;

export const useSessions = (date?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', user?.id, date],
    queryFn: async () => {
      let query = supabase
        .from('sessions')
        .select('*, students(name, color, avatar_url)')
        .order('scheduled_time');

      if (date) {
        query = query.eq('scheduled_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSessionsByRange = (startDate: string, endDate: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions', user?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, students(name, color, avatar_url)')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date')
        .order('scheduled_time');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: SessionInsert) => {
      const { data, error } = await supabase.from('sessions').insert(session).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
};

export const useUpdateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: SessionUpdate & { id: string }) => {
      const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
};

export const useDeleteSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
};
