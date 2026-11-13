/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const S={all:[],cat:'Semua',q:'',cur:null,err:'',fav:[],hist:[]};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const INFO={
 petunjuk:{k:'PANDUAN',t:'Petunjuk',h:'<p>Pilih kategori atau cari proyek, lalu klik <b>Buka</b>. Proyek berjalan di dalam player; gunakan tombol ⚙ untuk kembali, memuat ulang, atau layar penuh.</p><p>Beberapa proyek menyimpan kemajuan di browser Anda, jadi data itu hanya ada di perangkat yang dipakai. Tandai ★ pada kartu untuk menyimpannya ke Favorit.</p>'},
 syarat:{k:'INFORMASI',t:'Syarat & Ketentuan',h:'<p>Seluruh proyek di sini adalah karya I Gusti Agung Rian Gunawan, S.Kom., kecuali proyek bertanda tautan eksternal. Boleh dipakai untuk pembelajaran; jangan menjual ulang atau mengklaim sebagai karya sendiri tanpa izin. Lihat berkas LICENSE di repository untuk ketentuan lengkap.</p>'},
 privasi:{k:'PRIVASI',t:'Kebijakan Privasi',h:'<p>Situs ini tidak meminta akun dan tidak mengumpulkan data pribadi. Favorit, riwayat, dan data permainan proyek hanya tersimpan di browser Anda dan tidak dikirim ke server.</p>'}
};
const thumb=t=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="510"><rect width="900" height="510" fill="#0a3a6e"/><circle cx="740" cy="90" r="170" fill="#25caff" opacity=".12"/><text x="65" y="240" font-family="Arial" font-size="46" font-weight="800" fill="#fff">${esc(String(t).slice(0,26))}</text><text x="65" y="285" font-family="Arial" font-size="24" fill="#9fdfff">BRIAN Learning &amp; Media Studio</text></svg>`);
function toast(m,type='success'){const t=$('#toast');clearTimeout(toast.t);t.textContent=m;t.className='toast '+type;toast.t=setTimeout(()=>t.classList.add('hidden'),2600);}
function loadLocal(){try{S.fav=JSON.parse(localStorage.getItem('brian_fav')||'[]');}catch{S.fav=[];}try{S.hist=JSON.parse(localStorage.getItem('brian_hist')||'[]');}catch{S.hist=[];}}
function saveFav(){localStorage.setItem('brian_fav',JSON.stringify(S.fav));}
function saveHist(){localStorage.setItem('brian_hist',JSON.stringify(S.hist));}
function toggleFav(id){const i=S.fav.indexOf(id);if(i>=0)S.fav.splice(i,1);else S.fav.unshift(id);saveFav();render();}
function pushHist(id){S.hist=[id,...S.hist.filter(x=>x!==id)].slice(0,24);saveHist();}
async function init(){
 loadLocal();bind();
 try{const r=await fetch('data/projects.json',{cache:'no-cache'});if(!r.ok)throw new Error(r.status);S.all=((await r.json()).projects||[]).filter(p=>p.status!=='draft').sort((a,b)=>((b.pinned?1:0)-(a.pinned?1:0))||((b.updatedAt||0)-(a.updatedAt||0)));}
 catch(e){S.err='Daftar proyek tidak dapat dimuat. Buka situs lewat alamat hosting (bukan klik ganda file) dan pastikan data/projects.json ada.';}
 render();
}
function bind(){
 $$('#sideNav .side-link[data-category],#topChips .filter-chip').forEach(b=>b.onclick=()=>setCat(b.dataset.category));
 $('#collectionSearch').oninput=e=>{S.q=e.target.value.trim().toLowerCase();$('#searchClear').classList.toggle('hidden',!S.q);render();};
 $('#searchClear').onclick=()=>{$('#collectionSearch').value='';S.q='';$('#searchClear').classList.add('hidden');render();};
 document.addEventListener('click',e=>{
  const i=e.target.closest('[data-info]');if(i){e.preventDefault();openInfo(i.dataset.info);return;}
  const nt=e.target.closest('[data-note]');if(nt){e.preventDefault();openNote(nt.dataset.note);return;}
  const fv=e.target.closest('[data-fav]');if(fv){e.preventDefault();toggleFav(fv.dataset.fav);return;}
  const c=e.target.closest('[data-close]');if(c)$('#'+c.dataset.close).classList.add('hidden');
  const o=e.target.closest('[data-open]');if(o)openPlayer(o.dataset.open);
  if(!$('#floatMenu').classList.contains('hidden')&&!e.target.closest('#floatMenu,#floatGear'))$('#floatMenu').classList.add('hidden');
 });
 $('#infoDialog').onclick=e=>{if(e.target.id==='infoDialog')e.target.classList.add('hidden');};
 $('#playerBack').onclick=$('#playerClose').onclick=$('#floatBack').onclick=closePlayer;
 $('#playerReload').onclick=reload;$('#floatReload').onclick=()=>{reload();$('#floatMenu').classList.add('hidden');};
 $('#playerFull').onclick=fs;$('#floatFull').onclick=()=>{fs();$('#floatMenu').classList.add('hidden');};
 $('#floatGear').onclick=e=>{e.stopPropagation();$('#floatMenu').classList.toggle('hidden');};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#playerOverlay').classList.contains('hidden'))closePlayer();else $('#infoDialog').classList.add('hidden');}});
}
const CAT_INFO={
 Semua:['Semua Aplikasi','Gim edukasi, media pembelajaran, dan simulasi karya I Gusti Agung Rian Gunawan, S.Kom.'],
 'Gim Edu':['Ruang Gim Edu','Gim interaktif untuk belajar sambil bermain.'],
 MPI:['Ruang MPI','Media Pembelajaran Interaktif: slide, infografis, dan materi visual.'],
 'VLab/Simulasi':['Ruang VLab / Simulasi','Laboratorium virtual dan simulasi konsep yang sulit dibayangkan.'],
 Aplikasi:['Ruang Aplikasi','Perkakas dan aplikasi HTML pendukung pembelajaran.'],
 Favorit:['Favorit Saya','Proyek yang Anda tandai ★ di perangkat ini.'],
 Riwayat:['Riwayat Dibuka','Proyek yang baru-baru ini Anda buka di perangkat ini.']
};
function setCat(c){S.cat=c;$$('[data-category]').forEach(x=>x.classList.toggle('active',x.dataset.category===c));const info=CAT_INFO[c]||[c,`Menampilkan koleksi ${c}.`];$('#catalogTitle').textContent=info[0];$('#catalogSubtitle').textContent=info[1];render();}
function isNew(p){return p.updatedAt&&(Date.now()-p.updatedAt)<14*864e5;}
function render(){
 const n=c=>S.all.filter(p=>p.category===c).length;
 $('#allCount').textContent=S.all.length;$('#gameCount').textContent=n('Gim Edu');$('#mpiCount').textContent=n('MPI');$('#vlabCount').textContent=n('VLab/Simulasi');$('#appCount').textContent=n('Aplikasi');
 $('#favCount').textContent=S.fav.length;$('#histCount').textContent=S.hist.length;
 let list;
 if(S.cat==='Favorit')list=S.fav.map(id=>S.all.find(p=>p.id===id)).filter(Boolean);
 else if(S.cat==='Riwayat')list=S.hist.map(id=>S.all.find(p=>p.id===id)).filter(Boolean);
 else list=S.all.filter(p=>S.cat==='Semua'||p.category===S.cat);
 if(S.q)list=list.filter(p=>`${p.title} ${p.category} ${p.description}`.toLowerCase().includes(S.q));
 $('#visibleCount').textContent=list.length;
 const g=$('#catalogGrid');
 if(!list.length){
  const empty=S.cat==='Favorit'?'Belum ada favorit':S.cat==='Riwayat'?'Belum ada riwayat':S.q?'Tidak ada proyek yang cocok':'Belum ada proyek';
  const desc=S.cat==='Favorit'?'Tandai ★ pada kartu proyek untuk menyimpannya di sini.':S.cat==='Riwayat'?'Proyek yang Anda buka akan muncul di sini.':(S.q?'Coba kata kunci lain atau pilih kategori berbeda.':'Proyek baru akan muncul di sini setelah dipublikasikan.');
  g.innerHTML=`<div class="empty-state"><div class="empty-icon">∅</div><h3>${S.err?'Gagal memuat koleksi':empty}</h3><p>${esc(S.err||desc)}</p></div>`;return;
 }
 g.innerHTML=list.map(p=>{
  const faved=S.fav.includes(p.id);
  const cornerBadge=p.pinned?'<span class="new-badge pin-badge">★ Unggulan</span>':(isNew(p)?'<span class="new-badge">Terbaru</span>':'');
  return `<article class="catalog-card"><div class="catalog-thumb"><img loading="lazy" src="${p.thumb?esc(p.thumb):thumb(p.title)}" alt="Thumbnail ${esc(p.title)}"><div class="thumb-overlay"></div><span class="type-badge">${esc(p.category)}</span>${cornerBadge}${p.type==='link'?'<span class="link-badge">Tautan eksternal</span>':''}<button class="fav-btn${faved?' is-fav':''}" data-fav="${esc(p.id)}" title="${faved?'Hapus dari favorit':'Tandai favorit'}" aria-label="Favorit">${faved?'★':'☆'}</button></div><div class="catalog-card-body"><h3>${esc(p.title)}${p.teacherNote?`<button class="note-btn" data-note="${esc(p.id)}" title="Catatan untuk guru">ⓘ</button>`:''}</h3><p>${esc((p.description||'Proyek HTML interaktif.').slice(0,100))}</p><div class="card-actions"><button class="open-card" data-open="${esc(p.id)}">▶ Buka</button></div></div></article>`;
 }).join('');
}
function openInfo(k){const p=INFO[k]||INFO.petunjuk;$('#infoKicker').textContent=p.k;$('#infoTitle').textContent=p.t;$('#infoContent').innerHTML=p.h;$('#infoDialog').classList.remove('hidden');}
function openNote(id){const p=S.all.find(x=>x.id===id);if(!p?.teacherNote)return;$('#infoKicker').textContent='CATATAN GURU';$('#infoTitle').textContent=p.title;$('#infoContent').innerHTML=`<p>${esc(p.teacherNote)}</p>`;$('#infoDialog').classList.remove('hidden');}
function openPlayer(id){
 const p=S.all.find(x=>x.id===id);if(!p)return;
 pushHist(id);
 if(p.type==='link'&&p.embed===false){window.open(p.entry,'_blank','noopener');render();return;}
 S.cur=p;$('#playerTitle').textContent=p.title;$('#playerOverlay').classList.remove('hidden');$('#floatMenu').classList.add('hidden');document.body.style.overflow='hidden';$('#projectFrame').src=p.entry;
}
function reload(){if(S.cur)$('#projectFrame').src=S.cur.entry;}
function closePlayer(){$('#projectFrame').src='about:blank';$('#playerOverlay').classList.add('hidden');$('#floatMenu').classList.add('hidden');S.cur=null;document.body.style.overflow='';render();}
function fs(){const s=$('#playerStage');if(!document.fullscreenElement)s.requestFullscreen?.();else document.exitFullscreen?.();}
document.addEventListener('DOMContentLoaded',init);
