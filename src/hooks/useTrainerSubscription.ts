import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';

const FREE_LIMIT = 5;

// TODO: Replace with your actual Stripe price ID
// Create product "FitPro Premium" (R$ 9,90/month) in Stripe Dashboard
// and paste the price_id here
export const PREMIUM_PRICE_ID = 'price_REPLACE_ME';

export const useTrainerSubscription = () => {
  const { user } = useAuth();
  const { data: students } = useStudents();

  const activeStudents = students?.filter(s => s.status === 'active').length || 0;

  const subscriptionQuery = useQuery({
    queryKey: ['trainer-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .select('*')
        .eq('trainer_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const plan = subscriptionQuery.data?.plan || 'free';
  const status = subscriptionQuery.data?.status || 'active';
  const isPremium = plan === 'premium' && status === 'active';
  const isPendingPix = status === 'pending_pix';
  const slotsUsed = activeStudents;
  const slotsTotal = isPremium ? Infinity : FREE_LIMIT;
  const canAddActiveStudent = isPremium || activeStudents < FREE_LIMIT;
  const isNearLimit = !isPremium && activeStudents >= FREE_LIMIT - 1;

  return {
    plan,
    status,
    isPremium,
    isPendingPix,
    slotsUsed,
    slotsTotal,
    canAddActiveStudent,
    isNearLimit,
    activeStudents,
    isLoading: subscriptionQuery.isLoading,
    refetch: subscriptionQuery.refetch,
  };
};
