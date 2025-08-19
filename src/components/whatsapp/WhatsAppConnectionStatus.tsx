import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SyncLoader } from '@/components/ui/sync-loader';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

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
  // Since Evolution API is removed, show n8n integration status
  const status = 'n8n';
  const isChecking = false;

  const checkConnection = () => {
    // Now connections are managed via n8n
  };

  if (showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <Wifi className="w-3 h-3" />
          Via n8n
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={checkConnection}
          disabled={isChecking}
          className="h-6 w-6 p-0"
        >
          <SyncLoader size="sm" className={cn(!isChecking && "hidden")} />
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
      <div className="w-2 h-2 rounded-full bg-blue-500" />
      <Wifi className="w-3 h-3" />
      n8n
    </Button>
  );
};