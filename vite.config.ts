import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    cssMinify: mode === 'production',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks ultra-otimizados
          if (id.includes('node_modules')) {
            // React core - chunk separado e prioritário
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            
            // UI library - chunk específico
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            
            // Database - chunk específico
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // Query library - chunk específico
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            
            // Icons - chunk separado para cache
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            
            // Charts - chunk separado para lazy load
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            
            // Utilities
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            
            return 'vendor';
          }
          
          // Page chunks - otimizados por funcionalidade
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0].toLowerCase();
            
            // Agrupar páginas relacionadas
            if (['dashboard', 'dashboardoptimized', 'painel'].includes(pageName)) {
              return 'dashboard-page';
            }
            if (['atendimento', 'kanban', 'chat-interno'].includes(pageName)) {
              return 'communication-pages';
            }
            if (['usuarios', 'setores', 'gerenciar-equipe'].includes(pageName)) {
              return 'management-pages';
            }
            if (['chatbot', 'automations', 'flow-builder'].includes(pageName)) {
              return 'automation-pages';
            }
            if (pageName.startsWith('configuracoes')) {
              return 'settings-pages';
            }
            
            return `page-${pageName}`;
          }
          
          // Component chunks por área
          if (id.includes('/components/')) {
            if (id.includes('/components/admin/')) {
              return 'admin-components';
            }
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
            if (id.includes('/components/dashboard/')) {
              return 'dashboard-components';
            }
            if (id.includes('/components/flow/')) {
              return 'flow-components';
            }
            if (id.includes('/components/atendimento/')) {
              return 'atendimento-components';
            }
            return 'components';
          }
          
          // Hooks por funcionalidade
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          
          // Services
          if (id.includes('/services/')) {
            return 'services';
          }
          
          // Utils
          if (id.includes('/utils/')) {
            return 'utils';
          }
        }
      }
    },
    chunkSizeWarningLimit: 250, // Alertar para chunks > 250kb
    assetsInlineLimit: 1024, // Inline apenas assets muito pequenos
    cssCodeSplit: true, // Split CSS por chunk
    reportCompressedSize: false, // Desabilitar para build mais rápido
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    exclude: ['@xyflow/react'] // Lazy load para reduzir bundle inicial
  }
}));
