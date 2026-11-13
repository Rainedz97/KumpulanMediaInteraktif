/* =========================================================================
   ARENA.JS — Timer, Grid Vault, Modal Password, Overlay Hasil, Game Over
========================================================================= */

/* ---- Timer ---- */
let timerInterval=null, remainingSec=0, paused=false;
function startTimer(sec){
  clearInterval(timerInterval);
  remainingSec = sec; paused=false;
  document.getElementById('btn-pause').textContent='⏸️';
  updateTimerDisplay();
  timerInterval = setInterval(()=>{
    if(paused) return;
    remainingSec--;
    updateTimerDisplay();
    if(remainingSec<=0){ clearInterval(timerInterval); endGame(); }
  },1000);
}
function updateTimerDisplay(){
  const m = Math.floor(remainingSec/60), s = remainingSec%60;
  const box = document.getElementById('timer-box');
  box.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  box.classList.toggle('warn', remainingSec<=120);
}
function togglePause(){
  paused=!paused;
  document.getElementById('btn-pause').textContent = paused?'▶️':'⏸️';
}

/* ---- Tombol Home: keluar dari Arena, kembali ke Menu Utama ---- */
function confirmExitArena(){
  if(confirm('Kembali ke Menu Utama? Waktu & progres pertandingan saat ini akan berhenti.')){
    clearInterval(timerInterval);
    stopMusic();
    showScreen('screen-menu');
  }
}

/* ---- Leaderboard & Grid ---- */
function renderLeaderboard(){
  const wrap = document.getElementById('leaderboard');
  wrap.innerHTML='';
  state.teams.forEach(t=>{
    const el = document.createElement('div');
    el.className='lb-item';
    el.innerHTML = '<div class="lb-name">'+escapeHtml(t.name)+'</div><div class="lb-score">'+t.score+'</div>';
    wrap.appendChild(el);
  });
}
function renderVaultGrid(){
  const grid = document.getElementById('vault-grid');
  grid.innerHTML='';
  state.vaults.forEach(v=>{
    const card = document.createElement('div');
    card.className='vault-card lvl-'+v.level+(v.locked?' locked':'');
    if(v.locked){
      card.innerHTML = '<div class="lockicon">🔒</div><div class="vnum">Vault #'+String(v.id).padStart(2,'0')+'</div>'+
        '<div class="team-badge">'+escapeHtml(v.wonBy||'')+'</div>';
    }else{
      card.innerHTML = '<div class="vnum">VAULT #'+String(v.id).padStart(2,'0')+'</div><div class="vpts">'+v.points+' PTS</div>';
      card.onclick = ()=>openVaultModal(v.id);
    }
    grid.appendChild(card);
  });
}

/* ---- Modal Password: Step 1 Pilih Tim -> Step 2 Keyboard Jawaban ---- */
let currentVaultId=null, currentInput='', currentTeamIdx=null;

/* Ikon & warna kartu pemilihan tim — semua karakter Unicode/emoji bawaan
   sistem (tidak perlu internet/gambar eksternal), aman untuk mode offline. */
const TEAM_ICONS  = ['🛡️','⚔️','🔥','⚡','🚀','👑','🎯','🐉'];
const TEAM_COLORS = ['#00f2fe','#ffb703','#ff3b5c','#8b5cf6','#00e676','#ff8c42'];

function openVaultModal(id){
  const v = state.vaults.find(x=>x.id===id);
  if(!v || v.locked) return;
  currentVaultId=id; currentInput=''; currentTeamIdx=null;

  const label = 'VAULT #'+String(v.id).padStart(2,'0')+' - '+v.points+' PTS';
  document.getElementById('vault-modal-title-team').textContent = label;
  document.getElementById('vault-modal-title').textContent = label;

  const btnWrap = document.getElementById('vault-team-btns');
  btnWrap.innerHTML = state.teams.map((t,i)=>{
    const color = TEAM_COLORS[i % TEAM_COLORS.length];
    const icon = TEAM_ICONS[i % TEAM_ICONS.length];
    return '<button type="button" class="team-pick-card" style="--tc:'+color+'" onclick="selectVaultTeam('+i+')">'+
      '<span class="tc-icon">'+icon+'</span>'+
      '<span class="tc-name">'+escapeHtml(t.name)+'</span>'+
      '<span class="tc-score">'+t.score+' PTS</span>'+
    '</button>';
  }).join('');

  document.getElementById('vault-step-team').style.display='';
  document.getElementById('vault-step-answer').style.display='none';
  document.getElementById('modal-vault').classList.add('show');
}

