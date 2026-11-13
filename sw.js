/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
const VERSION='brian-v1';
const SHELL_CACHE=VERSION+'-shell';
const RUNTIME_CACHE=VERSION+'-runtime';
const SHELL_FILES=[
 '/','/index.html','/koleksi','/koleksi.html','/koleksi-saya','/koleksi-saya.html',
 '/css/styles.css','/css/collection.css','/css/saya.css',
 '/js/hero.js','/js/collection.js','/js/saya.js','/js/miniunzip.js','/js/watermark.js',
 '/manifest.json','/assets/icons/favicon.svg','/assets/icons/icon-192.png','/assets/icons/icon-512.png',
 '/assets/images/creator.webp'
];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL_FILES)).catch(()=>{}));
 self.skipWaiting();
});
self.addEventListener('activate',e=>{
 e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==location.origin)return; // jangan ganggu permintaan lintas situs (GitHub API, tautan eksternal)

 // Data katalog: selalu coba jaringan dulu supaya proyek baru langsung terlihat
 if(url.pathname==='/data/projects.json'){
  e.respondWith(
   fetch(req).then(res=>{const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));return res;})
    .catch(()=>caches.match(req))
  );
  return;
 }

 // Navigasi halaman (alamat diketik langsung / dibuka dari beranda HP): jaringan dulu, fallback cache
 if(req.mode==='navigate'){
  e.respondWith(
   fetch(req).then(res=>{const copy=res.clone();caches.open(SHELL_CACHE).then(c=>c.put(req,copy));return res;})
    .catch(()=>caches.match(req).then(r=>r||caches.match('/koleksi.html')))
  );
  return;
 }

 // Berkas proyek yang diunggah (projects/..., thumbs/...): cache-first, supaya proyek yang pernah dibuka bisa dipakai tanpa internet
 if(url.pathname.startsWith('/projects/')||url.pathname.startsWith('/thumbs/')){
  e.respondWith(
   caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));return res;
   }))
  );
  return;
 }

 // Lainnya (CSS/JS/ikon/gambar situs sendiri): cache-first dengan pembaruan diam-diam di latar
 e.respondWith(
  caches.match(req).then(cached=>{
   const fetchPromise=fetch(req).then(res=>{
    const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));return res;
   }).catch(()=>cached);
   return cached||fetchPromise;
  })
 );
});
