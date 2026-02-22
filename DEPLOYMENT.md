# Deployment Guide - Template Base React

## 🚀 Opções de Deploy

### 1. Vercel (Recomendado)

#### Setup Automático
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy do projeto
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name? template-base-react
# - Directory? . (current)
# - Want to override settings? No
```

#### Configuração Manual
1. Acesse https://vercel.com/dashboard
2. Clique "Add New Project"
3. Importe seu repositório GitHub
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Environment Variables no Vercel
No dashboard do projeto → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_SUPABASE_PROJECT_ID=seu-project-id
VITE_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

### 2. Netlify

#### Setup
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build e deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Configuração
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**: Mesmas do Vercel

### 3. Render

#### Setup
1. Conecte seu repositório GitHub/GitLab
2. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: Node 18+

### 4. Docker

#### Build
```bash
docker build -t template-base-react .
docker run -p 80:80 template-base-react
```

#### Dockerfile (já incluído)
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Configurações Específicas

### Custom Domains

#### Vercel
1. Project Settings → Domains
2. Adicione seu domínio
3. Configure DNS apontando para Vercel

#### Netlify
1. Site settings → Domain management
2. Adicione custom domain
3. Configure DNS

### HTTPS
Todos os provedores oferecem HTTPS automático.

## 📋 Checklist Pre-Deploy

### ✅ Build Test
```bash
npm run build
# Verifique se não há erros
```

### ✅ Environment Variables
- [ ] Supabase URL e Key configuradas
- [ ] Site URL atualizada
- [ ] APIs opcionais configuradas (se necessário)

### ✅ Performance
- [ ] Imagens otimizadas
- [ ] Lazy loading funcionando
- [ ] Build size < 1MB (ideal)

### ✅ SEO
- [ ] Meta tags configuradas
- [ ] Open Graph tags
- [ ] Sitemap (se necessário)

## 🚨 Troubleshooting

### Build Fails
```bash
# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Environment Variables não funcionam
- Verifique prefixo `VITE_` para variáveis do frontend
- Reinicie o servidor após mudar `.env`
- No deploy, configure no dashboard do provedor

### Supabase Connection Error
- Verifique CORS settings no Supabase
- Confirme se URL está correta
- Teste com Supabase Studio

### Imagens não carregam
- Verifique configuração de storage no Supabase
- Confirme permissões RLS policies
- Teste com URLs diretas

## 📊 Monitoramento

### Vercel Analytics
Ativado por padrão em projetos Vercel.

### Custom Analytics
```javascript
// Exemplo com Google Analytics
import { useEffect } from 'react';

useEffect(() => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID');
  }
}, []);
```

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 Best Practices

### Performance
- Use lazy loading para rotas
- Otimize imagens com WebP
- Configure cache headers
- Monitore Core Web Vitals

### Security
- Não exponha secrets no frontend
- Use HTTPS sempre
- Configure CSP headers
- Monitore vulnerabilidades

### Scalability
- Configure CDN
- Use edge functions quando possível
- Monitore performance
- Planeje scaling horizontal

---

**Status**: ✅ Ready for production deployment
