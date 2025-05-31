const CACHE_NAME = 'agenda-psi-cache-v2'; // Alterado para uma nova versão de cache
const urlsToCache = [
  './index.html', // Caminho atualizado
  './manifest.json',
  './service-worker.js',
  'https://cdn.tailwindcss.com',
  // Adicione aqui outros recursos que sua aplicação usa e que devem ser cacheados
];

// Instalação do Service Worker e cache dos recursos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Evento: install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('[Service Worker] Todos os URLs adicionados ao cache com sucesso!');
            self.skipWaiting(); // Força a ativação do novo Service Worker imediatamente
          })
          .catch(error => {
            console.error('[Service Worker] Falha ao adicionar URLs ao cache:', error);
            // Se houver um erro aqui, a instalação do Service Worker falhará.
            // Verifique se todos os URLs são acessíveis.
          });
      })
      .catch(error => {
        console.error('[Service Worker] Falha ao abrir o cache:', error);
      })
  );
});

// Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Evento: fetch para', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }
        // Se não estiver no cache, busca na rede
        console.log('[Service Worker] Buscando da rede:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Falha no fetch para:', event.request.url, error);
        // Você pode retornar uma página offline aqui, se desejar
        // return caches.match('/offline.html');
      })
  );
});

// Ativação do Service Worker (limpeza de caches antigos)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Evento: activate');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ativação completa. Clientes controlados.');
      return self.clients.claim(); // Assume o controle dos clientes imediatamente
    })
  );
});
