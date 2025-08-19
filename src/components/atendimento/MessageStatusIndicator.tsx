import React from 'react';
import { CheckIcon, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncLoaderInline } from '@/components/ui/sync-loader';

interface MessageStatusIndicatorProps {
  status: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
  className?: string;
}

export function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'enviando':
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/20',
          label: 'Enviando...'
        };
      case 'enviado':
        return {
          icon: CheckIcon,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/20',
          label: 'Enviado'
        };
      case 'entregue':
        return {
          icon: CheckIcon,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          label: 'Entregue'
        };
      case 'lido':
        return {
          icon: CheckIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: 'Lido'
        };
      case 'erro':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: 'Erro ao enviar'
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/20',
          label: 'Processando'
        };
    }
  };

  const { icon: Icon, color, bgColor, label } = getStatusConfig();

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        bgColor,
        color,
        className
      )}
      title={label}
    >
      <Icon className="w-3 h-3" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface MessageRetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function MessageRetryButton({ onRetry, isRetrying = false, className }: MessageRetryButtonProps) {
  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
        "hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      title="Tentar novamente"
    >
      {isRetrying ? <SyncLoaderInline size="sm" variant="muted" /> : <RotateCcw className="w-3 h-3" />}
      <span>Tentar novamente</span>
    </button>
  );
}