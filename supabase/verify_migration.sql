-- =============================================
-- SCRIPT DE VERIFICAÇÃO - FITPRO AGENDA
-- Execute para verificar se a migração foi bem-sucedida
-- =============================================

-- 1. Verificar extensões
SELECT 
    'Extensions' as section,
    extname as name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net')
ORDER BY extname;

-- 2. Verificar tabelas principais
SELECT 
    'Tables' as section,
    table_schema || '.' || table_name as name,
    'N/A' as inserts,
    'N/A' as updates,
    'N/A' as deletes
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Verificar RLS policies
SELECT 
    'RLS Policies' as section,
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    permissive as type,
    roles as applicable_roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar funções criadas
SELECT 
    'Functions' as section,
    proname as name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- 5. Verificar triggers
SELECT 
    'Triggers' as section,
    event_object_table as table_name,
    trigger_name,
    action_timing as timing,
    event_manipulation as event,
    action_condition as condition,
    action_statement as definition
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Verificar storage buckets
SELECT 
    'Storage Buckets' as section,
    id,
    name,
    public as is_public,
    created_at
FROM storage.buckets
ORDER BY name;

-- 7. Storage policies (verificação via buckets apenas)
SELECT 
    'Storage Policies' as section,
    'Check storage buckets section above' as note;

-- 8. Testar função has_role
SELECT 
    'Function Test' as section,
    'has_role function exists' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'has_role' 
            AND pronamespace = 'public'::regnamespace
        ) THEN '✅ OK'
        ELSE '❌ Missing'
    END as status;

-- 9. Verificar tipos customizados
SELECT 
    'Custom Types' as section,
    typname as type_name,
    typtype as type_category
FROM pg_type 
WHERE typnamespace = 'public'::regnamespace
AND typtype = 'e'
ORDER BY typname;

-- 10. Verificar índices importantes
SELECT 
    'Indexes' as section,
    schemaname || '.' || tablename as table_name,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 11. Contar registros em cada tabela (se existirem)
DO $$
DECLARE
    table_rec RECORD;
    count_result BIGINT;
BEGIN
    RAISE NOTICE '=== RECORD COUNTS ===';
    
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('profiles', 'user_roles', 'students', 'sessions', 
                         'progress_photos', 'bioimpedance', 'payments', 
                         'assessments', 'trainer_subscriptions', 'push_subscriptions')
        ORDER BY table_name
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_rec.table_name) INTO count_result;
            RAISE NOTICE '%: % records', table_rec.table_name, count_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '%: ERROR - %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '=== END RECORD COUNTS ===';
END $$;

-- 12. Verificar permissões do schema public
SELECT 
    'Schema Permissions' as section,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- =============================================
-- RESUMO FINAL
-- =============================================

DO $$
DECLARE
    tables_count INTEGER;
    policies_count INTEGER;
    functions_count INTEGER;
    triggers_count INTEGER;
    buckets_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO functions_count 
    FROM pg_proc WHERE pronamespace = 'public'::regnamespace 
    AND proname NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO triggers_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    SELECT COUNT(*) INTO buckets_count 
    FROM storage.buckets;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION VERIFICATION SUMMARY ===';
    RAISE NOTICE 'Tables: % (expected: ~10)', tables_count;
    RAISE NOTICE 'RLS Policies: % (expected: ~20)', policies_count;
    RAISE NOTICE 'Functions: % (expected: ~15)', functions_count;
    RAISE NOTICE 'Triggers: % (expected: ~8)', triggers_count;
    RAISE NOTICE 'Storage Buckets: % (expected: 2)', buckets_count;
    RAISE NOTICE '';
    
    IF tables_count >= 8 AND policies_count >= 15 AND functions_count >= 10 THEN
        RAISE NOTICE '✅ MIGRATION APPEARS SUCCESSFUL!';
    ELSE
        RAISE NOTICE '❌ MIGRATION MAY HAVE ISSUES - Check details above';
    END IF;
    
    RAISE NOTICE '=== END SUMMARY ===';
END $$;
