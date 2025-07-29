import React, { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Info, AlertCircle, Zap } from 'lucide-react';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

export function RealTimeAlerts() {
  const { alerts } = useSystemMonitoring();

  useEffect(() => {
    // Escutar por novos alertas e mostrar toast
    const latestAlert = alerts[0];
    if (latestAlert && !latestAlert.resolved) {
      const icon = getAlertIcon(latestAlert.severity);
      const variant = getToastVariant(latestAlert.severity);

      toast({
        title: `${latestAlert.type.toUpperCase()} Alert`,
        description: latestAlert.message,
        variant,
        duration: latestAlert.severity === 'critical' ? 0 : 5000, // Critical alerts persist
        action: latestAlert.severity === 'critical' ? (
          <div className="flex items-center gap-1">
            {icon}
            <span className="font-medium">Action Required</span>
          </div>
        ) : undefined
      });
    }
  }, [alerts]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Zap className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getToastVariant = (severity: string): "default" | "destructive" => {
    return severity === 'critical' || severity === 'high' ? 'destructive' : 'default';
  };

  // Este componente não renderiza nada visualmente
  // Apenas gerencia os alertas em tempo real
  return null;
}