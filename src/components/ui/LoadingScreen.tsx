import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { useOptimizedLoading } from '@/hooks/useOptimizedLoading';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

export const LoadingScreen = memo(({ 
  message = "Carregando...", 
  showProgress = true 
}: LoadingScreenProps) => {
  const { progress, phase } = useOptimizedLoading();

  const getPhaseMessage = () => {
    switch (phase) {
      case 'initializing': return 'Inicializando...';
      case 'loading': return 'Carregando componentes...';
      case 'ready': return 'Pronto!';
      case 'error': return 'Erro no carregamento';
      default: return message;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4 p-6">
        {/* Logo ou ícone */}
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        
        {/* Mensagem */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">{getPhaseMessage()}</h3>
          {showProgress && (
            <div className="w-64 space-y-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LoadingScreen.displayName = 'LoadingScreen';