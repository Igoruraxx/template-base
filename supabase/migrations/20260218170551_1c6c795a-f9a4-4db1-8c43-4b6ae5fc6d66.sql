
-- Tabela de subscriptions
CREATE TABLE public.trainer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  price numeric DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politica: admins podem gerenciar tudo
CREATE POLICY "Admins can manage subscriptions"
  ON public.trainer_subscriptions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Politica: trainer ve a propria
CREATE POLICY "Trainers view own subscription"
  ON public.trainer_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = trainer_id);

-- Trigger updated_at
CREATE TRIGGER update_trainer_subscriptions_updated_at
  BEFORE UPDATE ON public.trainer_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: criar subscription free ao criar profile
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trainer_subscriptions (trainer_id, plan, price)
  VALUES (NEW.user_id, 'free', 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();

-- Funcao admin: overview de trainers
CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  plan text,
  sub_status text,
  active_students bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Trigger server-side: trava de limite de alunos no plano free
CREATE OR REPLACE FUNCTION public.check_student_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_plan text;
  student_count bigint;
BEGIN
  SELECT COALESCE(ts.plan, 'free') INTO current_plan
  FROM trainer_subscriptions ts
  WHERE ts.trainer_id = NEW.trainer_id;

  IF current_plan = 'free' THEN
    SELECT COUNT(*) INTO student_count
    FROM students
    WHERE trainer_id = NEW.trainer_id AND status = 'active';

    IF student_count >= 5 THEN
      RAISE EXCEPTION 'STUDENT_LIMIT_REACHED: Free plan allows max 5 active students. Upgrade to premium.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_student_limit_before_insert
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.check_student_limit();
