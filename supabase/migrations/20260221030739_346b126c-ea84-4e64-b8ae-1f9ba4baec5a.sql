
-- Add RLS policy for admins to view all profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Add RLS policy for admins to delete profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create delete_trainer_complete function
CREATE OR REPLACE FUNCTION public.delete_trainer_complete(t_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  DELETE FROM sessions WHERE trainer_id = t_id;
  DELETE FROM payments WHERE trainer_id = t_id;
  DELETE FROM assessments WHERE trainer_id = t_id;
  DELETE FROM bioimpedance WHERE trainer_id = t_id;
  DELETE FROM progress_photos WHERE trainer_id = t_id;
  DELETE FROM students WHERE trainer_id = t_id;
  DELETE FROM push_subscriptions WHERE trainer_id = t_id;
  DELETE FROM trainer_subscriptions WHERE trainer_id = t_id;
  DELETE FROM user_roles WHERE user_id = t_id;
  DELETE FROM profiles WHERE user_id = t_id;
END;
$$;
