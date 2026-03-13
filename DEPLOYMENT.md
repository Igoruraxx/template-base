# Deployment Guide - Railway

## 🚀 Deploy on Railway

Railway is the recommended platform for deploying this template.

### Prerequisites

- GitHub repository with your project
- [Railway account](https://railway.app)
- Supabase project (for auth and database)

### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app) and click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway and choose your repository
4. Railway will automatically detect the Vite framework and start building

### Step 2: Configure Environment Variables

In your Railway project → **Settings → Variables**, add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_SITE_URL=https://your-app.up.railway.app
```

> ⚠️ Never commit real credentials to `.env`. Use Railway's variable management.

### Step 3: Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain
3. Update `VITE_PUBLIC_SITE_URL` to your custom domain
4. Update your Supabase project's allowed redirect URLs

### Build Configuration

The `railway.json` at the project root handles the build and start commands:

- **Build**: `npm run build` (via Nixpacks)
- **Start**: `npx serve -s dist -p $PORT`

### Supabase Auth Redirect URLs

In your Supabase project → **Authentication → URL Configuration**, add:

```
https://your-app.up.railway.app
https://your-app.up.railway.app/auth/confirm
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Start dev server
npm run dev
```

## 📦 Manual Build

```bash
npm run build
npx serve -s dist
```

## 🔧 Railway CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```
