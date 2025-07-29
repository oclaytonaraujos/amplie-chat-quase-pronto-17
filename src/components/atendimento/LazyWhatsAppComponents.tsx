/**
 * Componentes lazy-loaded para otimizar performance do WhatsApp Chat
 */
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading dos componentes pesados
export const LazyClienteInfo = lazy(() => 
  import('@/components/atendimento/ClienteInfo').then(module => ({
    default: module.ClienteInfo
  }))
);

export const LazyTransferDialog = lazy(() => 
  import('@/components/atendimento/TransferDialog').then(module => ({
    default: module.TransferDialog
  }))
);

export const LazyAdvancedMessageTemplates = lazy(() => 
  import('@/components/templates/AdvancedMessageTemplates').then(module => ({
    default: module.AdvancedMessageTemplates
  }))
);

export const LazyWhatsAppInputArea = lazy(() => 
  import('@/components/atendimento/whatsapp/WhatsAppInputArea').then(module => ({
    default: module.WhatsAppInputArea
  }))
);

// Skeletons otimizados para loading states
export function ClienteInfoSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function InputAreaSkeleton() {
  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function TemplatesSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// HOCs para lazy loading com suspense
export function withLazyLoading<T>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
  fallback: React.ReactNode
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props as any} />
      </Suspense>
    );
  };
}

// Componentes prontos para uso
export const ClienteInfoLazy = withLazyLoading(LazyClienteInfo, <ClienteInfoSkeleton />);
export const TransferDialogLazy = withLazyLoading(LazyTransferDialog, <div />);
export const AdvancedMessageTemplatesLazy = withLazyLoading(LazyAdvancedMessageTemplates, <TemplatesSkeleton />);
export const WhatsAppInputAreaLazy = withLazyLoading(LazyWhatsAppInputArea, <InputAreaSkeleton />);

// Preload helper para componentes críticos
export function preloadWhatsAppComponents() {
  // Preload apenas em dispositivos com boa performance
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 4) {
    requestIdleCallback(() => {
      // Note: preload is not available in current React lazy implementation
      console.log('Preloading WhatsApp components...');
    });
  }
}

// Hook para controlar lazy loading baseado em interações
export function useLazyComponentControl() {
  const preloadOnHover = (component: 'clienteInfo' | 'templates' | 'transfer') => {
    return () => {
      requestIdleCallback(() => {
        // Note: preload is not available in current React lazy implementation
        console.log(`Preloading ${component} component...`);
      });
    };
  };

  return {
    preloadOnHover
  };
}