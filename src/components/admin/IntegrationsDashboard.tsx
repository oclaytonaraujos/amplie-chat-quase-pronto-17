import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Zap, Bot, MessageSquare, Server, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { SimplifiedN8nConfig } from './SimplifiedN8nConfig';
import { useSimplifiedN8n } from '@/hooks/useSimplifiedN8n';

export function IntegrationsDashboard() {
  const { status, loading } = useSimplifiedN8n();
  const [activeTab, setActiveTab] = useState('overview');

  const integrations = [
    {
      id: 'n8n',
      name: 'n8n Middleware',
      description: 'Sistema centralizado de automação e processamento',
      icon: Server,
      status: status.overall_enabled ? 'active' : 'inactive',
      components: [
        { name: 'Mensagens', enabled: status.messages_enabled },
        { name: 'Instâncias', enabled: status.instances_enabled },
        { name: 'Chatbot', enabled: status.chatbot_enabled }
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
      status: status.chatbot_enabled ? 'active' : 'inactive',
      components: [
        { name: 'Fluxos', enabled: status.chatbot_enabled },
        { name: 'Processamento', enabled: status.chatbot_enabled },
        { name: 'Transferências', enabled: status.chatbot_enabled }
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
          <TabsTrigger value="n8n">Configurar n8n</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
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
                  {[status.messages_enabled, status.instances_enabled, status.chatbot_enabled].filter(Boolean).length}/3
                </div>
                <p className="text-xs text-muted-foreground">
                  Webhooks configurados
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
                  <Badge variant="outline" className="bg-green-50">Simplificada</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  n8n como middleware
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

                    {integration.id === 'n8n' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab('n8n')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar n8n
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
              <CardTitle>Fluxo de Dados Simplificado</CardTitle>
              <CardDescription>
                Como os dados fluem através do sistema usando n8n como middleware
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Sistema</p>
                  <p className="text-xs text-muted-foreground">Envia dados</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <Server className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">n8n</p>
                  <p className="text-xs text-muted-foreground">Processa</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Evolution API</p>
                  <p className="text-xs text-muted-foreground">Executa</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Retorno</p>
                  <p className="text-xs text-muted-foreground">Atualiza sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n" className="space-y-6">
          <SimplifiedN8nConfig />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>URLs de Webhook Configuradas</CardTitle>
              <CardDescription>
                Estas são as URLs que o sistema usa para se comunicar com o n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Webhook de Mensagens</h4>
                <Badge variant={status.messages_enabled ? "default" : "secondary"}>
                  {status.messages_enabled ? 'Configurado' : 'Não configurado'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Webhook de Instâncias</h4>
                <Badge variant={status.instances_enabled ? "default" : "secondary"}>
                  {status.instances_enabled ? 'Configurado' : 'Não configurado'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Webhook de Chatbot</h4>
                <Badge variant={status.chatbot_enabled ? "default" : "secondary"}>
                  {status.chatbot_enabled ? 'Configurado' : 'Não configurado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
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