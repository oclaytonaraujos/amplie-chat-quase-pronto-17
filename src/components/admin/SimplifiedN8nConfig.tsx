import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSimplifiedN8n } from '@/hooks/useSimplifiedN8n';
import { Webhook, MessageSquare, Bot, Zap } from 'lucide-react';

export function SimplifiedN8nConfig() {
  const { toast } = useToast();
  const { config, updateWebhook, testWebhook, loading } = useSimplifiedN8n();
  
  const [webhooks, setWebhooks] = useState({
    messages: config?.messages_webhook_url || '',
    instances: config?.instances_webhook_url || '',
    chatbot: config?.chatbot_webhook_url || ''
  });

  const handleSaveWebhook = async (type: keyof typeof webhooks) => {
    try {
      await updateWebhook(type, webhooks[type]);
      toast({
        title: "Webhook atualizado",
        description: `Webhook ${type} configurado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar webhook",
        variant: "destructive"
      });
    }
  };

  const handleTestWebhook = async (type: keyof typeof webhooks) => {
    try {
      const success = await testWebhook(type);
      toast({
        title: success ? "Teste bem-sucedido" : "Teste falhou",
        description: success ? `Webhook ${type} respondeu corretamente` : `Webhook ${type} não respondeu`,
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar webhook",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuração N8N Simplificada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-1" />
                Mensagens
              </TabsTrigger>
              <TabsTrigger value="instances">
                <Webhook className="h-4 w-4 mr-1" />
                Instâncias
              </TabsTrigger>
              <TabsTrigger value="chatbot">
                <Bot className="h-4 w-4 mr-1" />
                Chatbot
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="messages-webhook">Webhook de Mensagens</Label>
                <Input
                  id="messages-webhook"
                  placeholder="https://n8n.exemplo.com/webhook/messages"
                  value={webhooks.messages}
                  onChange={(e) => setWebhooks(prev => ({ ...prev, messages: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveWebhook('messages')}
                  disabled={loading || !webhooks.messages}
                >
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestWebhook('messages')}
                  disabled={loading || !webhooks.messages}
                >
                  Testar
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="instances" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instances-webhook">Webhook de Instâncias</Label>
                <Input
                  id="instances-webhook"
                  placeholder="https://n8n.exemplo.com/webhook/instances"
                  value={webhooks.instances}
                  onChange={(e) => setWebhooks(prev => ({ ...prev, instances: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveWebhook('instances')}
                  disabled={loading || !webhooks.instances}
                >
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestWebhook('instances')}
                  disabled={loading || !webhooks.instances}
                >
                  Testar
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="chatbot" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatbot-webhook">Webhook de Chatbot</Label>
                <Input
                  id="chatbot-webhook"
                  placeholder="https://n8n.exemplo.com/webhook/chatbot"
                  value={webhooks.chatbot}
                  onChange={(e) => setWebhooks(prev => ({ ...prev, chatbot: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveWebhook('chatbot')}
                  disabled={loading || !webhooks.chatbot}
                >
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestWebhook('chatbot')}
                  disabled={loading || !webhooks.chatbot}
                >
                  Testar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status dos Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Mensagens</span>
              </div>
              <Badge variant={webhooks.messages ? "default" : "secondary"}>
                {webhooks.messages ? "Configurado" : "Pendente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                <span className="text-sm font-medium">Instâncias</span>
              </div>
              <Badge variant={webhooks.instances ? "default" : "secondary"}>
                {webhooks.instances ? "Configurado" : "Pendente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">Chatbot</span>
              </div>
              <Badge variant={webhooks.chatbot ? "default" : "secondary"}>
                {webhooks.chatbot ? "Configurado" : "Pendente"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}