import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initFastPerformance } from './utils/performance-fast-init'
import { initAttendancePerformanceOptimizations, applyPerformanceBasedOptimizations } from './utils/performance-init'
import { initProductionOptimizations } from './utils/production-optimizations'
import { initCodeSplitting } from './utils/code-splitting'
import { PresenceProvider } from './contexts/PresenceContext'
import { PushNotificationProvider } from '@/components/notifications/PushNotifications';
import { ServiceWorkerProvider } from '@/hooks/useServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConnectionNotificationProvider } from '@/contexts/ConnectionNotificationContext';

// Inicialização ultra-rápida
initFastPerformance();

// Otimizações específicas do módulo de atendimento  
initAttendancePerformanceOptimizations();
applyPerformanceBasedOptimizations();

// Otimizações de produção
if (import.meta.env.PROD) {
  initProductionOptimizations();
  initCodeSplitting();
}

createRoot(document.getElementById("root")!).render(
  <ServiceWorkerProvider>
    <AuthProvider>
      <ConnectionNotificationProvider>
        <PushNotificationProvider>
          <PresenceProvider>
            <App />
          </PresenceProvider>
        </PushNotificationProvider>
      </ConnectionNotificationProvider>
    </AuthProvider>
  </ServiceWorkerProvider>
);
