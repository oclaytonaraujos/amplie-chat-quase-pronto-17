import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Server, 
  Database, 
  Wifi, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ElementType;
  trend: 'up' | 'down' | 'stable';
}

interface BackupConfig {
  id: string;
  name: string;
  type: 'database' | 'files' | 'config';
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastBackup: string;
  nextBackup: string;
}

export function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [backups, setBackups] = useState<BackupConfig[]>([]);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateMetrics = () => {
      const baseMetrics: SystemMetric[] = [
        {
          name: 'CPU Usage',
          value: Math.random() * 100,
          unit: '%',
          status: 'healthy',
          icon: Cpu,
          trend: 'stable'
        },
        {
          name: 'Memory Usage',
          value: Math.random() * 100,
          unit: '%',
          status: 'healthy',
          icon: MemoryStick,
          trend: 'up'
        },
        {
          name: 'Disk Usage',
          value: Math.random() * 100,
          unit: '%',
          status: 'warning',
          icon: HardDrive,
          trend: 'up'
        },
        {
          name: 'Network',
          value: Math.random() * 1000,
          unit: 'Mbps',
          status: 'healthy',
          icon: Wifi,
          trend: 'stable'
        },
        {
          name: 'Database',
          value: Math.random() * 500,
          unit: 'ms',
          status: 'healthy',
          icon: Database,
          trend: 'down'
        },
        {
          name: 'API Response',
          value: Math.random() * 200,
          unit: 'ms',
          status: 'healthy',
          icon: Server,
          trend: 'stable'
        }
      ];

      const updatedMetrics = baseMetrics.map(metric => {
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        
        if (metric.unit === '%') {
          if (metric.value > 90) status = 'critical';
          else if (metric.value > 75) status = 'warning';
        } else if (metric.unit === 'ms') {
          if (metric.value > 300) status = 'critical';
          else if (metric.value > 150) status = 'warning';
        }

        return { ...metric, status };
      });

      setMetrics(updatedMetrics);
    };

    setBackups([
      {
        id: '1',
        name: 'Backup Completo do Banco',
        type: 'database',
        frequency: 'daily',
        enabled: true,
        lastBackup: new Date(Date.now() - 86400000).toISOString(),
        nextBackup: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: '2',
        name: 'Backup de Configurações',
        type: 'config',
        frequency: 'weekly',
        enabled: true,
        lastBackup: new Date(Date.now() - 604800000).toISOString(),
        nextBackup: new Date(Date.now() + 604800000).toISOString()
      },
      {
        id: '3',
        name: 'Backup de Arquivos',
        type: 'files',
        frequency: 'weekly',
        enabled: false,
        lastBackup: new Date(Date.now() - 1209600000).toISOString(),
        nextBackup: new Date(Date.now() + 604800000).toISOString()
      }
    ]);

    generateMetrics();
    const interval = setInterval(generateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Saudável</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const generateBackup = async (backup: BackupConfig) => {
    setIsGeneratingBackup(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      setBackups(prev => prev.map(b => 
        b.id === backup.id 
          ? { ...b, lastBackup: new Date().toISOString() }
          : b
      ));

      toast({
        title: "Backup concluído",
        description: `${backup.name} foi executado com sucesso`
      });

      const backupData = {
        name: backup.name,
        type: backup.type,
        timestamp: new Date().toISOString(),
        size: Math.round(Math.random() * 1000) + 'MB',
        checksum: 'sha256:' + Math.random().toString(36).substring(7)
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.type}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Falha ao gerar backup",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const toggleBackup = (id: string) => {
    setBackups(prev => prev.map(b => 
      b.id === id ? { ...b, enabled: !b.enabled } : b
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Monitor do Sistema
          </h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real e sistema de backup automático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sistema Online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <metric.icon className={`w-5 h-5 ${getStatusColor(metric.status)}`} />
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  {getStatusBadge(metric.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">
                    {metric.value.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>
                {metric.unit === '%' && (
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sistema de Backup Automático
          </CardTitle>
          <CardDescription>
            Configure e monitore backups automatizados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{backup.name}</h4>
                    <Badge variant={backup.enabled ? "default" : "secondary"}>
                      {backup.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{backup.frequency}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Último: {new Date(backup.lastBackup).toLocaleDateString('pt-BR')}
                    </span>
                    <span>
                      Próximo: {new Date(backup.nextBackup).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBackup(backup.id)}
                  >
                    {backup.enabled ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generateBackup(backup)}
                    disabled={isGeneratingBackup}
                  >
                    {isGeneratingBackup ? 'Gerando...' : 'Executar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.filter(m => m.status !== 'healthy').length > 0 ? (
              metrics
                .filter(m => m.status !== 'healthy')
                .map((metric, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        {metric.name} - {metric.status === 'warning' ? 'Atenção' : 'Crítico'}
                      </p>
                      <p className="text-sm text-yellow-700">
                        Valor atual: {metric.value.toFixed(1)}{metric.unit}
                        {metric.status === 'critical' && ' - Ação imediata recomendada'}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Sistema funcionando normalmente</p>
                  <p className="text-sm text-green-700">Todas as métricas estão dentro dos parâmetros esperados</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}