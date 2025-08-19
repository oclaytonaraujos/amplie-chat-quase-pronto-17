import React, { useState } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { SyncLoaderInline } from '@/components/ui/sync-loader';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  empresa_id: string;
  status: 'open' | 'close' | 'connecting' | 'qr' | 'disconnected';
  qr_code?: string;
  numero?: string;
  profile_name?: string;
  profile_picture_url?: string;
  webhook_status: 'ativo' | 'inativo' | 'erro';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
}

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  isConnecting: boolean;
  onConnect: (instanceName: string) => void;
  onDisconnect: (instanceName: string) => void;
  onDelete: (instanceName: string) => void;
  onShowQR?: (qrCode: string, instanceName: string) => void;
}

export function WhatsAppInstanceCard({
  instance,
  isConnecting,
  onConnect,
  onDisconnect,
  onDelete,
  onShowQR
}: WhatsAppInstanceCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const statusInfo = getStatusInfo(instance.status);

  const handleConnect = () => {
    onConnect(instance.instance_name);
    
    // Se há QR code, mostrar após conectar
    if (instance.qr_code && onShowQR) {
      setTimeout(() => {
        onShowQR(instance.qr_code!, instance.instance_name);
      }, 1000);
    }
  };

  return (
    <Card className={`border-l-4 ${statusInfo.bgColor}`}>
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
                onClick={() => onDisconnect(instance.instance_name)}
                variant="outline"
                size="sm"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <SyncLoaderInline />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                    Esta ação não pode ser desfeita e removerá todas as configurações associadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(instance.instance_name);
                      setShowDeleteDialog(false);
                    }}
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
}