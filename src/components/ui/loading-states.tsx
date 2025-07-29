/**
 * Estados de carregamento avançados e elegantes
 */
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "animate-spin rounded-full border-2 border-current border-t-transparent",
        dots: "space-x-1",
        pulse: "animate-pulse",
        skeleton: "loading-shimmer rounded",
        wave: "space-x-1"
      },
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6", 
        lg: "w-8 h-8",
        xl: "w-12 h-12"
      }
    },
    defaultVariants: {
      variant: "spinner",
      size: "md"
    }
  }
);

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingVariants> {
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ 
  className, 
  variant = "spinner", 
  size = "md", 
  text,
  fullScreen = false,
  ...props 
}: LoadingProps) {
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center", fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50", className)} {...props}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-primary animate-bounce",
                size === "sm" && "w-2 h-2",
                size === "md" && "w-3 h-3", 
                size === "lg" && "w-4 h-4",
                size === "xl" && "w-6 h-6"
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {text && <span className="ml-3 text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn("flex items-center justify-center", fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50", className)} {...props}>
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "bg-primary animate-pulse",
                size === "sm" && "w-1 h-4",
                size === "md" && "w-1 h-6", 
                size === "lg" && "w-2 h-8",
                size === "xl" && "w-2 h-12"
              )}
              style={{ 
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && <span className="ml-3 text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50", className)} {...props}>
        <div className={cn(loadingVariants({ variant, size }), "bg-primary rounded-full")} />
        {text && <span className="ml-3 text-muted-foreground animate-pulse">{text}</span>}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn(loadingVariants({ variant, size }), className)} {...props}>
        <div className="w-full h-full loading-shimmer" />
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex items-center justify-center", fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50", className)} {...props}>
      <div className={cn(loadingVariants({ variant, size }))} />
      {text && <span className="ml-3 text-muted-foreground">{text}</span>}
    </div>
  );
}

// Skeleton components for different content types
export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)} {...props}>
      <div className="loading-shimmer h-4 w-3/4 rounded" />
      <div className="loading-shimmer h-3 w-1/2 rounded" />
      <div className="loading-shimmer h-16 w-full rounded" />
    </div>
  );
}

export function SkeletonList({ items = 5, className, ...props }: { items?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="loading-shimmer w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="loading-shimmer h-4 w-3/4 rounded" />
            <div className="loading-shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className, ...props }: { rows?: number; cols?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="loading-shimmer h-6 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="loading-shimmer h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading screen overlay
export function LoadingScreen({ 
  title = "Carregando...", 
  subtitle,
  variant = "spinner" 
}: { 
  title?: string; 
  subtitle?: string; 
  variant?: "spinner" | "dots" | "wave" 
}) {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loading variant={variant} size="xl" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// Progress loading
export function ProgressLoading({ 
  progress, 
  title = "Processando...",
  className,
  ...props 
}: { 
  progress: number; 
  title?: string; 
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex justify-between text-sm">
        <span>{title}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}