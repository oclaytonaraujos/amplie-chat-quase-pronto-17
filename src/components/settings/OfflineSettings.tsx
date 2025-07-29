/**
 * Configurações do modo offline
 */
import React from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useConnectivity } from '@/hooks/useConnectivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, HardDrive, Trash2, Download, RefreshCw } from 'lucide-react';

export function OfflineSettings() {
  const {
    isSupported,
    isRegistered,
    cacheSize,
    updateAvailable,
    registerSW,
    unregisterSW,
    updateSW,
    clearCache,
    getCacheSize,
    enableOfflineMode,
    disableOfflineMode
  } = useServiceWorker();

  const { isOnline, isSystemOnline, checkConnectivity } = useConnectivity();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Modo Offline
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta funcionalidades offline.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Status de Conectividade
          </CardTitle>
          <CardDescription>
            Status atual da sua conexão com a internet e sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Internet</span>
            <Badge variant={navigator.onLine ? "default" : "destructive"}>
              {navigator.onLine ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Sistema</span>
            <Badge variant={isSystemOnline ? "default" : "destructive"}>
              {isSystemOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnectivity}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Conectividade
          </Button>
        </CardContent>
      </Card>

      {/* Configurações do Modo Offline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Modo Offline
          </CardTitle>
          <CardDescription>
            Ative o modo offline para usar o sistema sem conexão com a internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Funcionalidade Offline</p>
              <p className="text-xs text-muted-foreground">
                Permite usar o sistema mesmo sem internet
              </p>
            </div>
            <Switch
              checked={isRegistered}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableOfflineMode();
                } else {
                  disableOfflineMode();
                }
              }}
            />
          </div>

          {isRegistered && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cache Utilizado</span>
                  <span>{formatBytes(cacheSize)}</span>
                </div>
                <Progress value={Math.min((cacheSize / (10 * 1024 * 1024)) * 100, 100)} />
                <p className="text-xs text-muted-foreground">
                  Máximo recomendado: 10 MB
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => getCacheSize()}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCache}
                  className="flex-1"
                  disabled={cacheSize === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>

              {updateAvailable && (
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Atualização Disponível</p>
                      <p className="text-xs text-muted-foreground">
                        Uma nova versão do sistema está disponível
                      </p>
                    </div>
                    <Button size="sm" onClick={updateSW}>
                      <Download className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}