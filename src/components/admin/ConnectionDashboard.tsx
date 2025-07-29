import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionMonitor } from '@/components/monitoring/ConnectionMonitor';
import { ConnectionMetrics } from '@/components/monitoring/ConnectionMetrics';
import { useAllInstances } from '@/hooks/useAllInstances';
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Plus,
  Smartphone,
  Server,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionDashboard() {
  const { instances, loading, getStats } = useAllInstances();
  const stats = getStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <Badge variant="default">Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Conectando</Badge>;
      case 'close':
      case 'disconnected':
        return <Badge variant="outline">Desconectado</Badge>;
      default:
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Stats Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Instâncias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
                <p className="text-sm text-muted-foreground">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.disconnected}</p>
                <p className="text-sm text-muted-foreground">Desconectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Monitoramento */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="instances" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Instâncias
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          </div>
        </div>

        <TabsContent value="overview">
          <ConnectionMonitor />
        </TabsContent>

        <TabsContent value="metrics">
          <ConnectionMetrics />
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : instances.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Smartphone className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma instância encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie uma nova instância para começar a usar o WhatsApp Business
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Instância
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {instances.map((instance) => (
                <Card key={instance.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          instance.status === 'open' ? 'bg-green-500' :
                          instance.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                          'bg-red-500'
                        )} />
                        <div>
                          <h4 className="font-medium">{instance.instance_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {instance.numero && (
                              <span>{instance.numero}</span>
                            )}
                            {instance.empresa_nome && (
                              <span>• {instance.empresa_nome}</span>
                            )}
                            <span>• {new Date(instance.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(instance.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {instance.descricao && (
                      <p className="text-sm text-muted-foreground mt-2 pl-6">
                        {instance.descricao}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}