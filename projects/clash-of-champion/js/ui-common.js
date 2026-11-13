/* =========================================================================
   UI-COMMON.JS — Navigasi antar layar & util bersama
========================================================================= */
let returnScreenAfterTeacher = 'screen-menu';

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

function closeModal(id){ document.getElementById(id).classList.remove('show'); }

function escapeHtml(s){
  return (s||'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s){ return escapeHtml(s); }

/* ---- Modal PIN Guru (dipakai dari menu utama, setup, & arena) ---- */
let pinTargetAction=null;
function openPinModal(action, fromScreenId){
  pinTargetAction = action;
  if(fromScreenId) returnScreenAfterTeacher = fromScreenId;
  document.getElementById('pin-input').value='';
  document.getElementById('pin-error').textContent='';
  document.getElementById('modal-pin').classList.add('show');
  setTimeout(()=>document.getElementById('pin-input').focus(),50);
}
function submitPin(){
  const val = document.getElementById('pin-input').value.trim();
  if(val === state.editPin){
    closeModal('modal-pin');
    if(pinTargetAction==='teacher') openTeacherDashboard();
  }else{
    document.getElementById('pin-error').textContent = 'PIN salah, akses ditolak.';
  }
}
