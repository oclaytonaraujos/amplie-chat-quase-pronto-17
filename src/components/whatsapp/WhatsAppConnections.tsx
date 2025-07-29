
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Smartphone, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConnection {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'pending' | 'waiting_approval';
  qrCode?: string;
  lastActivity?: Date;
  isActive: boolean;
  needsProviderApproval: boolean;
}

export function WhatsAppConnections() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([
    {
      id: '1',
      name: 'WhatsApp Principal',
      phone: '+55 11 99999-9999',
      status: 'connected',
      lastActivity: new Date(),
      isActive: true,
      needsProviderApproval: false,
    }
  ]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [activeQRConnection, setActiveQRConnection] = useState<string | null>(null);
  const { toast } = useToast();

  const generateQRCode = async (connectionId: string) => {
    setIsGeneratingQR(true);
    setActiveQRConnection(connectionId);
    
    try {
      // Simular geração de QR Code
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const qrCodeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, qrCode: qrCodeData, status: 'pending' as const }
          : conn
      ));
      
      toast({
        title: "QR Code gerado",
        description: "Escaneie o código com seu WhatsApp para conectar",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar QR Code",
        description: "Tente novamente em alguns momentos",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
      setActiveQRConnection(null);
    }
  };

  const addNewConnection = () => {
    const newConnection: WhatsAppConnection = {
      id: Date.now().toString(),
      name: `WhatsApp ${connections.length + 1}`,
      phone: '',
      status: 'disconnected',
      isActive: false,
      needsProviderApproval: connections.length > 0, // Apenas a primeira não precisa de aprovação
    };
    
    setConnections(prev => [...prev, newConnection]);
  };

  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    toast({
      title: "Conexão excluída",
      description: "A conexão WhatsApp foi removida com sucesso",
    });
  };

  const getStatusIcon = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'waiting_approval':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (connection: WhatsAppConnection) => {
    if (connection.needsProviderApproval && connection.status === 'disconnected') {
      return <Badge variant="secondary">Aguardando Liberação</Badge>;
    }
    
    switch (connection.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'waiting_approval':
        return <Badge className="bg-blue-100 text-blue-800">Aguardando Aprovação</Badge>;
      default:
        return <Badge variant="destructive">Desconectado</Badge>;
    }
  };

  // Exportar estado das conexões para uso em outros componentes
  useEffect(() => {
    localStorage.setItem('whatsapp-connections', JSON.stringify(connections));
  }, [connections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h2>
          <p className="text-gray-600">Gerencie suas conexões com o WhatsApp</p>
        </div>
        <Button onClick={addNewConnection} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{connection.name}</CardTitle>
                    <CardDescription>
                      {connection.phone || 'Não conectado'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(connection)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteConnection(connection.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(connection.status)}
                <span className="text-sm text-gray-600">
                  Status: {connection.status === 'connected' ? 'Conectado' : 
                          connection.status === 'pending' ? 'Aguardando Conexão' :
                          connection.status === 'waiting_approval' ? 'Aguardando Aprovação' : 'Desconectado'}
                </span>
              </div>

              {connection.lastActivity && connection.status === 'connected' && (
                <div className="text-sm text-gray-500">
                  Última atividade: {connection.lastActivity.toLocaleString()}
                </div>
              )}

              {connection.needsProviderApproval && connection.status === 'disconnected' && (
                <Alert>
                  <AlertDescription>
                    Esta conexão está sujeita à liberação do provedor. Entre em contato com o suporte para ativação.
                  </AlertDescription>
                </Alert>
              )}

              {connection.qrCode && connection.status === 'pending' && (
                <div className="text-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <img 
                      src={connection.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Escaneie este código com seu WhatsApp
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                {connection.status === 'disconnected' && !connection.needsProviderApproval && (
                  <Button 
                    onClick={() => generateQRCode(connection.id)}
                    disabled={isGeneratingQR && activeQRConnection === connection.id}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isGeneratingQR && activeQRConnection === connection.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando QR Code...
                      </>
                    ) : (
                      'Gerar QR Code'
                    )}
                  </Button>
                )}
                
                {connection.status === 'connected' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setConnections(prev => prev.map(conn => 
                        conn.id === connection.id 
                          ? { ...conn, status: 'disconnected' as const, qrCode: undefined }
                          : conn
                      ));
                      toast({
                        title: "WhatsApp desconectado",
                        description: "A conexão foi encerrada com sucesso",
                      });
                    }}
                    className="flex-1"
                  >
                    Desconectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {connections.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma conexão WhatsApp
            </h3>
            <p className="text-gray-600 mb-4">
              Adicione uma nova conexão para começar a usar o WhatsApp
            </p>
            <Button onClick={addNewConnection} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Primeira Conexão
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
