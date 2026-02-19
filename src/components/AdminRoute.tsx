import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
