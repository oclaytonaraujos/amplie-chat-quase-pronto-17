// Componente de fallback ultra-otimizado
export const OptimizedFallback = () => (
  <div className="h-40 w-full flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const FullScreenFallback = () => (
  <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);