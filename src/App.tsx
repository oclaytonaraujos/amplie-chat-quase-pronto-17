import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense, useEffect, startTransition } from "react";
import { SyncLoader } from '@/components/ui/sync-loader';

// Core providers otimizados - reduzido de 14 para 6
import { ThemeProvider } from "@/hooks/useTheme";
import { queryClient } from "@/config/queryClient";
import { setupGlobalErrorHandling } from "@/utils/production-logger";
import { OptimizedAuthProvider } from '@/contexts/OptimizedAuthProvider';
import { ConnectionNotificationProvider } from '@/contexts/ConnectionNotificationContext';
import { AdminAuthProvider } from "@/hooks/useAdminAuth";

// Layout sempre carregado para navegação fluida
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

// Lazy load otimizado com preloading inteligente
const Auth = lazy(() => import("@/pages/Auth"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));

// Páginas críticas - grupo 1 (carregamento imediato)
const Painel = lazy(() => import("@/pages/Painel"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Atendimento = lazy(() => import("@/pages/Atendimento"));

// Páginas secundárias - grupo 2 (carregamento sob demanda)
const Contatos = lazy(() => import("@/pages/Contatos"));
const Kanban = lazy(() => import("@/pages/Kanban"));
const ChatBot = lazy(() => import("@/pages/ChatBot"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const Setores = lazy(() => import("@/pages/Setores"));

// Páginas menos utilizadas - grupo 3 (carregamento tardio)
const ChatInterno = lazy(() => import("@/pages/ChatInterno"));
const GerenciarEquipe = lazy(() => import("@/pages/GerenciarEquipe"));
const MeuPerfil = lazy(() => import("@/pages/MeuPerfil"));
const PlanoFaturamento = lazy(() => import("@/pages/PlanoFaturamento"));

// Configurações - grupo 4 (carregamento muito tardio)
const ConfiguracoesGerais = lazy(() => import("@/pages/configuracoes/ConfiguracoesGerais"));
const ConfiguracoesAvancadas = lazy(() => import("@/pages/configuracoes/ConfiguracoesAvancadas"));
const PreferenciasNotificacao = lazy(() => import("@/pages/configuracoes/PreferenciasNotificacao"));
const Aparencia = lazy(() => import("@/pages/configuracoes/Aparencia"));
const Idioma = lazy(() => import("@/pages/configuracoes/Idioma"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Fallback ultra-otimizado
const OptimizedFallback = () => (
  <div className="h-40 w-full flex items-center justify-center">
    <SyncLoader />
  </div>
);

const FullScreenFallback = () => (
  <div className="h-screen w-full bg-background flex items-center justify-center">
    <SyncLoader size="lg" />
  </div>
);

// Preloading inteligente baseado na rota atual
const useSmartPreloading = () => {
  useEffect(() => {
    // Verificar capacidade da rede
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === '2g' || connection?.saveData) {
        return; // Skip preload em conexões lentas
      }
    }

    // Preload baseado na rota atual
    const currentPath = window.location.pathname;
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Sempre preload componentes críticos
        import('@/components/ui/button');
        import('@/components/ui/card');
        
        // Preload baseado na rota
        if (currentPath === '/' || currentPath === '/painel') {
          import('@/pages/Dashboard');
          import('@/pages/Atendimento');
        } else if (currentPath === '/dashboard') {
          import('@/pages/Atendimento');
          import('@/pages/Contatos');
        } else if (currentPath === '/atendimento') {
          import('@/pages/Dashboard');
          import('@/pages/Contatos');
        }
      }, { timeout: 1000 });
    }
  }, []);
};

function AppRoutes() {
  useSmartPreloading();
  
  return (
    <Routes>
      <Route path="/auth" element={
        <Suspense fallback={<FullScreenFallback />}>
          <Auth />
        </Suspense>
      } />
      
      <Route path="/admin" element={
        <Suspense fallback={<FullScreenFallback />}>
          <ProtectedRoute>
            <SuperAdmin />
          </ProtectedRoute>
        </Suspense>
      } />
      
      {/* Rotas críticas com Layout otimizado */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout title="Painel" description="Visão geral do sistema">
            <Suspense fallback={<OptimizedFallback />}>
              <Painel />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/painel" element={
        <ProtectedRoute>
          <Layout title="Painel" description="Visão geral do sistema">
            <Suspense fallback={<OptimizedFallback />}>
              <Painel />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout title="Dashboard" description="Métricas e estatísticas">
            <Suspense fallback={<OptimizedFallback />}>
              <Dashboard />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/atendimento" element={
        <ProtectedRoute>
          <Layout title="Atendimento" description="Central de atendimento">
            <Suspense fallback={<OptimizedFallback />}>
              <Atendimento />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Rotas secundárias */}
      <Route path="/contatos" element={
        <ProtectedRoute>
          <Layout title="Contatos" description="Gerenciamento de contatos">
            <Suspense fallback={<OptimizedFallback />}>
              <Contatos />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/kanban" element={
        <ProtectedRoute>
          <Layout title="Kanban" description="Quadro de tarefas">
            <Suspense fallback={<OptimizedFallback />}>
              <Kanban />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <Layout title="ChatBot" description="Automação inteligente">
            <Suspense fallback={<OptimizedFallback />}>
              <ChatBot />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <Layout title="Usuários" description="Gerenciamento de usuários">
            <Suspense fallback={<OptimizedFallback />}>
              <Usuarios />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/setores" element={
        <ProtectedRoute>
          <Layout title="Setores" description="Organização por setores">
            <Suspense fallback={<OptimizedFallback />}>
              <Setores />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Rotas menos utilizadas */}
      <Route path="/chat-interno" element={
        <ProtectedRoute>
          <Layout title="Chat Interno" description="Comunicação interna">
            <Suspense fallback={<OptimizedFallback />}>
              <ChatInterno />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/gerenciar-equipe" element={
        <ProtectedRoute>
          <Layout title="Gerenciar Equipe" description="Administração da equipe">
            <Suspense fallback={<OptimizedFallback />}>
              <GerenciarEquipe />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/meu-perfil" element={
        <ProtectedRoute>
          <Layout title="Meu Perfil" description="Configurações pessoais">
            <Suspense fallback={<OptimizedFallback />}>
              <MeuPerfil />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/plano-faturamento" element={
        <ProtectedRoute>
          <Layout title="Plano e Faturamento" description="Gerenciamento financeiro">
            <Suspense fallback={<OptimizedFallback />}>
              <PlanoFaturamento />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Configurações */}
      <Route path="/configuracoes/gerais" element={
        <ProtectedRoute>
          <Layout title="Configurações Gerais" description="Configurações do sistema">
            <Suspense fallback={<OptimizedFallback />}>
              <ConfiguracoesGerais />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/avancadas" element={
        <ProtectedRoute>
          <Layout title="Configurações Avançadas" description="Configurações técnicas">
            <Suspense fallback={<OptimizedFallback />}>
              <ConfiguracoesAvancadas />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/notificacoes" element={
        <ProtectedRoute>
          <Layout title="Notificações" description="Preferências de notificação">
            <Suspense fallback={<OptimizedFallback />}>
              <PreferenciasNotificacao />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/aparencia" element={
        <ProtectedRoute>
          <Layout title="Aparência" description="Personalização visual">
            <Suspense fallback={<OptimizedFallback />}>
              <Aparencia />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/idioma" element={
        <ProtectedRoute>
          <Layout title="Idioma" description="Configurações de idioma">
            <Suspense fallback={<OptimizedFallback />}>
              <Idioma />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={
        <Suspense fallback={<FullScreenFallback />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OptimizedAuthProvider>
          <ThemeProvider>
            <ConnectionNotificationProvider>
              <AdminAuthProvider>
                <Suspense fallback={<FullScreenFallback />}>
                <TooltipProvider>
                  <Toaster />
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </TooltipProvider>
              </Suspense>
            </AdminAuthProvider>
          </ConnectionNotificationProvider>
        </ThemeProvider>
        </OptimizedAuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;