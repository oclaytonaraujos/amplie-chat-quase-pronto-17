import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ErrorBoundaryAdmin } from '@/components/admin/ErrorBoundaryAdmin';

// Componentes consolidados por área
import EmpresasTab from '@/components/admin/EmpresasTab';
import UsuariosTab from '@/components/admin/UsuariosTab';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import PlanosGerenciamento from '@/components/admin/PlanosGerenciamento';
import { N8nWebhookConfig } from '@/components/admin/N8nWebhookConfig';
import ConfiguracoesAvancadas from '@/components/admin/ConfiguracoesAvancadas';
import QueueMonitoring from '@/components/admin/QueueMonitoring';

export default function SuperAdmin() {
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth();
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !isSuperAdmin) {
    return <Navigate to="/painel" replace />;
  }
  return <AdminLayout title="Super Admin" description="Gerencie todas as empresas e configurações da plataforma">
      <ErrorBoundaryAdmin>
        <Tabs defaultValue="analytics" className="space-y-8">
          <div className="relative overflow-x-auto pb-4 px-2">
            <TabsList className="grid grid-cols-7 w-full relative z-10">
              <TabsTrigger value="analytics" className="admin-tab-trigger">Dashboard</TabsTrigger>
              <TabsTrigger value="empresas" className="admin-tab-trigger">Empresas</TabsTrigger>
              <TabsTrigger value="usuarios" className="admin-tab-trigger">Usuários</TabsTrigger>
              <TabsTrigger value="planos" className="admin-tab-trigger">Planos</TabsTrigger>
              <TabsTrigger value="integracoes" className="admin-tab-trigger">Integrações</TabsTrigger>
              
              <TabsTrigger value="configuracoes" className="admin-tab-trigger">Configurações</TabsTrigger>
              <TabsTrigger value="filas" className="admin-tab-trigger">Monitoramento</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analytics" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Dashboard Analytics</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Métricas gerais, relatórios e visão consolidada da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresas" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Gestão de Empresas</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Gerencie todas as empresas cadastradas na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <EmpresasTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Gestão de Usuários</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Visualize e gerencie usuários de todas as empresas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <UsuariosTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planos" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Gestão de Planos</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Configure planos, permissões e funcionalidades da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <PlanosGerenciamento />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Central de Integrações</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  WhatsApp, Evolution API, n8n, webhooks e todas as configurações de integração
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <N8nWebhookConfig />
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="configuracoes" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Configurações do Sistema</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  API Keys, configurações avançadas e permissões do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <ConfiguracoesAvancadas />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filas" className="animate-scale-in-smooth">
            <Card className="admin-card rounded-2xl overflow-hidden shadow-xl border border-border/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  <CardTitle className="text-2xl text-primary font-bold tracking-tight">Monitoramento do Sistema</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Filas de mensagens, logs e performance da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <QueueMonitoring />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundaryAdmin>
    </AdminLayout>;
}