
-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  goal TEXT,
  plan_type TEXT DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'package')),
  plan_value NUMERIC(10,2),
  sessions_per_week INTEGER DEFAULT 3,
  package_total_sessions INTEGER,
  package_used_sessions INTEGER DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'forgotten')),
  is_consulting BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their own students"
ON public.students FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert their own students"
ON public.students FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own students"
ON public.students FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own students"
ON public.students FOR DELETE
USING (auth.uid() = trainer_id);

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  muscle_groups TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert their own sessions"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own sessions"
ON public.sessions FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own sessions"
ON public.sessions FOR DELETE
USING (auth.uid() = trainer_id);

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_students_trainer ON public.students(trainer_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_sessions_trainer ON public.sessions(trainer_id);
CREATE INDEX idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX idx_sessions_student ON public.sessions(student_id);
