import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainerOverview {
  user_id: string;
  full_name: string;
  email: string;
  plan: string;
  sub_status: string;
  active_students: number;
  created_at: string;
}

export const useAdminData = () => {
  const queryClient = useQueryClient();

  const trainersQuery = useQuery({
    queryKey: ['admin-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_trainer_overview');
      if (error) throw error;
      return data as TrainerOverview[];
    },
  });

  const subscriptionsQuery = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const blockTrainer = useMutation({
    mutationFn: async ({ trainerId, blocked }: { trainerId: string; blocked: boolean }) => {
      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({ status: blocked ? 'blocked' : 'active' })
        .eq('trainer_id', trainerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
  });

  const confirmPix = useMutation({
    mutationFn: async (trainerId: string) => {
      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({
          plan: 'premium',
          status: 'active',
          price: 9.90,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('trainer_id', trainerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
  });

  return { trainersQuery, subscriptionsQuery, blockTrainer, confirmPix };
};

export const useTrainerStudents = (trainerId: string | null) => {
  return useQuery({
    queryKey: ['admin-trainer-students', trainerId],
    queryFn: async () => {
      if (!trainerId) return [];
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!trainerId,
  });
};
