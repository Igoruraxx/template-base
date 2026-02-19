

# Preparar o projeto para deploy na Vercel com Supabase externo

## Resumo

O projeto atualmente roda no Lovable Cloud. Para migrar para a Vercel com seu proprio projeto Supabase, precisamos fazer ajustes na configuracao do build, variaveis de ambiente e remover dependencias exclusivas do Lovable.

## O que sera feito

### 1. Atualizar `vite.config.ts`
- Remover o plugin `lovable-tagger` (exclusivo do Lovable, nao funciona na Vercel)
- Remover a dependencia do import

### 2. Atualizar `src/integrations/supabase/client.ts`
- Usar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variaveis de ambiente (padrao Supabase)
- Adicionar fallback com valores vazios para evitar crash se as variaveis nao estiverem configuradas

### 3. Criar arquivo `vercel.json`
- Configurar rewrites para SPA (Single Page Application) -- todas as rotas redirecionam para `index.html`
- Configurar headers de cache para assets estaticos

### 4. Criar `.env.example`
- Documentar todas as variaveis de ambiente necessarias para que voce saiba o que configurar na Vercel

### 5. Atualizar `package.json`
- Remover `lovable-tagger` das devDependencies (vai causar erro no build da Vercel)

---

## Apos o deploy: o que voce precisa fazer na Vercel

1. **Conectar o repositorio GitHub** na Vercel
2. **Configurar as variaveis de ambiente** no painel da Vercel:
   - `VITE_SUPABASE_URL` = URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon key do seu projeto Supabase
3. **Deploy das Edge Functions**: as funcoes em `supabase/functions/` precisam ser deployadas no seu projeto Supabase via `supabase functions deploy`
4. **Configurar secrets no Supabase**: `STRIPE_SECRET_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `LOVABLE_API_KEY`
5. **Rodar as migrations**: executar os SQLs em `supabase/migrations/` no seu projeto Supabase

---

## Detalhes tecnicos

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### `.env.example`
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### `src/integrations/supabase/client.ts`
Atualizar para usar `VITE_SUPABASE_ANON_KEY` (nome padrao) com fallback seguro.

### `package.json`
Remover `lovable-tagger` das devDependencies.

