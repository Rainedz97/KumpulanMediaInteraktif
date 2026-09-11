const DB_NAME='brianLearningMediaDB';
const DB_VERSION=2;
const STORE='projects';
const AppDB={
  open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Database sedang dipakai tab lain. Tutup tab lain lalu coba lagi.'));});},
  async all(){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});},
  async get(id){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});},
  async put(value){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(value);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});},
  async del(id){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});},
  async clear(){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
};
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function normalizePath(p=''){return p.replaceAll('\\','/').replace(/^\.\//,'').replace(/^\//,'');}

// Menyelesaikan `target` (nilai src/href/url() dari sebuah file) relatif
// terhadap `base` (path file yang memuatnya) menjadi path proyek yang rata
// (tanpa './' atau '../'). Menangani:
//  - path absolut dari root proyek (diawali '/') -> dianggap relatif ke akar
//    folder proyek, bukan relatif ke folder file saat ini
//  - query string / fragment di belakang URL (mis. "app.css?v=2", "img.png#x")
//    yang umum muncul di paket HTML5 hasil export tool lain
function resolvePath(base,target){
  if(!target||/^(?:https?:|data:|blob:|#|mailto:|javascript:)/i.test(target))return null;
  const clean=target.split('#')[0].split('?')[0];
  if(!clean)return null;
  if(clean.startsWith('/'))return normalizePath(clean);
  const stack=normalizePath(base).split('/');stack.pop();
  for(const part of clean.split('/')){if(!part||part==='.')continue;if(part==='..')stack.pop();else stack.push(part)}
  return normalizePath(stack.join('/'));
}
function mimeFromPath(p){const ext=p.split('.').pop().toLowerCase();return {html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',mp4:'video/mp4',webm:'video/webm',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',ico:'image/x-icon'}[ext]||'application/octet-stream';}
function dataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
function fallbackThumb(title){const safe=String(title||'BRIAN PROJECT').slice(0,28).replace(/&/g,'&amp;').replace(/</g,'&lt;');return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="510" viewBox="0 0 900 510"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#0d67aa"/><stop offset="1" stop-color="#06224a"/></linearGradient><linearGradient id="b" x1="0" x2="1"><stop stop-color="#22c6ff"/><stop offset="1" stop-color="#0788ff"/></linearGradient></defs><rect width="900" height="510" fill="url(#g)"/><circle cx="720" cy="88" r="170" fill="#25caff" opacity=".12"/><circle cx="130" cy="420" r="220" fill="#ffac00" opacity=".1"/><rect x="65" y="72" width="72" height="72" rx="22" fill="url(#b)"/><text x="101" y="122" text-anchor="middle" font-family="Arial" font-size="34" font-weight="800" fill="#fff">B</text><text x="65" y="220" font-family="Arial" font-size="46" font-weight="800" fill="#fff">${safe}</text><text x="65" y="265" font-family="Arial" font-size="24" fill="#9fdfff">BRIAN LEARNING &amp; MEDIA STUDIO</text><rect x="65" y="345" width="360" height="12" rx="6" fill="#7edfff" opacity=".4"/><rect x="65" y="375" width="260" height="12" rx="6" fill="#7edfff" opacity=".22"/></svg>`);}
async function buildObjectUrls(files){const urls=new Map();for(const [path,buf] of files.entries()){urls.set(path,URL.createObjectURL(new Blob([buf],{type:mimeFromPath(path)})));}return urls;}
function replaceCssUrls(css,base,urls){return css.replace(/url\(([^)]+)\)/g,(m,raw)=>{const v=raw.trim().replace(/^['"]|['"]$/g,'');const p=resolvePath(base,v);return(p&&urls.has(p))?`url("${urls.get(p)}")`:m;});}

// Menulis ulang atribut `srcset` (gambar responsif <img>/<source>), yang
// berisi daftar "url deskriptor, url deskriptor, ...".
function rewriteSrcset(value,base,urls){
  return value.split(',').map(part=>{
    const trimmed=part.trim();if(!trimmed)return part;
    const m=trimmed.match(/^(\S+)(\s+.*)?$/);if(!m)return trimmed;
    const p=resolvePath(base,m[1]);
    return (p&&urls.has(p))?urls.get(p)+(m[2]||''):trimmed;
  }).join(', ');
}

// Menulis ulang `import ... from './x.js'`, `import './x.js'`, dan
// `import('./x.js')` yang menunjuk file lokal relatif di dalam kode
// JavaScript ber-modul (type="module"), supaya tetap bisa dimuat lewat
// Blob URL secara offline. Hanya menyentuh specifier relatif (diawali
// './' atau '../'); package/bare specifier (mis. "three") tetap dibiarkan
// karena memang tidak bisa diselesaikan tanpa internet/bundler.
function rewriteJsImports(code,base,urls){
  const mapSpec=spec=>{const p=resolvePath(base,spec);return (p&&urls.has(p))?urls.get(p):null;};
  code=code.replace(/\b(import|export)\b([^;'"`]{0,200}?)\bfrom\s*(['"])(\.\.?\/[^'"]+)\3/g,(m,kw,mid,q,spec)=>{
    const url=mapSpec(spec);return url?`${kw}${mid}from ${q}${url}${q}`:m;
  });
  code=code.replace(/\bimport\s*(\(\s*)?(['"])(\.\.?\/[^'"]+)\2(\s*\))?/g,(m,popen,q,spec,pclose)=>{
    const url=mapSpec(spec);if(!url)return m;
    return `import ${popen||''}${q}${url}${q}${pclose||''}`;
  });
  return code;
}

// Satu fungsi tunggal yang membangun dokumen HTML proyek yang siap
// dijalankan offline di dalam iframe sandbox: semua src/href/srcset,
// url() di <style> & file CSS eksternal, serta script biasa maupun
// ber-modul (termasuk import lokalnya) ditulis ulang ke Blob URL.
async function buildPlayableDocument(entryPath,files){
  const entryBuf=files.get(entryPath);
  if(!entryBuf)throw new Error('index.html tidak ditemukan di dalam proyek.');
  const urls=await buildObjectUrls(files);
  const objectUrls=[...urls.values()];
  const html=new TextDecoder().decode(entryBuf);
  const doc=new DOMParser().parseFromString(html,'text/html');
  const extraUrls=[];

  for(const el of doc.querySelectorAll('[src]')){
    const path=resolvePath(entryPath,el.getAttribute('src'));
    if(path&&urls.has(path))el.setAttribute('src',urls.get(path));
  }
  for(const el of doc.querySelectorAll('[srcset]')){
    el.setAttribute('srcset',rewriteSrcset(el.getAttribute('srcset'),entryPath,urls));
  }
  for(const el of doc.querySelectorAll('[href]:not(link[rel="stylesheet"])')){
    const path=resolvePath(entryPath,el.getAttribute('href'));
    if(path&&urls.has(path))el.setAttribute('href',urls.get(path));
  }
  for(const style of doc.querySelectorAll('style')){
    style.textContent=replaceCssUrls(style.textContent,entryPath,urls);
  }
  for(const link of [...doc.querySelectorAll('link[rel="stylesheet"]')]){
    const path=resolvePath(entryPath,link.getAttribute('href'));
    if(path&&files.has(path)){
      const css=replaceCssUrls(new TextDecoder().decode(files.get(path)),path,urls);
      const blob=URL.createObjectURL(new Blob([css],{type:'text/css'}));
      extraUrls.push(blob);link.setAttribute('href',blob);
    }
  }
  for(const script of [...doc.querySelectorAll('script[src]')]){
    const path=resolvePath(entryPath,script.getAttribute('src'));
    if(path&&files.has(path)){
      const isModule=(script.getAttribute('type')||'').toLowerCase()==='module';
      let content=files.get(path);let type=mimeFromPath(path);
      if(isModule){
        const code=rewriteJsImports(new TextDecoder().decode(content),path,urls);
        content=code;type='text/javascript';
      }
      const blob=URL.createObjectURL(new Blob([content],{type}));
      extraUrls.push(blob);script.setAttribute('src',blob);
    }
  }
  for(const script of doc.querySelectorAll('script:not([src])')){
    if((script.getAttribute('type')||'').toLowerCase()==='module'){
      script.textContent=rewriteJsImports(script.textContent,entryPath,urls);
    }
  }
  return {html:'<!doctype html>\n'+doc.documentElement.outerHTML,objectUrls:[...objectUrls,...extraUrls]};
}
function cleanProjectFiles(files){return Object.entries(files||{}).map(([path,buf])=>[normalizePath(path),buf]);}
