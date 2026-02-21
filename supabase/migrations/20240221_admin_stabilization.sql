-- Migração para estabilização do Painel Administrador
-- Foco: RLS para admin e função de deleção completa

-- 1. Garantir que admins possam ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    );

-- 2. Garantir que admins possam deletar perfis (necessário para a função de limpeza)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    );

-- 3. Função para deletar treinador e todos os dados relacionados de uma vez
-- Nota: As tabelas alunos, exercícios, etc já devem ter ON DELETE CASCADE no user_id/trainer_id
-- No entanto, remover o usuário do auth.users requer privilégios especiais ou uma função SECURITY DEFINER.

CREATE OR REPLACE FUNCTION delete_trainer_complete(t_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Permite rodar com privilégios de quem criou a função (admin)
AS $$
BEGIN
    -- Verificar se quem está chamando é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem remover treinadores.';
    END IF;

    -- 1. Remover assinaturas explicitamente (embora deva haver CASCADE)
    DELETE FROM public.trainer_subscriptions WHERE trainer_id = t_id;
    
    -- 2. Remover o perfil (isso deve disparar CASCADEs para students, etc)
    DELETE FROM public.profiles WHERE user_id = t_id;

    -- 3. Nota: Para deletar do auth.users via SQL/RPC, precisaríamos de extensões específicas
    -- mas remover de profiles já "mata" o acesso do usuário nas políticas baseadas em profiles.
END;
$$;
