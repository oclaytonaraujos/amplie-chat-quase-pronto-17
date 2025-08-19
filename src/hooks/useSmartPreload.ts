import { useState, useCallback, useMemo } from 'react';

// Mapeamento de rotas para imports dinâmicos otimizado
const routeImports: Record<string, () => Promise<any>> = {
  '/painel': () => import('@/pages/Painel'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/atendimento': () => import('@/pages/Atendimento'),
  '/contatos': () => import('@/pages/Contatos'),
  '/chat-interno': () => import('@/pages/ChatInterno'),
  '/kanban': () => import('@/pages/Kanban'),
  '/chatbot': () => import('@/pages/ChatBot'),
  '/usuarios': () => import('@/pages/Usuarios'),
  '/setores': () => import('@/pages/Setores'),
  '/gerenciar-equipe': () => import('@/pages/GerenciarEquipe'),
  '/meu-perfil': () => import('@/pages/MeuPerfil')
};

// Preload inteligente baseado em padrões de navegação
const useSmartPreload = () => {
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());
  
  // Verificar capacidade da rede
  const hasGoodConnection = useMemo(() => {
    if (!('connection' in navigator)) return true;
    const conn = (navigator as any).connection;
    return conn?.effectiveType !== '2g' && !conn?.saveData;
  }, []);

  const preloadRoute = useCallback((route: string) => {
    if (!hasGoodConnection || preloadedRoutes.has(route) || !routeImports[route]) {
      return;
    }

    // Usar requestIdleCallback para não bloquear UI
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        routeImports[route]()
          .then(() => {
            setPreloadedRoutes(prev => new Set([...prev, route]));
          })
          .catch(() => {
            // Falha silenciosa no preload
          });
      }, { timeout: 1000 });
    }
  }, [hasGoodConnection, preloadedRoutes]);

  return { preloadRoute, preloadedRoutes };
};

export default useSmartPreload;