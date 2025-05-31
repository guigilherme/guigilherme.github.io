// Nome do cache para a versão atual do service worker
const CACHE_NAME = 'agenda-psico-v1';

// Lista de arquivos para cachear durante a instalação
const urlsToCache = [
  '/index.html',
  '/manifest.json',
  // Você pode adicionar outros arquivos CSS, JS ou imagens aqui se eles estiverem em pastas separadas
  // Exemplo: '/css/style.css', '/js/app.js', '/images/icon.png'
];

// Evento de instalação do Service Worker
self.addEventListener('install', (event) => {
  // Espera até que o cache seja aberto e todos os arquivos essenciais sejam adicionados
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de ativação do Service Worker
self.addEventListener('activate', (event) => {
  // Remove caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch (intercepta requisições de rede)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o recurso estiver no cache, retorna-o
        if (response) {
          return response;
        }
        // Se não estiver no cache, tenta buscar na rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Verifica se a resposta da rede é válida antes de cachear
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta para que ela possa ser usada tanto pelo navegador quanto pelo cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Fallback para quando a rede e o cache falham (ex: página offline personalizada)
            // Você pode retornar uma página offline aqui se desejar
            // return caches.match('/offline.html');
            console.log('Falha na requisição e não encontrado no cache:', event.request.url);
            return new Response('<h1>Você está offline e esta página não está em cache.</h1>', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});