function selectVaultTeam(idx){
  currentTeamIdx = idx;
  currentInput='';
  const team = state.teams[idx];
  document.getElementById('vault-modal-team-sub').textContent = 'Tim: '+team.name+' — Masukkan kode password rahasia dari lembar soal.';
  updatePwDisplay();
  renderKeyboard();
  document.getElementById('vault-step-team').style.display='none';
  document.getElementById('vault-step-answer').style.display='';
  setTimeout(()=>document.getElementById('vault-pw-display').focus(),50);
}

function backToTeamSelect(){
  currentInput=''; currentTeamIdx=null;
  document.getElementById('vault-step-answer').style.display='none';
  document.getElementById('vault-step-team').style.display='';
}
function updatePwDisplay(){
  document.getElementById('vault-pw-display').value = currentInput;
}
/* Sinkron saat siswa/guru mengetik LANGSUNG lewat keyboard fisik (laptop) */
function onDirectTypeInput(val){ currentInput = val; }
/* Sinkron saat menekan tombol KEYBOARD LAYAR (untuk IFP/touchscreen) */
function kbPress(ch){ currentInput += ch; updatePwDisplay(); }
function kbBackspace(){ currentInput = currentInput.slice(0,-1); updatePwDisplay(); }
function kbClear(){ currentInput=''; updatePwDisplay(); }
function kbSpace(){ currentInput+=' '; updatePwDisplay(); }

/* Simbol matematika yang tersedia di semua tipe keyboard */
const MATH_SYMBOL_ROWS = ['+-×÷=%', '().,√', '²³^π', '<>≠±∞'];

function makeKeyBtn(label, onClick, opts){
  const b=document.createElement('button');
  b.type='button';
  b.textContent=label;
  if(opts && opts.wide) b.className='wide';
  if(opts && opts.symbol) b.classList.add('kb-symbol');
  b.onclick=onClick;
  return b;
}
function addRow(kb, chars, opts){
  const row=document.createElement('div'); row.className='kb-row'+(opts&&opts.symbol?' kb-row-symbols':'');
  chars.split('').forEach(ch=>row.appendChild(makeKeyBtn(ch, ()=>kbPress(ch), {symbol:opts&&opts.symbol})));
  kb.appendChild(row);
}
function addMathSymbolRows(kb){
  MATH_SYMBOL_ROWS.forEach(r=>addRow(kb, r, {symbol:true}));
}

function toggleSymbolKeyboard(){
  const wrap = document.getElementById('kb-symbols-wrap');
  const btn = document.getElementById('kb-expand-btn');
  const isOpen = wrap.classList.toggle('open');
  btn.textContent = isOpen ? '🔼 SEMBUNYIKAN SIMBOL & KARAKTER MATIK' : '🔣 SIMBOL & KARAKTER MATIK';
}

