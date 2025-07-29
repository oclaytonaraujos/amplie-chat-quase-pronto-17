
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useWhatsAppConnectionCheck } from '@/hooks/useWhatsAppConnectionCheck';
import { cn } from '@/lib/utils';

interface WhatsAppConnectionStatusProps {
  instanceId?: string;
  showDetails?: boolean;
  className?: string;
}

export const WhatsAppConnectionStatus: React.FC<WhatsAppConnectionStatusProps> = ({
  instanceId,
  showDetails = true,
  className
}) => {
  const { status, isChecking, checkConnection, numero, profileName } = useWhatsAppConnectionCheck(instanceId);

  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'close':
      case 'disconnected':
        return 'bg-red-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'qr':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'open':
        return numero ? `Conectado (${numero})` : 'Conectado';
      case 'close':
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando...';
      case 'qr':
        return 'QR Code';
      default:
        return 'Verificando...';
    }
  };

  const StatusIcon = (status === 'open') ? Wifi : WifiOff;

  if (showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
          <StatusIcon className="w-3 h-3" />
          {getStatusText()}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={checkConnection}
          disabled={isChecking}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn("w-3 h-3", isChecking && "animate-spin")} />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={checkConnection}
      disabled={isChecking}
      className={cn("flex items-center gap-1", className)}
    >
      <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
      <StatusIcon className="w-3 h-3" />
      {!isChecking && getStatusText()}
      {isChecking && <RefreshCw className="w-3 h-3 animate-spin" />}
    </Button>
  );
};
