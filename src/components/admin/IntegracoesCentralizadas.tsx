import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Settings, Webhook, Activity } from 'lucide-react';
import { WebhooksCentralizados } from './WebhooksCentralizados';
import IntegracaoSimples from './IntegracaoSimples';
import { InstanciasWhatsAppAdmin } from './InstanciasWhatsAppAdmin';
import { N8nIntegrationManager } from './N8nIntegrationManager';
import { useRealData } from '@/hooks/useRealData';

export default function IntegracoesCentralizadas() {
  const [instancias, setInstancias] = useState<any[]>([]);
  const { loadEvolutionInstances, loading } = useRealData();

  useEffect(() => {
    const loadData = async () => {
      const data = await loadEvolutionInstances();
      setInstancias(data);
    };
    loadData();
  }, [loadEvolutionInstances]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações Centralizadas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas integrações e conexões WhatsApp em um só lugar
        </p>
      </div>

      <Tabs defaultValue="simples" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            n8n
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
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <InstanciasWhatsAppAdmin instancias={instancias} />
        )}
      </TabsContent>

      <TabsContent value="webhooks">
        <WebhooksCentralizados />
      </TabsContent>

      <TabsContent value="n8n">
        <N8nIntegrationManager />
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