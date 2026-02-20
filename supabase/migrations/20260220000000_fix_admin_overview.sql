-- Corrigir a validação do has_role para usar o cast do enum app_role
CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(user_id uuid, full_name text, email text, role text, plan text, sub_status text, active_students bigint, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Correção: Adicionado '::app_role' para converter a string em um app_role, o que evita o erro 'function does not exist'
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
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
