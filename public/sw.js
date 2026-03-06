/**
 * Service Worker para cache agressivo de dados do Conecta Bahia
 * Estratégia: Stale-While-Revalidate para resposta instantânea
 */

const CACHE_NAME = 'conecta-bahia-v3';
const DATA_CACHE_NAME = 'conecta-data-v3';

// Arquivos estáticos para cache (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/BA_(1)9396399957704198.json',
  '/img/LogoConecta.png',
  '/img/MARCA%20GOVBA%200126%20-%20DO%20LADO%20DA%20GENTE__H.png',
];

// URLs de dados dinâmicos (API)
const DATA_URLS = [
  '/.netlify/functions/sharepoint',
  '/api/sharepoint',
];

// Instalação: Pre-cache de arquivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  // Forçar ativação imediata do novo SW
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto, adicionando assets estáticos');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch((err) => {
      console.warn('[SW] Erro ao cachear assets estáticos:', err);
    })
  );
  
  // Ativar imediatamente sem esperar
  self.skipWaiting();
});

// Ativação: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  // Assumir controle imediatamente
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // IMPORTANTE: Em desenvolvimento (localhost), SEMPRE fazer bypass do cache para API
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    if (url.pathname.includes('/api/')) {
      console.log('[SW] 🚫 Modo DEV: bypass total para:', url.pathname);
      event.respondWith(fetch(request));
      return;
    }
  }
  
  // ESTRATÉGIA 1: Stale-While-Revalidate para dados da API
  if (DATA_URLS.some(dataUrl => url.pathname.includes(dataUrl))) {
    event.respondWith(
      staleWhileRevalidate(request, DATA_CACHE_NAME)
    );
    return;
  }
  
  // ESTRATÉGIA 2: Cache First para assets estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(
      cacheFirst(request, CACHE_NAME)
    );
    return;
  }
  
  // ESTRATÉGIA 3: Network First para todo o resto
  event.respondWith(
    networkFirst(request, CACHE_NAME)
  );
});

/**
 * Stale-While-Revalidate: Retorna cache imediatamente e atualiza em background
 * Ideal para dados que mudam ocasionalmente mas velocidade é crítica
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Buscar atualização em background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      // Clonar antes de salvar (Response pode ser lido apenas uma vez)
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cache atualizado em background:', request.url);
    }
    return networkResponse;
  }).catch((err) => {
    console.warn('[SW] Erro ao buscar atualização:', err);
    return null;
  });
  
  // Retornar cache imediatamente se existir
  if (cachedResponse) {
    console.log('[SW] Retornando do cache (stale):', request.url);
    return cachedResponse;
  }
  
  // Se não houver cache, aguardar rede
  console.log('[SW] Sem cache, aguardando rede:', request.url);
  return fetchPromise;
}

/**
 * Cache First: Tenta cache primeiro, depois rede
 * Ideal para assets que não mudam
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache HIT:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache MISS, buscando da rede:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse && networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Network First: Tenta rede primeiro, fallback para cache
 * Ideal para conteúdo que muda frequentemente
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (err) {
    console.warn('[SW] Rede falhou, tentando cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw err;
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] Todos os caches limpos');
      })
    );
  }
});
