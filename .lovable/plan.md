

## Painel Administrativo SaaS - Plano de Implementacao

Este e um projeto grande que sera dividido em fases para garantir qualidade. Abaixo esta o plano completo.

---

### Fase 1: Banco de Dados

**Nova tabela `trainer_subscriptions`:**
- `id` (uuid, PK)
- `trainer_id` (uuid, referencia profiles.user_id)
- `plan` (text: 'free' ou 'premium')
- `status` (text: 'active', 'cancelled', 'blocked')
- `price` (numeric, default 9.90)
- `started_at` (timestamptz)
- `expires_at` (timestamptz)
- `created_at`, `updated_at`

**Politicas RLS:**
- Admins podem ler/atualizar todas as subscriptions
- Trainers podem ler apenas a propria subscription
- Auto-criacao de subscription 'free' via trigger ao criar profile

**View administrativa** (funcao SQL `admin_trainer_overview`):
- Retorna nome, email, plano, status, contagem de alunos ativos por trainer
- Acessivel apenas por admins via `SECURITY DEFINER`

---

### Fase 2: Layout e Rotas do Admin

**Novo layout `AdminLayout`:**
- Menu lateral fixo com icones (Sidebar usando componente existente)
- Itens: Dashboard, Usuarios, Cobrancas, Suporte
- Dark mode seguindo o tema existente com detalhes em verde/turquesa

**Novas paginas:**
- `/admin` - Dashboard com cards de resumo
- `/admin/users` - Tabela de gestao de trainers
- `/admin/billing` - Graficos e vencimentos
- `/admin/support` - Visualizador de fotos/bioimpedancia

**Protecao de rotas:**
- Novo componente `AdminRoute` que verifica `has_role(user_id, 'admin')` via query
- Redireciona para `/` se nao for admin

**Roteamento no App.tsx:**
- Adicionar rotas `/admin/*` protegidas pelo `AdminRoute`

---

### Fase 3: Dashboard Admin (`/admin`)

**Cards de resumo no topo:**
1. Total de Personals Ativos
2. Faturamento Mensal (MRR) - soma dos planos premium ativos
3. Novos cadastros da semana

**Mini-grafico** de crescimento de usuarios (ultimos 6 meses)

---

### Fase 4: Gestao de Usuarios (`/admin/users`)

**Tabela com colunas:**
- Nome do Personal
- E-mail
- Status do Plano (tags coloridas: "Gratuito" em cinza, "Assinante" em dourado)
- Alunos Ativos (com indicador visual quando proximo do limite de 5)
- Acoes: Bloquear/Desbloquear, Ver detalhes

**Funcionalidades:**
- Busca por nome/email
- Filtro por plano (gratuito/premium)
- Botao "Bloquear Acesso" para inadimplentes

---

### Fase 5: Modulo de Cobranca (`/admin/billing`)

**Graficos (usando Recharts, ja instalado):**
- Barras comparando usuarios gratuitos vs pagantes
- Evolucao de MRR nos ultimos 6 meses

**Lista de proximos vencimentos:**
- Trainers com plano premium proximo do vencimento

---

### Fase 6: Trava de Limite de Alunos (Regra de Negocio)

**No lado do trainer:**
- Ao tentar cadastrar o 6o aluno no plano gratuito, exibir modal de upgrade
- Mostrar no dashboard do trainer: "X/5 slots de alunos usados"
- Badge de "Slots disponiveis" no header

**Implementacao:**
- Verificacao client-side antes de inserir aluno
- Verificacao server-side via trigger ou politica RLS (seguranca)

---

### Secao Tecnica

**Estrutura de arquivos novos:**

```text
src/
  components/
    AdminLayout.tsx          -- Layout com sidebar
    AdminRoute.tsx           -- Protecao de rota admin
    admin/
      SummaryCards.tsx        -- Cards de resumo
      TrainersTable.tsx       -- Tabela de gestao
      BillingCharts.tsx       -- Graficos de cobranca
      StudentLimitModal.tsx   -- Modal de upgrade
  pages/
    admin/
      AdminDashboard.tsx      -- /admin
      AdminUsers.tsx          -- /admin/users
      AdminBilling.tsx        -- /admin/billing
      AdminSupport.tsx        -- /admin/support
  hooks/
    useAdminData.ts           -- Queries admin
    useTrainerSubscription.ts -- Subscription do trainer logado
```

**Migracao SQL:**

```text
-- Tabela de subscriptions
CREATE TABLE trainer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  price numeric DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE trainer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politica: admins veem tudo
CREATE POLICY "Admins can manage subscriptions"
  ON trainer_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Politica: trainer ve a propria
CREATE POLICY "Trainers view own subscription"
  ON trainer_subscriptions FOR SELECT
  USING (auth.uid() = trainer_id);

-- Trigger: criar subscription free ao criar profile
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO trainer_subscriptions (trainer_id, plan, price)
  VALUES (NEW.user_id, 'free', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();

-- Funcao admin: overview de trainers
CREATE OR REPLACE FUNCTION admin_trainer_overview()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  plan text,
  sub_status text,
  active_students bigint,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    u.email,
    COALESCE(ts.plan, 'free'),
    COALESCE(ts.status, 'active'),
    COUNT(s.id) FILTER (WHERE s.status = 'active'),
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN trainer_subscriptions ts ON ts.trainer_id = p.user_id
  LEFT JOIN students s ON s.trainer_id = p.user_id
  WHERE p.role = 'trainer'
  GROUP BY p.user_id, p.full_name, u.email, ts.plan, ts.status, p.created_at;
$$;
```

**Componente AdminRoute:**

```text
-- Consulta user_roles para verificar role = 'admin'
-- Usa has_role RPC
-- Redireciona para '/' se nao for admin
-- Mostra loading enquanto verifica
```

**Trava de alunos (client + server):**

```text
-- Client: antes de criar aluno, consultar subscription e contar alunos
-- Se plan='free' e active_students >= 5, mostrar modal de upgrade
-- Server: trigger BEFORE INSERT em students que valida o limite
```

---

### Ordem de Implementacao

1. Migracao SQL (tabela + trigger + funcao)
2. AdminRoute + AdminLayout com sidebar
3. Rotas no App.tsx
4. AdminDashboard com cards de resumo
5. AdminUsers com tabela de gestao
6. AdminBilling com graficos
7. Modal de limite de alunos no fluxo do trainer
8. Testes end-to-end