function renderKeyboard(){
  /* Keyboard standar (QWERTY + angka) untuk semua tipe vault.
     Simbol/karakter matik (×÷≠π√ dsb) disembunyikan di balik tombol "expand". */
  const kb = document.getElementById('vault-keyboard');
  kb.innerHTML='';

  const rows = ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  rows.forEach(r=>addRow(kb, r));

  const lastRow = document.createElement('div'); lastRow.className='kb-row';
  lastRow.appendChild(makeKeyBtn('SPASI', kbSpace, {wide:true}));
  lastRow.appendChild(makeKeyBtn('⌫ HAPUS', kbBackspace, {wide:true}));
  kb.appendChild(lastRow);

  const expandRow = document.createElement('div'); expandRow.className='kb-row';
  const expandBtn = makeKeyBtn('🔣 SIMBOL & KARAKTER MATIK', toggleSymbolKeyboard, {wide:true});
  expandBtn.id='kb-expand-btn';
  expandBtn.className='kb-expand-toggle';
  expandRow.appendChild(expandBtn);
  kb.appendChild(expandRow);

  const symWrap = document.createElement('div');
  symWrap.className='kb-symbols-wrap';
  symWrap.id='kb-symbols-wrap';
  addMathSymbolRows(symWrap);
  const clearRow = document.createElement('div'); clearRow.className='kb-row';
  clearRow.appendChild(makeKeyBtn('Clear', kbClear, {wide:true}));
  symWrap.appendChild(clearRow);
  kb.appendChild(symWrap);
}

function normalizeAns(s){ return (s||'').toString().trim().toUpperCase().replace(/\s+/g,' '); }

function submitVaultAnswer(){
  const v = state.vaults.find(x=>x.id===currentVaultId);
  if(!v) return;
  if(currentTeamIdx===null){ backToTeamSelect(); return; }
  const team = state.teams[currentTeamIdx];
  const isCorrect = normalizeAns(currentInput) === normalizeAns(v.answer);
  closeModal('modal-vault');

  if(isCorrect){
    v.locked=true; v.wonBy=team.name; team.score+=v.points;
    saveState();
    renderVaultGrid(); renderLeaderboard();
    sfxSuccess();
    showResultOverlay(true, 'ACCESS GRANTED! VAULT UNLOCKED! +'+v.points+' PTS', team.name+' berhasil membuka Vault #'+String(v.id).padStart(2,'0'));
    if(state.vaults.every(x=>x.locked)) setTimeout(endGame,1600);
  }else{
    sfxFail();
    showResultOverlay(false, 'ACCESS DENIED!', 'Kode password salah — coba lagi!');
  }
}

/* ---- Overlay Hasil (Benar/Salah) + Confetti ---- */
function showResultOverlay(correct, title, sub){
  const ov = document.getElementById('result-overlay');
  ov.className = 'result-overlay show '+(correct?'correct':'wrong');
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-sub').textContent = sub;
  const layer = document.getElementById('confetti-layer');
  layer.innerHTML='';
  if(correct) spawnConfetti(layer,20);
  const dur = correct?2600:1800;
  setTimeout(()=>{ ov.classList.remove('show'); },dur);
}
function spawnConfetti(container,count){
  const colors=['#00f2fe','#ffb703','#00e676','#8b5cf6','#ff3b5c'];
  for(let i=0;i<count;i++){
    const p=document.createElement('div');
    p.className='confetti-piece';
    p.style.left=Math.random()*100+'%';
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration=(1.4+Math.random()*1.2)+'s';
    p.style.animationDelay=(Math.random()*0.4)+'s';
    container.appendChild(p);
  }
}

/* ---- Game Over ---- */
function endGame(){
  clearInterval(timerInterval);
  stopMusic();
  const ranked = [...state.teams].sort((a,b)=>b.score-a.score);
  const wrap = document.getElementById('podium-wrap');
  wrap.innerHTML='';
  const order = [1,0,2]; // tampilkan posisi 2,1,3 secara visual
  order.forEach(rankIdx=>{
    const t = ranked[rankIdx];
    if(!t) return;
    const col = document.createElement('div');
    col.className='podium-col p'+(rankIdx+1);
    col.innerHTML = '<div class="podium-name">'+escapeHtml(t.name)+'</div>'+
      '<div class="podium-bar">'+(rankIdx+1)+'</div>';
    wrap.appendChild(col);
  });
  const tbody = document.getElementById('final-table-body');
  tbody.innerHTML = ranked.map((t,i)=>'<tr><td>#'+(i+1)+'</td><td>'+escapeHtml(t.name)+'</td><td>'+t.score+'</td></tr>').join('');
  spawnConfetti(document.getElementById('confetti-final'),36);
  showScreen('screen-gameover');
}
