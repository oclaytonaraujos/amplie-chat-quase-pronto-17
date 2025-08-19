import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Lock, Activity, Download, RefreshCw } from 'lucide-react';
import { useSecurityMonitor, SecurityEvent, SecurityMetrics } from '@/utils/security-monitor';
import { useBackupSystem, BackupMetadata } from '@/utils/backup-system';
import { toast } from '@/hooks/use-toast';
import { SyncLoaderSection } from '@/components/ui/sync-loader';

export function SecurityDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  
  const securityMonitor = useSecurityMonitor();
  const backupSystem = useBackupSystem();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [metrics, events, backupList] = await Promise.all([
        securityMonitor.getMetrics(),
        securityMonitor.getRecentEvents(20),
        backupSystem.listBackups()
      ]);
      
      setSecurityMetrics(metrics);
      setRecentEvents(events);
      setBackups(backupList);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de segurança",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      await backupSystem.createBackup({
        tables: ['profiles', 'empresas', 'atendimentos', 'mensagens'],
        includeFiles: false,
        compression: true
      });
      
      loadData(); // Recarregar lista de backups
    } catch (error) {
      // Toast já mostrado pelo sistema de backup
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventTypeIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt': return '🔑';
      case 'permission_violation': return '🚫';
      case 'data_access': return '📊';
      case 'suspicious_activity': return '⚠️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <SyncLoaderSection text="Carregando dados de segurança..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas críticos */}
      {securityMetrics && securityMetrics.criticalEvents > 0 && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{securityMetrics.criticalEvents} eventos críticos</strong> detectados nas últimas 24h.
            Verifique os logs de segurança imediatamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas de segurança */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics?.recentAttempts || 0} na última hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {securityMetrics?.criticalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Bloqueados</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.blockedIPs.length || 0}</div>
            <p className="text-xs text-muted-foreground">Ativos no momento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Padrões Suspeitos</CardTitle>
            <Lock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.suspiciousPatterns || 0}</div>
            <p className="text-xs text-muted-foreground">Detectados hoje</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos de Segurança</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="blocked">IPs Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>
                Últimos 20 eventos de segurança registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                ) : (
                  recentEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{event.type.replace('_', ' ')}</span>
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.userId && `Usuário: ${event.userId}`}
                            {event.ip && ` • IP: ${event.ip}`}
                            {event.resource && ` • Recurso: ${event.resource}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Backups do Sistema</CardTitle>
                <CardDescription>
                  Gerencie backups e restaurações dos dados
                </CardDescription>
              </div>
              <Button onClick={createBackup}>
                <Download className="w-4 h-4 mr-2" />
                Criar Backup
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum backup encontrado</p>
                ) : (
                  backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{backup.id}</span>
                          <Badge variant={backup.status === 'completed' ? 'default' : 'destructive'}>
                            {backup.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {backup.tables.length} tabelas • {(backup.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(backup.timestamp).toLocaleString()}
                        </span>
                        {backup.downloadUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(backup.downloadUrl, '_blank')}
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IPs Bloqueados</CardTitle>
              <CardDescription>
                Lista de endereços IP atualmente bloqueados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!securityMetrics?.blockedIPs.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum IP bloqueado no momento</p>
                ) : (
                  securityMetrics.blockedIPs.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-destructive" />
                        <span className="font-mono">{ip}</span>
                      </div>
                      <Badge variant="destructive">Bloqueado</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}