import React from 'react';
import { cn } from '@/lib/utils';

interface SyncLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'primary' | 'secondary' | 'muted';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantClasses = {
  primary: 'border-primary',
  secondary: 'border-secondary-foreground',
  muted: 'border-muted-foreground'
};

export function SyncLoader({ 
  size = 'md', 
  className,
  variant = 'primary'
}: SyncLoaderProps) {
  return (
    <div 
      className={cn(
        'border-2 border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Carregando..."
    />
  );
}

// Componente de loading para seções inteiras
export function SyncLoaderSection({ 
  size = 'lg',
  text = 'Carregando...',
  className 
}: SyncLoaderProps & { text?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      <SyncLoader size={size} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Componente inline para botões
export function SyncLoaderInline({ 
  size = 'sm',
  className 
}: SyncLoaderProps) {
  return (
    <SyncLoader 
      size={size} 
      className={cn('mr-2', className)} 
    />
  );
}