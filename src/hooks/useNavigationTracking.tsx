/**
 * Hook para rastreamento de navegação e analytics
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';

interface NavigationEvent {
  path: string;
  previousPath?: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  referrer: string;
}

class NavigationTracker {
  private sessionId: string;
  private previousPath?: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  private generateSessionId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackNavigation(path: string, userId?: string) {
    const event: NavigationEvent = {
      path,
      previousPath: this.previousPath,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId,
      referrer: document.referrer
    };

    // Log da navegação
    logger.info(`Navigation: ${this.previousPath || 'initial'} → ${path}`, {
      component: 'NavigationTracker',
      metadata: {
        sessionId: this.sessionId,
        userId,
        previousPath: this.previousPath,
        currentPath: path,
        timeOnPreviousPage: this.previousPath ? Date.now() - this.startTime : 0
      }
    });

    // Armazenar no localStorage para analytics offline
    this.storeNavigationEvent(event);

    // Atualizar estado
    this.previousPath = path;
    this.startTime = Date.now();
  }

  private storeNavigationEvent(event: NavigationEvent) {
    try {
      const stored = JSON.parse(localStorage.getItem('navigation_events') || '[]');
      stored.push(event);

      // Manter apenas os últimos 100 eventos
      const limited = stored.slice(-100);
      localStorage.setItem('navigation_events', JSON.stringify(limited));
    } catch (error) {
      logger.error('Failed to store navigation event', {
        component: 'NavigationTracker'
      }, error as Error);
    }
  }

  getSessionData() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      currentPath: window.location.pathname,
      sessionDuration: Date.now() - this.startTime
    };
  }
}

// Singleton instance
const navigationTracker = new NavigationTracker();

export function useNavigationTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    navigationTracker.trackNavigation(location.pathname, user?.id);
  }, [location.pathname, user?.id]);

  // Track page visibility for more accurate time on page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logger.debug('Page hidden', {
          component: 'NavigationTracker',
          metadata: {
            path: location.pathname,
            sessionData: navigationTracker.getSessionData()
          }
        });
      } else {
        logger.debug('Page visible', {
          component: 'NavigationTracker',
          metadata: {
            path: location.pathname,
            sessionData: navigationTracker.getSessionData()
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  // Track session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionData = navigationTracker.getSessionData();
      
      logger.info('Session ending', {
        component: 'NavigationTracker',
        metadata: sessionData
      });

      // Store final session data
      localStorage.setItem('last_session', JSON.stringify({
        ...sessionData,
        endTime: Date.now()
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    sessionId: navigationTracker.getSessionData().sessionId,
    sessionDuration: navigationTracker.getSessionData().sessionDuration,
    currentPath: location.pathname
  };
}