import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff, Clock, AlertCircle, QrCode } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';

interface WhatsAppStatusIndicatorProps {
  instanceName?: string;
  showAll?: boolean;
  compact?: boolean;
}

const statusConfig = {
  connected: {
    label: 'Conectado',
    icon: Wifi,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  connecting: {
    label: 'Conectando',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  qr_required: {
    label: 'QR Pendente',
    icon: QrCode,
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  disconnected: {
    label: 'Desconectado',
    icon: WifiOff,
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  error: {
    label: 'Erro',
    icon: AlertCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200'
  }
};

export function WhatsAppStatusIndicator({ 
  instanceName, 
  showAll = false, 
  compact = false 
}: WhatsAppStatusIndicatorProps) {
  const { instances, isLoading, hasConnectedInstances } = useWhatsApp();

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Clock className="w-3 h-3 mr-1" />
        Carregando...
      </Badge>
    );
  }

  // Show specific instance status
  if (instanceName) {
    const instance = instances.find(i => i.instanceName === instanceName);
    if (!instance) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Não encontrada
        </Badge>
      );
    }

    const config = statusConfig[instance.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {compact ? config.label.slice(0, 3) : config.label}
      </Badge>
    );
  }

  // Show all instances or general status
  if (showAll) {
    if (instances.length === 0) {
      return (
        <Badge variant="secondary">
          <Smartphone className="w-3 h-3 mr-1" />
          Nenhuma instância
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {instances.map(instance => {
          const config = statusConfig[instance.status];
          const Icon = config.icon;
          
          return (
            <Badge key={instance.instanceName} variant={config.variant} className={config.className}>
              <Icon className="w-3 h-3 mr-1" />
              {compact ? instance.instanceName.slice(0, 8) : instance.instanceName}
            </Badge>
          );
        })}
      </div>
    );
  }

  // Show general status
  const connectedCount = instances.filter(i => i.status === 'connected').length;
  const totalCount = instances.length;

  if (totalCount === 0) {
    return (
      <Badge variant="secondary">
        <Smartphone className="w-3 h-3 mr-1" />
        Sem conexões
      </Badge>
    );
  }

  if (connectedCount === totalCount) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        {compact ? `${connectedCount}/${totalCount}` : `${connectedCount} de ${totalCount} conectadas`}
      </Badge>
    );
  }

  if (connectedCount > 0) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Wifi className="w-3 h-3 mr-1" />
        {compact ? `${connectedCount}/${totalCount}` : `${connectedCount} de ${totalCount} conectadas`}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="w-3 h-3 mr-1" />
      {compact ? 'Offline' : 'Todas desconectadas'}
    </Badge>
  );
}