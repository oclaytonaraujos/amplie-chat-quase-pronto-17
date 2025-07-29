import { Suspense, ReactNode } from 'react';

interface FastSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const FastFallback = () => (
  <div className="h-4 w-full animate-pulse bg-muted rounded" />
);

export const FastSuspense = ({ children, fallback = <FastFallback /> }: FastSuspenseProps) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};