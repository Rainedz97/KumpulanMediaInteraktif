/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cfg={repo:localStorage.getItem('b_repo')||'',branch:localStorage.getItem('b_branch')||'main',token:localStorage.getItem('b_token')||''};
let projects=[],editing=null,busy=false;
const log=(m,err)=>{const e=$('#log');e.textContent=m;e.className=err?'err':'';};
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'proyek';
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);};
async function gh(path,opt={}){
 const r=await fetch(`https://api.github.com/repos/${cfg.repo}${path}`,{...opt,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'}});
 if(!r.ok){let m='';try{m=(await r.json()).message}catch{}throw new Error(`GitHub ${r.status}: ${m||r.statusText}`);}
 return r.json();
}
async function loadList(){
 log('Memuat daftar proyek…');
 try{
  const f=await gh(`/contents/data/projects.json?ref=${encodeURIComponent(cfg.branch)}`);
  const bytes=Uint8Array.from(atob(f.content.replace(/\s/g,'')),c=>c.charCodeAt(0));
  projects=JSON.parse(new TextDecoder().decode(bytes)).projects||[];
 }catch(e){if(!/ 404/.test(e.message))throw e;projects=[];}
 $('#formBox').hidden=$('#listBox').hidden=false;render();log('Terhubung. '+projects.length+' proyek.');
}
function render(){
 const sorted=[...projects].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.updatedAt||0)-(a.updatedAt||0));
 $('#list').innerHTML=sorted.length?sorted.map(p=>`<div class="item"><img src="${esc(p.thumb||'')}" alt="" onerror="this.style.visibility='hidden'"><div><b>${p.pinned?'★ ':''}${esc(p.title)}</b><small>${esc(p.category)} · ${p.status==='draft'?'draf':'terbit'}${p.type==='link'?' · tautan':''}</small></div><button class="o" data-preview="${esc(p.id)}">👁 Lihat</button><button class="o" data-edit="${esc(p.id)}">Edit</button><button class="d" data-del="${esc(p.id)}">Hapus</button></div>`).join(''):'<small>Belum ada proyek. Tambahkan lewat formulir di atas.</small>';
}
async function pool(items,n,fn){const q=[...items];await Promise.all(Array.from({length:n},async()=>{while(q.length)await fn(q.shift());}));}
async function commit(msg,add,delPaths){
 const head=(await gh('/git/ref/heads/'+cfg.branch)).object.sha;
 const base=(await gh('/git/commits/'+head)).tree.sha;
 const tree=[];
 if(delPaths.length){
  const t=await gh(`/git/trees/${base}?recursive=1`);
  for(const n of t.tree)if(n.type==='blob'&&delPaths.some(p=>n.path===p||(p.endsWith('/')&&n.path.startsWith(p))))tree.push({path:n.path,mode:'100644',type:'blob',sha:null});
 }
 let done=0;
 await pool(add,4,async f=>{
  const body=f.file?{content:b64(await f.file.arrayBuffer()),encoding:'base64'}:{content:f.text,encoding:'utf-8'};
  const b=await gh('/git/blobs',{method:'POST',body:JSON.stringify(body)});
  tree.push({path:f.path,mode:'100644',type:'blob',sha:b.sha});log(`Mengunggah ${++done}/${add.length}…`);
 });
 const nt=await gh('/git/trees',{method:'POST',body:JSON.stringify({base_tree:base,tree})});
 const nc=await gh('/git/commits',{method:'POST',body:JSON.stringify({message:msg,tree:nt.sha,parents:[head]})});
 await gh('/git/refs/heads/'+cfg.branch,{method:'PATCH',body:JSON.stringify({sha:nc.sha})});
 return nc.sha;
}
function commitLink(sha){return sha?`https://github.com/${esc(cfg.repo)}/commit/${sha}`:'';}
function showLog(msg,link){const e=$('#log');e.className='';if(link)e.innerHTML=esc(msg)+' <a href="'+link+'" target="_blank" rel="noopener">Lihat commit ↗</a>';else e.textContent=msg;}
const manifest=()=>({path:'data/projects.json',text:JSON.stringify({projects},null,1)+'\n'});
function setPType(t){
 $('#folderRow').hidden=t!=='upload';$('#linkRow').hidden=t!=='link';
 document.querySelector(`input[name=ptype][value=${t}]`).checked=true;
}
function resetForm(){
 editing=null;$('#form').reset();$('#formTitle').textContent='Tambah proyek';setPType('upload');
 $('#embedResult').textContent='';$('#cancel').hidden=true;$('#saveBtn').textContent='Terbitkan';
}
function lock(b){busy=b;document.querySelectorAll('button').forEach(x=>x.disabled=b);}
async function run(fn,reload=true){if(busy)return;lock(true);let m='',mt='',c='';try{await fn();}catch(e){log(e.message,true);}finally{lock(false);m=$('#log').innerHTML;mt=$('#log').textContent;c=$('#log').className;if(reload){try{await loadList();}catch{}if(mt&&!/^(Memuat|Terhubung)/.test(mt)){$('#log').innerHTML=m;$('#log').className=c;}}}}
$('#connect').onclick=()=>run(async()=>{
 cfg.repo=$('#repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'');cfg.branch=$('#branch').value.trim()||'main';cfg.token=$('#token').value.trim();
 if(!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo)||!cfg.token)throw new Error('Isi repository (username/nama-repo) dan token.');
 localStorage.setItem('b_repo',cfg.repo);localStorage.setItem('b_branch',cfg.branch);localStorage.setItem('b_token',cfg.token);
 await loadList();
},false);
$('#forget').onclick=()=>{localStorage.removeItem('b_token');cfg.token='';$('#token').value='';$('#formBox').hidden=$('#listBox').hidden=true;log('Token dihapus dari browser ini.');};
$('#cancel').onclick=resetForm;
document.querySelectorAll('input[name=ptype]').forEach(r=>r.onchange=()=>setPType(r.value));
document.querySelectorAll('input[name=umode]').forEach(r=>r.onchange=()=>{
 $('#umodeFolder').hidden=r.value!=='folder';$('#umodeZip').hidden=r.value!=='zip';
});
async function zipToFiles(file){
 const buf=await file.arrayBuffer();
 let entries;
 try{entries=window.MiniUnzip.readZip(buf);}catch(e){throw new Error('Gagal membaca .zip: '+e.message);}
 const raw=new Map();
 for(const en of entries){
  if(!en.name||en.name.endsWith('/'))continue;
  let bytes;
  if(en.method===0)bytes=en.raw;
  else if(en.method===8)bytes=window.MiniUnzip.inflateRaw(en.raw);
  else continue; // metode kompresi tidak didukung, lewati berkas ini
  raw.set(en.name.replace(/\\/g,'/'),bytes);
 }
 let map=raw;
 if(!map.has('index.html')){
  const tops=new Set([...map.keys()].map(k=>k.split('/')[0]));
  if(tops.size===1){
   const only=[...tops][0];
   const stripped=new Map([...map.entries()].map(([k,v])=>[k.slice(only.length+1),v]));
   if(stripped.has('index.html'))map=stripped;
  }
 }
 if(!map.has('index.html'))throw new Error('index.html tidak ditemukan di tingkat paling atas isi .zip.');
 let total=0;const list=[];
 for(const [path,bytes] of map){
  if(!path||/(^|\/)(\.DS_Store|Thumbs\.db)$/.test(path))continue;
  total+=bytes.length;list.push({path,bytes});
 }
 if(total>90*1048576)throw new Error('Ukuran isi .zip melebihi ±90 MB. Kompres media atau pecah proyek.');
 return list;
}
$('#testEmbed').onclick=()=>{
 const url=$('#linkUrl').value.trim();if(!/^https:\/\//.test(url)){$('#embedResult').textContent='Isi alamat https:// yang valid dulu.';return;}
 const f=$('#embedTestFrame');$('#embedResult').textContent='Menguji…';
 let done=false;
 const timer=setTimeout(()=>{if(!done){done=true;$('#embedResult').textContent='⚠ Tidak merespons — kemungkinan situs menolak disematkan. Gunakan mode "tab baru".';}},4500);
 f.onload=()=>{if(done)return;done=true;clearTimeout(timer);
  try{const ok=!!f.contentWindow;$('#embedResult').textContent=ok?'✓ Sepertinya bisa disematkan. Tetap periksa manual sebelum dipakai di kelas.':'⚠ Gagal memuat.';}
  catch{$('#embedResult').textContent='✓ Termuat (konten lintas situs, wajar tidak bisa dibaca dari sini).';}
 };
 f.src=url;
};
$('#list').onclick=e=>{
 const ed=e.target.closest('[data-edit]'),dl=e.target.closest('[data-del]'),pv=e.target.closest('[data-preview]');
 if(pv){const p=projects.find(x=>x.id===pv.dataset.preview);if(p)window.open(p.entry,'_blank','noopener');return;}
 if(ed){
  const p=projects.find(x=>x.id===ed.dataset.edit);editing=p.id;
  $('#name').value=p.title;$('#cat').value=p.category;$('#status').value=p.status||'live';$('#desc').value=p.description||'';$('#teacherNote').value=p.teacherNote||'';$('#pinned').checked=!!p.pinned;
  setPType(p.type==='link'?'link':'upload');
  if(p.type==='link'){$('#linkUrl').value=p.entry||'';$('#embedMode').checked=p.embed!==false;}
  $('#folderRow').hidden=true; // isi proyek tak bisa diubah lewat edit
  $('#formTitle').textContent='Edit: '+p.title;$('#saveBtn').textContent='Simpan perubahan';$('#cancel').hidden=false;$('#name').focus();
 }
 if(dl){const p=projects.find(x=>x.id===dl.dataset.del);if(!confirm(`Hapus "${p.title}" beserta semua filenya dari repository?`))return;
  run(async()=>{projects=projects.filter(x=>x.id!==p.id);const sha=await commit('Hapus proyek: '+p.title,[manifest()],p.type==='link'?[...(p.thumb?[p.thumb]:[])]:[`projects/${p.id}/`,...(p.thumb?[p.thumb]:[])]);showLog('Terhapus. Vercel sedang menerbitkan ulang.',commitLink(sha));});}
};
$('#form').onsubmit=e=>{e.preventDefault();run(async()=>{
 const title=$('#name').value.trim(),thumb=$('#thumb').files[0],add=[],del=[];let p;const now=Date.now();
 const ptype=document.querySelector('input[name=ptype]:checked').value;
 const meta={title,category:$('#cat').value,status:$('#status').value,description:$('#desc').value.trim(),teacherNote:$('#teacherNote').value.trim(),pinned:$('#pinned').checked,updatedAt:now};
 if(editing){
  p=projects.find(x=>x.id===editing);Object.assign(p,meta);
  if(p.type==='link'){
   const url=$('#linkUrl').value.trim();if(!/^https:\/\//.test(url))throw new Error('Alamat tautan harus diawali https://');
   p.entry=url;p.embed=$('#embedMode').checked;
  }
 } else if(ptype==='link'){
  const url=$('#linkUrl').value.trim();if(!/^https:\/\//.test(url))throw new Error('Alamat tautan harus diawali https://');
  let id=slug(title);while(projects.some(x=>x.id===id))id+='-2';
  p={id,...meta,type:'link',entry:url,embed:$('#embedMode').checked,thumb:'',createdAt:now};
  projects.unshift(p);
 } else if((document.querySelector('input[name=umode]:checked')||{}).value==='zip'){
  const zf=$('#zipFile').files[0];if(!zf)throw new Error('Pilih berkas .zip.');
  const list=await zipToFiles(zf);
  let id=slug(title);while(projects.some(x=>x.id===id))id+='-2';
  p={id,...meta,type:'upload',entry:`projects/${id}/index.html`,thumb:'',createdAt:now};
  list.forEach(({path,bytes})=>add.push({path:`projects/${id}/${path}`,file:new Blob([bytes])}));projects.unshift(p);
 } else{
  const files=[...$('#folder').files].filter(f=>!/(^|\/)(\.DS_Store|Thumbs\.db|\.git\/)/.test(f.webkitRelativePath));
  if(!files.length)throw new Error('Pilih folder proyek.');
  const rel=f=>f.webkitRelativePath.split('/').slice(1).join('/');
  if(!files.some(f=>rel(f)==='index.html'))throw new Error('index.html tidak ditemukan di tingkat paling atas folder. Pilih folder yang langsung berisi index.html.');
  if(files.reduce((a,f)=>a+f.size,0)>90*1048576)throw new Error('Ukuran folder melebihi ±90 MB. Kompres media atau pecah proyek.');
  let id=slug(title);while(projects.some(x=>x.id===id))id+='-2';
  p={id,...meta,type:'upload',entry:`projects/${id}/index.html`,thumb:'',createdAt:now};
  files.forEach(f=>add.push({path:`projects/${id}/${rel(f)}`,file:f}));projects.unshift(p);
 }
 if(thumb){const ext=(thumb.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`thumbs/${p.id}-${now.toString(36)}.${ext}`;if(p.thumb)del.push(p.thumb);p.thumb=path;add.push({path,file:thumb});}
 add.push(manifest());
 log('Menyiapkan commit…');
 const sha=await commit((editing?'Ubah proyek: ':'Tambah proyek: ')+title,add,del);
 resetForm();showLog('Tersimpan di GitHub. Vercel menerbitkan dalam ±1 menit, lalu muat ulang halaman koleksi.',commitLink(sha));
});};
$('#repo').value=cfg.repo;$('#branch').value=cfg.branch;$('#token').value=cfg.token;
if(cfg.repo&&cfg.token)run(loadList,false);
