import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Webhook, Database, MessageSquare, Settings, Smartphone } from 'lucide-react';

export default function EvolutionApiArchitecture() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conexão Global */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Conexão Global (CRUD)
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Server URL + API Key
              </Badge>
            </CardTitle>
            <CardDescription>
              Operações administrativas de instâncias usando server-url e apikey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <Settings className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">POST /instance/create</span>
                <Badge variant="secondary">Criar instância</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">GET /instance/fetchInstances</span>
                <Badge variant="secondary">Listar instâncias</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <Smartphone className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">PUT /instance/restart</span>
                <Badge variant="secondary">Reiniciar</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="h-4 w-4 bg-red-600 rounded" />
                <span className="text-sm font-medium">DELETE /instance/delete</span>
                <Badge variant="secondary">Deletar instância</Badge>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Usado para:</strong> Gerenciamento da vida útil das instâncias, 
                configurações administrativas e envio ativo de mensagens.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks em Tempo Real */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-purple-600" />
              Webhooks (Tempo Real)
              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                Events
              </Badge>
            </CardTitle>
            <CardDescription>
              Notificações em tempo real para eventos de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">MESSAGES_UPSERT</span>
                <Badge variant="secondary">Mensagens entrantes</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="h-4 w-4 bg-blue-600 rounded-full" />
                <span className="text-sm font-medium">CONNECTION_UPDATE</span>
                <Badge variant="secondary">Status conexão</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="h-4 w-4 bg-yellow-600 rounded" />
                <span className="text-sm font-medium">QRCODE_UPDATED</span>
                <Badge variant="secondary">QR Code atualizado</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="h-4 w-4 bg-green-600 rounded" />
                <span className="text-sm font-medium">MESSAGE_ACK</span>
                <Badge variant="secondary">Entrega/Leitura</Badge>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-purple-100/50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Usado para:</strong> Receber mensagens, monitorar QR Code, 
                acompanhar estado da conexão e status de entrega.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Arquitetura */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Fluxo da Arquitetura Evolution API</CardTitle>
          <CardDescription>
            Como as duas abordagens trabalham juntas no Amplie Chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">1. Gestão Global</h4>
              <p className="text-sm text-blue-700 mt-1">
                Admin usa server-url + apikey para criar/gerenciar instâncias
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <Webhook className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900">2. Webhooks Ativos</h4>
              <p className="text-sm text-purple-700 mt-1">
                Evolution API notifica eventos em tempo real via webhooks
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-900">3. Interação</h4>
              <p className="text-sm text-green-700 mt-1">
                Sistema responde automaticamente via chatbot ou atendente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}