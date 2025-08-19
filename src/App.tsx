
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, startTransition } from "react";

// Core providers e configurações críticas
import { ThemeProvider } from "@/hooks/useTheme";
import { queryClient } from "@/config/queryClient";
import { setupGlobalErrorHandling } from "@/utils/production-logger";
import { ServiceWorkerProvider } from "@/hooks/useServiceWorker";
import { WhatsAppEvolutionProvider } from "@/contexts/WhatsAppEvolutionContext";
import { WhatsAppConnectionProvider } from "@/contexts/WhatsAppConnectionContext";
import { useNavigationTracking } from "@/hooks/useNavigationTracking";

// Lazy load componentes críticos - Layout NÃO lazy para manter navegação fluida
// AuthProvider NÃO deve ser lazy para evitar problemas de hidratação
import { AuthProvider } from "@/hooks/useAuth";
// AdminAuthProvider NÃO deve ser lazy para evitar problemas na rota /admin
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
import { Layout } from "@/components/layout/Layout";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

// Páginas - todas lazy loaded
const Auth = lazy(() => import("@/pages/Auth").then(m => ({ default: m.default })));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin").then(m => ({ default: m.default })));
const Painel = lazy(() => import("@/pages/Painel").then(m => ({ default: m.default })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.default })));
const Atendimento = lazy(() => import("@/pages/Atendimento").then(m => ({ default: m.default })));
const Contatos = lazy(() => import("@/pages/Contatos").then(m => ({ default: m.default })));
const Kanban = lazy(() => import("@/pages/Kanban").then(m => ({ default: m.default })));
const ChatBot = lazy(() => import("@/pages/ChatBot").then(m => ({ default: m.default })));
const FlowBuilder = lazy(() => import("@/pages/FlowBuilder").then(m => ({ default: m.default })));
const Usuarios = lazy(() => import("@/pages/Usuarios").then(m => ({ default: m.default })));
const Setores = lazy(() => import("@/pages/Setores").then(m => ({ default: m.default })));


// Páginas menos críticas - carregamento sob demanda
const ChatInterno = lazy(() => import("@/pages/ChatInterno").then(m => ({ default: m.default })));
const Automations = lazy(() => import("@/pages/Automations").then(m => ({ default: m.default })));
const GerenciarEquipe = lazy(() => import("@/pages/GerenciarEquipe").then(m => ({ default: m.default })));
const MeuPerfil = lazy(() => import("@/pages/MeuPerfil").then(m => ({ default: m.default })));
const PlanoFaturamento = lazy(() => import("@/pages/PlanoFaturamento").then(m => ({ default: m.default })));
const MelhoriasDashboard = lazy(() => import("@/pages/MelhoriasDashboard").then(m => ({ default: m.default })));

// Páginas de configuração - carregamento tardio
const ConfiguracoesGerais = lazy(() => import("@/pages/configuracoes/ConfiguracoesGerais").then(m => ({ default: m.default })));
const ConfiguracoesAvancadas = lazy(() => import("@/pages/configuracoes/ConfiguracoesAvancadas").then(m => ({ default: m.default })));
const PreferenciasNotificacao = lazy(() => import("@/pages/configuracoes/PreferenciasNotificacao").then(m => ({ default: m.default })));
const Aparencia = lazy(() => import("@/pages/configuracoes/Aparencia").then(m => ({ default: m.default })));
const Idioma = lazy(() => import("@/pages/configuracoes/Idioma").then(m => ({ default: m.default })));

