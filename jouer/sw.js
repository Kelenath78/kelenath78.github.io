/* CYBERCITY OVERDRIVE : fonctionnement hors ligne */
const VERSION='cybercity-overdrive-v0.92.0';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  /* polices Google : mises en cache au premier lancement en ligne */
  if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(VERSION+'-fonts').then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{c.put(req,r.clone());return r}).catch(()=>hit))));return;
  }
  if(url.origin!==location.origin)return;
  /* la page du jeu : réseau d'abord (toujours la dernière version en ligne), cache si hors ligne */
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put('./index.html',cp))}return r}).catch(()=>caches.match('./index.html')));return;
  }
  /* le reste : depuis le cache (hors ligne), mis à jour en arrière-plan */
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{
    const net=fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return r}).catch(()=>hit||caches.match('./index.html'));
    return hit||net;
  }));
});
