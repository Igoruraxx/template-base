import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// External Supabase project credentials
const EXTERNAL_SUPABASE_URL = "https://hfyijlmdejjcdotwccrp.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeWlqbG1kZWpqY2RvdHdjY3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTc3OTYsImV4cCI6MjA4NzA5Mzc5Nn0.43h404RWr939umgPy3RYmhoO5hIicNXjExATLan3-cY";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(EXTERNAL_SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(EXTERNAL_SUPABASE_ANON_KEY),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(EXTERNAL_SUPABASE_ANON_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify("hfyijlmdejjcdotwccrp"),
  },
}));
