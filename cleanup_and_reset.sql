-- SCRIPT DE LIMPEZA DE DADOS (STABLE RESET)
-- Remove alunos fictícios e dados de teste para restaurar o estado "Lovable"

-- 1. Remover alunos com padrões de teste
DELETE FROM public.students 
WHERE email LIKE '%@fake.com' 
   OR email LIKE '%@teste.com'
   OR name ILIKE '%teste%'
   OR name ILIKE '%ficticio%'
   OR name ILIKE '%aluno %';

-- 2. Limpar sessões órfãs (caso o CASCADE falhe em algum projeto anterior)
DELETE FROM public.sessions 
WHERE student_id NOT IN (SELECT id FROM public.students);

-- 3. Garantir que o usuário principal ainda seja admin (para não perder acesso na versão estável)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'semap.igor@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'semap.igor@gmail.com');
