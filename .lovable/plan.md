

# Correcao Definitiva do Painel Administrativo

## Resumo Executivo

O painel admin esta completamente inoperante porque o aplicativo se conecta ao banco de dados ERRADO. Alem disso, existem 12 problemas secundarios que precisam ser corrigidos de uma vez para garantir funcionamento completo.

---

## PROBLEMA RAIZ -- Conexao com banco errado

O arquivo `vite.config.ts` (linhas 7-11 e 26-31) contem credenciais hardcoded do projeto externo `hfyijlmdejjcdotwccrp`, sobrescrevendo as variaveis de ambiente que apontam para o banco correto (`drjdifrwmbrirmifmxjv`). 

**Consequencia direta**: Toda chamada ao banco (RPC, queries, auth) vai para o banco errado. Nesse banco externo existem duas versoes da funcao `has_role` (uma com `app_role`, outra com `text`), causando o erro PGRST203 "Could not choose the best candidate function" que aparece em TODOS os requests.

**O banco correto (Lovable Cloud) ja tem**:
- `has_role(uuid, app_role)` -- versao unica, sem conflito
- `admin_trainer_overview()` -- retornando `expires_at` corretamente
- `delete_trainer_complete(uuid)` -- funcional
- RLS policies para admin em todas as tabelas

---

## Lista Completa de Problemas e Correcoes

### 1. vite.config.ts -- Credenciais hardcoded (CRITICO)

**Arquivo**: `vite.config.ts`
**Problema**: Linhas 7-11 definem constantes externas e linhas 26-31 usam `define` para sobrescrever variaveis de ambiente.
**Correcao**: Remover as constantes `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_ANON_KEY` e todo o bloco `define`. Manter o bloco `build.rollupOptions` que ja esta la para performance.

### 2. TrainerOverview sem expires_at (ERRO DE TIPAGEM)

**Arquivo**: `src/hooks/useAdminData.ts` linha 5-14
**Problema**: A interface `TrainerOverview` nao inclui `expires_at`, mas a RPC retorna esse campo. Isso impede o frontend de exibir datas de expiracao.
**Correcao**: Adicionar `expires_at?: string` a interface.

### 3. Fallback da trainersQuery com join impossivel

**Arquivo**: `src/hooks/useAdminData.ts` linhas 27-36
**Problema**: O fallback tenta `.select('... trainer_subscriptions(plan, status)')` na tabela `profiles`. Esse join so funciona se houver FK entre profiles e trainer_subscriptions, o que nao existe.
**Correcao**: Reescrever o fallback para buscar profiles e trainer_subscriptions separadamente e cruzar no JavaScript.

### 4. recentStudentsQuery com join impossivel

**Arquivo**: `src/hooks/useAdminData.ts` linhas 132-143
**Problema**: Query faz `.select('*, profiles(full_name)')` na tabela `students`. Nao existe FK entre students e profiles.
**Correcao**: Remover o join com profiles. O nome do treinador sera obtido cruzando com `trainersQuery.data` no componente.

### 5. AdminDashboard referencia profiles inexistente

**Arquivo**: `src/pages/admin/AdminDashboard.tsx` linha 114
**Problema**: Exibe `s.profiles?.full_name?.split(' ')[0]` para alunos recentes, mas como a query nao tem mais o join (problema 4), isso retorna `undefined`.
**Correcao**: Cruzar `s.trainer_id` com os dados de `trainersQuery` para obter o nome do treinador. Passar os trainers para o componente.

### 6. SummaryCards com growth "+12%" inventado

**Arquivo**: `src/components/admin/SummaryCards.tsx` linha 43
**Problema**: O card "Novos Usuarios" mostra `growth: '+12%'` hardcoded, sem calculo real.
**Correcao**: Remover a propriedade `growth` ou calcular baseado em dados reais (comparar semana atual vs anterior).

### 7. BillingCharts com dados de MRR simulados

