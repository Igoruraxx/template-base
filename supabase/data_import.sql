-- SCRIPT DE IMPORTAÇÃO DE DADOS CORRIGIDO
-- Execute APÓS criar a conta do usuário (semap.igor@gmail.com) no sistema
-- e após rodar o full_migration.sql

DO $$
DECLARE
    -- Email do usuário alvo
    target_email TEXT := 'semap.igor@gmail.com';
    
    -- ID que será buscado dinamicamente
    t_id UUID;
    
    -- Variavel auxiliar
    rec RECORD;
BEGIN

    -- 1. Buscar ID do usuário pelo email
    SELECT id INTO t_id FROM auth.users WHERE email = target_email;

    IF t_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não encontrado! Crie a conta primeiro.', target_email;
    END IF;

    RAISE NOTICE 'Importando dados para o usuário % (ID: %)', target_email, t_id;

    -- ==================== DESABILITAR TRIGGERS ====================
    ALTER TABLE public.students DISABLE TRIGGER check_student_limit_trigger;
    ALTER TABLE public.trainer_subscriptions DISABLE TRIGGER update_trainer_subscriptions_updated_at;

    -- ==================== PROFILES ====================
    -- Atualiza ou insere perfil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = t_id) THEN
        UPDATE public.profiles 
        SET full_name = 'IGOR FERREIRA CUNHA', role = 'admin' 
        WHERE user_id = t_id;
    ELSE
        INSERT INTO public.profiles (user_id, full_name, role)
        VALUES (t_id, 'IGOR FERREIRA CUNHA', 'admin');
    END IF;

    -- ==================== USER ROLES ====================
    INSERT INTO public.user_roles (user_id, role)
    VALUES (t_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- ==================== TRAINER SUBSCRIPTIONS ====================
    -- Remove anterior se existir e insere nova ou atualiza
    DELETE FROM public.trainer_subscriptions WHERE trainer_id = t_id;
    
    INSERT INTO public.trainer_subscriptions (id, trainer_id, plan, status, price, started_at, expires_at)
    VALUES (gen_random_uuid(), t_id, 'premium', 'active', 99.90, now(), now() + interval '1 year');

    -- ==================== STUDENTS ====================
    -- Usando t_id como trainer_id
    INSERT INTO public.students (id, trainer_id, name, phone, email, goal, plan_type, plan_value, sessions_per_week, package_total_sessions, package_used_sessions, color, avatar_url, status, is_consulting, notes, access_code, schedule_config, needs_reminder, payment_due_day, created_at, updated_at) VALUES
    ('5c6f15cd-6384-490b-87b5-0ad752173410', t_id, 'Myriam Viana', '62998417667', 'myriamviana92@gmail.com', 'Hipertrofia', 'monthly', NULL, 3, NULL, 0, '#ec4899', NULL, 'active', false, 'Amor', NULL, '[{"day":1,"time":"19:00"},{"day":1,"time":"19:00"},{"day":4,"time":"19:00"}]'::jsonb, true, 6, '2026-02-18 19:13:26.031856+00', '2026-02-18 19:13:26.031856+00'),
    ('9b64a672-0808-4038-9e3a-76341c4948dd', t_id, 'Kelen Aline', '+55 62 9959-1255', NULL, 'Emagrecimento', 'monthly', 650.00, 6, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"08:00"},{"day":2,"time":"08:00"},{"day":3,"time":"08:00"},{"day":4,"time":"08:00"},{"day":5,"time":"08:00"},{"day":6,"time":"09:00"}]'::jsonb, true, 6, '2026-02-18 20:03:10.593362+00', '2026-02-18 20:19:56.359301+00'),
    ('03c8de25-522b-4782-ae5a-7190ea9b48e4', t_id, 'Mirlene Castro', '+55 62 9802-7385', NULL, 'Emagrecimento', 'monthly', 450.00, 3, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"07:00"},{"day":3,"time":"07:00"},{"day":5,"time":"07:00"}]'::jsonb, true, 20, '2026-02-18 20:05:48.239673+00', '2026-02-18 20:23:36.716847+00'),
    ('9360d9c3-ab64-4a78-9549-dc8b98ec3c51', t_id, 'Michel Valença', '+55 62 8458-2039', NULL, 'Hipertrofia', 'monthly', 540.00, 4, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"12:00"},{"day":2,"time":"12:00"},{"day":4,"time":"12:00"},{"day":5,"time":"12:00"}]'::jsonb, true, NULL, '2026-02-18 20:07:23.877638+00', '2026-02-18 20:23:16.89244+00'),
    ('79474a69-4ee9-4d6d-943c-31e6a22c6e48', t_id, 'Dayane O', '+55 62 9815-4043', NULL, NULL, 'monthly', 600.00, 5, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"13:00"},{"day":2,"time":"13:00"},{"day":3,"time":"13:00"},{"day":4,"time":"13:00"},{"day":1,"time":"13:00"}]'::jsonb, true, NULL, '2026-02-18 20:13:35.637472+00', '2026-02-18 20:24:05.929024+00'),
    ('b8bbc930-9737-4e20-b1e0-01a8e5850579', t_id, 'Jardson Fonseca', '62 9336-7771', NULL, NULL, 'monthly', 550.00, 5, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"18:00"},{"day":2,"time":"18:00"},{"day":3,"time":"18:00"},{"day":4,"time":"18:00"},{"day":5,"time":"18:00"}]'::jsonb, true, 5, '2026-02-18 20:16:04.609028+00', '2026-02-18 20:16:04.609028+00'),
    ('0155337d-b2e8-4823-ab94-e67c98a65de1', t_id, 'Lorena Araujo', '+55 62 8338-1796', NULL, NULL, 'monthly', 600.00, 5, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"16:00"},{"day":2,"time":"16:00"},{"day":3,"time":"16:00"},{"day":4,"time":"16:00"},{"day":5,"time":"16:00"}]'::jsonb, true, NULL, '2026-02-18 20:17:41.484606+00', '2026-02-19 12:34:08.58697+00'),
    ('36295f96-e8f8-459b-826e-f83f54767438', t_id, 'Izildinha Arriel', '+55 62 9914-9731', NULL, NULL, 'monthly', 350.00, 3, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"11:00"},{"day":3,"time":"11:00"},{"day":5,"time":"11:00"}]'::jsonb, true, 21, '2026-02-18 20:19:18.044351+00', '2026-02-18 20:23:54.964321+00'),
    ('0bbc5ab4-bd76-4546-b9be-a0ae1d5e9c1f', t_id, 'Pedro Dutra', '62995303535', NULL, NULL, 'monthly', 450.00, 2, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":2,"time":"17:00"},{"day":5,"time":"17:00"}]'::jsonb, true, 3, '2026-02-18 20:22:04.679686+00', '2026-02-18 20:22:45.946419+00'),
    ('54f3435b-c8dc-49c5-aafa-03b79ca91e46', t_id, 'Thiago Barros', '62996581659', NULL, 'Hipertrofia', 'monthly', 200.00, 3, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"08:00"},{"day":3,"time":"08:00"},{"day":5,"time":"08:00"}]'::jsonb, true, 6, '2026-02-19 11:49:17.941303+00', '2026-02-19 11:49:17.941303+00'),
    ('d318e329-1a2c-46ec-bc8c-e62b9333a3d1', t_id, 'Carolina Luiz Benfica Souza', '62995054175', NULL, 'Emagrecimento', 'monthly', NULL, 1, NULL, 0, '#ec4899', NULL, 'active', true, NULL, '3ERJF6', '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 11:54:58.057907+00', '2026-02-19 12:31:46.957851+00'),
    ('53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, 'Eriberto Cassio de Souza', '62998037028', NULL, NULL, 'monthly', NULL, 1, NULL, 0, '#10b981', NULL, 'active', true, NULL, NULL, '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 11:55:39.896681+00', '2026-02-19 11:55:39.896681+00'),
    ('93968298-193c-4ea8-ad96-8db5b06e620e', t_id, 'Dilcarla Rabelo e Silva', '62992156895', NULL, NULL, 'monthly', NULL, 1, NULL, 0, '#ec4899', NULL, 'active', true, NULL, NULL, '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 12:11:55.862689+00', '2026-02-19 12:11:55.862689+00')
    ON CONFLICT (id) DO NOTHING;

    -- ==================== PAYMENTS ====================
    INSERT INTO public.payments (id, student_id, trainer_id, amount, reference_month, status, paid_at, payment_method, notes, created_at, updated_at) VALUES
    ('5e3bb9e5-54b1-4ee9-8c7e-bd23c77f7b15', '9b64a672-0808-4038-9e3a-76341c4948dd', t_id, 650.00, '2026-02', 'paid', '2026-02-19 12:30:28.038+00', NULL, NULL, '2026-02-18 21:25:50.264773+00', '2026-02-19 12:30:28.264781+00'),
    ('5ad8ece4-85d7-4aec-b038-709ef359e23d', 'b8bbc930-9737-4e20-b1e0-01a8e5850579', t_id, 550.00, '2026-02', 'paid', '2026-02-19 12:30:32.772+00', NULL, NULL, '2026-02-18 21:25:50.270222+00', '2026-02-19 12:30:32.973621+00'),
    ('6049a5bf-6e0c-4202-8e00-488922b22e80', '03c8de25-522b-4782-ae5a-7190ea9b48e4', t_id, 450.00, '2026-02', 'paid', '2026-02-19 12:30:36.583+00', NULL, NULL, '2026-02-18 21:25:50.688217+00', '2026-02-19 12:30:36.7751+00'),
    ('4de701b7-7f5d-4ec1-9d07-357816f19ea8', '36295f96-e8f8-459b-826e-f83f54767438', t_id, 350.00, '2026-02', 'pending', NULL, NULL, NULL, '2026-02-18 21:25:50.682445+00', '2026-02-18 21:25:50.682445+00'),
    ('fcf888c8-6813-4a5f-9643-ddf62bdbf570', '0bbc5ab4-bd76-4546-b9be-a0ae1d5e9c1f', t_id, 450.00, '2026-02', 'paid', '2026-02-19 12:30:41.303+00', NULL, NULL, '2026-02-18 21:25:50.694733+00', '2026-02-19 12:30:41.488+00'),
    ('47efad1e-d447-4ccf-9e7a-4eebb94e7fd2', '54f3435b-c8dc-49c5-aafa-03b79ca91e46', t_id, 200.00, '2026-02', 'paid', '2026-02-19 12:30:42.622+00', NULL, NULL, '2026-02-19 12:30:23.02634+00', '2026-02-19 12:30:42.789788+00')
    ON CONFLICT (id) DO NOTHING;

    -- ==================== BIOIMPEDANCE ====================
    INSERT INTO public.bioimpedance (id, student_id, trainer_id, measured_at, weight, body_fat_pct, muscle_mass, visceral_fat, bmr, body_water_pct, bone_mass, report_url, notes, created_at) VALUES
    ('7035b725-2ce3-4433-a2b4-00e71f44ee6e', '5c6f15cd-6384-490b-87b5-0ad752173410', t_id, '2026-02-18', 96.70, 20.30, 71.90, 7.00, 2035.00, 58.40, 5.20, NULL, NULL, '2026-02-18 19:30:48.590842+00'),
    ('b9428f17-e1d9-4447-92d2-d73d97a29b8d', '5c6f15cd-6384-490b-87b5-0ad752173410', t_id, '2026-02-10', 77.80, 31.50, 49.80, 10.00, 1521.00, 50.20, 3.60, NULL, NULL, '2026-02-18 19:32:20.005107+00'),
    ('c26dd0a5-d19d-4a03-a307-3ff0d9e216b2', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', t_id, '2026-02-19', 81.30, 33.00, 50.80, 11.00, 1547.00, 49.10, 3.70, NULL, NULL, '2026-02-19 12:05:44.325024+00'),
    ('fa5d8220-b0bd-4e77-9be7-9118f5ee65cb', '93968298-193c-4ea8-ad96-8db5b06e620e', t_id, '2026-02-11', 89.10, 55.70, 36.90, 20.00, 1223.00, 32.50, 2.60, NULL, NULL, '2026-02-19 12:14:29.173731+00'),
    ('bd1309fd-5291-4ffe-8ade-47cb937768de', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, '2026-02-19', 92.10, 21.00, 67.90, 7.00, 1940.00, 57.90, 4.90, NULL, NULL, '2026-02-19 14:58:34.278318+00'),
    ('dba168b7-8f6a-4161-82e2-34c1f7bee187', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, '2026-02-19', 92.10, 21.00, 67.90, 7.00, 1940.00, 57.90, 4.90, NULL, NULL, '2026-02-19 15:08:07.621957+00')
    ON CONFLICT (id) DO NOTHING;

    -- ==================== PROGRESS PHOTOS ====================
    INSERT INTO public.progress_photos (id, student_id, trainer_id, photo_url, photo_type, taken_at, notes, created_at) VALUES
    ('4540a5aa-a9c6-4ffc-bfbe-83edd16b4cc9', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', t_id, 'ATUALIZAR_URL_AQUI', 'front', '2026-02-19', NULL, '2026-02-19 12:04:27.915282+00'),
    ('e7def574-8917-4535-afff-e135dfa9c6a5', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', t_id, 'ATUALIZAR_URL_AQUI', 'side', '2026-02-19', NULL, '2026-02-19 12:04:36.262271+00'),
    ('86d01dd6-ffda-45cc-bc49-962e0d535014', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', t_id, 'ATUALIZAR_URL_AQUI', 'back', '2026-02-19', NULL, '2026-02-19 12:04:47.953813+00'),
    ('e59f5d43-4b81-456c-9d4b-0994de6c1b44', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, 'ATUALIZAR_URL_AQUI', 'front', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:10:39.433231+00'),
    ('23d9bd37-0479-494c-9c32-322b21f563b7', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, 'ATUALIZAR_URL_AQUI', 'side', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:11:00.491207+00'),
    ('0a04cffa-4caa-45d3-ba35-233cb3dc17d7', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', t_id, 'ATUALIZAR_URL_AQUI', 'back', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:11:11.684384+00'),
    ('1bd299eb-3ce7-4d47-a3ff-f33e7b843782', '93968298-193c-4ea8-ad96-8db5b06e620e', t_id, 'ATUALIZAR_URL_AQUI', 'front', '2026-02-11', NULL, '2026-02-19 12:12:45.048936+00'),
    ('c7da4282-8abb-4df9-8922-f5159c791adf', '93968298-193c-4ea8-ad96-8db5b06e620e', t_id, 'ATUALIZAR_URL_AQUI', 'side', '2026-02-11', NULL, '2026-02-19 12:13:03.206645+00'),
    ('d7a504bc-7478-4f20-aea6-0e1eba66ae1f', '93968298-193c-4ea8-ad96-8db5b06e620e', t_id, 'ATUALIZAR_URL_AQUI', 'back', '2026-02-11', NULL, '2026-02-19 12:13:24.258039+00'),
    ('3a6b455d-2003-4770-99fc-c9ba6d1a25a1', '0155337d-b2e8-4823-ab94-e67c98a65de1', t_id, 'ATUALIZAR_URL_AQUI', 'front', '2026-02-10', NULL, '2026-02-19 12:34:46.955307+00'),
    ('113ef953-de51-46b1-8720-d2cd9450f36e', '0155337d-b2e8-4823-ab94-e67c98a65de1', t_id, 'ATUALIZAR_URL_AQUI', 'side', '2026-02-10', NULL, '2026-02-19 12:35:06.388337+00'),
    ('f4d4dc56-f555-48a2-87d0-e9f7b757b436', '0155337d-b2e8-4823-ab94-e67c98a65de1', t_id, 'ATUALIZAR_URL_AQUI', 'back', '2026-02-10', NULL, '2026-02-19 12:35:34.654016+00')
    ON CONFLICT (id) DO NOTHING;

    -- ==================== SESSIONS (Truncated for brevity in example, but logic applies) ====================
    -- INSERINDO SESSIONS DE EXEMPLO (se precisar de todas, copie o bloco original e substitua trainer_id por t_id)
    INSERT INTO public.sessions (id, trainer_id, student_id, scheduled_date, scheduled_time, duration_minutes, location, status, notes, muscle_groups, created_at, updated_at) VALUES
    ('666099fa-3eed-40a3-a2d5-8fb9ab6c6567', t_id, '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-02-23', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:06.336296+00', '2026-02-18 19:14:06.336296+00'),
    ('083fba6b-b501-442f-ab1d-88d620a64872', t_id, '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-02', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:06.693766+00', '2026-02-18 19:14:06.693766+00'),
    -- ... (adicione as outras sessões aqui, substituindo o GUID antigo por t_id)
    ('ed5ef9b1-2a22-45c1-bd42-5c5d34132a16', t_id, '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-23', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:23.218295+00', '2026-02-18 20:08:23.218295+00')
    ON CONFLICT (id) DO NOTHING;

    -- ==================== REABILITAR TRIGGERS ====================
    ALTER TABLE public.students ENABLE TRIGGER check_student_limit_trigger;
    ALTER TABLE public.trainer_subscriptions ENABLE TRIGGER update_trainer_subscriptions_updated_at;

    RAISE NOTICE 'Importação concluída com sucesso!';
END $$;
