/**
 * Layout otimizado para carregamento rápido
 */
import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface FastLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

// Layout minimalista para carregamento rápido
const FastLayout: React.FC<FastLayoutProps> = memo(({ children, title, className }) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {title && (
        <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      )}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
});

FastLayout.displayName = 'FastLayout';

export { FastLayout };