**Arquivo**: `src/components/admin/BillingCharts.tsx` linhas 18-23
**Problema**: O grafico "Evolucao MRR (6 meses)" usa dados simulados com formula `Math.max(0, premium - (5 - i)) * 9.9`. Isso nao reflete a realidade.
**Correcao**: Remover o grafico de evolucao MRR ou renomea-lo para "Estimativa" com aviso visual. Sem historico de transacoes no banco, nao ha como calcular MRR real.

### 8. AdminUsers sem botoes de +Dias e Downgrade na tabela

**Arquivo**: `src/pages/admin/AdminUsers.tsx`
**Problema**: O componente nao importa `useAdminMutations` e nao passa handlers de `addPremiumDays` ou `downgradePlan` para o `TrainersTable`. Essas acoes so existem dentro do modal (`TrainerDetailsModal`), nao na tabela principal.
**Correcao**: Importar `useAdminMutations`, criar handlers `handleAddDays` e `handleDowngrade`, e passa-los como props para `TrainersTable`.

### 9. useAdminMutations sem downgradePlan

**Arquivo**: `src/hooks/useAdminData.ts` linhas 183-221
**Problema**: O hook `useAdminMutations` so exporta `addPremiumDays`. Nao existe funcao para remover premium.
**Correcao**: Adicionar mutation `downgradePlan` que faz update na `trainer_subscriptions` setando `plan='free'`, `expires_at=null`, `price=0`.

### 10. TrainersTable sem acoes de +Dias e Downgrade

**Arquivo**: `src/components/admin/TrainersTable.tsx`
**Problema**: A interface `TrainersTableProps` nao aceita `onAddDays` e `onDowngrade`. Os botoes nao existem na tabela desktop nem no dropdown mobile.
**Correcao**: Adicionar props `onAddDays`, `isAddingDays`, `onDowngrade`, `isDowngrading` na interface. Adicionar popover de +Dias (com opcoes 7/15/30/90 dias + input customizado) e botao "Free" na coluna de acoes.

### 11. admin_trainer_overview da migracao sem expires_at

**Arquivo**: `supabase/migrations/20260221000000_master_admin_fix.sql` linhas 82-121
**Problema**: A migracao redefine `admin_trainer_overview()` SEM incluir `expires_at` no retorno, mas o banco atual JA retorna esse campo (de uma migracao anterior). Se essa migracao rodar novamente, vai REMOVER o campo.
**Correcao**: Criar nova migracao que redefine a funcao incluindo `expires_at` no RETURNS TABLE e no SELECT.

### 12. AuthContext com fallback inseguro

**Arquivo**: `src/contexts/AuthContext.tsx` linha 49
**Problema**: `setIsAdmin(!!adminCheck || profileData?.role === 'admin')` -- o fallback `profileData?.role === 'admin'` pode ser explorado se alguem alterar a tabela profiles diretamente.
**Correcao**: Remover o fallback e confiar apenas no `has_role` via `user_roles`. Linha 49 vira `setIsAdmin(!!adminCheck)`.

---

## Plano de Implementacao (Ordem de Execucao)

### Passo 1: Migracao SQL

Nova migracao para garantir que `admin_trainer_overview` retorne `expires_at`:

```sql
CREATE OR REPLACE FUNCTION public.admin_trainer_overview()
RETURNS TABLE(
  user_id uuid, full_name text, email text, role text,
  plan text, sub_status text, active_students bigint,
  created_at timestamptz, expires_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT p.user_id, p.full_name, u.email,
    COALESCE(ur.role::text, p.role, 'trainer'),
    COALESCE(ts.plan, 'free'), COALESCE(ts.status, 'active'),
    COUNT(s.id) FILTER (WHERE s.status = 'active'),
    p.created_at, ts.expires_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  LEFT JOIN trainer_subscriptions ts ON ts.trainer_id = p.user_id
  LEFT JOIN students s ON s.trainer_id = p.user_id
  GROUP BY p.user_id, p.full_name, u.email, ur.role, p.role,
           ts.plan, ts.status, p.created_at, ts.expires_at
  ORDER BY p.created_at DESC;
END; $$;
```

