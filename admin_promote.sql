-- Script FINAL para Promover semap.igor@gmail.com a Admin
-- Executar no Supabase SQL Editor

DO $$
DECLARE
    target_email TEXT := 'semap.igor@gmail.com';
    target_name TEXT := 'IGOR FERREIRA CUNHA';
    target_id UUID;
BEGIN
    -- 1. Buscar Usuario Auth existente
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NOT NULL THEN
        -- 2. Atualizar ou Criar Perfil (para UI - BottomNav e AuthContext)
        IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_id) THEN
            UPDATE public.profiles 
            SET role = 'admin', full_name = target_name
            WHERE user_id = target_id;
        ELSE
            INSERT INTO public.profiles (user_id, full_name, role)
            VALUES (target_id, target_name, 'admin');
        END IF;

        -- 3. Inserir Role na tabela user_roles (para RLS policies e Segurança)
        -- Importante: O sistema usa user_roles para verificar permissões de admin nas queries
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_id AND role = 'admin') THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (target_id, 'admin');
        END IF;

        -- 4. Inserir ou Atualizar Assinatura para Premium
        IF EXISTS (SELECT 1 FROM public.trainer_subscriptions WHERE trainer_id = target_id) THEN
            UPDATE public.trainer_subscriptions
            SET plan = 'premium', status = 'active', price = 99.90, expires_at = (now() + interval '365 days')
            WHERE trainer_id = target_id;
        ELSE
            INSERT INTO public.trainer_subscriptions (id, trainer_id, plan, status, price, started_at, expires_at)
            VALUES (gen_random_uuid(), target_id, 'premium', 'active', 99.90, now(), now() + interval '365 days');
        END IF;
        
        RAISE NOTICE 'Usuário % (ID: %) promovido a Admin/Premium com sucesso. Nome atualizado para %.', target_email, target_id, target_name;
    ELSE
        RAISE WARNING 'ERRO CRÍTICO: Usuário % não encontrado. Crie a conta primeiro via SignUp no App!', target_email;
    END IF;
END $$;
