import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { Loader2, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { WhatsAppStatusIndicator } from './WhatsAppStatusIndicator';

export function WhatsAppConfig() {
  const { globalConfig, isConfigured, isLoading, updateGlobalConfig, instances } = useWhatsApp();
  
  const [config, setConfig] = useState({
    server_url: globalConfig?.server_url || '',
    api_key: globalConfig?.api_key || '',
    webhook_base_url: globalConfig?.webhook_base_url || ''
  });
  
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    setTesting(true);
    try {
      await updateGlobalConfig(config);
    } finally {
      setTesting(false);
    }
  };

  const isValidConfig = config.server_url && config.api_key;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração Evolution API
              </CardTitle>
              <CardDescription>
                Configure a conexão global com o servidor Evolution API
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Configurado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Não configurado</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="server_url">URL do Servidor</Label>
              <Input
                id="server_url"
                placeholder="https://evolution-api.exemplo.com"
                value={config.server_url}
                onChange={(e) => setConfig(prev => ({ ...prev, server_url: e.target.value }))}
                disabled={isLoading || testing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_key">Chave da API</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Sua chave da API"
                value={config.api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                disabled={isLoading || testing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook_base_url">URL Base do Webhook (Opcional)</Label>
              <Input
                id="webhook_base_url"
                placeholder="https://seu-app.supabase.co/functions/v1"
                value={config.webhook_base_url}
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_base_url: e.target.value }))}
                disabled={isLoading || testing}
              />
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={!isValidConfig || isLoading || testing}
            className="w-full"
          >
            {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar e Testar Conexão
          </Button>
        </CardContent>
      </Card>

      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Status das Instâncias</CardTitle>
            <CardDescription>
              Instâncias WhatsApp configuradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma instância configurada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {instances.map((instance) => (
                  <div key={instance.instanceName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{instance.instanceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {instance.numero || 'Número não definido'}
                        </p>
                      </div>
                    </div>
                    <WhatsAppStatusIndicator instanceName={instance.instanceName} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}