// Advanced Features - carregamento sob demanda
const ComprehensiveAnalytics = lazy(() => import("@/components/analytics/ComprehensiveAnalytics").then(m => ({ default: m.ComprehensiveAnalytics })));
const AdvancedTemplateManager = lazy(() => import("@/components/templates/AdvancedTemplateManager").then(m => ({ default: m.AdvancedTemplateManager })));
const AdvancedAutomationBuilder = lazy(() => import("@/components/automation/AdvancedAutomationBuilder").then(m => ({ default: m.AdvancedAutomationBuilder })));
const SystemMonitor = lazy(() => import("@/components/performance/SystemMonitor").then(m => ({ default: m.SystemMonitor })));
const WebhookManager = lazy(() => import("@/components/integrations/WebhookManager").then(m => ({ default: m.WebhookManager })));
const MonitorConexoes = lazy(() => import("@/pages/MonitorConexoes").then(m => ({ default: m.default })));

const NotFound = lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

// Fallback otimizado para Core Web Vitals (app completo)
const FastFallback = () => (
  <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="loading-spinner" />
    <div className="sr-only">Carregando...</div>
  </div>
);

// Fallback otimizado para conteúdo da página (apenas área do conteúdo)
const PageContentFallback = () => (
  <div className="flex items-center justify-center h-40 w-full">
    <div className="loading-spinner" />
    <div className="sr-only">Carregando página...</div>
  </div>
);

// Preload otimizado apenas para rotas críticas
const preloadCriticalPages = () => {
  // Verificar se vale a pena fazer preload
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType === '2g' || connection.saveData) {
      return; // Skip preload em conexões lentas
    }
  }

  // Preload crítico removido temporariamente para diagnóstico
  console.log('Preload function called - skipping for debugging');
};

