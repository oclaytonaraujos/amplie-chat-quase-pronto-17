import React, { useState } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode, 
  Plus, 
  Trash2, 
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useWhatsAppManager } from '@/hooks/useWhatsAppManager';
import { CreateInstanceDialog } from './CreateInstanceDialog';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  qrCode: string;
  instanceName: string;
}

function QRModal({ open, onClose, qrCode, instanceName }: QRModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <QrCode className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg mb-3">
            Conectar WhatsApp - {instanceName}
          </h3>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <img 
                src={qrCode} 
                alt="QR Code para conectar WhatsApp" 
                className="max-w-64 max-h-64"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>✓ Abra o WhatsApp no seu telefone</p>
            <p>✓ Vá em Configurações → Aparelhos conectados</p>
            <p>✓ Escaneie este QR Code</p>
          </div>
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnifiedWhatsAppDashboard() {
  const {
    globalConfig,
    instances,
    loading,
    connecting,
    stats,
    isConfigured,
    isServiceAvailable,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    checkInstanceStatus,
    refreshAll
  } = useWhatsAppManager();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    qrCode: string;
    instanceName: string;
  }>({ open: false, qrCode: '', instanceName: '' });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const handleConnect = async (instanceName: string) => {
    const success = await connectInstance(instanceName);
    if (success) {
      // Aguardar um pouco e verificar se há QR code
      setTimeout(async () => {
        await checkInstanceStatus(instanceName);
        const instance = instances.find(i => i.instance_name === instanceName);
        if (instance?.qr_code) {
          setQrModal({
            open: true,
            qrCode: instance.qr_code,
            instanceName
          });
        }
      }, 2000);
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    await disconnectInstance(instanceName);
  };

  const handleDelete = async (instanceName: string) => {
    await deleteInstance(instanceName);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Conectado',
          color: 'bg-green-100 text-green-800 border-green-200',
          bgColor: 'bg-green-50'
        };
      case 'connecting':
        return {
          icon: <Clock className="w-4 h-4 animate-pulse" />,
          text: 'Conectando',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          bgColor: 'bg-yellow-50'
        };
      case 'close':
      case 'disconnected':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: 'Desconectado',
          color: 'bg-red-100 text-red-800 border-red-200',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Desconhecido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          bgColor: 'bg-gray-50'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando configurações WhatsApp...</span>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Conexões WhatsApp</h2>
            <p className="text-muted-foreground">Configure a Evolution API para começar</p>
          </div>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <Settings className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Evolution API não está configurada. Configure a API global primeiro no painel de administração.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isServiceAvailable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Conexões WhatsApp</h2>
            <p className="text-muted-foreground">Serviço Evolution API indisponível</p>
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Não foi possível conectar com a Evolution API. Verifique as configurações no painel administrativo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conexões WhatsApp</h2>
          <p className="text-muted-foreground">
            Gerencie suas instâncias WhatsApp conectadas via Evolution API
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Conectadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Conectando</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.connecting}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Desconectadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.disconnected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Instâncias */}
      <div className="space-y-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instância WhatsApp
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua primeira instância para começar a usar o WhatsApp Business
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
          instances.map((instance) => {
            const statusInfo = getStatusInfo(instance.status);
            const isConnecting = connecting.has(instance.instance_name);
            
            return (
              <Card key={instance.id} className={`border-l-4 ${statusInfo.bgColor}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg border">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
                        <CardDescription>
                          {instance.numero ? `WhatsApp: ${instance.numero}` : 'Número não conectado'}
                          {instance.profile_name && ` • ${instance.profile_name}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusInfo.color}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.text}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>Criado: {new Date(instance.created_at).toLocaleDateString('pt-BR')}</p>
                      {instance.last_connected_at && (
                        <p>Última conexão: {new Date(instance.last_connected_at).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {instance.status === 'open' ? (
                        <Button
                          onClick={() => handleDisconnect(instance.instance_name)}
                          variant="outline"
                          size="sm"
                        >
                          <WifiOff className="w-4 h-4 mr-2" />
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(instance.instance_name)}
                          disabled={isConnecting}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isConnecting ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Wifi className="w-4 h-4 mr-2" />
                          )}
                          {isConnecting ? 'Conectando...' : 'Conectar'}
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir instância</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a instância <strong>{instance.instance_name}</strong>?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(instance.instance_name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <CreateInstanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInstanceCreated={() => {
          setShowCreateDialog(false);
          refreshAll();
        }}
      />

      <QRModal
        open={qrModal.open}
        onClose={() => setQrModal({ open: false, qrCode: '', instanceName: '' })}
        qrCode={qrModal.qrCode}
        instanceName={qrModal.instanceName}
      />
    </div>
  );
}