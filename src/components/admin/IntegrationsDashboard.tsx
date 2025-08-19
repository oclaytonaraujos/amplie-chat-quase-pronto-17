import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Zap, Bot, MessageSquare, Server, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { SimpleWebhookConfig } from './SimpleWebhookConfig';
import { useUnifiedWebhooks } from '@/hooks/useUnifiedWebhooks';

export function IntegrationsDashboard() {
  const { config, loading } = useUnifiedWebhooks();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate status from config
  const status = {
    overall_enabled: !!(config?.webhook_url && config?.enabled),
    webhook_configured: !!config?.webhook_url,
    webhook_enabled: !!config?.enabled,
    events_count: config?.events?.length || 0
  };

  // Verificar quais eventos estão habilitados
  const hasMessageEvents = config?.events?.includes('message') || false;
  const hasInstanceEvents = config?.events?.includes('instance') || false;
  const hasChatbotEvents = config?.events?.includes('chatbot') || false;

  const integrations = [
    {
      id: 'unified',
      name: 'Webhook Unificado',
      description: 'Sistema centralizado de webhooks',
      icon: Server,
      status: status.overall_enabled ? 'active' : 'inactive',
      components: [
        { name: 'Mensagens', enabled: hasMessageEvents },
        { name: 'Instâncias', enabled: hasInstanceEvents },
        { name: 'Chatbot', enabled: hasChatbotEvents }
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp (Evolution API)',
      description: 'Integração com WhatsApp Business',
      icon: MessageSquare,
      status: 'active',
      components: [
        { name: 'Envio', enabled: true },
        { name: 'Recebimento', enabled: true },
        { name: 'Mídia', enabled: true }
      ]
    },
    {
      id: 'chatbot',
      name: 'Sistema de Chatbot',
      description: 'Automação de atendimento via IA',
      icon: Bot,
      status: hasChatbotEvents ? 'active' : 'inactive',
      components: [
        { name: 'Fluxos', enabled: hasChatbotEvents },
        { name: 'Processamento', enabled: hasChatbotEvents },
        { name: 'Transferências', enabled: hasChatbotEvents }
      ]
    }
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando integrações...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrações</h2>
        <p className="text-muted-foreground">
          Configure e gerencie as integrações do sistema com serviços externos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="unified">Configurar Webhook</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <StatusIcon status={status.overall_enabled ? 'active' : 'inactive'} />
                  <Badge variant={status.overall_enabled ? "default" : "secondary"}>
                    {status.overall_enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhooks Ativos</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status.events_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Eventos configurados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arquitetura</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <Badge variant="outline" className="bg-green-50">Unificada</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Webhook único
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {integration.name}
                      <StatusIcon status={integration.status} />
                    </CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {integration.components.map((component, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{component.name}</span>
                          <Badge variant={component.enabled ? "default" : "secondary"} className="text-xs">
                            {component.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {integration.id === 'unified' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab('unified')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Webhook
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Architecture Diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Arquitetura Unificada</CardTitle>
              <CardDescription>
                Como o sistema funciona com webhook único
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Sistema</p>
                  <p className="text-xs text-muted-foreground">Gera evento</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Webhook</p>
                  <p className="text-xs text-muted-foreground">Processa</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Resposta</p>
                  <p className="text-xs text-muted-foreground">Confirma</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unified" className="space-y-6">
          <SimpleWebhookConfig />
        </TabsContent>


        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Integração</CardTitle>
              <CardDescription>
                Monitore a comunicação entre o sistema e as integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Logs serão exibidos aqui em breve</p>
                <p className="text-sm">Configure as integrações para começar a ver os logs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}