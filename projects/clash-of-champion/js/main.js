/* =========================================================================
   MAIN.JS — Titik Masuk Aplikasi (navigasi menu utama + inisialisasi)
   Catatan: TIDAK ada audio yang dijalankan di sini — AudioContext hanya
   boleh dimulai lewat klik pengguna (lihat setup.js: startGame()).
========================================================================= */

/* ---- Dari Menu Utama ---- */
function goToArenaSetup(){
  fillSetupFormFromState();
  showScreen('screen-setup');
}
function goToEditFromMenu(){
  openPinModal('teacher','screen-menu');
}

document.addEventListener('DOMContentLoaded', ()=>{
  fillSetupFormFromState();
  renderPrintWorksheet();
  document.getElementById('arena-subject-tag').textContent = 'MATERI: '+state.subject.toUpperCase();
  document.getElementById('ps-subject-title').textContent = 'LEMBAR KERJA TIM: '+state.subject.toUpperCase();
  showScreen('screen-menu');
});
