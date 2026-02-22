# Template Base React - Setup Independente

## 🎯 Visão Geral
Este é um template base React + TypeScript + Vite + Supabase que pode ser configurado como um projeto completamente independente.

## 📋 Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Supabase (para backend)
- Conta Vercel (opcional, para deploy)

## 🚀 Setup Rápido (5 minutos)

### 1. Clonar o Projeto
```bash
git clone <URL-DO-REPOSITORIO>
cd lovable-integration-bridge
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_SUPABASE_PROJECT_ID=seu-project-id

# URLs do App
VITE_PUBLIC_SITE_URL=http://localhost:5173

# APIs (Opcional - desabilite se não for usar)
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
VITE_RESEND_API_KEY=sua-chave-resend-aqui

# Pagamentos (Opcional)
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Rodar o Projeto
```bash
npm run dev
```

Abra `http://localhost:5173` no navegador.

## 🔧 Configurações Detalhadas

### Supabase Setup
1. Crie um novo projeto em https://supabase.com
2. Copie a URL e a chave anônima para o `.env`
3. Execute as migrations SQL da pasta `supabase/`:
   - `supabase/full_migration.sql`
   - `supabase/setup_storage_final.sql`

### Features Principais

#### ✅ Funciona Imediatamente
- Autenticação com Supabase
- Sistema de rotas React Router
- UI Components com shadcn/ui
- Tema Dark/Light
- Layout responsivo

#### 🎯 Opcionais (requerem configuração extra)
- **OCR com Gemini AI**: Configure `VITE_GEMINI_API_KEY`
- **Emails com Resend**: Configure `VITE_RESEND_API_KEY`  
- **Pagamentos Stripe**: Configure `STRIPE_SECRET_KEY`
- **Deploy automático**: Configure Vercel

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes UI
│   ├── ui/             # shadcn/ui components
│   └── *.tsx           # Componentes da aplicação
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente Supabase
├── lib/                # Utilitários
├── pages/              # Páginas da aplicação
└── test/               # Testes
```

## 🛠️ Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run build:dev    # Build de desenvolvimento
npm run preview      # Preview do build

# Qualidade
npm run lint         # ESLint
npm run test         # Testes unitários
npm run test:watch   # Testes com watch
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte o repositório no Vercel
2. Configure as environment variables no dashboard
3. Deploy automático em cada push para `main`

### Outras Opções
- **Netlify**: Funciona com build padrão
- **Render**: Funciona com build padrão  
- **Docker**: Incluído `Dockerfile` na raiz

## ⚠️ Importante

### Segurança
- **NUNCA** commitar o `.env`
- **NUNCA** expor chaves privadas no frontend
- Use apenas chaves `VITE_*` no frontend

### Performance
- O build otimiza automaticamente
- Lazy loading implementado
- Imagens otimizadas automaticamente

### Escalabilidade
- Arquitetura modular
- Separação clara de responsabilidades
- Fácil de estender com novas features

## 🐛 Problemas Comuns

### "Supabase URL not found"
- Verifique se `.env` está configurado
- Reinicie o servidor após mudar o `.env`

### "Build failed"
- Limpe o cache: `rm -rf node_modules && npm install`
- Verifique se todas as variáveis obrigatórias estão setadas

### "OCR não funciona"
- Configure `VITE_GEMINI_API_KEY`
- Verifique se a Edge Function está deployada no Supabase

## 📞 Suporte

- **Documentação**: Verifique os comentários no código
- **Issues**: Abra issue no GitHub
- **Comunidade**: Discord do projeto

## 🔄 Próximos Passos

1. **Customize o tema**: Edite `tailwind.config.ts`
2. **Adicione suas páginas**: Crie em `src/pages/`
3. **Configure suas APIs**: Adicione em `src/integrations/`
4. **Deploy**: Configure Vercel/Netlify

---

**Status**: ✅ Pronto para uso independente
