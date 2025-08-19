import React from 'react';
import { SyncLoader as ReactSpinnersSyncLoader } from 'react-spinners';
import { cn } from '@/lib/utils';

interface SyncLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'primary' | 'secondary' | 'muted';
  color?: string;
}

const sizeMap = {
  sm: 6,
  md: 8, 
  lg: 12,
  xl: 16
};

const variantColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary-foreground))',
  muted: 'hsl(var(--muted-foreground))'
};

export function SyncLoader({ 
  size = 'md', 
  className,
  variant = 'primary',
  color
}: SyncLoaderProps) {
  const finalColor = color || variantColors[variant];
  
  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label="Carregando..."
    >
      <ReactSpinnersSyncLoader 
        color={finalColor}
        size={sizeMap[size]}
        speedMultiplier={0.7}
      />
    </div>
  );
}

// Componente de loading para seções inteiras
export function SyncLoaderSection({ 
  size = 'lg',
  text = 'Carregando...',
  className,
  variant = 'primary'
}: SyncLoaderProps & { text?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      <SyncLoader size={size} variant={variant} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Componente inline para botões
export function SyncLoaderInline({ 
  size = 'sm',
  className,
  variant = 'primary'
}: SyncLoaderProps) {
  return (
    <SyncLoader 
      size={size} 
      variant={variant}
      className={cn('mr-2', className)} 
    />
  );
}