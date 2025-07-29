
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface N8nConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function N8nConfigDialog({ open, onOpenChange }: N8nConfigDialogProps) {
  const [webhookReceiveUrl, setWebhookReceiveUrl] = useState('');
  const [webhookSendUrl, setWebhookSendUrl] = useState('');
  const [evolutionInstanceName, setEvolutionInstanceName] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const { toast } = useToast();

  const amplieWebhookUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook';

  const copiarParaClipboard = (texto: string, nome: string) => {
    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado!",
      description: `${nome} copiado para a área de transferência`,
    });
  };

  const fluxoRecebimento = `{
  "nodes": [
    {
      "name": "Webhook Recebimento",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-receive",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Encaminhar para Amplie",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "${amplieWebhookUrl}",
        "jsonParameters": true,
        "parametersJson": "={{ $json.body }}"
      }
    },
    {
      "name": "Resposta OK",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "{ \\"success\\": true, \\"message\\": \\"Mensagem processada\\" }"
      }
    }
  ],
  "connections": {
    "Webhook Recebimento": {
      "main": [
        [
          {
            "node": "Encaminhar para Amplie",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Encaminhar para Amplie": {
      "main": [
        [
          {
            "node": "Resposta OK",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;

  const fluxoEnvio = `{
  "nodes": [
    {
      "name": "Webhook Envio",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-send"
      }
    },
    {
      "name": "Switch Tipo Mensagem",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "rules": {
          "rules": [
            {
              "operation": "equal",
              "value1": "={{ $json.body.type }}",
              "value2": "text"
            },
            {
              "operation": "equal",
              "value1": "={{ $json.body.type }}",
              "value2": "image"
            },
            {
              "operation": "equal",
              "value1": "={{ $json.body.type }}",
              "value2": "document"
            }
          ]
        }
      }
    },
    {
      "name": "Enviar Texto Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [650, 200],
      "parameters": {
        "method": "POST",
        "url": "={{ $('Webhook Envio').item.json.serverUrl }}/message/sendText/{{ $('Webhook Envio').item.json.instanceName }}",
        "headers": {
          "apikey": "={{ $('Webhook Envio').item.json.apiKey }}"
        },
        "jsonParameters": true,
        "parametersJson": "={ \\"number\\": \\"{{ $json.body.phone }}\\", \\"text\\": \\"{{ $json.body.data.message }}\\" }"
      }
    },
    {
      "name": "Enviar Imagem Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $('Webhook Envio').item.json.serverUrl }}/message/sendMedia/{{ $('Webhook Envio').item.json.instanceName }}",
        "headers": {
          "apikey": "={{ $('Webhook Envio').item.json.apiKey }}"
        },
        "jsonParameters": true,
        "parametersJson": "={ \\"number\\": \\"{{ $json.body.phone }}\\", \\"media\\": \\"{{ $json.body.data.imageUrl }}\\", \\"caption\\": \\"{{ $json.body.data.caption }}\\" }"
      }
    },
    {
      "name": "Enviar Documento Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [650, 400],
      "parameters": {
        "method": "POST",
        "url": "={{ $('Webhook Envio').item.json.serverUrl }}/message/sendMedia/{{ $('Webhook Envio').item.json.instanceName }}",
        "headers": {
          "apikey": "={{ $('Webhook Envio').item.json.apiKey }}"
        },
        "jsonParameters": true,
        "parametersJson": "={ \\"number\\": \\"{{ $json.body.phone }}\\", \\"media\\": \\"{{ $json.body.data.documentUrl }}\\", \\"fileName\\": \\"{{ $json.body.data.filename }}\\" }"
      }
    }
  ],
  "connections": {
    "Webhook Envio": {
      "main": [
        [
          {
            "node": "Switch Tipo Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch Tipo Mensagem": {
      "main": [
        [
          {
            "node": "Enviar Texto Evolution API",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Enviar Imagem Evolution API",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Enviar Documento Evolution API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração n8n + Evolution API
          </DialogTitle>
          <DialogDescription>
            Configure a integração entre n8n e Evolution API para gerenciar mensagens do WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Arquitetura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arquitetura da Integração</CardTitle>
              <CardDescription>
                Fluxo completo de mensagens usando n8n como middleware
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-green-50">Recebimento</Badge>
                  <p className="text-sm text-gray-600">
                    Cliente → Evolution API → n8n → Amplie Chat
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-blue-50">Envio</Badge>
                  <p className="text-sm text-gray-600">
                    Amplie Chat → n8n → Evolution API → Cliente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passo 1: Fluxo de Recebimento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Fluxo de Recebimento (n8n)
              </CardTitle>
              <CardDescription>
                Crie este workflow no n8n para receber mensagens da Evolution API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>JSON do Workflow:</Label>
                <Textarea
                  value={fluxoRecebimento}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarParaClipboard(fluxoRecebimento, 'Fluxo de Recebimento')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar JSON
                </Button>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Após criar o workflow, anote a URL do webhook gerada pelo n8n. 
                  Ela será algo como: <code>https://seu-n8n.com/webhook/whatsapp-receive</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Passo 2: Fluxo de Envio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Fluxo de Envio (n8n)
              </CardTitle>
              <CardDescription>
                Crie este workflow no n8n para enviar mensagens via Evolution API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="evolution-instance">Nome da Instância Evolution API</Label>
                  <Input
                    id="evolution-instance"
                    value={evolutionInstanceName}
                    onChange={(e) => setEvolutionInstanceName(e.target.value)}
                    placeholder="Ex: minha-instancia"
                  />
                </div>
                <div>
                  <Label htmlFor="evolution-token">API Key da Evolution API</Label>
                  <Input
                    id="evolution-token"
                    type="password"
                    value={evolutionApiKey}
                    onChange={(e) => setEvolutionApiKey(e.target.value)}
                    placeholder="Ex: B3F8A2E1..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>JSON do Workflow:</Label>
                <Textarea
                  value={fluxoEnvio}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarParaClipboard(fluxoEnvio, 'Fluxo de Envio')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar JSON
                </Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Após criar o workflow, anote a URL do webhook gerada pelo n8n. 
                  Ela será algo como: <code>https://seu-n8n.com/webhook/whatsapp-send</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Passo 3: Configuração da Evolution API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Configuração da Evolution API
              </CardTitle>
              <CardDescription>
                Configure o webhook na Evolution API para apontar para o n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL para Configurar na Evolution API:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={webhookReceiveUrl}
                    onChange={(e) => setWebhookReceiveUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/whatsapp-receive"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarParaClipboard(webhookReceiveUrl, 'URL do Webhook')}
                    disabled={!webhookReceiveUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Passos na Evolution API:</strong>
                </p>
                <ol className="text-sm text-purple-700 mt-2 list-decimal list-inside space-y-1">
                  <li>Acesse o painel da Evolution API</li>
                  <li>Vá em "Webhooks" ou "Configurações"</li>
                  <li>Cole a URL do webhook de recebimento do n8n</li>
                  <li>Ative o webhook</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Passo 4: URLs para o Frontend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                URLs para o Frontend
              </CardTitle>
              <CardDescription>
                Configure estas URLs no código do Amplie Chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL do Webhook de Envio (n8n):</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={webhookSendUrl}
                    onChange={(e) => setWebhookSendUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/whatsapp-send"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarParaClipboard(webhookSendUrl, 'URL de Envio')}
                    disabled={!webhookSendUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Ação Necessária:</strong> Atualize a constante <code>N8N_WEBHOOK_URL</code> 
                  no arquivo <code>useAtendimentoReal.ts</code> com a URL do webhook de envio.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Final */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Checklist de Configuração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="step1" />
                  <label htmlFor="step1" className="text-sm">Workflow de recebimento criado no n8n</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="step2" />
                  <label htmlFor="step2" className="text-sm">Workflow de envio criado no n8n</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="step3" />
                  <label htmlFor="step3" className="text-sm">Webhook configurado na Evolution API</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="step4" />
                  <label htmlFor="step4" className="text-sm">URL de envio atualizada no código</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="step5" />
                  <label htmlFor="step5" className="text-sm">Bucket de storage criado no Supabase</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
