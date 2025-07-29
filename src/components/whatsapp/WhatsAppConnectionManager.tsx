import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, QrCode, Plus, Edit3, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useEvolutionIntegration } from '@/hooks/useEvolutionIntegration';
import { useEvolutionApiStatus } from '@/hooks/useEvolutionApiStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionName: string;
  qrCode: string | null;
  onRefreshQR: () => void;
  isRefreshing: boolean;
}
const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  connectionName,
  qrCode,
  onRefreshQR,
  isRefreshing
}) => {
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<number>(45);
  useEffect(() => {
    if (!isOpen) return;

    // Iniciar timer assim que o modal abrir
    setAutoRefreshTimer(45);
    const interval = setInterval(() => {
      setAutoRefreshTimer(prev => {
        if (prev <= 1) {
          // Auto-refresh do QR code quando expirar
          onRefreshQR();
          return 45; // Reset timer para próximo ciclo
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, onRefreshQR]);
  useEffect(() => {
    if (isOpen) {
      setAutoRefreshTimer(45);
    }
  }, [isOpen]);
  if (!isOpen) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conectar WhatsApp - {connectionName}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {qrCode ? <>
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code para conectar WhatsApp" className="w-64 h-64" onError={e => {
                console.error('Erro ao carregar QR Code:', e);
                console.log('QR Code data:', qrCode.substring(0, 100) + '...');
              }} onLoad={() => {
                console.log('QR Code carregado com sucesso');
              }} />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  QR Code expira em: <strong>{autoRefreshTimer}s</strong>
                </p>
                <Button onClick={onRefreshQR} disabled={isRefreshing} variant="outline" size="sm">
                  {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Atualizar QR Code
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Abra o WhatsApp no seu telefone</p>
                <p>• Vá em Configurações → Aparelhos conectados</p>
                <p>• Toque em "Conectar um aparelho"</p>
                <p>• Escaneie este QR Code</p>
              </div>
            </> : <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p>Gerando QR Code...</p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};
interface CreateEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
  editingInstance?: {
    id: string;
    instance_name: string;
  } | null;
}
const CreateEditDialog: React.FC<CreateEditDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingInstance
}) => {
  const [instanceName, setInstanceName] = useState('');
  useEffect(() => {
    if (editingInstance) {
      setInstanceName(editingInstance.instance_name);
    } else {
      setInstanceName('');
    }
  }, [editingInstance, isOpen]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instanceName.trim()) {
      onSubmit(instanceName.trim());
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingInstance ? 'Editar Conexão WhatsApp' : 'Nova Conexão WhatsApp'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instanceName">Nome da Conexão</Label>
            <Input id="instanceName" value={instanceName} onChange={e => setInstanceName(e.target.value)} placeholder="Ex: Atendimento Principal" required />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !instanceName.trim()}>
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingInstance ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export function WhatsAppConnectionManager() {
  const {
    config,
    instances,
    loading,
    connected,
    createInstance,
    deleteInstance,
    connectInstance,
    logoutInstance,
    loadInstances
  } = useEvolutionIntegration();
  const { refreshInstanceStatus } = useEvolutionApiStatus();
  const {
    toast
  } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingInstance, setEditingInstance] = useState<{
    id: string;
    instance_name: string;
  } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQR, setCurrentQR] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [connectionStates, setConnectionStates] = useState<Record<string, string>>({});
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  // Função para atualizar status da instância no banco
  const updateInstanceStatus = useCallback(async (instanceName: string, status: string, connectionState: string) => {
    try {
      await supabase.from('evolution_api_config').update({
        status,
        connection_state: connectionState,
        last_connected_at: status === 'connected' ? new Date().toISOString() : null
      }).eq('instance_name', instanceName);
      console.log(`Status atualizado para ${instanceName}: ${status}/${connectionState}`);
    } catch (error) {
      console.error('Erro ao atualizar status no banco:', error);
    }
  }, []);

  // Função para configurar webhook na instância
  const configureWebhook = useCallback(async (instanceName: string) => {
    try {
      // Garantir que a configuração está carregada
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (!globalConfig?.server_url || !globalConfig?.api_key) {
        throw new Error('Configuração Evolution API não encontrada');
      }

      const webhookUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution';
      const response = await fetch(`${globalConfig.server_url}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
        })
      });

      if (response.ok) {
        console.log('Webhook configurado com sucesso para:', instanceName);

        // Atualizar configuração no banco
        await supabase.from('evolution_api_config').update({
          webhook_url: webhookUrl,
          webhook_events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
        }).eq('instance_name', instanceName);
        return true;
      } else {
        console.error('Erro ao configurar webhook:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      return false;
    }
  }, []);

  // Verificar estado das conexões periodicamente usando o novo hook
  const checkConnectionStates = useCallback(async () => {
    if (!config.api_key || !config.server_url || instances.length === 0) return;

    // Usar o hook de status para verificação mais robusta
    for (const instance of instances) {
      try {
        const status = await refreshInstanceStatus(instance.instance_name);
        setConnectionStates(prev => ({
          ...prev,
          [instance.instance_name]: status.status
        }));

        // Se estava conectando e agora está conectado, fechar modal QR
        if ((connectionStates[instance.instance_name] === 'connecting' || connectionStates[instance.instance_name] === 'disconnected') && status.status === 'connected' && selectedInstance === instance.instance_name && showQRModal) {
          setShowQRModal(false);
          setCurrentQR(null);

          toast({
            title: "Conexão realizada!",
            description: `WhatsApp ${instance.instance_name} conectado com sucesso!`
          });
        }

        // Configurar webhook para instâncias conectadas
        if (status.status === 'connected' && (!instance.webhook_url || instance.webhook_url !== 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution')) {
          console.log(`Configurando webhook para instância conectada: ${instance.instance_name}`);
          await configureWebhook(instance.instance_name);
        }
      } catch (error) {
        console.error(`Erro ao verificar status da instância ${instance.instance_name}:`, error);
        setConnectionStates(prev => ({
          ...prev,
          [instance.instance_name]: 'error'
        }));
      }
    }
  }, [config, instances, connectionStates, selectedInstance, showQRModal, toast, refreshInstanceStatus, configureWebhook]);
  useEffect(() => {
    if (connected && instances.length > 0) {
      // Verificar estados inicialmente
      checkConnectionStates();

      // Verificar estados a cada 5 segundos
      const interval = setInterval(checkConnectionStates, 5000);
      return () => clearInterval(interval);
    }
  }, [connected, instances, checkConnectionStates]);
  const handleCreateInstance = async (name: string) => {
    setOperationLoading(prev => ({
      ...prev,
      create: true
    }));
    try {
      const success = await createInstance(name);
      if (success) {
        setShowCreateDialog(false);
        await loadInstances();
      }
    } finally {
      setOperationLoading(prev => ({
        ...prev,
        create: false
      }));
    }
  };
  const handleEditInstance = (instance: any) => {
    setEditingInstance({
      id: instance.id,
      instance_name: instance.instance_name
    });
    setShowCreateDialog(true);
  };
  const handleUpdateInstance = async (name: string) => {
    // Por enquanto, apenas fechamos o modal já que a API Evolution não tem endpoint de update
    setShowCreateDialog(false);
    setEditingInstance(null);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de conexões será disponibilizada em breve",
      variant: "destructive"
    });
  };
  const handleDeleteInstance = async (instanceName: string) => {
    setOperationLoading(prev => ({
      ...prev,
      [instanceName]: true
    }));
    try {
      const success = await deleteInstance(instanceName);
      if (success) {
        await loadInstances();
        // Limpar estado da conexão deletada
        setConnectionStates(prev => {
          const newStates = {
            ...prev
          };
          delete newStates[instanceName];
          return newStates;
        });
      }
    } finally {
      setOperationLoading(prev => ({
        ...prev,
        [instanceName]: false
      }));
    }
  };
  const handleConnect = async (instanceName: string) => {
    setOperationLoading(prev => ({
      ...prev,
      [instanceName]: true
    }));
    try {
      const success = await connectInstance(instanceName);
      if (success) {
        setSelectedInstance(instanceName);
        setShowQRModal(true);

        // Buscar QR code após um breve delay
        setTimeout(async () => {
          await handleRefreshQR(instanceName);
        }, 2000);
      }
    } finally {
      setOperationLoading(prev => ({
        ...prev,
        [instanceName]: false
      }));
    }
  };
  const handleRefreshQR = async (instanceName?: string) => {
    const targetInstance = instanceName || selectedInstance;
    if (!targetInstance) return;
    setIsRefreshingQR(true);
    try {
      const response = await fetch(`${config.server_url}/instance/connect/${targetInstance}`, {
        method: 'GET',
        headers: {
          apikey: config.api_key
        }
      });
      if (response.ok) {
        const data = await response.json();
        const qrCodeData = data.base64 || data.qrcode || data.qr || data.qrCode;
        if (qrCodeData) {
          setCurrentQR(qrCodeData);
        }
      }
    } catch (error) {
      console.error('Erro ao renovar QR Code:', error);
    } finally {
      setIsRefreshingQR(false);
    }
  };
  const handleDisconnect = async (instanceName: string) => {
    setOperationLoading(prev => ({
      ...prev,
      [instanceName]: true
    }));
    try {
      const success = await logoutInstance(instanceName);
      if (success) {
        await loadInstances();
        setConnectionStates(prev => ({
          ...prev,
          [instanceName]: 'disconnected'
        }));
      }
    } finally {
      setOperationLoading(prev => ({
        ...prev,
        [instanceName]: false
      }));
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
      case 'qr':
        return 'bg-yellow-100 text-yellow-800';
      case 'close':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'Conectado';
      case 'connecting':
      case 'qr':
        return 'Conectando';
      case 'close':
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Verificando...';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'qr':
        return <QrCode className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando conexões WhatsApp...</span>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
          
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {instances.length === 0 ? <Card>
          
        </Card> : <div className="grid gap-4">
          {instances.map(instance => {
        const status = connectionStates[instance.instance_name] || 'checking';
        const isConnected = status === 'open' || status === 'connected';
        const needsConnection = !isConnected; // Mostra botão conectar até que esteja realmente conectado

        return <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">{instance.instance_name}</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {instance.numero || 'Número não vinculado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{getStatusText(status)}</span>
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditInstance(instance)} title="Editar conexão">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Excluir conexão">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta conexão WhatsApp? Esta ação não pode ser desfeita.
                                <br /><br />
                                <strong>Conexão:</strong> {instance.instance_name}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteInstance(instance.instance_name)} disabled={operationLoading[instance.instance_name]} className="bg-red-600 hover:bg-red-700">
                                {operationLoading[instance.instance_name] ? <>
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    Excluindo...
                                  </> : <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </>}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                 <CardContent>
                   <div className="flex space-x-2">
                     {needsConnection && <Button onClick={() => handleConnect(instance.instance_name)} disabled={operationLoading[instance.instance_name]} className="bg-green-600 hover:bg-green-700">
                         {operationLoading[instance.instance_name] ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                         {status === 'connecting' || status === 'qr' ? 'Gerar QR Code' : 'Conectar'}
                       </Button>}
                     
                     {isConnected && <>
                         <Button onClick={() => handleDisconnect(instance.instance_name)} disabled={operationLoading[instance.instance_name]} variant="destructive">
                           {operationLoading[instance.instance_name] ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                           Desconectar
                         </Button>
                         
                         <Button onClick={() => configureWebhook(instance.instance_name)} variant="outline" size="sm">
                           <RefreshCw className="w-4 h-4 mr-2" />
                           Sync Webhook
                         </Button>
                       </>}
                   </div>
                 </CardContent>
              </Card>;
      })}
        </div>}

      <CreateEditDialog isOpen={showCreateDialog} onClose={() => {
      setShowCreateDialog(false);
      setEditingInstance(null);
    }} onSubmit={editingInstance ? handleUpdateInstance : handleCreateInstance} isLoading={operationLoading.create} editingInstance={editingInstance} />

      <QRCodeModal isOpen={showQRModal} onClose={() => {
      setShowQRModal(false);
      setCurrentQR(null);
      setSelectedInstance('');
    }} connectionName={selectedInstance} qrCode={currentQR} onRefreshQR={() => handleRefreshQR()} isRefreshing={isRefreshingQR} />
    </div>;
}