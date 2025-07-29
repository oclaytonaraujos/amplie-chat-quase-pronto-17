import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  RefreshCw, 
  Link,
  Settings,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAllInstances, type InstanciaGlobal } from '@/hooks/useAllInstances';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { QRCodeModal } from '@/components/admin/QRCodeModal';
import { supabase } from '@/integrations/supabase/client';

export function WhatsAppConnectionsEmpresa() {
  const [selectedInstance, setSelectedInstance] = useState<InstanciaGlobal | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { instances, loading, loadInstances, getInstancesByCompany, syncInstanceStatus } = useAllInstances();
  const { connectInstance, getConnectionState, checkWebhookStatus } = useEvolutionAPIComplete();

  // Filtrar instâncias da empresa do usuário logado
  // Primeiro precisamos buscar o empresa_id do perfil do usuário
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('empresa_id')
            .eq('id', user.id)
            .single();
            
          if (profile?.empresa_id) {
            setEmpresaId(profile.empresa_id);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
        }
      }
    };
    
    getUserProfile();
  }, [user]);

  const empresaInstances = empresaId ? getInstancesByCompany(empresaId) : [];

  useEffect(() => {
    if (empresaId) {
      loadInstances();
    }
  }, [empresaId]);

  const handleConnect = async (instancia: InstanciaGlobal) => {
    try {
      setRefreshing(instancia.id);
      const result = await connectInstance(instancia.instance_name);
      
      if (result) {
        // Verificar se recebemos QR code
        const connectionState = await getConnectionState(instancia.instance_name);
        const updatedInstance = {
          ...instancia,
          qr_code: connectionState?.instance?.qrcode
        };
        
        setSelectedInstance(updatedInstance);
        setShowQRModal(true);
        
        // Sincronizar status
        await syncInstanceStatus(instancia.instance_name, 'connecting');
        
        // Recarregar dados após um tempo
        setTimeout(() => {
          loadInstances();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar instância WhatsApp",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshStatus = async (instancia: InstanciaGlobal) => {
    try {
      setRefreshing(instancia.id);
      const connectionState = await getConnectionState(instancia.instance_name);
      
      if (connectionState?.instance) {
        const newStatus = connectionState.instance.state || 'disconnected';
        await syncInstanceStatus(instancia.instance_name, newStatus);
        
        toast({
          title: "Status atualizado",
          description: `Status da instância: ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar status da instância",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Conectando</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conexões WhatsApp</h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões WhatsApp da empresa
          </p>
        </div>
        <Button onClick={loadInstances} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {empresaInstances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma instância WhatsApp configurada
            </h3>
            <p className="text-muted-foreground mb-6">
              Entre em contato com o administrador para configurar uma instância WhatsApp para sua empresa
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Instâncias WhatsApp são criadas e configuradas pelo administrador do sistema. 
                Solicite ao suporte a criação de uma instância para sua empresa.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Suas Instâncias WhatsApp ({empresaInstances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {empresaInstances.map((instancia) => (
                <div key={instancia.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(instancia.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{instancia.instance_name}</span>
                          {!instancia.ativo && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {instancia.numero && (
                            <span>📱 {instancia.numero}</span>
                          )}
                          {instancia.descricao && (
                            <span>• {instancia.descricao}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(instancia.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRefreshStatus(instancia)}
                        disabled={refreshing === instancia.id || !instancia.ativo}
                      >
                        {refreshing === instancia.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Status
                          </>
                        )}
                      </Button>

                      {(instancia.status === 'disconnected' || instancia.status === 'close') && instancia.ativo && (
                        <Button 
                          size="sm" 
                          onClick={() => handleConnect(instancia)}
                          disabled={refreshing === instancia.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {refreshing === instancia.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link className="w-4 h-4 mr-1" />
                              Conectar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal QR Code */}
      <QRCodeModal
        open={showQRModal}
        onOpenChange={(open) => {
          setShowQRModal(open);
          if (!open) {
            setSelectedInstance(null);
          }
        }}
        qrCode={(selectedInstance as any)?.qr_code}
        instanceName={selectedInstance?.instance_name || ''}
        onRefresh={() => {
          if (selectedInstance) {
            handleRefreshStatus(selectedInstance);
          }
        }}
        isLoading={refreshing !== null}
      />
    </div>
  );
}