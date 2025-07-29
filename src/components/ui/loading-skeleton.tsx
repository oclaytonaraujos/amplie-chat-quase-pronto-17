/**
 * Componentes de loading elegantes e responsivos
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

// Skeleton para cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

// Skeleton para tabelas
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton para lista de conversas
export function ConversationListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// Loading spinner elegante
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  );
}

// Loading overlay para toda a página
export function LoadingOverlay({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg border">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Loading para botões
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({ isLoading, children, className }: ButtonLoadingProps) {
  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <div className={cn(isLoading && "opacity-0")}>
        {children}
      </div>
    </div>
  );
}

// Skeleton para dashboard metrics
export function MetricCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-16" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Loading states específicos para diferentes seções
export function ContactsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-64" /> {/* Search */}
        <Skeleton className="h-10 w-32" /> {/* Filter */}
        <Skeleton className="h-10 w-32" /> {/* Add button */}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r p-4 space-y-3">
        <Skeleton className="h-10 w-full" /> {/* Search */}
        <ConversationListSkeleton count={10} />
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
              <Skeleton className={cn("h-10 max-w-xs rounded-lg", i % 2 === 0 ? "w-48" : "w-32")} />
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="border-t p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}