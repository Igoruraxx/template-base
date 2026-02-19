-- Função para deletar um treinador e todos os seus dados vinculados
-- Esta função deve ser executada como superuser (SECURITY DEFINER)
-- para poder deletar registros de auth.users

CREATE OR REPLACE FUNCTION public.delete_trainer_complete(t_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- A remoção em cascata deve cuidar de students, sessions, payments, etc.
  -- se as chaves estrangeiras estiverem configuradas com ON DELETE CASCADE.
  -- Se não estiverem, precisamos deletar manualmente aqui.
  
  -- Exclui o usuário da tabela auth.users (isso disparará o CASCADE para o perfil público)
  DELETE FROM auth.users WHERE id = t_id;
END;
$$;

-- Garantir permissão de execução apenas para administradores
REVOKE EXECUTE ON FUNCTION public.delete_trainer_complete(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_trainer_complete(UUID) TO service_role;
-- Nota: Como o frontend usa a API anon/authenticated, precisamos garantir que o RLS 
-- ou uma verificação interna na função valide se quem chama é admin.

CREATE OR REPLACE FUNCTION public.delete_trainer_complete(t_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  -- Verificar se o chamador é um admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = caller_id AND role::TEXT = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: Somente administradores podem remover treinadores.';
  END IF;

  -- Deleta o usuário (CASCADE cuidará do resto se configurado)
  DELETE FROM auth.users WHERE id = t_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_trainer_complete(UUID) TO authenticated;
