import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  CheckCircle,
  Clock,
  User,
  Building2,
  Calendar,
  RefreshCw,
  Settings,
  Phone
} from 'lucide-react';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstanciaCompleta {
  id: string;
  instance_name: string;
  status: string;
  numero?: string;
  qr_code?: string;
  ativo: boolean;
  empresa_id?: string;
  empresa_nome?: string;
  descricao?: string;
  webhook_url?: string;
  webhook_status?: 'ativo' | 'inativo' | 'erro';
  created_at: string;
  updated_at: string;
  profile_name?: string;
  profile_picture_url?: string;
  connection_state?: string;
  battery_level?: number;
  platform?: string;
}

interface InstanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: InstanciaCompleta | null;
  onRefresh: () => void;
}

export function InstanceDetailsDialog({ 
  open, 
  onOpenChange, 
  instance,
  onRefresh 
}: InstanceDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const { getConnectionState, findChats } = useEvolutionAPIComplete();

  useEffect(() => {
    if (open && instance) {
      loadDetailedInfo();
    }
  }, [open, instance]);

  const loadDetailedInfo = async () => {
    if (!instance) return;

    setLoading(true);
    try {
      // Buscar informações detalhadas da instância
      const [connectionData, chatsData] = await Promise.all([
        getConnectionState(instance.instance_name),
        findChats(instance.instance_name)
      ]);

      setDetailedInfo({
        connection: connectionData,
        chats: chatsData
      });
    } catch (error) {
      console.error('Erro ao carregar informações detalhadas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!instance) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
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

  const getWebhookBadge = (status: 'ativo' | 'inativo' | 'erro') => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Webhook Ativo</Badge>;
      case 'erro':
        return <Badge className="bg-red-100 text-red-800">Webhook com Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Webhook Inativo</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Detalhes da Instância: {instance.instance_name}
          </DialogTitle>
          <DialogDescription>
            Informações completas e estatísticas da instância WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status da Conexão</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(instance.status)}
                    {getStatusBadge(instance.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Webhook</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Wifi className="w-4 h-4" />
                    {getWebhookBadge(instance.webhook_status || 'inativo')}
                  </div>
                </div>
              </div>

              {instance.numero && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono">{instance.numero}</span>
                  </div>
                </div>
              )}

              {instance.empresa_nome && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    <span>{instance.empresa_nome}</span>
                  </div>
                </div>
              )}

              {instance.descricao && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-sm mt-1">{instance.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criada em</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {format(new Date(instance.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Atualizada em</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {format(new Date(instance.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Perfil WhatsApp */}
          {(instance.profile_name || detailedInfo?.connection?.instance?.profileName) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(instance.profile_name || detailedInfo?.connection?.instance?.profileName) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome do Perfil</label>
                    <p className="mt-1">{instance.profile_name || detailedInfo?.connection?.instance?.profileName}</p>
                  </div>
                )}

                {instance.battery_level && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nível da Bateria</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            instance.battery_level > 50 ? 'bg-green-500' : 
                            instance.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${instance.battery_level}%` }}
                        />
                      </div>
                      <span className="text-sm">{instance.battery_level}%</span>
                    </div>
                  </div>
                )}

                {instance.platform && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plataforma</label>
                    <p className="mt-1">{instance.platform}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas de Chats */}
          {detailedInfo?.chats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Estatísticas de Chats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedInfo.chats.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Chats</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {detailedInfo.chats.filter((chat: any) => !chat.id.includes('@g.us')).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Conversas Privadas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {detailedInfo.chats.filter((chat: any) => chat.id.includes('@g.us')).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Grupos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Carregando informações detalhadas...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => { loadDetailedInfo(); onRefresh(); }} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}