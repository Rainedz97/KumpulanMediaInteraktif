/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
if('serviceWorker' in navigator){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
 });
}
// window.__brianInstallEvt ditangkap sedini mungkin oleh skrip kecil di <head>
// (lihat index.html), supaya tidak luput kalau browser memicu beforeinstallprompt
// sebelum file ini dimuat. Di sini kita hanya memakainya saat tombol diklik.
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-install]');
 if(!b)return;
 const evt=window.__brianInstallEvt;
 if(!evt){
  const msg=window.matchMedia('(display-mode: standalone)').matches
   ?'Sudah terpasang di perangkat ini.'
   :'Pemasangan otomatis belum tersedia di browser ini. Di iPhone/iPad, gunakan menu Bagikan → "Tambah ke Layar Utama".';
  alert(msg);return;
 }
 evt.prompt();
 evt.userChoice.finally(()=>{window.__brianInstallEvt=null;document.documentElement.classList.remove('can-install');});
});
