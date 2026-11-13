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

/* ---- Modal Password + Keyboard Adaptif ---- */
let currentVaultId=null, currentInput='';
function openVaultModal(id){
  const v = state.vaults.find(x=>x.id===id);
  if(!v || v.locked) return;
  currentVaultId=id; currentInput='';
  document.getElementById('vault-modal-title').textContent = 'VAULT #'+String(v.id).padStart(2,'0')+' - '+v.points+' PTS';
  const sel = document.getElementById('vault-team-select');
  sel.innerHTML = state.teams.map((t,i)=>'<option value="'+i+'">'+escapeHtml(t.name)+'</option>').join('');
  updatePwDisplay();
  renderKeyboard(v.type);
  document.getElementById('modal-vault').classList.add('show');
  setTimeout(()=>document.getElementById('vault-pw-display').focus(),50);
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

function renderKeyboard(type){
  const kb = document.getElementById('vault-keyboard');
  kb.innerHTML='';
  if(type==='binary'){
    const row1 = document.createElement('div'); row1.className='kb-row';
    ['1','0'].forEach(d=>{ const b=document.createElement('button'); b.type='button'; b.textContent=d; b.onclick=()=>kbPress(d); row1.appendChild(b); });
    kb.appendChild(row1);
    const row2 = document.createElement('div'); row2.className='kb-row';
    const bc=document.createElement('button'); bc.type='button'; bc.textContent='Clear'; bc.onclick=kbClear;
    const bb=document.createElement('button'); bb.type='button'; bb.textContent='⌫'; bb.onclick=kbBackspace;
    row2.appendChild(bc); row2.appendChild(bb);
    kb.appendChild(row2);
  }else{
    const rows = ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
    rows.forEach(r=>{
      const row=document.createElement('div'); row.className='kb-row';
      r.split('').forEach(ch=>{ const b=document.createElement('button'); b.type='button'; b.textContent=ch; b.onclick=()=>kbPress(ch); row.appendChild(b); });
      kb.appendChild(row);
    });
    const lastRow = document.createElement('div'); lastRow.className='kb-row';
    const bsp=document.createElement('button'); bsp.type='button'; bsp.textContent='SPASI'; bsp.className='wide'; bsp.onclick=kbSpace;
    const bbk=document.createElement('button'); bbk.type='button'; bbk.textContent='⌫ HAPUS'; bbk.className='wide'; bbk.onclick=kbBackspace;
    lastRow.appendChild(bsp); lastRow.appendChild(bbk);
    kb.appendChild(lastRow);
  }
}

function normalizeAns(s){ return (s||'').toString().trim().toUpperCase().replace(/\s+/g,' '); }

function submitVaultAnswer(){
  const v = state.vaults.find(x=>x.id===currentVaultId);
  if(!v) return;
  const teamIdx = parseInt(document.getElementById('vault-team-select').value,10);
  const team = state.teams[teamIdx];
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
