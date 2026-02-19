-- SCRIPT DE AUTO-REPARO DE ACESSO ADMIN
-- Este script promove o usuário atual a administrador em ambas as tabelas (user_roles e profiles).
-- Execute no SQL Editor do Supabase logado com sua conta.

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'semap.igor@gmail.com'; -- E-mail padrão do desenvolvedor
BEGIN
  -- 1. Tentar encontrar pelo e-mail primeiro (mais garantido no SQL Editor)
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  -- 2. Se não encontrar pelo e-mail, tentar pelo auth.uid() (se estiver logado no Editor)
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível localizar seu usuário. Por favor, edite o script com seu e-mail correto.';
  END IF;

  -- 3. Garantir papel na 'user_roles' (RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Sincronizar 'profiles' (UI)
  UPDATE public.profiles
  SET role = 'admin'
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Acesso administrativo (admin) restaurado com sucesso para o ID: %', v_user_id;
END $$;
