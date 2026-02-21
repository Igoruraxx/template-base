import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()].filter(Boolean),
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://drjdifrwmbrirmifmxjv.supabase.co"),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyamRpZnJ3bWJyaXJtaWZteGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjYwMzIsImV4cCI6MjA4NzAwMjAzMn0.HRcBnzYuvMe1kn-KZfpqWI9A0xAfW3srP6hFi0f4r1c"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
