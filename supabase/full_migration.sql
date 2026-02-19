-- =============================================
-- SCRIPT COMPLETO DE MIGRAÇÃO - FitPro Agenda
-- Idempotente: pode ser rodado múltiplas vezes
-- Execute no SQL Editor do novo projeto Supabase
-- =============================================

-- ==================== EXTENSÕES ====================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ==================== FUNÇÕES UTILITÁRIAS ====================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==================== PROFILES ====================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'trainer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== USER ROLES ====================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'trainer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::TEXT = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ==================== STUDENTS ====================

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  goal TEXT,
  plan_type TEXT DEFAULT 'monthly',
  plan_value NUMERIC(10,2),
  sessions_per_week INTEGER DEFAULT 3,
  package_total_sessions INTEGER,
  package_used_sessions INTEGER DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  is_consulting BOOLEAN DEFAULT false,
  notes TEXT,
  access_code TEXT UNIQUE,
  schedule_config JSONB,
  needs_reminder BOOLEAN DEFAULT false,
  payment_due_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their own students" ON public.students;
CREATE POLICY "Trainers can view their own students"
ON public.students FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can insert their own students" ON public.students;
CREATE POLICY "Trainers can insert their own students"
ON public.students FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their own students" ON public.students;
CREATE POLICY "Trainers can update their own students"
ON public.students FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete their own students" ON public.students;
CREATE POLICY "Trainers can delete their own students"
ON public.students FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_students_trainer ON public.students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- ==================== SESSIONS ====================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  muscle_groups TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their own sessions" ON public.sessions;
CREATE POLICY "Trainers can view their own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can insert their own sessions" ON public.sessions;
CREATE POLICY "Trainers can insert their own sessions"
ON public.sessions FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their own sessions" ON public.sessions;
CREATE POLICY "Trainers can update their own sessions"
ON public.sessions FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete their own sessions" ON public.sessions;
CREATE POLICY "Trainers can delete their own sessions"
ON public.sessions FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON public.sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.sessions(student_id);

-- ==================== STORAGE BUCKETS ====================

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bioimpedance-reports', 'bioimpedance-reports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Trainers can upload progress photos" ON storage.objects;
CREATE POLICY "Trainers can upload progress photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Trainers view own progress photos" ON storage.objects;
CREATE POLICY "Trainers view own progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Trainers can delete progress photos" ON storage.objects;
CREATE POLICY "Trainers can delete progress photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Trainers can upload bioimpedance reports" ON storage.objects;
CREATE POLICY "Trainers can upload bioimpedance reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bioimpedance-reports' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Trainers view own bioimpedance reports" ON storage.objects;
CREATE POLICY "Trainers view own bioimpedance reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Trainers can delete bioimpedance reports" ON storage.objects;
CREATE POLICY "Trainers can delete bioimpedance reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'bioimpedance-reports' AND auth.role() = 'authenticated');

-- ==================== PROGRESS PHOTOS ====================

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'front',
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their students photos" ON public.progress_photos;
CREATE POLICY "Trainers can view their students photos"
ON public.progress_photos FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can insert photos" ON public.progress_photos;
CREATE POLICY "Trainers can insert photos"
ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can delete photos" ON public.progress_photos;
CREATE POLICY "Trainers can delete photos"
ON public.progress_photos FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_progress_photos_student ON public.progress_photos(student_id);

-- ==================== BIOIMPEDANCE ====================

CREATE TABLE IF NOT EXISTS public.bioimpedance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2),
  body_fat_pct NUMERIC(5,2),
  muscle_mass NUMERIC(5,2),
  visceral_fat NUMERIC(5,2),
  bmr NUMERIC(7,2),
  body_water_pct NUMERIC(5,2),
  bone_mass NUMERIC(5,2),
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bioimpedance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their bioimpedance records" ON public.bioimpedance;
CREATE POLICY "Trainers can view their bioimpedance records"
ON public.bioimpedance FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can insert bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can insert bioimpedance"
ON public.bioimpedance FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can update bioimpedance"
ON public.bioimpedance FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can delete bioimpedance"
ON public.bioimpedance FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_bioimpedance_student ON public.bioimpedance(student_id);

-- ==================== PAYMENTS ====================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reference_month TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their payments" ON public.payments;
CREATE POLICY "Trainers can view their payments"
ON public.payments FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can insert payments" ON public.payments;
CREATE POLICY "Trainers can insert payments"
ON public.payments FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update payments" ON public.payments;
CREATE POLICY "Trainers can update payments"
ON public.payments FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete payments" ON public.payments;
CREATE POLICY "Trainers can delete payments"
ON public.payments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON public.payments(reference_month);

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== ASSESSMENTS ====================

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  sex TEXT NOT NULL,
  age INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  skinfold_chest NUMERIC,
  skinfold_axillary NUMERIC,
  skinfold_triceps NUMERIC,
  skinfold_subscapular NUMERIC,
  skinfold_abdominal NUMERIC,
  skinfold_suprailiac NUMERIC,
  skinfold_thigh NUMERIC,
  perim_neck NUMERIC,
  perim_shoulder NUMERIC,
  perim_chest NUMERIC,
  perim_waist NUMERIC,
  perim_abdomen NUMERIC,
  perim_hip NUMERIC,
  perim_arm_relaxed NUMERIC,
  perim_arm_contracted NUMERIC,
  perim_forearm NUMERIC,
  perim_thigh_proximal NUMERIC,
  perim_thigh_mid NUMERIC,
  perim_calf NUMERIC,
  body_density NUMERIC,
  body_fat_pct NUMERIC,
  fat_mass_kg NUMERIC,
  lean_mass_kg NUMERIC,
  sum_skinfolds NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their assessments" ON public.assessments;
