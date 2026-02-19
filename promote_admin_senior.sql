-- SCRIPT MESTRE DE PROMOÇÃO ADMIN (SENIOR VERSION)
-- Este script garante sincronia entre 'user_roles' (RLS) e 'profiles' (UI rápida)

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'semap.igor@gmail.com';
BEGIN
  -- 1. Localizar o usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com e-mail % não encontrado.', v_email;
    RETURN;
  END IF;

  -- 2. Garantir papel na 'user_roles' (Fonte de verdade para RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Sincronizar 'profiles' (Fonte de verdade para a UI básica)
  UPDATE public.profiles
  SET role = 'admin'
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Usuário % promovido a admin com sucesso em ambas as tabelas.', v_email;
END $$;
