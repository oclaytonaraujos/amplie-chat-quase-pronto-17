import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Zap, Globe, Database, AlertCircle, CheckCircle, Play, Pause, BarChart3, Webhook } from 'lucide-react';
import { N8nConfigDialog } from './N8nConfigDialog';
import { WebhookConfigurationCenter } from './WebhookConfigurationCenter';
import { SystemWebhooksConfig } from './SystemWebhooksConfig';
import { N8nDashboard } from './N8nDashboard';
import { useToast } from '@/hooks/use-toast';

export function N8nIntegrationTab() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const testN8nConnection = async () => {
    setIsTestingConnection(true);
    
    // Simular teste da conexão
    setTimeout(() => {
      setIsTestingConnection(false);
      toast({
        title: "Teste de Conexão",
        description: "Conexão com n8n testada com sucesso!",
      });
    }, 2000);
  };

  const integrationStatus = {
    n8nInstance: 'connected', // connected, disconnected, error
    webhooks: 'configured', // configured, pending, error
    evolution: 'active', // active, inactive, error
    flows: 12,
    totalExecutions: 1847,
    successRate: 98.5
  };

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks Sistema</TabsTrigger>
        <TabsTrigger value="config">Configuração</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        <N8nDashboard />
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-6">
        <SystemWebhooksConfig />
      </TabsContent>

      <TabsContent value="config" className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status n8n</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {integrationStatus.n8nInstance === 'connected' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Conectado
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive">Desconectado</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {integrationStatus.webhooks === 'configured' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Configurado
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <Badge variant="secondary">Pendente</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {integrationStatus.successRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {integrationStatus.totalExecutions} execuções
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* n8n Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração n8n
              </CardTitle>
              <CardDescription>
                Configure sua instância n8n e workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Status da Instância: <Badge variant="outline">Cloud</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Workflows Ativos: <strong>{integrationStatus.flows}</strong>
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setConfigDialogOpen(true)}
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Workflows
                </Button>
                
                <Button
                  onClick={testN8nConnection}
                  disabled={isTestingConnection}
                  variant="secondary"
                >
                  {isTestingConnection ? (
                    <>
                      <Pause className="h-4 w-4 mr-2 animate-pulse" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Gerenciamento de Webhooks
              </CardTitle>
              <CardDescription>
                Configure URLs de recebimento e envio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookConfigurationCenter />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="templates" className="space-y-6">
        {/* Workflow Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates de Workflows</CardTitle>
            <CardDescription>
              Workflows pré-configurados para integração com WhatsApp e eventos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recebimento de Mensagens</h4>
                  <Badge variant="outline" className="bg-green-50">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Processa mensagens recebidas via Evolution API
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Envio de Mensagens</h4>
                  <Badge variant="outline" className="bg-green-50">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Envia mensagens através da Evolution API
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Eventos do Sistema</h4>
                  <Badge variant="secondary">Configurar</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Processa eventos como criação de contatos e início de atendimentos
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Webhook className="h-4 w-4 mr-2" />
                  Ver Webhooks
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Processamento de Mídia</h4>
                  <Badge variant="secondary">Configurar</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Processa e armazena arquivos de mídia
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Relatórios Automáticos</h4>
                  <Badge variant="secondary">Disponível</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gera e envia relatórios de atendimento automaticamente
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Backup de Conversas</h4>
                  <Badge variant="secondary">Disponível</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Faz backup automático das conversas para sistemas externos
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* N8n Configuration Dialog */}
      <N8nConfigDialog 
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </Tabs>
  );
}