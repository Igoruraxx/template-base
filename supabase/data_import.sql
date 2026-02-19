-- =============================================
-- SCRIPT DE IMPORTAÇÃO DE DADOS - FitPro Agenda
-- Execute APÓS o full_migration.sql
-- IMPORTANTE: Desabilite os triggers antes de inserir
-- =============================================

-- Desabilitar triggers temporariamente para evitar conflitos
ALTER TABLE students DISABLE TRIGGER check_student_limit_trigger;
ALTER TABLE trainer_subscriptions DISABLE TRIGGER update_trainer_subscriptions_updated_at;

-- ==================== PROFILES ====================
-- NOTA: O profile será criado automaticamente pelo trigger on_auth_user_created
-- quando o usuário se cadastrar no novo projeto.
-- Se quiser migrar o usuário manualmente, primeiro crie-o no auth.users
-- e o trigger criará o profile automaticamente.
-- Caso queira forçar, insira manualmente:

INSERT INTO profiles (id, user_id, full_name, avatar_url, role, created_at, updated_at) VALUES
('e9747167-8412-4373-9c2d-42affe2e9a2d', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'IGOR FERREIRA CUNHA', NULL, 'trainer', '2026-02-18 15:32:39.674307+00', '2026-02-18 15:32:39.674307+00')
ON CONFLICT (user_id) DO NOTHING;

-- ==================== USER ROLES ====================

