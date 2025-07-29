import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Wifi, QrCode, RefreshCw, LogOut } from 'lucide-react';
import { useEvolutionApiV2 } from '@/hooks/useEvolutionApiV2';
import { useToast } from '@/hooks/use-toast';

export function EvolutionApiConfig() {
  const [apiKey, setApiKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { 
    status, 
    isConfigured, 
    configure, 
    checkStatus, 
    getQRCode,
    connectInstance,
    restartInstance,
    logoutInstance,
    setWebhook,
    disconnect 
  } = useEvolutionApiV2();
  const { toast } = useToast();

  // Carregar dados salvos
  useEffect(() => {
    const savedConfig = localStorage.getItem('evolution-api-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiKey(config.apiKey || '');
        setServerUrl(config.serverUrl || '');
        setInstanceName(config.instanceName || '');
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    }

    const savedWebhook = localStorage.getItem('evolution-api-webhook');
    if (savedWebhook) {
      setWebhookUrl(savedWebhook);
    }
  }, []);

  const handleConnect = async () => {
    if (!apiKey || !serverUrl || !instanceName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      configure({
        apiKey,
        serverUrl,
        instanceName,
        webhookUrl: webhookUrl || undefined,
      });

      // Conectar a instância (a criação é feita pelo EvolutionApiGlobalService)
      await connectInstance();

      toast({
        title: "Evolution API configurada",
        description: "Integração configurada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar com a Evolution API",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    await checkStatus();
    setIsCheckingStatus(false);
  };

  const handleGetQRCode = async () => {
    const result = await getQRCode();
    // Handle object response from Evolution API
    const qrString = result?.qrCode || null;
    setQrCode(qrString);
    if (!qrString) {
      toast({
        title: "QR Code não disponível",
        description: "Verifique o status da conexão",
        variant: "destructive",
      });
    }
  };

  const handleConfigureWebhook = async () => {
    if (webhookUrl) {
      const success = await setWebhook(webhookUrl);
      if (success) {
        localStorage.setItem('evolution-api-webhook', webhookUrl);
      }
    }
  };

  const handleRestart = async () => {
    await restartInstance();
  };

  const handleLogout = async () => {
    await logoutInstance();
    setQrCode(null);
  };

  const getStatusIcon = () => {
    if (status.connected) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getConnectionBadge = () => {
    if (!isConfigured) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    
    if (status.connected) {
      return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
    }
    
    if (status.instanceStatus === 'qr') {
      return <Badge className="bg-orange-100 text-orange-800">Aguardando QR Code</Badge>;
    }
    
    return <Badge variant="destructive">Offline</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-5 h-5" />
                <span>Configuração Evolution API</span>
              </CardTitle>
              <CardDescription>
                Configure sua instância Evolution API para envio e recebimento de mensagens WhatsApp
              </CardDescription>
            </div>
            {getConnectionBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua API Key da Evolution API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConfigured}
              />
            </div>
            <div>
              <Label htmlFor="serverUrl">URL do Servidor</Label>
              <Input
                id="serverUrl"
                placeholder="https://api.evolution-api.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={isConfigured}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              placeholder="minha-instancia"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={isConfigured}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {!isConfigured ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar Evolution API'
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleCheckStatus} 
                  disabled={isCheckingStatus}
                  variant="outline"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar Status'
                  )}
                </Button>
                
                {status.instanceStatus === 'qr' && (
                  <Button onClick={handleGetQRCode} variant="outline">
                    <QrCode className="w-4 h-4 mr-2" />
                    Obter QR Code
                  </Button>
                )}
                
                <Button onClick={handleRestart} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
                
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                
                <Button 
                  onClick={() => disconnect()}
                  variant="destructive"
                >
                  Desconectar
                </Button>
              </>
            )}
          </div>

          {isConfigured && (
            <Alert>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <AlertDescription>
                  <strong>Status:</strong> {status.instanceStatus}
                  {status.lastCheck && (
                    <span className="text-sm text-gray-500 ml-2">
                      (verificado em {status.lastCheck.toLocaleTimeString()})
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-semibold">Escaneie o QR Code com o WhatsApp</h3>
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 mx-auto block"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Abra o WhatsApp no seu celular, vá em <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong> e escaneie este código
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Webhook</CardTitle>
            <CardDescription>
              Configure o webhook para receber mensagens em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">URL do Webhook</Label>
              <Input
                id="webhookUrl"
                placeholder="https://sua-aplicacao.com/webhook/evolution-api"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleConfigureWebhook} disabled={!webhookUrl}>
              Configurar Webhook
            </Button>
            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Configure esta URL para receber mensagens automaticamente.
                A Evolution API enviará eventos para esta URL.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}