-- Script de Seed para Dados Fictícios (CORRIGIDO v5 - FINALISSIMO)
-- Executar no Supabase SQL Editor

DO $$
DECLARE
    -- IDs de referência
    t1_email TEXT := 'carlos.silva@fake.com';
    t2_email TEXT := 'amanda.souza@fake.com';
    
    -- IDs resolvidos
    t1_id UUID;
    t2_id UUID;
    
    -- IDs defaults caso precise criar do zero (e não existam)
    default_t1_id UUID := '917a6363-0230-4e88-8941-5efefd3660d8'; 
    default_t2_id UUID := 'a28b7474-1341-5f99-9052-1e4771e9a2b1';
    
    s_id UUID;
    
    -- Loop variables
    i INT;
    day_offset INT;
    
    max_students INT := 5; -- LIMITE SOLICITADO PELO USUÁRIO (EVITA ERRO DE PLANO FREE)

BEGIN

    --------------------------------------------------------------------------------
    -- TREINADOR 1: Carlos Silva
    --------------------------------------------------------------------------------
    
    -- 1. Buscar Usuario Auth existente
    SELECT id INTO t1_id FROM auth.users WHERE email = t1_email;
    
    IF t1_id IS NULL THEN
        -- Tenta usar default, se ocupado gera novo
        t1_id := default_t1_id;
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = t1_id) THEN
            t1_id := gen_random_uuid();
        END IF;

        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
        VALUES (t1_id, t1_email, '$2a$10$wK1k6W.u.x.j.z.l.u.x.j.z.l.u.x.j.z.l.u.x.j.z.l.u.', now(), 'authenticated', 'authenticated', now(), now());
    END IF;

    -- 2. Atualizar/Criar Perfil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = t1_id) THEN
        UPDATE public.profiles 
        SET full_name = 'Carlos Silva', role = 'trainer' 
        WHERE user_id = t1_id;
    ELSE
        INSERT INTO public.profiles (id, user_id, full_name, role, created_at, updated_at)
        VALUES (t1_id, t1_id, 'Carlos Silva', 'trainer', now(), now());
    END IF;

    -- 3. Inserir ou Atualizar Assinatura
    -- Se já existe, atualizamos para garantir consistência (ex: plano premium)
    IF EXISTS (SELECT 1 FROM public.trainer_subscriptions WHERE trainer_id = t1_id) THEN
        UPDATE public.trainer_subscriptions
        SET plan = 'premium', status = 'active', price = 99.90, expires_at = (now() + interval '30 days')
        WHERE trainer_id = t1_id;
    ELSE
        INSERT INTO public.trainer_subscriptions (id, trainer_id, plan, status, price, started_at, expires_at)
        VALUES (gen_random_uuid(), t1_id, 'premium', 'active', 99.90, now(), now() + interval '30 days');
    END IF;


    --------------------------------------------------------------------------------
    -- TREINADOR 2: Amanda Souza
    --------------------------------------------------------------------------------
    
    -- 1. Buscar Usuario Auth existente
    SELECT id INTO t2_id FROM auth.users WHERE email = t2_email;
    
    IF t2_id IS NULL THEN
        t2_id := default_t2_id;
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = t2_id) THEN
             t2_id := gen_random_uuid();
        END IF;

        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
        VALUES (t2_id, t2_email, '$2a$10$wK1k6W.u.x.j.z.l.u.x.j.z.l.u.x.j.z.l.u.x.j.z.l.u.', now(), 'authenticated', 'authenticated', now(), now());
    END IF;

    -- 2. Atualizar/Criar Perfil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = t2_id) THEN
        UPDATE public.profiles 
        SET full_name = 'Amanda Souza', role = 'trainer' 
        WHERE user_id = t2_id;
    ELSE
        INSERT INTO public.profiles (id, user_id, full_name, role, created_at, updated_at)
        VALUES (t2_id, t2_id, 'Amanda Souza', 'trainer', now(), now());
    END IF;

    -- 3. Inserir ou Atualizar Assinatura
    IF EXISTS (SELECT 1 FROM public.trainer_subscriptions WHERE trainer_id = t2_id) THEN
        UPDATE public.trainer_subscriptions
        SET plan = 'free', status = 'active', price = 0.00, expires_at = null
        WHERE trainer_id = t2_id;
    ELSE
        INSERT INTO public.trainer_subscriptions (id, trainer_id, plan, status, price, started_at, expires_at)
        VALUES (gen_random_uuid(), t2_id, 'free', 'active', 0.00, now(), null);
    END IF;


    --------------------------------------------------------------------------------
    -- DADOS DO CARLOS (ALUNOS E SESSÕES)
    --------------------------------------------------------------------------------
    -- REDUZIDO PARA 5 ALUNOS PARA EVITAR ERRO DE LIMITE
    FOR i IN 1..max_students LOOP
        -- Verifica se aluno já existe
        IF NOT EXISTS (SELECT 1 FROM public.students WHERE email = 'aluno.carlos' || i || '@fake.com') THEN
            s_id := gen_random_uuid();
            
            INSERT INTO public.students (
                id, trainer_id, name, email, plan_type, status, goal, sessions_per_week, created_at, updated_at
            ) VALUES (
                s_id, t1_id, 
                'Aluno Carlos ' || i, 
                'aluno.carlos' || i || '@fake.com', 
                CASE WHEN i % 2 = 0 THEN 'monthly' ELSE 'package' END,
                'active',
                'Hipertrofia',
                3,
                now(), now()
            );

            -- Agendamentos (Agenda Cheia)
            FOR day_offset IN 0..30 LOOP
                -- Agenda dia sim / dia não
                IF (day_offset + i) % 2 = 0 THEN
                    INSERT INTO public.sessions (
                        id, trainer_id, student_id, scheduled_date, scheduled_time, status, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), t1_id, s_id, 
                        (CURRENT_DATE + day_offset * interval '1 day'), 
                        '08:00',
                        'scheduled',
                        now(), now()
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;


    --------------------------------------------------------------------------------
    -- DADOS DA AMANDA (ALUNOS E SESSÕES)
    --------------------------------------------------------------------------------
    -- REDUZIDO PARA 5 ALUNOS PARA EVITAR ERRO DE LIMITE
    FOR i IN 1..max_students LOOP
         IF NOT EXISTS (SELECT 1 FROM public.students WHERE email = 'aluno.amanda' || i || '@fake.com') THEN
            s_id := gen_random_uuid();
            
            INSERT INTO public.students (
                id, trainer_id, name, email, plan_type, status, goal, sessions_per_week, created_at, updated_at
            ) VALUES (
                s_id, t2_id, 
                'Aluno Amanda ' || i, 
                'aluno.amanda' || i || '@fake.com', 
                'monthly', 
                'active',
                'Emagrecimento',
                4,
                now(), now()
            );

            -- Agendamentos
             FOR day_offset IN 0..30 LOOP
                IF (day_offset + i) % 2 = 0 THEN
                    INSERT INTO public.sessions (
                        id, trainer_id, student_id, scheduled_date, scheduled_time, status, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), t2_id, s_id, 
                        (CURRENT_DATE + day_offset * interval '1 day'), 
                        '18:00', 
                        'completed', 
                        now(), now()
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;

END $$;