CREATE POLICY "Trainers can view their assessments"
ON public.assessments FOR SELECT
USING ((auth.uid() = trainer_id) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Trainers can insert assessments" ON public.assessments;
CREATE POLICY "Trainers can insert assessments"
ON public.assessments FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update assessments" ON public.assessments;
CREATE POLICY "Trainers can update assessments"
ON public.assessments FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete assessments" ON public.assessments;
CREATE POLICY "Trainers can delete assessments"
ON public.assessments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== TRAINER SUBSCRIPTIONS ====================

CREATE TABLE IF NOT EXISTS public.trainer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  price NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.trainer_subscriptions;
CREATE POLICY "Admins can manage subscriptions"
ON public.trainer_subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers view own subscription" ON public.trainer_subscriptions;
CREATE POLICY "Trainers view own subscription"
ON public.trainer_subscriptions FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update own subscription" ON public.trainer_subscriptions;
CREATE POLICY "Trainers can update own subscription"
ON public.trainer_subscriptions FOR UPDATE
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

DROP TRIGGER IF EXISTS update_trainer_subscriptions_updated_at ON public.trainer_subscriptions;
CREATE TRIGGER update_trainer_subscriptions_updated_at
BEFORE UPDATE ON public.trainer_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trainer_subscriptions (trainer_id, plan, price)
  VALUES (NEW.user_id, 'free', 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_free_subscription();

-- ==================== PUSH SUBSCRIPTIONS ====================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  daily_summary_hour INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Trainers can view their own subscriptions"
ON public.push_subscriptions FOR SELECT USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can insert their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Trainers can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Trainers can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Trainers can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE USING (auth.uid() = trainer_id);

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== FUNCTIONS ====================

CREATE OR REPLACE FUNCTION public.check_student_limit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_plan TEXT;
  current_status TEXT;
  student_count BIGINT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(ts.plan, 'free'), COALESCE(ts.status, 'active')
  INTO current_plan, current_status
  FROM trainer_subscriptions ts
  WHERE ts.trainer_id = NEW.trainer_id;

  IF current_plan IS NULL THEN
    current_plan := 'free';
  END IF;

  IF current_plan = 'premium' AND current_status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO student_count
  FROM students
  WHERE trainer_id = NEW.trainer_id AND status = 'active'
    AND id IS DISTINCT FROM NEW.id;

  IF student_count >= 5 THEN
    RAISE EXCEPTION 'STUDENT_LIMIT_REACHED: Free plan allows max 5 active students. Upgrade to premium.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_student_limit_trigger ON public.students;
CREATE TRIGGER check_student_limit_trigger
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.check_student_limit();

CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT, plan TEXT, sub_status TEXT, active_students BIGINT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT
    p.user_id, p.full_name, u.email,
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

CREATE OR REPLACE FUNCTION public.get_student_by_code(_code TEXT)
RETURNS SETOF public.students
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.students WHERE access_code = _code AND access_code IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_student_sessions(_student_id UUID)
RETURNS TABLE (id UUID, scheduled_date DATE, scheduled_time TIME, status TEXT, muscle_groups TEXT[], notes TEXT, duration_minutes INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.scheduled_date, s.scheduled_time,
         s.status, s.muscle_groups, s.notes, s.duration_minutes
  FROM sessions s
  JOIN students st ON st.id = s.student_id
  WHERE s.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY s.scheduled_date DESC
  LIMIT 30;
$$;

CREATE OR REPLACE FUNCTION public.get_student_photos(_student_id UUID)
RETURNS TABLE (id UUID, photo_url TEXT, photo_type TEXT, taken_at DATE, notes TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.photo_url, p.photo_type, p.taken_at, p.notes
  FROM progress_photos p
  JOIN students st ON st.id = p.student_id
  WHERE p.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY p.taken_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_student_bio(_student_id UUID)
RETURNS TABLE (id UUID, measured_at DATE, weight NUMERIC, body_fat_pct NUMERIC, muscle_mass NUMERIC, visceral_fat NUMERIC, bmr NUMERIC, body_water_pct NUMERIC, bone_mass NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.measured_at, b.weight, b.body_fat_pct,
         b.muscle_mass, b.visceral_fat, b.bmr, b.body_water_pct, b.bone_mass
  FROM bioimpedance b
  JOIN students st ON st.id = b.student_id
  WHERE b.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY b.measured_at ASC;
$$;

-- =============================================
-- FIM DO SCRIPT
-- =============================================
--
-- APÓS RODAR ESTE SCRIPT, CONFIGURE:
--
-- 1. Secrets no Supabase (Settings > Edge Functions):
--    - STRIPE_SECRET_KEY
--    - VAPID_PUBLIC_KEY
--    - VAPID_PRIVATE_KEY
--    - LOVABLE_API_KEY
--
-- 2. Deploy das Edge Functions via CLI:
--    supabase link --project-ref SEU-PROJECT-ID
--    supabase functions deploy extract-bioimpedance
--    supabase functions deploy create-checkout
--    supabase functions deploy check-subscription
--    supabase functions deploy student-signed-urls
--    supabase functions deploy register-push
--    supabase functions deploy push-notify
--    supabase functions deploy generate-vapid-keys
--
-- 3. Configure o .env do frontend (produção):
--    VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
--    VITE_SUPABASE_ANON_KEY=sua-anon-key
-- =============================================
