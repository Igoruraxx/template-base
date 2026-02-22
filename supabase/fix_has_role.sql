-- =============================================
-- SCRIPT PARA CORRIGIR FUNÇÃO has_role
-- Execute para adicionar a função que está faltando
-- =============================================

-- 1. Garantir que a tabela user_roles existe
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Criar a função has_role (corrigida)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Criar RLS policies para user_roles (se não existirem)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Verificar se a função foi criada
SELECT 
    'Function Verification' as section,
    'has_role function' as name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'has_role' 
            AND pronamespace = 'public'::regnamespace
        ) THEN '✅ Created successfully'
        ELSE '❌ Still missing'
    END as status;

-- 5. Testar a função
SELECT 
    'Function Test' as section,
    'has_role test' as name,
    public.has_role(NULL::UUID, 'admin') as test_result;

-- 6. Verificar user_roles
SELECT 
    'Table Check' as section,
    'user_roles table' as name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_roles'
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status;

-- =============================================
-- RESUMO
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== has_role FUNCTION FIX SUMMARY ===';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'has_role' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE '✅ has_role function created successfully!';
    ELSE
        RAISE NOTICE '❌ has_role function still missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
    ) THEN
        RAISE NOTICE '✅ user_roles table exists!';
    ELSE
        RAISE NOTICE '❌ user_roles table missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Agora execute novamente o script verify_migration.sql';
    RAISE NOTICE '=== END SUMMARY ===';
END $$;
