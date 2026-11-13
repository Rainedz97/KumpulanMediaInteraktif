/* =========================================================================
   SETUP.JS — Layar Pengaturan Tim (sebelum masuk Arena)
========================================================================= */
function renderTeamNameInputs(){
  const count = parseInt(document.getElementById('in-teamcount').value,10);
  const wrap = document.getElementById('team-name-inputs');
  wrap.innerHTML='';
  for(let i=0;i<count;i++){
    const existing = state.teams[i] ? state.teams[i].name : ('Tim '+(i+1));
    const inp = document.createElement('input');
    inp.type='text'; inp.id='team-name-'+i; inp.value=existing; inp.placeholder='Tim '+(i+1);
    wrap.appendChild(inp);
  }
}

function fillSetupFormFromState(){
  document.getElementById('setup-subject-display').textContent = state.subject;
  document.getElementById('in-duration').value = state.duration;
  document.getElementById('in-teamcount').value = String(state.teams.length||4);
  renderTeamNameInputs();
}

function startGame(){
  const count = parseInt(document.getElementById('in-teamcount').value,10);
  const teams=[];
  for(let i=0;i<count;i++){
    const val = document.getElementById('team-name-'+i).value.trim();
    teams.push({name: val || ('Tim '+(i+1)), score:0});
  }
  state.duration = Math.max(1, parseInt(document.getElementById('in-duration').value,10) || 15);
  state.teams = teams;
  state.vaults.forEach(v=>{ v.locked=false; v.wonBy=null; });
  saveState();

  document.getElementById('arena-subject-tag').textContent = 'MATERI: '+state.subject.toUpperCase();
  document.getElementById('ps-subject-title').textContent = 'LEMBAR KERJA TIM: '+state.subject.toUpperCase();
  renderVaultGrid();
  renderLeaderboard();
  renderPrintWorksheet();
  startTimer(state.duration*60);

  showScreen('screen-arena');
  startMusic(); // AudioContext dibuat/di-resume di dalam klik ini (autoplay policy)
}

function restartSameTeams(){
  state.vaults.forEach(v=>{ v.locked=false; v.wonBy=null; });
  state.teams.forEach(t=>t.score=0);
  saveState();
  renderVaultGrid();
  renderLeaderboard();
  startTimer(state.duration*60);
  showScreen('screen-arena');
  startMusic();
}
