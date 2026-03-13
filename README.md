# Template Base React

A React + TypeScript + Vite template with shadcn-ui, Tailwind CSS, and Supabase integration, ready to deploy on Railway.

## Technologies

- **React 18** + TypeScript
- **Vite** (build tool)
- **shadcn/ui** (component library)
- **Tailwind CSS** (styling)
- **Supabase** (authentication & database)
- **React Router v6** (routing)
- **TanStack Query** (server state management)

## Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd template-base
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

### 4. Start the development server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

## Deploy on Railway

### Automatic Deploy

1. Push your repository to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Select **"Deploy from GitHub repo"** and choose your repository
4. Railway auto-detects Vite and builds the project using Nixpacks
5. Add environment variables in **Settings → Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PUBLIC_SITE_URL` (your Railway app URL, e.g. `https://your-app.up.railway.app`)

### Manual Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

### Environment Variables on Railway

In your Railway project dashboard → **Settings → Variables**, add:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_PUBLIC_SITE_URL` | Your deployed app URL |
| `VITE_GEMINI_API_KEY` | (Optional) Gemini AI key for OCR features |

## Project Structure

```
src/
├── components/          # UI Components
│   └── ui/             # shadcn/ui components
├── contexts/           # React Contexts (Auth, etc.)
├── hooks/              # Custom React Hooks
├── integrations/       # External integrations
│   └── supabase/       # Supabase client & types
├── lib/                # Utility functions
├── pages/              # Application pages
└── test/               # Tests
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the **Project URL** and **anon public key** from **Settings → API**
3. Set these as environment variables (see above)

## License

MIT
