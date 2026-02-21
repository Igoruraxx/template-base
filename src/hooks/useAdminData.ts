import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainerOverview {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  plan: string;
  sub_status: string;
  active_students: number;
  created_at: string;
  expires_at?: string;
}

export const useAdminData = () => {
  const queryClient = useQueryClient();

  const trainersQuery = useQuery({
    queryKey: ['admin-trainers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('admin_trainer_overview');
        if (error) {
          console.warn('RPC admin_trainer_overview falhou, tentando fallback...', error);
          // Fallback: fetch profiles and subscriptions separately (no impossible joins)
          const [profilesRes, subsRes] = await Promise.all([
            supabase.from('profiles').select('user_id, full_name, role, created_at'),
            supabase.from('trainer_subscriptions').select('trainer_id, plan, status, expires_at'),
          ]);
          if (profilesRes.error) throw profilesRes.error;
          const subsMap = new Map((subsRes.data ?? []).map((s: any) => [s.trainer_id, s]));
          return (profilesRes.data ?? []).map((p: any) => {
            const sub = subsMap.get(p.user_id);
            return {
              user_id: p.user_id,
              full_name: p.full_name,
              email: '',
              role: p.role,
              created_at: p.created_at,
              plan: sub?.plan || 'free',
              sub_status: sub?.status || 'active',
              expires_at: sub?.expires_at || undefined,
              active_students: 0,
            } as TrainerOverview;
          });
        }
        return (data as TrainerOverview[]) || [];
      } catch (err: any) {
        toast.error('Erro crítico no painel: ' + (err.message || 'Verifique permissões'));
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
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

  const deleteTrainer = useMutation({
    mutationFn: async (trainerId: string) => {
      const { error } = await supabase.rpc('delete_trainer_complete' as any, { t_id: trainerId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] });
    },
  });

  const recentTrainersQuery = useQuery({
    queryKey: ['admin-recent-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const recentStudentsQuery = useQuery({
    queryKey: ['admin-recent-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return { trainersQuery, subscriptionsQuery, blockTrainer, confirmPix, deleteTrainer, recentTrainersQuery, recentStudentsQuery };
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

export const useTrainerSubscriptionDetails = (trainerId: string | null) => {
  return useQuery({
    queryKey: ['admin-trainer-subscription-details', trainerId],
    queryFn: async () => {
      if (!trainerId) return null;
      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .select('*')
        .eq('trainer_id', trainerId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!trainerId,
  });
};

export const useAdminMutations = () => {
  const queryClient = useQueryClient();

  const addPremiumDays = useMutation({
    mutationFn: async ({ trainerId, days }: { trainerId: string; days: number }) => {
      const { data: current } = await supabase
        .from('trainer_subscriptions')
        .select('expires_at')
        .eq('trainer_id', trainerId)
        .single();

      let newDate = new Date();
      if (current?.expires_at && new Date(current.expires_at) > new Date()) {
        newDate = new Date(current.expires_at);
      }
      
      newDate.setDate(newDate.getDate() + days);

      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({
          expires_at: newDate.toISOString(),
          status: 'active',
          plan: 'premium'
        })
        .eq('trainer_id', trainerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-trainer-subscription-details'] });
    },
  });

  const downgradePlan = useMutation({
    mutationFn: async (trainerId: string) => {
      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({
          plan: 'free',
          expires_at: null,
          price: 0,
        })
        .eq('trainer_id', trainerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-trainer-subscription-details'] });
    },
  });

  return { addPremiumDays, downgradePlan };
};
