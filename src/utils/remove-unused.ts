/**
 * Script para identificar e remover código não utilizado
 */

// Console logs para remoção em produção
export const stripConsoleLogsInProduction = () => {
  if (import.meta.env.PROD) {
    // Substituir console.log por função vazia
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      if (console[method as keyof Console]) {
        (console as any)[method] = () => {};
      }
    });
  }
};

// CSS não utilizados - lista de classes que podem ser removidas
export const unusedCSSClasses = [
  // Animações duplicadas
  'animate-slide-in-right', // Duplicada no index.css
  'animate-slide-out-right', // Duplicada no index.css
  
  // Classes que não estão sendo usadas
  'pull-to-refresh',
  'swipe-indicator',
  'btn-mobile',
  'touch-manipulation',
  'touch-pan-y',
  'touch-pan-x',
  'touch-none',
  'transform-gpu',
  
  // Responsive classes não utilizadas
  'text-responsive',
  'heading-responsive',
  
  // Print styles não utilizados
  'no-print'
];

// Imports desnecessários comuns
export const commonUnusedImports = [
  // React imports que podem ser otimizados
  'import React from "react"', // Se usando React 17+
  
  // Lodash completo (usar funções específicas)
  'import _ from "lodash"',
  'import * as _ from "lodash"',
  
  // Moment.js (substituir por date-fns)
  'import moment from "moment"',
  
  // Imports de componentes não utilizados
  'OptimizedLoading', // Se não usado
];

// Função para detectar componentes/hooks não utilizados
export const findUnusedComponents = () => {
  const potentiallyUnused = [
    // Componentes que podem não estar sendo usados
    'ErrorBoundaryAdmin',
    'LoadingStateCard', 
    'EmptyState',
    'PerformanceDashboard',
    'VideoAudioIntegration',
    'AdvancedReports',
    'AccessRequestDialog',
    'FlowTemplates',
    'FlowHistory',
    'ActivityLogs',
    'MetricsOverview',
    'IntegrationTester',
    
    // Hooks que podem não estar sendo usados
    'useNavigationTracking',
    'usePerformanceMonitor',
    'useAutoSave',
    'useServiceWorker',
    'useContactCheck',
    'useTransferNotifications',
    
    // Utils não utilizados
    'authCleanup',
    'bundle-analyzer',
  ];
  
  if (import.meta.env.DEV) {
    console.group('🔍 Potentially Unused Components');
    potentiallyUnused.forEach(component => {
      console.log(`- ${component}`);
    });
    console.groupEnd();
  }
};

// Dependências que podem ser removidas
export const unusedDependencies = [
  '@mendable/firecrawl-js', // Se não usado
  'jspdf', // Se relatórios não estão sendo usados
  'jspdf-autotable',
  'xlsx', // Se export/import de Excel não usado
  'vaul', // Se drawer não usado
  'embla-carousel-react', // Se carousel não usado
  'input-otp', // Se OTP não usado
  'react-is', // Se não usado
  '@xyflow/react', // Se flow builder não usado
];

// Otimizações de tree-shaking
export const treeShakingOptimizations = {
  // Imports que devem ser específicos
  lucideReact: 'import { SpecificIcon } from "lucide-react"',
  radixUI: 'import { Dialog } from "@radix-ui/react-dialog"',
  dateUtils: 'import { format } from "date-fns"',
  
  // Evitar imports de barril
  avoidBarrelExports: [
    'src/components/ui/index.ts', // Se existir
    'src/hooks/index.ts', // Se existir
    'src/utils/index.ts',
  ]
};

// Inicializar otimizações
export const initializeOptimizations = () => {
  stripConsoleLogsInProduction();
  
  if (import.meta.env.DEV) {
    findUnusedComponents();
    
    console.group('📦 Bundle Optimization Tips');
    console.log('1. Remove unused CSS classes');
    console.log('2. Use specific imports instead of barrel exports');
    console.log('3. Lazy load heavy components');
    console.log('4. Remove unused dependencies');
    console.groupEnd();
  }
};