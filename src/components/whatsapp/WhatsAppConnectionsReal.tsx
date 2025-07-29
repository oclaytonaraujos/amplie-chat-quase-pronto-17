
import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, QrCode, Settings, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreateInstanceDialog } from './CreateInstanceDialog';

export function WhatsAppConnectionsReal() {
const { 
    config, 
    instanceConfig,
    loading, 
    isServiceAvailable,
    connectInstance,
    getConnectionState,
    deleteInstance,
    testApiConnection,
    loadGlobalConfig
  } = useEvolutionAPIComplete();
  
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('desconhecido');
  const [verificandoStatus, setVerificandoStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState(false);

  // Verificar status da conexão ao carregar
  useEffect(() => {
    if (instanceConfig && !loading) {
      handleVerificarStatus();
    }
  }, [instanceConfig, loading]);

  const handleObterQRCode = async () => {
    if (!instanceConfig) return;
    
    try {
      setConnecting(true);
      const response = await connectInstance(instanceConfig.instance_name);
      if (response) {
        // Aguardar um pouco e verificar se há QR code disponível
        setTimeout(() => handleVerificarStatus(), 2000);
        setStatus('aguardando-conexao');
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível iniciar a conexão",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar instância WhatsApp",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleVerificarStatus = async () => {
    if (!instanceConfig) return;
    
    try {
      setVerificandoStatus(true);
      const response = await getConnectionState(instanceConfig.instance_name);
      
      if (response && response.instance) {
        const instanceState = response.instance.state;
        setStatus(instanceState || 'desconectado');
        
        if (instanceState === 'open') {
          setQrCode(null); // Limpar QR Code se conectado
        } else if (response.instance.qrcode) {
          setQrCode(response.instance.qrcode);
        }
      } else {
        setStatus('desconectado');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus('erro');
    } finally {
      setVerificandoStatus(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceConfig) return;
    
    try {
      setDeletingInstance(true);
      const response = await deleteInstance(instanceConfig.instance_name);
      
      if (response) {
        toast({
          title: "Sucesso",
          description: "Instância deletada com sucesso!",
        });
        
        // Recarregar configurações para atualizar o estado
        await loadGlobalConfig();
        setStatus('desconectado');
        setQrCode(null);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível deletar a instância",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar instância WhatsApp",
        variant: "destructive",
      });
    } finally {
      setDeletingInstance(false);
    }
  };

  const handleInstanceCreated = async () => {
    // Recarregar configurações para buscar a nova instância
    await loadGlobalConfig();
    setShowCreateDialog(false);
    setStatus('desconectado');
    setQrCode(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'CONNECTED':
      case 'conectado':
        return 'bg-green-100 text-green-800';
      case 'connecting':
      case 'aguardando-conexao':
        return 'bg-yellow-100 text-yellow-800';
      case 'close':
      case 'desconectado':
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
      case 'CONNECTED':
      case 'conectado':
        return 'Conectado';
      case 'connecting':
      case 'aguardando-conexao':
        return 'Conectando';
      case 'close':
      case 'desconectado':
      case 'DISCONNECTED':
        return 'Desconectado';
      case 'erro':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'CONNECTED':
      case 'conectado':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'aguardando-conexao':
        return <QrCode className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando configurações...</span>
      </div>
    );
  }

  if (!instanceConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
            <p className="text-gray-600">Crie e gerencie suas conexões com o WhatsApp via Evolution API</p>
          </div>
        </div>

        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Nenhuma configuração Evolution API encontrada. Crie sua primeira instância para começar.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="text-center py-12">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Primeira Conexão WhatsApp
            </h3>
            <p className="text-gray-600 mb-6">
              Crie sua primeira instância WhatsApp através do AmplieChat para começar a atender seus clientes
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

        <CreateInstanceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onInstanceCreated={handleInstanceCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
          <p className="text-gray-600">Gerencie suas conexões com o WhatsApp via Evolution API</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Instância
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="text-lg font-semibold">WhatsApp: {instanceConfig.instance_name}</span>
                <p className="text-sm text-muted-foreground mt-1">Status da sua conexão</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(status)}>
                {getStatusIcon(status)}
                <span className="ml-1">{getStatusText(status)}</span>
              </Badge>
               <div className="flex space-x-1">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 w-8 p-0"
                   onClick={() => setShowCreateDialog(true)}
                   title="Editar instância"
                 >
                   <Edit3 className="w-4 h-4" />
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
                         <strong>Instância:</strong> {instanceConfig.instance_name}
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction
                         onClick={handleDeleteInstance}
                         disabled={deletingInstance}
                         className="bg-red-600 hover:bg-red-700"
                       >
                         {deletingInstance ? (
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
        
        <CardContent className="space-y-6">
          <div className="flex space-x-3">
            <Button
              onClick={handleVerificarStatus}
              disabled={verificandoStatus}
              variant="outline"
              className="flex-1"
            >
              {verificandoStatus ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Verificar Status
            </Button>

            {(status === 'desconectado' || status === 'DISCONNECTED' || status === 'close') && (
              <Button
                onClick={handleObterQRCode}
                disabled={connecting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Conectar WhatsApp
              </Button>
            )}
          </div>

          {qrCode && (
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
                      src={qrCode} 
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

      <CreateInstanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInstanceCreated={handleInstanceCreated}
      />
    </div>
  );
}
