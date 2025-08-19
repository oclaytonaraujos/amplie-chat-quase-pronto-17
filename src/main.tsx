import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initProductionOptimizations } from './utils/production-optimizations'
import { PresenceProvider } from './contexts/PresenceContext'
import { PushNotificationProvider } from '@/components/notifications/PushNotifications';
import { ServiceWorkerProvider } from '@/hooks/useServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConnectionNotificationProvider } from '@/contexts/ConnectionNotificationContext';

// Otimizações de produção
if (import.meta.env.PROD) {
  initProductionOptimizations();
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
