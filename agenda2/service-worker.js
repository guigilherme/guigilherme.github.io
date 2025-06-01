// service-worker.js
const CACHE_NAME = 'agenda-psico-v2';
const OFFLINE_PAGE = '/agenda2/index.html';
const FILES_TO_CACHE = [
  OFFLINE_PAGE,
  '/agenda2/manifest.json',
  '/agenda2/service-worker.js',
  // Adicione outros assets se necessário (imagens, CSS, JS separados)
];

// Instalação - Cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto e arquivos essenciais armazenados');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Ativa imediatamente
  );
});

// Ativação - Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => {
      console.log('Service Worker ativado e controlando clientes');
      return clients.claim();
    })
  );
});

// Estratégia de Fetch: Cache-first com fallback para rede
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e requisições externas (opcional)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Tratamento especial para navegação (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // Para outros recursos (JS, CSS, manifest, etc)
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Retorna do cache se existir, senão busca na rede
        return cached || fetch(event.request)
          .then(response => {
            // Se for um asset estático, adiciona ao cache para uso offline
            if (isCacheable(event.request)) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return response;
          })
          .catch(error => {
            console.log('Falha na requisição:', error);
            // Fallback genérico para outros recursos
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_PAGE);
            }
          });
      })
  );
});

// Verifica se a requisição deve ser cacheada
function isCacheable(request) {
  return (
    request.url.startsWith(self.location.origin) &&
    !request.url.includes('/api/') && // Exclui endpoints de API
    (request.url.endsWith('.js') || 
     request.url.endsWith('.css') || 
     request.url.endsWith('.json') ||
     request.url.endsWith('.png') ||
     request.url.endsWith('.jpg') ||
     request.url.endsWith('.ico'))
  );
}

// Mensagem para atualização em segundo plano
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
