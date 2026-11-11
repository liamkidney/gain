const REV='__REVISION__', CHANNEL='__CHANNEL__', BASE='__BASE_PATH__';
const CACHE=`gain-${CHANNEL}-${REV}`;
const STATIC=['./','./index.html','./style.css','./src/app.js','./src/model.js','./src/storage.js','./src/charts.js','./src/catalog.js','./src/numericKeypad.js','./src/plateLoading.js','./manifest.webmanifest','./favicon.svg','./icon-192.png','./icon-512.png',...['press','fly','squat','hinge','extension','lunge','curl','pull','row','ohp','raise','pushdown','calf','core','carry','thrust','hip-thrust'].map(x=>`./assets/exercises/${x}.svg`)];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC.map(p=>new Request(p,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(`gain-${CHANNEL}-`)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const path=new URL(req.url).pathname;
  if(CHANNEL==='prod'&&path.startsWith('/gain/dev/'))return; // prod SW scope includes /dev/: never intercept it
  if(!path.startsWith(BASE))return;
  e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const r=await fetch(req,{cache:'no-store'});if(r.ok)await cache.put(req,r.clone());return r;}catch{return (await cache.match(req,{ignoreSearch:true}))||(req.mode==='navigate'?await cache.match('./index.html'):Response.error());}})());
});
