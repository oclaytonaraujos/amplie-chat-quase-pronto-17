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
  CheckCircle,
  Clock,
  User,
  Building2,
  Calendar,
  RefreshCw,
  Settings,
  Phone,
  AlertTriangle
} from 'lucide-react';
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

  if (!instance) return null;

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
            Informações básicas da instância (dados detalhados via n8n)
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
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(instance.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Webhook</label>
                  <div className="flex items-center gap-2 mt-1">
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

          {/* Aviso sobre migração */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-4 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>Informações detalhadas agora via n8n</p>
                <p className="text-sm">Configure fluxos n8n para obter dados avançados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}