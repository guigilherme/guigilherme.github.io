const CACHE_NAME = 'agenda-psi-cache-v1';
const urlsToCache = [
  './clínica psi.html',
  './manifest.json',
  './service-worker.js',
  'https://cdn.tailwindcss.com',
  // Adicione aqui outros recursos que sua aplicação usa e que devem ser cacheados
  // Por exemplo, imagens, fontes, outros arquivos JS/CSS locais.
  // Para este exemplo, apenas os arquivos essenciais estão incluídos.
];

// Instalação do Service Worker e cache dos recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          return response;
        }
        // Se não estiver no cache, busca na rede
        return fetch(event.request);
      })
  );
});

// Ativação do Service Worker (limpeza de caches antigos)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Deleta caches que não estão na whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
