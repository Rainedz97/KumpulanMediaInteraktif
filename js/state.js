/* =========================================================================
   STATE.JS — Model data aplikasi & penyimpanan lokal (localStorage)
========================================================================= */
const STORAGE_KEY = 'cocVaultArenaState_v2';
const LEVELS = {1:{points:100,label:'MUDAH'},2:{points:200,label:'SEDANG'},3:{points:300,label:'SULIT'}};

function defaultVaults(){
  return window.DEFAULT_QUESTION_DATA.map((d,i)=>({
    id:i+1, level:d[0], points:LEVELS[d[0]].points, question:d[1], answer:d[2], type:d[3],
    locked:false, wonBy:null
  }));
}

function defaultState(){
  return {
    subject:'Informatika',
    teams:[{name:'Tim 1',score:0},{name:'Tim 2',score:0},{name:'Tim 3',score:0},{name:'Tim 4',score:0}],
    duration:15,
    editPin:'1234',
    vaults:defaultVaults()
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const parsed = JSON.parse(raw); return Object.assign(defaultState(), parsed); }
  }catch(e){ /* localStorage tidak tersedia — lanjut dengan default */ }
  return defaultState();
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

let state = loadState();
