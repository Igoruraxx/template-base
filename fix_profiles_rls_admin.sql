-- CORREÇÃO DE RLS: Permitir que admins vejam todos os perfis
-- Essencial para o Dashboard Admin e Busca de Alunos

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Aproveitando para garantir que admins possam ver todas as roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
