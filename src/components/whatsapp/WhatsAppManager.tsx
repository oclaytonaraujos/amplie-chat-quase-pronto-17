import React, { useState } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, QrCode, Settings, Plus, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useWhatsAppEvolution } from '@/hooks/useWhatsAppEvolution';
import { CreateInstanceDialog } from './CreateInstanceDialog';

/**
 * Componente principal para gerenciar conexões WhatsApp
 * Substitui WhatsAppConnections, WhatsAppConnectionsReal, etc.
 */
export function WhatsAppManager() {
  const {
    instances,
    globalConfig,
    loading,
    isConfigured,
    globalStatus,
    refreshInstances,
    testConnection,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    getConnectionState
  } = useWhatsAppEvolution();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState<string | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // Verificar status de uma instância
  const handleCheckStatus = async (instanceName: string) => {
    try {
      const state = await getConnectionState(instanceName);
      if (state?.instance?.qrcode) {
        setQrCodes(prev => ({ ...prev, [instanceName]: state.instance.qrcode }));
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Conectar instância
  const handleConnect = async (instanceName: string) => {
    setConnectingInstance(instanceName);
    try {
      await connectInstance(instanceName);
      
      // Verificar QR Code após conectar
      setTimeout(() => {
        handleCheckStatus(instanceName);
      }, 2000);
    } finally {
      setConnectingInstance(null);
    }
  };

  // Desconectar instância
  const handleDisconnect = async (instanceName: string) => {
    await disconnectInstance(instanceName);
    setQrCodes(prev => {
      const newQrCodes = { ...prev };
      delete newQrCodes[instanceName];
      return newQrCodes;
    });
  };

  // Deletar instância
  const handleDelete = async (instanceName: string) => {
    setDeletingInstance(instanceName);
    try {
      await deleteInstance(instanceName);
      setQrCodes(prev => {
        const newQrCodes = { ...prev };
        delete newQrCodes[instanceName];
        return newQrCodes;
      });
    } finally {
      setDeletingInstance(null);
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
      case 'qr_required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
      case 'close':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'qr_required':
        return 'QR Code Necessário';
      case 'disconnected':
      case 'close':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'qr_required':
        return <QrCode className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando conexões WhatsApp...</span>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
            <p className="text-gray-600">Configure a Evolution API para gerenciar suas conexões WhatsApp</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Evolution API não configurada. Acesse as configurações globais para configurar a integração.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp via Evolution API</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(globalStatus)}>
            {getStatusIcon(globalStatus)}
            <span className="ml-1">Status Geral: {getStatusText(globalStatus)}</span>
          </Badge>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância WhatsApp
            </h3>
            <p className="text-gray-600 mb-6">
              Crie sua primeira instância WhatsApp para começar a atender seus clientes
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">{instance.instance_name}</span>
                      {instance.numero && (
                        <p className="text-sm text-muted-foreground">+{instance.numero}</p>
                      )}
                      {instance.profile_name && (
                        <p className="text-sm text-muted-foreground">{instance.profile_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(instance.status)}>
                      {getStatusIcon(instance.status)}
                      <span className="ml-1">{getStatusText(instance.status)}</span>
                    </Badge>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleCheckStatus(instance.instance_name)}
                        title="Verificar status"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Deletar instância"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta instância WhatsApp? Esta ação não pode ser desfeita.
                              <br /><br />
                              <strong>Instância:</strong> {instance.instance_name}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(instance.instance_name)}
                              disabled={deletingInstance === instance.instance_name}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingInstance === instance.instance_name ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                  Excluindo...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  {(instance.status === 'disconnected' || instance.status === 'close' || instance.status === 'DISCONNECTED') && (
                    <Button
                      onClick={() => handleConnect(instance.instance_name)}
                      disabled={connectingInstance === instance.instance_name}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {connectingInstance === instance.instance_name ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <QrCode className="w-4 h-4 mr-2" />
                      )}
                      Conectar WhatsApp
                    </Button>
                  )}
                  
                  {(instance.status === 'connected' || instance.status === 'open' || instance.status === 'CONNECTED') && (
                    <Button
                      onClick={() => handleDisconnect(instance.instance_name)}
                      variant="outline"
                      className="flex-1"
                    >
                      <WifiOff className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                </div>

                {qrCodes[instance.instance_name] && (
                  <div className="border rounded-xl p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                        <QrCode className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">
                        Escaneie o QR Code com seu WhatsApp
                      </h3>
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                          <img 
                            src={qrCodes[instance.instance_name]} 
                            alt="QR Code para conectar WhatsApp" 
                            className="max-w-xs max-h-64"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>✓ Abra o WhatsApp no seu telefone</p>
                        <p>✓ Vá em Configurações → Aparelhos conectados</p>
                        <p>✓ Escaneie este QR Code</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateInstanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInstanceCreated={() => {
          setShowCreateDialog(false);
          refreshInstances();
        }}
      />
    </div>
  );
}