function AppRoutes() {
  useNavigationTracking();
  
  useEffect(() => {
    startTransition(() => {
      preloadCriticalPages();
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Layout title="Painel" description="Visão geral do sistema">
            <Suspense fallback={<PageContentFallback />}>
              <Painel />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/auth" element={
        <Suspense fallback={<FastFallback />}>
          <Auth />
        </Suspense>
      } />
      
      <Route path="/admin" element={
        <Suspense fallback={<FastFallback />}>
          <ProtectedRoute>
            <SuperAdmin />
          </ProtectedRoute>
        </Suspense>
      } />
      
      <Route path="/painel" element={
        <ProtectedRoute>
          <Layout title="Painel" description="Visão geral do sistema">
            <Suspense fallback={<PageContentFallback />}>
              <Painel />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout title="Dashboard" description="Métricas e estatísticas">
            <Suspense fallback={<PageContentFallback />}>
              <Dashboard />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/atendimento" element={
        <ProtectedRoute>
          <Layout title="Atendimento" description="Central de atendimento">
            <Suspense fallback={<PageContentFallback />}>
              <Atendimento />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/contatos" element={
        <ProtectedRoute>
          <Layout title="Contatos" description="Gerenciamento de contatos">
            <Suspense fallback={<PageContentFallback />}>
              <Contatos />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Rotas menos críticas com lazy loading tardio */}
      <Route path="/kanban" element={
        <ProtectedRoute>
          <Layout title="Kanban" description="Quadro de tarefas">
            <Suspense fallback={<PageContentFallback />}>
              <Kanban />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <Layout title="ChatBot" description="Automação inteligente">
            <Suspense fallback={<PageContentFallback />}>
              <ChatBot />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chatbot/flow-builder/:id" element={
        <Suspense fallback={<FastFallback />}>
          <ProtectedRoute>
            <FlowBuilder />
          </ProtectedRoute>
        </Suspense>
      } />
      
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <Layout title="Usuários" description="Gerenciamento de usuários">
            <Suspense fallback={<PageContentFallback />}>
              <Usuarios />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/setores" element={
        <ProtectedRoute>
          <Layout title="Setores" description="Organização por setores">
            <Suspense fallback={<PageContentFallback />}>
              <Setores />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      
      {/* Rotas de baixa prioridade */}
      <Route path="/automations" element={
        <ProtectedRoute>
          <Layout title="Automações" description="Fluxos de automação">
            <Suspense fallback={<PageContentFallback />}>
              <Automations />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chat-interno" element={
        <ProtectedRoute>
          <Layout title="Chat Interno" description="Comunicação interna">
            <Suspense fallback={<PageContentFallback />}>
              <ChatInterno />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/gerenciar-equipe" element={
        <ProtectedRoute>
          <Layout title="Gerenciar Equipe" description="Administração da equipe">
            <Suspense fallback={<PageContentFallback />}>
              <GerenciarEquipe />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/meu-perfil" element={
        <ProtectedRoute>
          <Layout title="Meu Perfil" description="Configurações pessoais">
            <Suspense fallback={<PageContentFallback />}>
              <MeuPerfil />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/plano-faturamento" element={
        <ProtectedRoute>
          <Layout title="Plano e Faturamento" description="Gerenciamento financeiro">
            <Suspense fallback={<PageContentFallback />}>
              <PlanoFaturamento />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Configurações - carregamento sob demanda */}
      <Route path="/configuracoes/gerais" element={
        <ProtectedRoute>
          <Layout title="Configurações Gerais" description="Configurações do sistema">
            <Suspense fallback={<PageContentFallback />}>
              <ConfiguracoesGerais />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/avancadas" element={
        <ProtectedRoute>
          <Layout title="Configurações Avançadas" description="Configurações técnicas">
            <Suspense fallback={<PageContentFallback />}>
              <ConfiguracoesAvancadas />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/notificacoes" element={
        <ProtectedRoute>
          <Layout title="Notificações" description="Preferências de notificação">
            <Suspense fallback={<PageContentFallback />}>
              <PreferenciasNotificacao />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/aparencia" element={
        <ProtectedRoute>
          <Layout title="Aparência" description="Personalização visual">
            <Suspense fallback={<PageContentFallback />}>
              <Aparencia />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/idioma" element={
        <ProtectedRoute>
          <Layout title="Idioma" description="Configurações de idioma">
            <Suspense fallback={<PageContentFallback />}>
              <Idioma />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Advanced Features */}
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout title="Analytics" description="Relatórios e análises avançadas">
            <Suspense fallback={<PageContentFallback />}>
              <ComprehensiveAnalytics />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/templates" element={
        <ProtectedRoute>
          <Layout title="Templates" description="Gerenciador de templates">
            <Suspense fallback={<PageContentFallback />}>
              <AdvancedTemplateManager />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/automation-builder" element={
        <ProtectedRoute>
          <Layout title="Automation Builder" description="Construtor de automações">
            <Suspense fallback={<PageContentFallback />}>
              <AdvancedAutomationBuilder />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/system-monitor" element={
        <ProtectedRoute>
          <Layout title="Monitor do Sistema" description="Monitoramento em tempo real">
            <Suspense fallback={<PageContentFallback />}>
              <SystemMonitor />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/webhooks" element={
        <ProtectedRoute>
          <Layout title="Webhooks" description="Gerenciador de webhooks">
            <Suspense fallback={<PageContentFallback />}>
              <WebhookManager />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/monitor-conexoes" element={
        <ProtectedRoute>
          <Layout title="Monitor de Conexões" description="Monitoramento de conexões WhatsApp">
            <Suspense fallback={<PageContentFallback />}>
              <MonitorConexoes />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={
        <Suspense fallback={<FastFallback />}>
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
        <ThemeProvider>
          <ServiceWorkerProvider>
            <WhatsAppEvolutionProvider>
              <WhatsAppConnectionProvider>
                <Suspense fallback={<FastFallback />}>
                  <AuthProvider>
                    <AdminAuthProvider>
                      <TooltipProvider>
                        <Toaster />
                        <BrowserRouter>
                          <AppRoutes />
                        </BrowserRouter>
                      </TooltipProvider>
                    </AdminAuthProvider>
                  </AuthProvider>
                </Suspense>
              </WhatsAppConnectionProvider>
            </WhatsAppEvolutionProvider>
          </ServiceWorkerProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
