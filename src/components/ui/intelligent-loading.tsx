/**
 * Intelligent Loading Components with Context-Aware States
 */
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LoadingState } from './enhanced-loading';
import { SyncLoader } from './sync-loader';

interface IntelligentLoadingProps {
  isLoading: boolean;
  type?: 'conversations' | 'messages' | 'contacts' | 'generic';
  minLoadingTime?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showProgress?: boolean;
  estimatedDuration?: number;
}

export const IntelligentLoading: React.FC<IntelligentLoadingProps> = ({
  isLoading,
  type = 'generic',
  minLoadingTime = 300,
  children,
  fallback,
  showProgress = false,
  estimatedDuration = 2000
}) => {
  const [showLoading, setShowLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isLoading) {
      // Só mostra loading após um delay para evitar flicker
      loadingTimer = setTimeout(() => {
        setShowLoading(true);
      }, 100);

      // Simula progresso baseado no tempo estimado
      if (showProgress) {
        const progressStep = 100 / (estimatedDuration / 100);
        progressInterval = setInterval(() => {
          setProgress(prev => {
            const next = prev + progressStep;
            return next >= 95 ? 95 : next; // Para em 95% até carregar
          });
        }, 100);
      }
    } else {
      // Garante tempo mínimo de loading para UX suave
      if (showLoading) {
        setTimeout(() => {
          setShowLoading(false);
          setProgress(100);
          setTimeout(() => setProgress(0), 300);
        }, minLoadingTime);
      } else {
        setShowLoading(false);
        setProgress(0);
      }
    }

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(progressInterval);
    };
  }, [isLoading, minLoadingTime, showProgress, estimatedDuration]);

  if (showLoading || isLoading) {
    return (
      <div className="animate-fade-in">
        {fallback || (
          <LoadingState
            type={type}
            showProgress={showProgress}
            progress={progress}
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

// Skeleton Loading Components
export const MessageSkeleton: React.FC = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="h-8 w-8 bg-muted rounded-full" />
      <div className="h-4 bg-muted rounded w-24" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  </div>
);

export const ConversationSkeleton: React.FC = () => (
  <div className="p-4 border-b space-y-3 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="h-10 w-10 bg-muted rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
      <div className="h-3 bg-muted rounded w-12" />
    </div>
  </div>
);

export const ContactSkeleton: React.FC = () => (
  <div className="p-3 space-y-3 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="h-8 w-8 bg-muted rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  </div>
);

interface SkeletonListProps {
  type: 'message' | 'conversation' | 'contact';
  count?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  type,
  count = 5,
  className
}) => {
  const SkeletonComponent = {
    message: MessageSkeleton,
    conversation: ConversationSkeleton,
    contact: ContactSkeleton
  }[type];

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
};

// Progressive Loading Component
interface ProgressiveLoadingProps {
  phases: {
    label: string;
    duration: number;
  }[];
  onComplete?: () => void;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  phases,
  onComplete
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let phaseTimer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (currentPhase < phases.length) {
      const currentPhaseDuration = phases[currentPhase].duration;
      const progressStep = 100 / (currentPhaseDuration / 50);

      progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + progressStep;
          if (next >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return next;
        });
      }, 50);

      phaseTimer = setTimeout(() => {
        setProgress(0);
        setCurrentPhase(prev => prev + 1);
      }, currentPhaseDuration);
    } else {
      onComplete?.();
    }

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(progressInterval);
    };
  }, [currentPhase, phases, onComplete]);

  if (currentPhase >= phases.length) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <SyncLoader size="lg" className="mb-4" />
      <p className="text-muted-foreground text-center mb-4">
        {phases[currentPhase].label}
      </p>
      
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Fase {currentPhase + 1} de {phases.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};