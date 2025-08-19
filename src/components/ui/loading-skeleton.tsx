import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ className, count = 1, height = "h-4" }: LoadingSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse bg-muted rounded",
            height,
            className
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <LoadingSkeleton height="h-6" className="w-3/4" />
      <LoadingSkeleton height="h-4" count={3} />
      <LoadingSkeleton height="h-8" className="w-1/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <LoadingSkeleton height="h-4" className="w-1/4" />
          <LoadingSkeleton height="h-4" className="w-1/3" />
          <LoadingSkeleton height="h-4" className="w-1/4" />
          <LoadingSkeleton height="h-4" className="w-1/6" />
        </div>
      ))}
    </div>
  );
}