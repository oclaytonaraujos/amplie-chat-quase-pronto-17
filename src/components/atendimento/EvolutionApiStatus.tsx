import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, RotateCcw } from 'lucide-react';
import { useEvolutionApiSync } from '@/hooks/useEvolutionApiSync';
import { useWhatsAppStatusMonitor } from '@/hooks/useWhatsAppStatusMonitor';

interface WhatsAppConnection {
  id: string;
  instance_name: string;
  status: string;
  send_webhook_url: string | null;
  evolution_api_token: string | null;
}

export function EvolutionApiStatus() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncInstanceStatus, connectInstance, restartInstance, loading: syncLoading } = useEvolutionApiSync();
  
  // Monitoramento automático de status
  useWhatsAppStatusMonitor({ enabled: true, interval: 30000 });

  const loadConnectionsAndConfig = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar configuração global da Evolution API
      const { data: globalConfigData, error: globalError } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (globalError && globalError.code !== 'PGRST116') {
        throw new Error('Configuração global da Evolution API não encontrada');
      }

      setGlobalConfig(globalConfigData);

      // Buscar conexões da empresa
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        setError('Empresa não encontrada');
        return;
      }

      const { data, error: connectionError } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true);

      if (connectionError) {
        throw connectionError;
      }

      const mappedConnections = (data || []).map((conn: any) => ({
        id: conn.id,
        instance_name: conn.instance_name || 'Conexão sem nome',
        status: conn.status || 'disconnected',
        send_webhook_url: conn.webhook_url,
        evolution_api_token: globalConfigData?.api_key
      }));

      setConnections(mappedConnections);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectionsAndConfig();
  }, [user]);

  const getStatusIcon = (connection: WhatsAppConnection) => {
    const hasGlobalConfig = !!globalConfig;
    const isConnected = connection.status === 'open';

    if (hasGlobalConfig && isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (hasGlobalConfig) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (connection: WhatsAppConnection) => {
    const hasGlobalConfig = !!globalConfig;
    const isConnected = connection.status === 'open';

    if (hasGlobalConfig && isConnected) {
      return 'Conectado';
    } else if (hasGlobalConfig && connection.status === 'close') {
      return 'Desconectado';
    } else if (hasGlobalConfig && connection.status === 'connecting') {
      return 'Conectando';
    } else if (hasGlobalConfig && connection.status === 'qr') {
      return 'Aguardando QR Code';
    } else if (hasGlobalConfig) {
      return 'Aguardando conexão';
    } else {
      return 'Configuração global não encontrada';
    }
  };

  const getStatusVariant = (connection: WhatsAppConnection) => {
    const hasGlobalConfig = !!globalConfig;
    const isConnected = connection.status === 'open';

    if (hasGlobalConfig && isConnected) {
      return 'default' as const;
    } else if (hasGlobalConfig) {
      return 'secondary' as const;
    } else {
      return 'destructive' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Verificando configuração...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao verificar configuração: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (connections.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma conexão WhatsApp configurada. Configure uma conexão Evolution API 
          para enviar mensagens.
        </AlertDescription>
      </Alert>
    );
  }

  const hasGlobalConfig = !!globalConfig;
  const connectedInstances = connections.filter(conn => conn.status === 'open');

  return (
    <div className="space-y-3">
      {!hasGlobalConfig && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Configuração global da Evolution API não encontrada. 
            Configure no painel de administração.
          </AlertDescription>
        </Alert>
      )}

      {hasGlobalConfig && connectedInstances.length === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma instância WhatsApp conectada. 
            Verifique o status das conexões.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Status das Conexões WhatsApp</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadConnectionsAndConfig}
            className="h-6 px-2"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        {connections.map((connection) => (
          <div 
            key={connection.id} 
            className="flex items-center justify-between p-2 border rounded-lg"
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(connection)}
              <span className="text-sm font-medium">
                {connection.instance_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(connection)}>
                {getStatusText(connection)}
              </Badge>
              {connection.status !== 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connectInstance(connection.instance_name)}
                  disabled={syncLoading}
                  className="h-6 px-2"
                >
                  <Wifi className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => restartInstance(connection.instance_name)}
                disabled={syncLoading}
                className="h-6 px-2"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => syncInstanceStatus(connection.instance_name)}
                disabled={syncLoading}
                className="h-6 px-2"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}