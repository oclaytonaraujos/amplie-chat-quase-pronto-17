import React from 'react';
import { SyncLoader } from './sync-loader';

// Componente de fallback ultra-otimizado
export const OptimizedFallback = () => (
  <div className="h-40 w-full flex items-center justify-center">
    <SyncLoader size="md" />
  </div>
);

export const FullScreenFallback = () => (
  <div className="h-screen w-full bg-background flex items-center justify-center">
    <SyncLoader size="lg" />
  </div>
);