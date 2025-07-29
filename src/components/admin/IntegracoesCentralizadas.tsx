import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Settings, Webhook, Activity } from 'lucide-react';
import { WebhooksCentralizados } from './WebhooksCentralizados';
import IntegracaoSimples from './IntegracaoSimples';
import { InstanciasWhatsAppAdmin } from './InstanciasWhatsAppAdmin';

// Mock data - replace with actual data from your API
const mockInstancias = [
  {
    id: '1',
    instance_name: 'whatsapp-principal',
    numero: '+55 11 99999-9999',
    status: 'open' as const,
    ativo: true,
    empresa_nome: 'Empresa Principal',
    webhook_status: 'ativo' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    instance_name: 'whatsapp-suporte',
    numero: '+55 11 88888-8888',
    status: 'close' as const,
    ativo: true,
    empresa_nome: 'Empresa Suporte',
    webhook_status: 'inativo' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export default function IntegracoesCentralizadas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações Centralizadas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas integrações e conexões WhatsApp em um só lugar
        </p>
      </div>

      <Tabs defaultValue="simples" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="simples" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuração Simples
          </TabsTrigger>
          <TabsTrigger value="instancias" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Instâncias WhatsApp
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

      <TabsContent value="simples">
        <IntegracaoSimples />
      </TabsContent>

      <TabsContent value="instancias">
        <InstanciasWhatsAppAdmin instancias={mockInstancias} />
      </TabsContent>

      <TabsContent value="webhooks">
        <WebhooksCentralizados />
      </TabsContent>

      <TabsContent value="monitoring">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Monitoramento em Desenvolvimento</h3>
          <p className="text-muted-foreground">Este painel estará disponível em breve.</p>
        </div>
      </TabsContent>
    </Tabs>
    </div>
  );
}