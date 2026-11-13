/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function toast(m,type='success'){const t=$('#toast');clearTimeout(toast.t);t.textContent=m;t.className='toast '+type;toast.t=setTimeout(()=>t.classList.add('hidden'),2800);}

/* ---------- IndexedDB ---------- */
const DB_NAME='brianLocalDB',DB_VER=1;
let dbp=null;
function openDB(){
 if(dbp)return dbp;
 dbp=new Promise((res,rej)=>{
  const r=indexedDB.open(DB_NAME,DB_VER);
  r.onupgradeneeded=()=>{
   const db=r.result;
   if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});
   if(!db.objectStoreNames.contains('gamedata'))db.createObjectStore('gamedata',{keyPath:'pid'});
  };
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
 });
 return dbp;
}
async function idbGet(store,key){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readonly').objectStore(store).get(key);t.onsuccess=()=>res(t.result||null);t.onerror=()=>rej(t.error);});}
async function idbAll(store){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readonly').objectStore(store).getAll();t.onsuccess=()=>res(t.result||[]);t.onerror=()=>rej(t.error);});}
async function idbPut(store,val){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite').objectStore(store).put(val);t.onsuccess=()=>res();t.onerror=()=>rej(t.error);});}
async function idbDel(store,key){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite').objectStore(store).delete(key);t.onsuccess=()=>res();t.onerror=()=>rej(t.error);});}

/* ---------- Util ---------- */
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'proyek';
const newId=title=>slug(title)+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon',
 mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',mp4:'video/mp4',webm:'video/webm',
 woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',pdf:'application/pdf',json:'application/json'};
const TEXT_EXT=new Set(['html','htm','css','js','mjs','json','svg','txt','xml','csv']);
function extOf(name){const m=/\.([a-z0-9]+)$/i.exec(name);return m?m[1].toLowerCase():'';}
function b64FromBytes(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s);}
function textDecode(bytes){return new TextDecoder('utf-8').decode(bytes);}

/* ---------- Menggabungkan file proyek jadi satu dokumen (inline) ---------- */
function buildInlineDoc(indexText,fileMap){
 // fileMap: relPath(lowercase-normalized) -> {bin:Uint8Array|null, text:string|null, mime}
 const lookup=rel=>{
  const norm=rel.replace(/^\.\//,'').replace(/^\//,'');
  return fileMap.get(norm)||fileMap.get(norm.toLowerCase());
 };
 const dataUri=f=>f.text!=null?`data:${f.mime};charset=utf-8;base64,${btoa(unescape(encodeURIComponent(f.text)))}`:`data:${f.mime};base64,${b64FromBytes(f.bin)}`;
 let html=indexText;
 // <link rel="stylesheet" href="..."> -> <style>...</style> (dengan url() di dalamnya ikut di-inline)
 html=html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi,tag=>{
  const m=/href=["']([^"'#][^"']*)["']/i.exec(tag);if(!m)return tag;
  const f=lookup(m[1]);if(!f||f.text==null)return tag;
  let css=f.text.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/gi,(full,u)=>{
   if(/^(https?:|data:|#)/i.test(u))return full;
   const uf=lookup(u);return uf?`url(${dataUri(uf)})`:full;
  });
  return `<style>${css}</style>`;
 });
 // <script src="..."></script> (non-module) -> <script>...</script>
 html=html.replace(/<script\b([^>]*)\bsrc=["']([^"'#][^"']*)["']([^>]*)>\s*<\/script>/gi,(full,pre,src,post)=>{
  if(/type=["']module["']/i.test(pre+post))return full; // modul ESM tidak di-inline (lihat catatan keterbatasan)
  const f=lookup(src);if(!f||f.text==null)return full;
  const attrs=(pre+post).replace(/\bsrc=["'][^"']*["']/i,'').trim();
  return `<script${attrs?' '+attrs:''}>${f.text}</script>`;
 });
 // src="..." / href="..." lain (gambar, audio, video, ikon) -> data URI
 html=html.replace(/\b(src|href|poster)=["']([^"'#][^"']*)["']/gi,(full,attr,val)=>{
  if(/^(https?:|data:|mailto:|tel:)/i.test(val))return full;
  const f=lookup(val);if(!f)return full;
  return `${attr}="${dataUri(f)}"`;
 });
 return html;
}

/* ---------- Mengubah daftar File jadi fileMap ---------- */
async function filesToMap(fileList,stripPrefixCount){
 const map=new Map();let totalSize=0;
 for(const f of fileList){
  const parts=f.webkitRelativePath?f.webkitRelativePath.split('/'):[f.name];
  const rel=parts.slice(stripPrefixCount).join('/');
  if(!rel||/(^|\/)(\.DS_Store|Thumbs\.db)$/.test(rel))continue;
  const buf=await f.arrayBuffer();totalSize+=buf.byteLength;
  const ext=extOf(rel),mime=MIME[ext]||'application/octet-stream';
  if(TEXT_EXT.has(ext))map.set(rel.toLowerCase(),{text:textDecode(new Uint8Array(buf)),bin:null,mime:ext==='html'||ext==='htm'?'text/html':ext==='css'?'text/css':ext==='js'||ext==='mjs'?'text/javascript':mime});
  else map.set(rel.toLowerCase(),{text:null,bin:new Uint8Array(buf),mime});
 }
 return {map,totalSize};
}
function findIndexKey(map){
 if(map.has('index.html'))return 'index.html';
 // satu folder pembungkus (umum saat zip dibuat dari satu folder) -> coba lepas satu level
 const keys=[...map.keys()];
 const tops=new Set(keys.map(k=>k.split('/')[0]));
 if(tops.size===1){
  const only=[...tops][0];
  const stripped=new Map(keys.map(k=>[k.slice(only.length+1),map.get(k)]));
  if(stripped.has('index.html'))return {stripped};
 }
 return null;
}

/* ---------- Simpan proyek ---------- */
async function saveProject(title,description,docHtml,size){
 const id=newId(title);const now=Date.now();
 await idbPut('projects',{id,title,description:description||'',docHtml,size,createdAt:now,updatedAt:now});
 return id;
}
const LIMIT_BYTES=60*1024*1024; // ±60MB per proyek, batas kenyamanan browser

/* ---------- UI state ---------- */
let projects=[],quotaInfo=null;
async function refresh(){
 projects=(await idbAll('projects')).sort((a,b)=>b.updatedAt-a.updatedAt);
 render();
 if(navigator.storage?.estimate){
  try{quotaInfo=await navigator.storage.estimate();
   const mb=(quotaInfo.usage/1048576).toFixed(1);
   $('#saQuota').textContent=mb+' MB';
  }catch{$('#saQuota').textContent='—';}
 }
}
function render(){
 $('#saCount').textContent=projects.length;
 const q=($('#saSearch').value||'').trim().toLowerCase();
 const list=q?projects.filter(p=>`${p.title} ${p.description}`.toLowerCase().includes(q)):projects;
 const g=$('#saGrid');
 if(!list.length){
  g.innerHTML=`<div class="empty-state"><div class="empty-icon">∅</div><h3>${q?'Tidak ada yang cocok':'Koleksi Saya masih kosong'}</h3><p>${q?'Coba kata kunci lain.':'Tambahkan media HTML Anda lewat tombol di atas. Semua tersimpan di browser ini saja.'}</p></div>`;return;
 }
 g.innerHTML=list.map(p=>`<article class="catalog-card"><div class="catalog-thumb"><div class="sa-ph">${esc(p.title.slice(0,2).toUpperCase())}</div><span class="local-badge">Di perangkat ini</span><button class="sa-menu-btn" data-edit="${p.id}" title="Ubah / hapus">⋯</button></div><div class="catalog-card-body"><h3>${esc(p.title)}</h3><p>${esc(p.description||'Proyek HTML pribadi.')}</p><div class="card-actions"><button class="open-card" data-open="${p.id}">▶ Buka</button></div></div></article>`).join('');
}

/* ---------- Pemutar (sandbox terisolasi + shim penyimpanan) ---------- */
let curId=null,pendingSave=null,saveTimer=null;
function buildShim(pid,data){
 const safeData=JSON.stringify(data).replace(/<\//g,'<\\/');
 const safePid=JSON.stringify(pid).replace(/<\//g,'<\\/');
 return `<script>(function(){
  var __d=${safeData};
  var __store=new Map(Object.entries(__d));
  function __emit(k,v){try{parent.postMessage({__brianSave:true,pid:${safePid},key:k,value:v},'*');}catch(e){}}
  var __ls={
   getItem:function(k){return __store.has(k)?__store.get(k):null;},
   setItem:function(k,v){v=String(v);__store.set(k,v);__emit(k,v);},
   removeItem:function(k){__store.delete(k);__emit(k,null);},
   clear:function(){Array.from(__store.keys()).forEach(function(k){__emit(k,null);});__store.clear();},
   key:function(i){return Array.from(__store.keys())[i]||null;}
  };
  Object.defineProperty(__ls,'length',{get:function(){return __store.size;}});
  try{Object.defineProperty(window,'localStorage',{value:__ls,configurable:true});}catch(e){}
  try{Object.defineProperty(window,'sessionStorage',{value:__ls,configurable:true});}catch(e){}
  console.log('%cBRIAN Learning & Media Studio','color:#4fd1ff;font-weight:bold','— proyek berjalan di sandbox terisolasi.');
 })();<\/script>`;
}
function injectShim(doc,shim){
 if(/<head[^>]*>/i.test(doc))return doc.replace(/<head[^>]*>/i,m=>m+shim);
 if(/<html[^>]*>/i.test(doc))return doc.replace(/<html[^>]*>/i,m=>m+shim);
 return shim+doc;
}
async function openPlayer(id){
 const p=projects.find(x=>x.id===id);if(!p)return;
 curId=id;
 const gd=await idbGet('gamedata',id);
 const shim=buildShim(id,gd?.data||{});
 $('#playerTitle').textContent=p.title;
 $('#playerOverlay').classList.remove('hidden');document.body.style.overflow='hidden';
 $('#projectFrame').srcdoc=injectShim(p.docHtml,shim);
}
function closePlayer(){$('#projectFrame').srcdoc='';$('#playerOverlay').classList.add('hidden');document.body.style.overflow='';curId=null;flushSave();}
function reload(){if(curId)openPlayer(curId);}
function fs(){const s=$('#playerStage');if(!document.fullscreenElement)s.requestFullscreen?.();else document.exitFullscreen?.();}
let saveBuf={};
window.addEventListener('message',e=>{
 const d=e.data;if(!d||!d.__brianSave||d.pid!==curId)return;
 saveBuf[d.key]=d.value;clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,500);
});
async function flushSave(){
 if(!curId||!Object.keys(saveBuf).length)return;
 const pid=curId,buf=saveBuf;saveBuf={};
 const rec=(await idbGet('gamedata',pid))||{pid,data:{}};
 for(const k in buf){if(buf[k]===null)delete rec.data[k];else rec.data[k]=buf[k];}
 await idbPut('gamedata',rec);
}

/* ---------- Tambah proyek ---------- */
async function addSingleFile(file){
 if(file.size>LIMIT_BYTES)throw new Error('Ukuran file melebihi 60 MB.');
 const text=await file.text();
 const id=await saveProject(file.name.replace(/\.html?$/i,''),'',text,file.size);
 toast('Proyek ditambahkan ke Koleksi Saya.');await refresh();
}
async function addFolderOrZipEntries(entries,totalSize,defaultTitle){
 if(totalSize>LIMIT_BYTES)throw new Error('Ukuran proyek melebihi 60 MB.');
 let idx=findIndexKey(entries);
 let map=entries;
 if(idx&&idx.stripped){map=idx.stripped;}
 else if(!entries.has('index.html'))throw new Error('index.html tidak ditemukan di tingkat paling atas folder/zip.');
 const idxFile=map.get('index.html');
 const doc=buildInlineDoc(idxFile.text,map);
 const id=await saveProject(defaultTitle,'',doc,totalSize);
 toast('Proyek ditambahkan ke Koleksi Saya.');await refresh();
}
async function addFolder(fileList){
 const files=[...fileList];if(!files.length)return;
 if(!files[0].webkitRelativePath)throw new Error('Browser ini tidak memberi informasi struktur folder. Gunakan berkas .zip sebagai gantinya.');
 const top=files[0].webkitRelativePath.split('/')[0];
 const {map,totalSize}=await filesToMap(files,1);
 if(!map.size)throw new Error('Folder tampak kosong atau tidak terbaca. Coba lagi atau gunakan .zip.');
 await addFolderOrZipEntries(map,totalSize,top);
}
async function addZip(file){
 if(file.size>LIMIT_BYTES)throw new Error('Ukuran berkas melebihi 60 MB.');
 const buf=await file.arrayBuffer();
 let entries;
 try{entries=window.MiniUnzip.readZip(buf);}catch(e){throw new Error('Gagal membaca .zip: '+e.message);}
 const map=new Map();let totalSize=0;
 for(const e of entries){
  if(!e.name||e.name.endsWith('/'))continue;
  let bytes;
  if(e.method===0)bytes=e.raw;
  else if(e.method===8)bytes=window.MiniUnzip.inflateRaw(e.raw);
  else continue; // metode kompresi tidak didukung, lewati
  totalSize+=bytes.length;
  const rel=e.name.toLowerCase();const ext=extOf(rel),mime=MIME[ext]||'application/octet-stream';
  if(TEXT_EXT.has(ext))map.set(rel,{text:textDecode(bytes),bin:null,mime:ext==='html'||ext==='htm'?'text/html':ext==='css'?'text/css':ext==='js'?'text/javascript':mime});
  else map.set(rel,{text:null,bin:bytes,mime});
 }
 await addFolderOrZipEntries(map,totalSize,file.name.replace(/\.zip$/i,''));
}
async function addPaste(name,code){
 if(new Blob([code]).size>LIMIT_BYTES)throw new Error('Kode terlalu besar.');
 const id=await saveProject(name,'',code,code.length);
 toast('Proyek ditambahkan ke Koleksi Saya.');await refresh();
}

/* ---------- Ekspor / impor ---------- */
async function exportAll(){
 const all=await idbAll('projects');const gd=await idbAll('gamedata');
 const blob=new Blob([JSON.stringify({app:'brian-koleksi-saya',version:1,exportedAt:Date.now(),projects:all,gamedata:gd},null,0)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='brian-koleksi-saya-cadangan.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function importAll(file){
 const json=JSON.parse(await file.text());
 if(json.app!=='brian-koleksi-saya'||!Array.isArray(json.projects))throw new Error('Berkas cadangan tidak dikenali.');
 for(const p of json.projects){
  let id=p.id;while(projects.some(x=>x.id===id))id=id+'-salin';
  await idbPut('projects',{...p,id});
 }
 for(const g of (json.gamedata||[]))await idbPut('gamedata',g);
 await refresh();
 return json.projects.length;
}

/* ---------- Ikatan UI ---------- */
function bind(){
 $('#saSearch').oninput=render;
 $$('[data-add]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.add;
  if(k==='file')$('#pickFile').click();
  else if(k==='folder'){
   if(!('webkitdirectory' in document.createElement('input'))){toast('Perangkat/browser ini tidak mendukung pilih folder. Gunakan berkas .zip atau satu file .html sebagai gantinya.','err');return;}
   $('#pickFolder').click();
  }
  else if(k==='zip')$('#pickZip').click();
  else if(k==='paste'){$('#pasteName').value='';$('#pasteCode').value='';$('#pasteDialog').classList.remove('hidden');}
 });
 $('#pickFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)addSingleFile(f).catch(err=>toast(err.message,'err'));};
 $('#pickFolder').onchange=e=>{const fl=[...e.target.files];e.target.value='';if(fl.length)addFolder(fl).catch(err=>toast(err.message,'err'));};
 $('#pickZip').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)addZip(f).catch(err=>toast(err.message,'err'));};
 $('#pasteForm').onsubmit=e=>{e.preventDefault();addPaste($('#pasteName').value.trim(),$('#pasteCode').value).then(()=>$('#pasteDialog').classList.add('hidden')).catch(err=>toast(err.message,'err'));};
 document.addEventListener('click',e=>{
  const c=e.target.closest('[data-close]');if(c)$('#'+c.dataset.close).classList.add('hidden');
  const o=e.target.closest('[data-open]');if(o)openPlayer(o.dataset.open);
  const ed=e.target.closest('[data-edit]');if(ed)openEdit(ed.dataset.edit);
  const i=e.target.closest('[data-info]');if(i)openInfo();
 });
 $('#pasteDialog').onclick=e=>{if(e.target.id==='pasteDialog')e.target.classList.add('hidden');};
 $('#editDialog').onclick=e=>{if(e.target.id==='editDialog')e.target.classList.add('hidden');};
 $('#exportDialog').onclick=e=>{if(e.target.id==='exportDialog')e.target.classList.add('hidden');};
 $('#infoDialog').onclick=e=>{if(e.target.id==='infoDialog')e.target.classList.add('hidden');};
 $('#playerBack').onclick=$('#playerClose').onclick=closePlayer;
 $('#playerReload').onclick=reload;$('#playerFull').onclick=fs;
 $('#openExport').onclick=()=>{$('#importStatus').textContent='';$('#exportDialog').classList.remove('hidden');};
 $('#doExport').onclick=exportAll;
 $('#importFile').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const n=await importAll(f);$('#importStatus').textContent=`Berhasil mengimpor ${n} proyek.`;}
  catch(err){$('#importStatus').textContent='Gagal impor: '+err.message;}
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#playerOverlay').classList.contains('hidden'))closePlayer();else $$('.dialog-backdrop:not(.hidden)').forEach(d=>d.classList.add('hidden'));}});
}
let editingId=null;
function openEdit(id){const p=projects.find(x=>x.id===id);if(!p)return;editingId=id;$('#editName').value=p.title;$('#editDesc').value=p.description||'';$('#editDialog').classList.remove('hidden');}
document.addEventListener('DOMContentLoaded',()=>{
 bind();
 $('#editForm').onsubmit=async e=>{
  e.preventDefault();const p=projects.find(x=>x.id===editingId);if(!p)return;
  p.title=$('#editName').value.trim();p.description=$('#editDesc').value.trim();p.updatedAt=Date.now();
  await idbPut('projects',p);$('#editDialog').classList.add('hidden');await refresh();
 };
 $('#editDelete').onclick=async()=>{
  if(!editingId||!confirm('Hapus proyek ini dari Koleksi Saya di perangkat ini?'))return;
  await idbDel('projects',editingId);await idbDel('gamedata',editingId);
  $('#editDialog').classList.add('hidden');await refresh();
 };
 refresh();
});
function openInfo(){
 $('#infoKicker').textContent='TENTANG';$('#infoTitle').textContent='Koleksi Saya';
 $('#infoContent').innerHTML='<p>Halaman ini menyimpan media HTML Anda sendiri langsung di browser ini (IndexedDB), terpisah dari koleksi publik. Tidak ada yang terkirim ke server BRIAN Studio.</p><p>Setiap proyek dijalankan di sandbox terisolasi: ia tidak bisa membaca data situs atau proyek lain. Permainan yang menyimpan skor lewat <code>localStorage</code> tetap tersimpan per proyek, namun hanya di perangkat dan browser ini — gunakan <b>Ekspor</b> secara berkala sebagai cadangan.</p><p>Proyek yang memuat berkas lain lewat <code>fetch()</code>, atau skrip bertipe <code>module</code>, mungkin tidak berjalan sempurna karena semua berkas digabung menjadi satu dokumen.</p>';
 $('#infoDialog').classList.remove('hidden');
}
