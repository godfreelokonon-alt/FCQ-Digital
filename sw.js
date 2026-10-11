/* FCQ Digital : garde une copie de l'application dans la tablette pour l'ouvrir sans réseau.
   Avec réseau, la page vient de GitHub (dernière version publiée) et la copie est remplacée.
   Sans réseau, ou si le réseau ne répond pas en 4 s, la copie prend le relais.
   Les fiches saisies ne passent pas par ici : elles restent dans le stockage de la tablette. */
const CACHE = 'fcq-digital';
const FICHIERS = ['./', 'manifest.webmanifest', 'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;   // polices Google : le navigateur s'en charge
  const cle = r.mode === 'navigate' ? './' : r;      // toute ouverture de l'appli (index.html, lien d'invitation…) = la même page
  const reseau = caches.open(CACHE).then(c => fetch(r).then(rep => {
    if (rep.ok) c.put(cle, rep.clone());
    return rep;
  }));
  e.waitUntil(reseau.catch(() => {}));                 // la copie se met à jour même si l'écran a déjà été servi par elle
  e.respondWith(caches.match(cle).then(copie => {
    if (!copie) return reseau;
    const delai = new Promise(ok => setTimeout(() => ok(copie), 4000));
    return Promise.race([reseau.then(rep => rep.ok ? rep : copie, () => copie), delai]);
  }));
});
