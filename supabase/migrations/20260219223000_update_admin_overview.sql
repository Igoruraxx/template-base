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
    COUNT(s.id) FILTER (WHERE s.status = 'active'),
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN trainer_subscriptions ts ON ts.trainer_id = p.user_id
  LEFT JOIN students s ON s.trainer_id = p.user_id
  WHERE p.role IN ('trainer', 'admin') -- Alterado para incluir admins no dashboard
  GROUP BY p.user_id, p.full_name, u.email, p.role, ts.plan, ts.status, p.created_at;
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
