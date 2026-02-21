-- ========================================================
-- MASTER ADMIN ARCHITECTURE FIX - SENIOR LEVEL
-- ========================================================

-- 1. NORMALIZAÇÃO DE TIPOS E SEGURANÇA BASE
DO $body$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'trainer');
    END IF;
END $body$;

-- Função helper suprema para checar permissões
-- NOTA SÊNIOR: Mantemos o nome do parâmetro como '_role' para não quebrar as políticas RLS dependentes
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role::TEXT
  );
END;
$$;

-- 2. LIMPEZA E INTEGRIDADE (SENIOR CLEANUP)
-- Remove registros de tabelas públicas que referenciam usuários que não existem mais no auth.users
-- Isso corrige erros de Foreign Key e inconsistências no painel admin
DO $body$
BEGIN
    DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
    DELETE FROM public.profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
    DELETE FROM public.trainer_subscriptions WHERE trainer_id NOT IN (SELECT id FROM auth.users);
END $body$;

-- Garante que todo perfil tenha uma entrada na tabela de assinaturas
INSERT INTO public.trainer_subscriptions (trainer_id, plan, status, price)
SELECT user_id, 'free', 'active', 0
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.trainer_subscriptions ts WHERE ts.trainer_id = p.user_id
)
ON CONFLICT DO NOTHING;

-- 3. REDEFINIÇÃO DE RLS (SEGURANÇA TOTAL ADMIN)

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;
CREATE POLICY "Admins can manage all students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.sessions;
CREATE POLICY "Admins can manage all sessions" ON public.sessions FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Subscriptions
ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.trainer_subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.trainer_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. RPC: ADMIN_TRAINER_OVERVIEW (VERSÃO FINAL OTIMIZADA)
DROP FUNCTION IF EXISTS public.admin_trainer_overview();

CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  email text, 
  role text, 
  plan text, 
  sub_status text, 
  active_students bigint, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
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

-- 5. RPC: DELETE_TRAINER_COMPLETE
CREATE OR REPLACE FUNCTION public.delete_trainer_complete(t_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: Somente administradores podem remover treinadores.';
  END IF;

  IF auth.uid() = t_id THEN
    RAISE EXCEPTION 'Auto-deleção bloqueada para segurança da conta.';
  END IF;

  DELETE FROM auth.users WHERE id = t_id;
END;
$$;

-- 6. INDEXAÇÃO E REQUISITOS DE INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_profiles_role_search ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_status_trainer ON public.students(status, trainer_id);

-- Garantir que trainer_subscriptions tenha uma Foreign Key explícita se ainda não tiver
DO $body$
BEGIN
    -- (Já realizado no topo do script para maior segurança)

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trainer_subscriptions_trainer_id_fkey'
    ) THEN
        ALTER TABLE public.trainer_subscriptions 
        ADD CONSTRAINT trainer_subscriptions_trainer_id_fkey 
        FOREIGN KEY (trainer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $body$;
