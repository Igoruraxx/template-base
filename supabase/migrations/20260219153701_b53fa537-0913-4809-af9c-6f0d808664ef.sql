
-- Fix 1: Make storage buckets private
UPDATE storage.buckets SET public = false 
WHERE id IN ('progress-photos', 'bioimpedance-reports');

-- Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Anyone can view progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view bioimpedance reports" ON storage.objects;

-- Create trainer-scoped SELECT policies
CREATE POLICY "Trainers view own progress photos" ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Trainers view own bioimpedance reports" ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix 2: Add admin authorization check to admin_trainer_overview
CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(user_id uuid, full_name text, email text, plan text, sub_status text, active_students bigint, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    u.email,
    COALESCE(ts.plan, 'free'),
    COALESCE(ts.status, 'active'),
    COUNT(s.id) FILTER (WHERE s.status = 'active'),
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN trainer_subscriptions ts ON ts.trainer_id = p.user_id
  LEFT JOIN students s ON s.trainer_id = p.user_id
  WHERE p.role = 'trainer'
  GROUP BY p.user_id, p.full_name, u.email, ts.plan, ts.status, p.created_at;
END;
$$;
