
## Varredura Completa — Correção de Todos os Erros

### Diagnóstico dos Erros de Build

Os 3 erros de build são do mesmo tipo: no TypeScript/Deno, o parâmetro `error` em um bloco `catch` tem tipo `unknown` por padrão. Acessar `error.message` diretamente causa erro de compilação porque `unknown` não garante que o objeto tem a propriedade `.message`.

A correção padrão é usar um type guard:
```typescript
// ANTES (erro TS18046)
return new Response(JSON.stringify({ error: error.message }), { ... });

// DEPOIS (correto)
const msg = error instanceof Error ? error.message : String(error);
return new Response(JSON.stringify({ error: msg }), { ... });
```

### Arquivos a Corrigir

**1. `supabase/functions/generate-vapid-keys/index.ts` — linha 36**

Bloco `catch (error)` sem type guard. Correção: adicionar `const msg = error instanceof Error ? error.message : String(error)` e usar `msg`.

**2. `supabase/functions/push-notify/index.ts` — linha 231**

Mesmo problema no bloco `catch` principal. Correção idêntica à anterior.

**3. `supabase/functions/register-push/index.ts` — linha 51**

Mesmo problema. Correção idêntica.

### Resultado Após as Correções

- Build das Edge Functions volta a funcionar sem erros TypeScript
- Comportamento em runtime permanece idêntico (o type guard não muda a lógica)
- Todas as outras Edge Functions já estão corretas (`check-subscription`, `create-checkout`, `extract-bioimpedance`, `student-signed-urls` já usam o padrão `instanceof Error ? error.message : String(error)`)
- O arquivo `StudentSearch.tsx` já está correto (a versão atual não tem `variant="warning"` — está usando `className` diretamente na linha 59)
- O `vite.config.ts` com as credenciais do Supabase externo está correto e funcional
- Toda a estrutura de rotas, RLS e hooks está consistente

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-vapid-keys/index.ts` | Type guard no catch (linha 36) |
| `supabase/functions/push-notify/index.ts` | Type guard no catch (linha 231) |
| `supabase/functions/register-push/index.ts` | Type guard no catch (linha 51) |
