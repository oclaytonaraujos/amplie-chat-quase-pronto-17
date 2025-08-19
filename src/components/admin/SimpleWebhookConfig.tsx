import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedWebhooks } from '@/hooks/useUnifiedWebhooks';
import { Webhook, Activity, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export function SimpleWebhookConfig() {
  const { toast } = useToast();
  const { 
    config, 
    loading, 
    logs, 
    updateConfig, 
    testWebhook, 
    loadLogs 
  } = useUnifiedWebhooks();
  
  const [webhookUrl, setWebhookUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const availableEvents = [
    { id: 'message', label: 'Mensagens', description: 'Envio e recebimento de mensagens' },
    { id: 'instance', label: 'Instâncias', description: 'Criação e gerenciamento de instâncias' },
    { id: 'chatbot', label: 'Chatbot', description: 'Eventos do chatbot' },
    { id: 'connection', label: 'Conexões', description: 'Status de conexões WhatsApp' }
  ];

  useEffect(() => {
    if (config) {
      setWebhookUrl(config.webhook_url || '');
      setEnabled(config.enabled || false);
      setSelectedEvents(config.events || []);
    }
  }, [config]);

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL do webhook é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateConfig({
        webhook_url: webhookUrl.trim(),
        enabled,
        events: selectedEvents
      });

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await testWebhook();
      
      toast({
        title: result ? "Sucesso" : "Falha",
        description: result 
          ? "Webhook testado com sucesso!" 
          : "Falha no teste do webhook",
        variant: result ? "default" : "destructive",
      });

      // Recarregar logs após teste
      loadLogs();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar webhook",
        variant: "destructive",
      });
    }
  };

  const handleEventChange = (eventId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, eventId]);
    } else {
      setSelectedEvents(prev => prev.filter(id => id !== eventId));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <CardTitle>Configuração Unificada de Webhook</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure um webhook único para receber todos os eventos do sistema
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">
                <Settings className="h-4 w-4 mr-2" />
                Configuração
              </TabsTrigger>
              <TabsTrigger value="events">
                <Activity className="h-4 w-4 mr-2" />
                Eventos
              </TabsTrigger>
              <TabsTrigger value="logs">
                Logs
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://seu-n8n.exemplo.com/webhook/unified"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL onde todos os eventos serão enviados
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook-enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                  <Label htmlFor="webhook-enabled">Webhook ativo</Label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar Configuração'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTest}
                    disabled={loading || !webhookUrl || !enabled}
                  >
                    Testar Webhook
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Selecione os eventos para enviar</h4>
                {availableEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={(checked) => handleEventChange(event.id, !!checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={event.id} className="text-sm font-medium">
                        {event.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Logs de Entrega</h4>
                <Button variant="outline" size="sm" onClick={loadLogs}>
                  Atualizar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum log encontrado
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{log.event_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Sucesso" : "Falha"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.delivered_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Webhook</span>
              <Badge variant={config?.webhook_url ? "default" : "secondary"}>
                {config?.webhook_url ? "Configurado" : "Pendente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Status</span>
              <Badge variant={config?.enabled ? "default" : "secondary"}>
                {config?.enabled ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Eventos</span>
              <Badge variant="outline">
                {selectedEvents.length} selecionados
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Logs</span>
              <Badge variant="outline">
                {logs.length} registros
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}