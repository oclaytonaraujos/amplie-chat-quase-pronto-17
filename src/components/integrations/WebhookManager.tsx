import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Zap, Settings, Download, Upload, Send, TestTube } from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  enabled: boolean;
  platform: 'zapier' | 'n8n' | 'make' | 'custom';
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const platforms = [
    { value: 'zapier', label: 'Zapier', icon: Zap },
    { value: 'n8n', label: 'n8n', icon: Settings },
    { value: 'make', label: 'Make', icon: Settings },
    { value: 'custom', label: 'Custom', icon: Settings }
  ];

  const handleSaveWebhook = async (webhook: WebhookConfig) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updated = webhooks.find(w => w.id === webhook.id);
      if (updated) {
        setWebhooks(prev => prev.map(w => w.id === webhook.id ? webhook : w));
      } else {
        setWebhooks(prev => [...prev, { ...webhook, id: Date.now().toString() }]);
      }
      
      setEditingWebhook(null);
      toast({
        title: "Webhook salvo",
        description: "Configuração de webhook salva com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar webhook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    setIsLoading(true);
    try {
      await fetch(webhook.url, {
        method: webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        mode: 'no-cors',
        body: webhook.method !== 'GET' ? JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'webhook-manager'
        }) : undefined
      });

      toast({
        title: "Teste enviado",
        description: "Verifique o histórico da sua automação para confirmar o recebimento"
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar webhook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportWebhooks = () => {
    const dataStr = JSON.stringify(webhooks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'webhooks-config.json';
    link.click();
  };

  const importWebhooks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setWebhooks(imported);
          toast({
            title: "Importação concluída",
            description: `${imported.length} webhooks importados`
          });
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: "Arquivo JSON inválido",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Webhooks</h2>
          <p className="text-muted-foreground">Configure integrações com plataformas externas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportWebhooks}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importWebhooks}
          />
          <Button onClick={() => setEditingWebhook({
            id: '',
            name: '',
            url: '',
            method: 'POST',
            headers: {},
            enabled: true,
            platform: 'zapier'
          })}>
            Novo Webhook
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {webhook.name}
                    <Badge variant={webhook.enabled ? "default" : "secondary"}>
                      {webhook.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {webhook.method} • {webhook.platform} • {webhook.url}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook)}
                    disabled={isLoading}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingWebhook(webhook)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {editingWebhook && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingWebhook.id ? 'Editar' : 'Novo'} Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={editingWebhook.name}
                  onChange={(e) => setEditingWebhook(prev => prev ? {...prev, name: e.target.value} : null)}
                  placeholder="Nome do webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select
                  value={editingWebhook.platform}
                  onValueChange={(value: any) => setEditingWebhook(prev => prev ? {...prev, platform: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Método</Label>
                <Select
                  value={editingWebhook.method}
                  onValueChange={(value: any) => setEditingWebhook(prev => prev ? {...prev, method: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={editingWebhook.url}
                  onChange={(e) => setEditingWebhook(prev => prev ? {...prev, url: e.target.value} : null)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={JSON.stringify(editingWebhook.headers, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setEditingWebhook(prev => prev ? {...prev, headers} : null);
                  } catch {}
                }}
                placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setEditingWebhook(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => editingWebhook && handleSaveWebhook(editingWebhook)}
                disabled={isLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}