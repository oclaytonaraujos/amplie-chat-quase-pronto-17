// Service Worker avançado para produção
const CACHE_NAME = 'whatsapp-crm-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/Inter-Regular.woff2',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Configuração de TTL para diferentes tipos de conteúdo
const CACHE_TTL = {
  API: 5 * 60 * 1000, // 5 minutos
  STATIC: 24 * 60 * 60 * 1000, // 24 horas
  IMAGES: 7 * 24 * 60 * 60 * 1000 // 7 dias
};

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache assets estáticos
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      cleanupOldCaches(),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Decidir estratégia baseada no tipo de requisição
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (url.pathname.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
    // Assets estáticos - Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/')) {
    // HTML pages - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    // Tentar rede primeiro
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache response se bem sucedida
      const cache = await caches.open(cacheName);
      const responseClone = response.clone();
      
      // Adicionar timestamp para TTL
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return response;
  } catch (error) {
    // Se rede falhar, tentar cache
    const cachedResponse = await getCachedResponse(request, cacheName);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se nem rede nem cache, retornar erro
    throw error;
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  // Tentar cache primeiro
  const cachedResponse = await getCachedResponse(request, cacheName);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não estiver em cache, buscar da rede
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Retornar resposta offline se disponível
    return getOfflineResponse(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await getCachedResponse(request, cacheName);
  
  // Buscar da rede em background para atualizar cache
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não há cache, aguardar rede
  return networkPromise || getOfflineResponse(request);
}

// Obter resposta em cache considerando TTL
async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  // Verificar TTL
  const cachedAt = cachedResponse.headers.get('sw-cached-at');
  if (cachedAt) {
    const age = Date.now() - parseInt(cachedAt);
    const ttl = getTTLForRequest(request);
    
    if (age > ttl) {
      // Cache expirado, remover
      cache.delete(request);
      return null;
    }
  }
  
  return cachedResponse;
}

// Obter TTL baseado no tipo de requisição
function getTTLForRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return CACHE_TTL.API;
  } else if (url.pathname.match(/\.(png|jpg|svg)$/)) {
    return CACHE_TTL.IMAGES;
  } else {
    return CACHE_TTL.STATIC;
  }
}

// Limpar caches antigos
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => caches.delete(cacheName))
  );
}

// Resposta offline padrão
function getOfflineResponse(request) {
  if (request.destination === 'document') {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>Você está offline</h1>
            <p>Conecte-se à internet para acessar o sistema.</p>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  return new Response('Offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Background sync para dados importantes
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sincronizar dados pendentes quando conectar
  try {
    const pendingData = await getPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const data = event.notification.data;
  
  event.waitUntil(
    clients.openWindow(data.url || '/')
  );
});

// Placeholder functions para funcionalidades futuras
async function getPendingData() {
  // TODO: Implementar obtenção de dados pendentes
  return [];
}

async function syncPendingData(data) {
  // TODO: Implementar sincronização de dados
  console.log('Syncing pending data:', data);
}