### Passo 2: vite.config.ts

Remover linhas 7-11 (constantes) e 26-31 (bloco `define`). Resultado final:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080, hmr: { overlay: false } },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          ui: ['framer-motion', '@radix-ui/react-dialog', 'lucide-react'],
          charts: ['recharts'],
          pdf: ['jspdf', 'html2canvas'],
        }
      }
    }
  }
}));
```

### Passo 3: useAdminData.ts

- Adicionar `expires_at?: string` na interface `TrainerOverview`
- Reescrever fallback da `trainersQuery` sem join impossivel
- Corrigir `recentStudentsQuery` removendo `.select('*, profiles(full_name)')` para `.select('*')`
- Adicionar mutation `downgradePlan` ao `useAdminMutations`

### Passo 4: AdminUsers.tsx

- Importar `useAdminMutations`
- Criar handlers `handleAddDays(trainerId, days)` e `handleDowngrade(trainerId)` com confirmacao
- Passar como props para `TrainersTable`

### Passo 5: TrainersTable.tsx

- Adicionar props `onAddDays`, `isAddingDays`, `onDowngrade`, `isDowngrading`
- Na tabela desktop: adicionar popover com botoes de +7/+15/+30/+90 dias e input customizado, mais botao "Free" para downgrade
- No mobile: adicionar itens "+Dias" e "Remover Premium" no dropdown de acoes
- Nao mostrar essas acoes para linhas com role === 'admin'

### Passo 6: AdminDashboard.tsx

- Corrigir a referencia `s.profiles?.full_name` na listagem de alunos recentes
- Cruzar `s.trainer_id` com `trainers[]` para obter o nome do treinador responsavel

### Passo 7: SummaryCards.tsx

- Remover `growth: '+12%'` do card "Novos Usuarios"
- Adicionar KPI "Inadimplentes" (PIX Pendente) como 4o card
- Adicionar KPI "Expirando em 7 dias" para visibilidade

### Passo 8: BillingCharts.tsx

- Renomear grafico "Evolucao MRR (6 meses)" para "Projecao MRR" com badge "Estimativa"
- Ou remover o grafico simulado e manter apenas "Gratuitos vs Assinantes"

### Passo 9: AuthContext.tsx

- Remover fallback `profileData?.role === 'admin'` da linha 49
- Confiar apenas no `!!adminCheck` do `has_role` RPC

---

## Arquivos Modificados

| Arquivo | Tipo de Mudanca |
|---|---|
| Nova migracao SQL | Redefinir `admin_trainer_overview` com `expires_at` |
| `vite.config.ts` | Remover credenciais hardcoded externas |
| `src/hooks/useAdminData.ts` | Fix interface, fallback, recentStudents, downgradePlan |
| `src/pages/admin/AdminUsers.tsx` | Wiring de addDays e downgrade |
| `src/components/admin/TrainersTable.tsx` | Botoes +Dias, Downgrade, popover customizado |
| `src/pages/admin/AdminDashboard.tsx` | Fix referencia profiles em alunos recentes |
| `src/components/admin/SummaryCards.tsx` | Remover growth falso, adicionar KPIs reais |
| `src/components/admin/BillingCharts.tsx` | Renomear/remover grafico MRR simulado |
| `src/contexts/AuthContext.tsx` | Remover fallback inseguro de admin check |

---

## Resultado Esperado

Apos todas as correcoes:
- O app conecta ao banco correto (Lovable Cloud)
- Login como Igor funciona sem erro PGRST203
- Dashboard mostra KPIs reais (sem dados inventados)
- Tabela de treinadores carrega com dados completos incluindo `expires_at`
- Botoes +Dias e Downgrade funcionam diretamente na tabela
- Busca de alunos funciona em /admin/students e /admin/support
- Modal do treinador exibe todos os detalhes corretos
- Seguranca: admin check usa apenas `user_roles`, sem fallback exploravel

