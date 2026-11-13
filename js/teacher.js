/* =========================================================================
   TEACHER.JS — Dashboard Guru: kelola soal, kunci jawaban, PIN, backup
========================================================================= */
function openTeacherDashboard(){
  renderQuestionEditor();
  document.getElementById('td-newpin').value = state.editPin;
  document.getElementById('td-subject').value = state.subject;
  switchTdTab('edit');
  showScreen('screen-teacher');
}
function saveSubjectName(){
  const val = document.getElementById('td-subject').value.trim();
  state.subject = val || 'Informatika';
  saveState();
  document.getElementById('arena-subject-tag').textContent = 'MATERI: '+state.subject.toUpperCase();
  document.getElementById('ps-subject-title').textContent = 'LEMBAR KERJA TIM: '+state.subject.toUpperCase();
  const setupDisp = document.getElementById('setup-subject-display');
  if(setupDisp) setupDisp.textContent = state.subject;
  renderPrintWorksheet();
  alert('Mata pelajaran berhasil disimpan.');
}
function closeTeacherDashboard(){
  saveState();
  renderVaultGrid();
  renderPrintWorksheet();
  showScreen(returnScreenAfterTeacher || 'screen-menu');
}
function switchTdTab(tab){
  document.querySelectorAll('.td-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.td-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('td-panel-'+tab).classList.add('active');
  if(tab==='print') renderPrintPreview('soal');
}

function renderQuestionEditor(){
  const list = document.getElementById('qedit-list');
  list.innerHTML='';
  state.vaults.forEach((v)=>{
    const row = document.createElement('div');
    row.className='qedit-row';
    row.innerHTML =
      '<div class="qnum-badge">#'+String(v.id).padStart(2,'0')+'</div>'+
      '<textarea onchange="updateQuestionText('+v.id+',this.value)">'+escapeHtml(v.question)+'</textarea>'+
      '<div>'+
        '<label style="font-size:10px;color:var(--text-dim);">Jawaban / Password</label>'+
        '<input type="text" value="'+escapeAttr(v.answer)+'" onchange="updateAnswerText('+v.id+',this.value)">'+
        '<label style="font-size:10px;color:var(--text-dim);">Level</label>'+
        '<select onchange="updateVaultLevel('+v.id+',this.value)">'+
          '<option value="1"'+(v.level===1?' selected':'')+'>Mudah (100)</option>'+
          '<option value="2"'+(v.level===2?' selected':'')+'>Sedang (200)</option>'+
          '<option value="3"'+(v.level===3?' selected':'')+'>Sulit (300)</option>'+
        '</select>'+
      '</div>'+
      '<div>'+
        '<label style="font-size:10px;color:var(--text-dim);">Tipe Input</label>'+
        '<select onchange="updateInputType('+v.id+',this.value)">'+
          '<option value="text"'+(v.type==='text'?' selected':'')+'>Kata/Kalimat</option>'+
          '<option value="binary"'+(v.type==='binary'?' selected':'')+'>Biner/Angka</option>'+
        '</select>'+
      '</div>'+
      '<button type="button" class="icon-btn" title="Hapus" onclick="deleteVault('+v.id+')">🗑️</button>';
    list.appendChild(row);
  });
}
function updateQuestionText(id, value){
  const v = state.vaults.find(x=>x.id===id);
  if(!v) return;
  v.question = value;
  saveState();
}
function updateAnswerText(id, value){
  const v = state.vaults.find(x=>x.id===id);
  if(!v) return;
  v.answer = value;
  saveState();
}
function updateInputType(id, value){
  const v = state.vaults.find(x=>x.id===id);
  if(!v) return;
  v.type = value;
  saveState();
}
function updateVaultLevel(id, levelVal){
  const v = state.vaults.find(x=>x.id===id);
  if(!v) return;
  const lvl = parseInt(levelVal,10);
  v.level = lvl; v.points = LEVELS[lvl].points;
  saveState();
  renderQuestionEditor();
}
function addNewVault(){
  const nextId = state.vaults.length ? Math.max(...state.vaults.map(v=>v.id))+1 : 1;
  state.vaults.push({id:nextId, level:1, points:100, question:'Soal baru...', answer:'JAWABAN', type:'text', locked:false, wonBy:null});
  saveState();
  renderQuestionEditor();
}
function deleteVault(id){
  state.vaults = state.vaults.filter(v=>v.id!==id);
  saveState();
  renderQuestionEditor();
}
function resetVaultsToDefault(){
  if(!confirm('Reset seluruh 30 soal ke default? Perubahan yang sudah dibuat akan hilang.')) return;
  state.vaults = defaultVaults();
  saveState();
  renderQuestionEditor();
}
function changePin(){
  const val = document.getElementById('td-newpin').value.trim();
  if(val.length<4){ alert('PIN minimal 4 karakter.'); return; }
  state.editPin = val;
  saveState();
  alert('PIN berhasil diganti.');
}

/* ---- Export / Import JSON ---- */
function exportJSON(){
  const payload = { subject: state.subject, vaults: state.vaults };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='bank-soal-cipher-vault.json'; a.click();
  URL.revokeObjectURL(url);
}
function importJSON(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const parsed = JSON.parse(e.target.result);
      if(Array.isArray(parsed.vaults)){
        state.vaults = parsed.vaults.map((v,i)=>({
          id:i+1, level:v.level||1, points: LEVELS[v.level||1].points,
          question:v.question||'', answer:v.answer||'', type:v.type||'text',
          locked:false, wonBy:null
        }));
        if(parsed.subject) state.subject = parsed.subject;
        saveState();
        renderQuestionEditor();
        alert('Bank soal berhasil diimpor ('+state.vaults.length+' kartu).');
      }else{ alert('Format file JSON tidak sesuai.'); }
    }catch(err){ alert('Gagal membaca file JSON.'); }
  };
  reader.readAsText(file);
  evt.target.value='';
}
