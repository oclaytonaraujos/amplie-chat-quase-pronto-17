import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info } from 'lucide-react';

interface SecurityAlertProps {
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function SecurityAlert({ level, title, description, actions }: SecurityAlertProps) {
  const getIcon = () => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (level) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Alert variant={getVariant()} className={`
      ${level === 'critical' ? 'border-red-500 bg-red-50' : ''}
      ${level === 'warning' ? 'border-orange-500 bg-orange-50' : ''}
      ${level === 'info' ? 'border-blue-500 bg-blue-50' : ''}
    `}>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {description}
        {actions && (
          <div className="mt-3 flex gap-2">
            {actions}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}