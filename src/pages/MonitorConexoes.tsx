import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionMonitor } from '@/components/monitoring/ConnectionMonitor';
import { ConnectionMetrics } from '@/components/monitoring/ConnectionMetrics';
import { Activity, BarChart3 } from 'lucide-react';

export default function MonitorConexoes() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Monitor de Conexões</h1>
        <p className="text-muted-foreground">
          Acompanhe o status e performance das suas conexões WhatsApp em tempo real
        </p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitor em Tempo Real
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Métricas e Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <ConnectionMonitor />
        </TabsContent>

        <TabsContent value="metrics">
          <ConnectionMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}