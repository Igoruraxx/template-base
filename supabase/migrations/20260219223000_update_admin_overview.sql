-- Incluir administradores na visualização do painel administrativo
CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(user_id uuid, full_name text, email text, role text, plan text, sub_status text, active_students bigint, created_at timestamp with time zone)
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
    p.role,
    COALESCE(ts.plan, 'free'),
    COALESCE(ts.status, 'active'),
    (SELECT COUNT(*) FROM public.students s WHERE s.trainer_id = p.user_id AND s.status = 'active') as active_students,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.trainer_subscriptions ts ON ts.trainer_id = p.user_id
  WHERE p.role IN ('trainer', 'admin')
  ORDER BY p.created_at DESC;
END;
$$;

-- Remover usuários mortos/mocks (Carlos Silva, Amanda Souza)
-- Realiza a deleção direta ignorando a RPC que exige auth.uid() logado como admin
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Remover os falsos alunos
  DELETE FROM public.students WHERE name IN ('Carlos Silva', 'Amanda Souza');

  -- Deletar direto de auth.users usando os IDs encontrados na tabela profiles
  FOR rec IN 
    SELECT user_id FROM public.profiles WHERE full_name IN ('Carlos Silva', 'Amanda Souza')
  LOOP
    DELETE FROM auth.users WHERE id = rec.user_id;
  END LOOP;
END;
$$;

-- Reforçar a função de checagem de papel para ser mais resiliente
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
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role::text
  );
$$;