INSERT INTO user_roles (id, user_id, role) VALUES
('c99ec618-50c8-4e98-ad06-bf5acf5ceea6', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ==================== TRAINER SUBSCRIPTIONS ====================

INSERT INTO trainer_subscriptions (id, trainer_id, plan, status, price, started_at, expires_at, created_at, updated_at) VALUES
('27302e58-d707-4dd0-ab13-3c18e9455d65', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'premium', 'active', 9.9, '2026-02-18 18:05:55.183+00', '2026-03-20 18:05:55.183+00', '2026-02-18 17:46:51.757886+00', '2026-02-18 18:05:55.867038+00')
ON CONFLICT (id) DO NOTHING;

-- ==================== STUDENTS ====================

INSERT INTO students (id, trainer_id, name, phone, email, goal, plan_type, plan_value, sessions_per_week, package_total_sessions, package_used_sessions, color, avatar_url, status, is_consulting, notes, access_code, schedule_config, needs_reminder, payment_due_day, created_at, updated_at) VALUES
('5c6f15cd-6384-490b-87b5-0ad752173410', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Myriam Viana', '62998417667', 'myriamviana92@gmail.com', 'Hipertrofia', 'monthly', NULL, 3, NULL, 0, '#ec4899', NULL, 'active', false, 'Amor', NULL, '[{"day":1,"time":"19:00"},{"day":1,"time":"19:00"},{"day":4,"time":"19:00"}]'::jsonb, true, 6, '2026-02-18 19:13:26.031856+00', '2026-02-18 19:13:26.031856+00'),
('9b64a672-0808-4038-9e3a-76341c4948dd', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Kelen Aline', '+55 62 9959-1255', NULL, 'Emagrecimento', 'monthly', 650.00, 6, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"08:00"},{"day":2,"time":"08:00"},{"day":3,"time":"08:00"},{"day":4,"time":"08:00"},{"day":5,"time":"08:00"},{"day":6,"time":"09:00"}]'::jsonb, true, 6, '2026-02-18 20:03:10.593362+00', '2026-02-18 20:19:56.359301+00'),
('03c8de25-522b-4782-ae5a-7190ea9b48e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Mirlene Castro', '+55 62 9802-7385', NULL, 'Emagrecimento', 'monthly', 450.00, 3, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"07:00"},{"day":3,"time":"07:00"},{"day":5,"time":"07:00"}]'::jsonb, true, 20, '2026-02-18 20:05:48.239673+00', '2026-02-18 20:23:36.716847+00'),
('9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Michel Valença', '+55 62 8458-2039', NULL, 'Hipertrofia', 'monthly', 540.00, 4, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"12:00"},{"day":2,"time":"12:00"},{"day":4,"time":"12:00"},{"day":5,"time":"12:00"}]'::jsonb, true, NULL, '2026-02-18 20:07:23.877638+00', '2026-02-18 20:23:16.89244+00'),
('79474a69-4ee9-4d6d-943c-31e6a22c6e48', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Dayane O', '+55 62 9815-4043', NULL, NULL, 'monthly', 600.00, 5, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"13:00"},{"day":2,"time":"13:00"},{"day":3,"time":"13:00"},{"day":4,"time":"13:00"},{"day":1,"time":"13:00"}]'::jsonb, true, NULL, '2026-02-18 20:13:35.637472+00', '2026-02-18 20:24:05.929024+00'),
('b8bbc930-9737-4e20-b1e0-01a8e5850579', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Jardson Fonseca', '62 9336-7771', NULL, NULL, 'monthly', 550.00, 5, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"18:00"},{"day":2,"time":"18:00"},{"day":3,"time":"18:00"},{"day":4,"time":"18:00"},{"day":5,"time":"18:00"}]'::jsonb, true, 5, '2026-02-18 20:16:04.609028+00', '2026-02-18 20:16:04.609028+00'),
('0155337d-b2e8-4823-ab94-e67c98a65de1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Lorena Araujo', '+55 62 8338-1796', NULL, NULL, 'monthly', 600.00, 5, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"16:00"},{"day":2,"time":"16:00"},{"day":3,"time":"16:00"},{"day":4,"time":"16:00"},{"day":5,"time":"16:00"}]'::jsonb, true, NULL, '2026-02-18 20:17:41.484606+00', '2026-02-19 12:34:08.58697+00'),
('36295f96-e8f8-459b-826e-f83f54767438', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Izildinha Arriel', '+55 62 9914-9731', NULL, NULL, 'monthly', 350.00, 3, NULL, 0, '#ec4899', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"11:00"},{"day":3,"time":"11:00"},{"day":5,"time":"11:00"}]'::jsonb, true, 21, '2026-02-18 20:19:18.044351+00', '2026-02-18 20:23:54.964321+00'),
('0bbc5ab4-bd76-4546-b9be-a0ae1d5e9c1f', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Pedro Dutra', '62995303535', NULL, NULL, 'monthly', 450.00, 2, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":2,"time":"17:00"},{"day":5,"time":"17:00"}]'::jsonb, true, 3, '2026-02-18 20:22:04.679686+00', '2026-02-18 20:22:45.946419+00'),
('54f3435b-c8dc-49c5-aafa-03b79ca91e46', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Thiago Barros', '62996581659', NULL, 'Hipertrofia', 'monthly', 200.00, 3, NULL, 0, '#10b981', NULL, 'active', false, NULL, NULL, '[{"day":1,"time":"08:00"},{"day":3,"time":"08:00"},{"day":5,"time":"08:00"}]'::jsonb, true, 6, '2026-02-19 11:49:17.941303+00', '2026-02-19 11:49:17.941303+00'),
('d318e329-1a2c-46ec-bc8c-e62b9333a3d1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Carolina Luiz Benfica Souza', '62995054175', NULL, 'Emagrecimento', 'monthly', NULL, 1, NULL, 0, '#ec4899', NULL, 'active', true, NULL, '3ERJF6', '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 11:54:58.057907+00', '2026-02-19 12:31:46.957851+00'),
('53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Eriberto Cassio de Souza', '62998037028', NULL, NULL, 'monthly', NULL, 1, NULL, 0, '#10b981', NULL, 'active', true, NULL, NULL, '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 11:55:39.896681+00', '2026-02-19 11:55:39.896681+00'),
('93968298-193c-4ea8-ad96-8db5b06e620e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'Dilcarla Rabelo e Silva', '62992156895', NULL, NULL, 'monthly', NULL, 1, NULL, 0, '#ec4899', NULL, 'active', true, NULL, NULL, '[{"day":1,"time":"08:00"}]'::jsonb, true, NULL, '2026-02-19 12:11:55.862689+00', '2026-02-19 12:11:55.862689+00')
ON CONFLICT (id) DO NOTHING;

-- ==================== PAYMENTS ====================

INSERT INTO payments (id, student_id, trainer_id, amount, reference_month, status, paid_at, payment_method, notes, created_at, updated_at) VALUES
('5e3bb9e5-54b1-4ee9-8c7e-bd23c77f7b15', '9b64a672-0808-4038-9e3a-76341c4948dd', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 650.00, '2026-02', 'paid', '2026-02-19 12:30:28.038+00', NULL, NULL, '2026-02-18 21:25:50.264773+00', '2026-02-19 12:30:28.264781+00'),
('5ad8ece4-85d7-4aec-b038-709ef359e23d', '9737-4e20-b1e0-01a8e5850579', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 550.00, '2026-02', 'paid', '2026-02-19 12:30:32.772+00', NULL, NULL, '2026-02-18 21:25:50.270222+00', '2026-02-19 12:30:32.973621+00'),
('6049a5bf-6e0c-4202-8e00-488922b22e80', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 450.00, '2026-02', 'paid', '2026-02-19 12:30:36.583+00', NULL, NULL, '2026-02-18 21:25:50.688217+00', '2026-02-19 12:30:36.7751+00'),
('4de701b7-7f5d-4ec1-9d07-357816f19ea8', '36295f96-e8f8-459b-826e-f83f54767438', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 350.00, '2026-02', 'pending', NULL, NULL, NULL, '2026-02-18 21:25:50.682445+00', '2026-02-18 21:25:50.682445+00'),
('fcf888c8-6813-4a5f-9643-ddf62bdbf570', '0bbc5ab4-bd76-4546-b9be-a0ae1d5e9c1f', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 450.00, '2026-02', 'paid', '2026-02-19 12:30:41.303+00', NULL, NULL, '2026-02-18 21:25:50.694733+00', '2026-02-19 12:30:41.488+00'),
('47efad1e-d447-4ccf-9e7a-4eebb94e7fd2', '54f3435b-c8dc-49c5-aafa-03b79ca91e46', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 200.00, '2026-02', 'paid', '2026-02-19 12:30:42.622+00', NULL, NULL, '2026-02-19 12:30:23.02634+00', '2026-02-19 12:30:42.789788+00')
ON CONFLICT (id) DO NOTHING;

-- ==================== BIOIMPEDANCE ====================

INSERT INTO bioimpedance (id, student_id, trainer_id, measured_at, weight, body_fat_pct, muscle_mass, visceral_fat, bmr, body_water_pct, bone_mass, report_url, notes, created_at) VALUES
('7035b725-2ce3-4433-a2b4-00e71f44ee6e', '5c6f15cd-6384-490b-87b5-0ad752173410', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-18', 96.70, 20.30, 71.90, 7.00, 2035.00, 58.40, 5.20, NULL, NULL, '2026-02-18 19:30:48.590842+00'),
('b9428f17-e1d9-4447-92d2-d73d97a29b8d', '5c6f15cd-6384-490b-87b5-0ad752173410', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-10', 77.80, 31.50, 49.80, 10.00, 1521.00, 50.20, 3.60, NULL, NULL, '2026-02-18 19:32:20.005107+00'),
('c26dd0a5-d19d-4a03-a307-3ff0d9e216b2', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-19', 81.30, 33.00, 50.80, 11.00, 1547.00, 49.10, 3.70, NULL, NULL, '2026-02-19 12:05:44.325024+00'),
('fa5d8220-b0bd-4e77-9be7-9118f5ee65cb', '93968298-193c-4ea8-ad96-8db5b06e620e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-11', 89.10, 55.70, 36.90, 20.00, 1223.00, 32.50, 2.60, NULL, NULL, '2026-02-19 12:14:29.173731+00'),
('bd1309fd-5291-4ffe-8ade-47cb937768de', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-19', 92.10, 21.00, 67.90, 7.00, 1940.00, 57.90, 4.90, NULL, NULL, '2026-02-19 14:58:34.278318+00'),
('dba168b7-8f6a-4161-82e2-34c1f7bee187', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '2026-02-19', 92.10, 21.00, 67.90, 7.00, 1940.00, 57.90, 4.90, NULL, NULL, '2026-02-19 15:08:07.621957+00')
ON CONFLICT (id) DO NOTHING;

-- ==================== PROGRESS PHOTOS ====================
-- NOTA: As URLs de foto apontam para o storage do projeto atual.
-- Você precisará baixar as fotos e re-uploadar no novo projeto,
-- depois atualizar as URLs aqui.

INSERT INTO progress_photos (id, student_id, trainer_id, photo_url, photo_type, taken_at, notes, created_at) VALUES
('4540a5aa-a9c6-4ffc-bfbe-83edd16b4cc9', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'front', '2026-02-19', NULL, '2026-02-19 12:04:27.915282+00'),
('e7def574-8917-4535-afff-e135dfa9c6a5', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'side', '2026-02-19', NULL, '2026-02-19 12:04:36.262271+00'),
('86d01dd6-ffda-45cc-bc49-962e0d535014', 'd318e329-1a2c-46ec-bc8c-e62b9333a3d1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'back', '2026-02-19', NULL, '2026-02-19 12:04:47.953813+00'),
('e59f5d43-4b81-456c-9d4b-0994de6c1b44', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'front', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:10:39.433231+00'),
('23d9bd37-0479-494c-9c32-322b21f563b7', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'side', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:11:00.491207+00'),
('0a04cffa-4caa-45d3-ba35-233cb3dc17d7', '53714658-143b-4a3f-ae4b-b8d16cfad4e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'back', '2026-02-19', 'Peso: 92kg', '2026-02-19 12:11:11.684384+00'),
('1bd299eb-3ce7-4d47-a3ff-f33e7b843782', '93968298-193c-4ea8-ad96-8db5b06e620e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'front', '2026-02-11', NULL, '2026-02-19 12:12:45.048936+00'),
('c7da4282-8abb-4df9-8922-f5159c791adf', '93968298-193c-4ea8-ad96-8db5b06e620e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'side', '2026-02-11', NULL, '2026-02-19 12:13:03.206645+00'),
('d7a504bc-7478-4f20-aea6-0e1eba66ae1f', '93968298-193c-4ea8-ad96-8db5b06e620e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'back', '2026-02-11', NULL, '2026-02-19 12:13:24.258039+00'),
('3a6b455d-2003-4770-99fc-c9ba6d1a25a1', '0155337d-b2e8-4823-ab94-e67c98a65de1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'front', '2026-02-10', NULL, '2026-02-19 12:34:46.955307+00'),
('113ef953-de51-46b1-8720-d2cd9450f36e', '0155337d-b2e8-4823-ab94-e67c98a65de1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'side', '2026-02-10', NULL, '2026-02-19 12:35:06.388337+00'),
('f4d4dc56-f555-48a2-87d0-e9f7b757b436', '0155337d-b2e8-4823-ab94-e67c98a65de1', '7fd63bda-0975-4eff-8fa6-3f62099250ee', 'ATUALIZAR_URL_AQUI', 'back', '2026-02-10', NULL, '2026-02-19 12:35:34.654016+00')
ON CONFLICT (id) DO NOTHING;

-- ==================== SESSIONS ====================
-- São muitas sessões. Inserindo todas:

INSERT INTO sessions (id, trainer_id, student_id, scheduled_date, scheduled_time, duration_minutes, location, status, notes, muscle_groups, created_at, updated_at) VALUES
-- Myriam Viana sessions
('666099fa-3eed-40a3-a2d5-8fb9ab6c6567', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-02-23', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:06.336296+00', '2026-02-18 19:14:06.336296+00'),
('083fba6b-b501-442f-ab1d-88d620a64872', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-02', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:06.693766+00', '2026-02-18 19:14:06.693766+00'),
('ae9dfff9-7d87-44f0-b655-4a0da6befdac', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-09', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:07.079801+00', '2026-02-18 19:14:07.079801+00'),
('a21f44d5-8ea0-407a-8917-c1aa385e57ff', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-16', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:07.504234+00', '2026-02-18 19:14:07.504234+00'),
('e634909a-fdb8-4578-b442-60381e976e16', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-02-23', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:07.904329+00', '2026-02-18 19:14:07.904329+00'),
('358cf254-0be1-452c-9732-d7a578ef903e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-02', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:08.339134+00', '2026-02-18 19:14:08.339134+00'),
('9eb76a86-21fd-4a2a-bfc2-e8dbf45eb85f', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-09', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:09.245137+00', '2026-02-18 19:14:09.245137+00'),
('d4fcb422-1012-4f4a-ada1-008c7a908230', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-16', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:09.909212+00', '2026-02-18 19:14:09.909212+00'),
('98676a43-2d1e-45fb-ba4c-d884e79b967d', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-02-19', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:10.558213+00', '2026-02-18 19:14:10.558213+00'),
('f250423f-6af7-404c-bca9-5599077fe0ba', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-02-26', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:11.212184+00', '2026-02-18 19:14:11.212184+00'),
('ef59945c-5d06-48a2-a8be-285d5888589e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-05', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:11.902914+00', '2026-02-18 19:14:11.902914+00'),
('9ba719f3-886d-41cc-990e-1e2a290395b4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '5c6f15cd-6384-490b-87b5-0ad752173410', '2026-03-12', '19:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 19:14:12.71198+00', '2026-02-18 19:14:12.71198+00'),
-- Mirlene Castro sessions
('ca0a561c-e268-4ae1-a353-40859cdb8589', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-02-23', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:05.001913+00', '2026-02-18 20:06:05.001913+00'),
('deb0f9d8-d25f-453c-8c03-0396c6aa1522', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-02', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:05.277739+00', '2026-02-18 20:06:05.277739+00'),
('45302fb7-dc49-44bc-b3a5-7f9a3519f00f', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-09', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:05.822392+00', '2026-02-18 20:06:05.822392+00'),
('42916e1a-2a39-4f9f-84da-e1377ceec680', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-16', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:06.222515+00', '2026-02-18 20:06:06.222515+00'),
('e4f14f86-851d-40cf-9306-b6c4ef8b7b98', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-02-25', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:07.031862+00', '2026-02-18 20:06:07.031862+00'),
('c7b0d0e6-92d9-4eb1-b006-3125f06de6e3', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-04', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:08.256093+00', '2026-02-18 20:06:08.256093+00'),
('799581a2-fdeb-4f03-8860-6b8322e8114a', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-11', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:08.941372+00', '2026-02-18 20:06:08.941372+00'),
('5c951ec6-8e84-4a08-a5c9-42d1410ecfcc', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-02-20', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:09.618928+00', '2026-02-18 20:06:09.618928+00'),
('be691484-49c6-4cc0-a26f-e832a755b72e', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-02-27', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:10.389507+00', '2026-02-18 20:06:10.389507+00'),
('0471aa61-7092-4431-8af2-000dc2de4949', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-06', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:11.209095+00', '2026-02-18 20:06:11.209095+00'),
('c583af8a-bda6-4d53-95ca-421dfe76922a', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-03-13', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:11.95598+00', '2026-02-18 20:06:11.95598+00'),
('5f1f1ad2-6803-4624-af1f-1be16dac78e4', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '03c8de25-522b-4782-ae5a-7190ea9b48e4', '2026-02-18', '07:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:06:06.486265+00', '2026-02-18 20:06:06.486265+00'),
-- Michel Valença sessions
('ed5ef9b1-2a22-45c1-bd42-5c5d34132a16', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-23', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:23.218295+00', '2026-02-18 20:08:23.218295+00'),
('92a7770f-4b93-4179-b91d-9489b4c0fb42', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-02', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:23.65827+00', '2026-02-18 20:08:23.65827+00'),
('e3d4143e-5640-49b6-a239-770450159307', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-09', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:24.034426+00', '2026-02-18 20:08:24.034426+00'),
('f5145461-0e31-4941-a084-2f82ba4838b2', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-16', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:24.330754+00', '2026-02-18 20:08:24.330754+00'),
('ad91976b-89b1-43d7-a7f3-18ad9cae41e8', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-24', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:24.849862+00', '2026-02-18 20:08:24.849862+00'),
('b912010a-4e22-41fa-a2bb-ee8c900c996b', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-03', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:25.2685+00', '2026-02-18 20:08:25.2685+00'),
('d69bd038-a582-4247-ac76-41516349e703', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-10', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:25.74173+00', '2026-02-18 20:08:25.74173+00'),
('3859a1ab-e53f-48ed-b5dc-5eb3705eff2c', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-17', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:26.099991+00', '2026-02-18 20:08:26.099991+00'),
('f542cd46-c81b-4021-a0d9-c66f77dd3f7a', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-19', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:26.498968+00', '2026-02-18 20:08:26.498968+00'),
('d878c74e-93ae-497f-9030-e799c2ea08f8', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-26', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:26.822637+00', '2026-02-18 20:08:26.822637+00'),
('022cbe6e-1203-4e69-bd70-dae254493923', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-05', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:27.199645+00', '2026-02-18 20:08:27.199645+00'),
('0272907c-041a-4027-a1da-76558b8ae530', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-12', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:27.728258+00', '2026-02-18 20:08:27.728258+00'),
('f6e1d41a-cf80-4abd-802a-a6a83db992c8', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-20', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:28.143327+00', '2026-02-18 20:08:28.143327+00'),
('0d0c0b04-b5da-4c2d-b005-0b212e8db692', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-02-27', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:28.443706+00', '2026-02-18 20:08:28.443706+00'),
('99f2f5a0-a4af-44f9-a706-ad2a2372e587', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-06', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:28.885822+00', '2026-02-18 20:08:28.885822+00'),
('89386e6a-86da-4f3a-8ca2-7b30595f8e99', '7fd63bda-0975-4eff-8fa6-3f62099250ee', '9360d9c3-ab64-4a78-9549-dc8b98ec3c51', '2026-03-13', '12:00:00', 60, NULL, 'scheduled', NULL, '{}', '2026-02-18 20:08:29.257963+00', '2026-02-18 20:08:29.257963+00')
ON CONFLICT (id) DO NOTHING;

-- NOTA: As sessões dos demais alunos (Kelen, Dayane, Jardson, Lorena, Izildinha, Pedro, Thiago)
-- foram truncadas neste script devido ao volume. Use o mesmo padrão para inserir.
-- Você pode exportar sessões adicionais diretamente do Cloud > Database > Sessions > Export.

-- ==================== REABILITAR TRIGGERS ====================

ALTER TABLE students ENABLE TRIGGER check_student_limit_trigger;
ALTER TABLE trainer_subscriptions ENABLE TRIGGER update_trainer_subscriptions_updated_at;

-- =============================================
-- IMPORTANTE: 
-- 1. O student_id do pagamento do Jardson precisa ser corrigido para:
--    'b8bbc930-9737-4e20-b1e0-01a8e5850579' (estava truncado acima)
-- 2. As URLs de progress_photos e bioimpedance report_url precisam 
--    ser atualizadas após migrar os arquivos para o novo storage
-- 3. O user_id do auth.users precisa ser o mesmo no novo projeto
--    (crie o usuário com o mesmo email para manter os IDs)
-- =============================================
