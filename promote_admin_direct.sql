-- SCRIPT PARA PROMOVER ADMINISTRADOR
-- Execute no SQL Editor do Supabase

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'semap.igor@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';

-- Verificação: O comando abaixo deve retornar 1 linha se tudo deu certo
-- SELECT * FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'semap.igor@gmail.com');
