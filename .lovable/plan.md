
# Migração para Supabase Externo

Este plano cobre todas as mudanças necessárias para migrar o projeto do Lovable Cloud para um projeto Supabase externo, com controle total sobre o banco de dados, mantendo o app funcionando aqui no Lovable Editor.

---

## O que precisa ser feito

### 1. Corrigir os dois erros de build (imediato)

**Erro 1 — Edge Functions com importação incorreta**

4 funções usam `npm:@supabase/supabase-js@2.57.2` em vez de `https://esm.sh/@supabase/supabase-js@2`, que é o formato correto para Deno/Edge Functions:

- `check-subscription/index.ts`
- `create-checkout/index.ts`
- `student-signed-urls/index.ts`
- `extract-bioimpedance/index.ts`

A correção é simples: trocar o import em todas elas para:
```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

**Erro 2 — Badge com variant inválido**

Em `src/components/admin/StudentSearch.tsx` linha 59, o componente Badge recebe `variant="warning"`, que não existe no shadcn/ui. A correção é remover o variant e usar apenas a className personalizada:
```tsx
case 'payment_pending': return <Badge className="text-yellow-800 bg-yellow-100 border-yellow-300">Pagamento Pendente</Badge>;
```

---

### 2. Migração para Supabase Externo

**Passo a passo para você (fora do Lovable):**

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor do novo projeto, rode o arquivo `supabase/full_migration.sql` (já existe no projeto)
3. Crie os secrets no novo Supabase (Settings → Edge Functions → Secrets):
   - `STRIPE_SECRET_KEY`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `LOVABLE_API_KEY`

**O que vou alterar no código:**

A. **`src/integrations/supabase/client.ts`** — Este arquivo é gerenciado automaticamente pelo Lovable Cloud e **não pode** ser editado. Porém, ao conectar o GitHub e rodar localmente, basta definir as variáveis de ambiente:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

B. **`.env.example`** — Atualizar para documentar corretamente as variáveis necessárias.

C. **`supabase/config.toml`** — Atualizar o `project_id` para o ID do novo projeto Supabase.

D. **Edge Functions** — Fazer deploy delas no novo projeto via CLI:
```bash
supabase link --project-ref SEU-PROJECT-ID
supabase functions deploy check-subscription
supabase functions deploy create-checkout
supabase functions deploy extract-bioimpedance
supabase functions deploy student-signed-urls
supabase functions deploy register-push
supabase functions deploy push-notify
supabase functions deploy generate-vapid-keys
```

---

## Resumo das mudanças de código

| Arquivo | Mudança |
|---|---|
| `supabase/functions/check-subscription/index.ts` | Corrigir import do supabase-js |
| `supabase/functions/create-checkout/index.ts` | Corrigir import do supabase-js |
| `supabase/functions/student-signed-urls/index.ts` | Corrigir import do supabase-js |
| `supabase/functions/extract-bioimpedance/index.ts` | Corrigir import do supabase-js |
| `src/components/admin/StudentSearch.tsx` | Remover `variant="warning"` inválido |
| `.env.example` | Documentar as variáveis de ambiente corretas |

---

## Importante

- Enquanto o projeto continuar aberto aqui no Lovable Editor, ele continuará usando o banco do Lovable Cloud automaticamente (o `client.ts` é gerenciado por ele).
- Para usar o Supabase externo com o Lovable Editor, seria necessário **desabilitar o Lovable Cloud** — o que é uma mudança irreversível. Recomendo fortemente usar o Supabase externo apenas **em produção (Vercel)**, mantendo o Lovable Cloud para desenvolvimento aqui.
- Os erros de build serão corrigidos imediatamente e o projeto voltará a funcionar normalmente aqui.
