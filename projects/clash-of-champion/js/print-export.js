/* =========================================================================
   PRINT-EXPORT.JS — Lembar Cetak A4, Preview Guru, Export PNG (Canvas API)
========================================================================= */
let currentPreviewMode='soal';
function renderPrintPreview(mode){
  currentPreviewMode=mode;
  const grid = document.getElementById('print-preview-grid');
  grid.innerHTML='';
  state.vaults.forEach(v=>{
    const card = document.createElement('div');
    card.className='pp-card';
    card.innerHTML = '<div class="pp-head">VAULT #'+String(v.id).padStart(2,'0')+' · '+v.points+' PTS</div>'+
      '<div>'+escapeHtml(v.question)+'</div>'+
      (mode==='kunci' ? '<div class="pp-ans">🔑 '+escapeHtml(v.answer)+'</div>' : '');
    grid.appendChild(card);
  });
}

function downloadPreviewAsImage(){
  const canvas = document.getElementById('export-canvas');
  const W=1600,H=2263; // rasio A4
  canvas.width=W; canvas.height=H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1325'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#ffb703'; ctx.font='bold 42px Arial';
  ctx.fillText((currentPreviewMode==='kunci'?'KUNCI JAWABAN - ':'LEMBAR SOAL - ')+state.subject.toUpperCase(), 40, 60);
  ctx.strokeStyle='#00f2fe'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(40,80); ctx.lineTo(W-40,80); ctx.stroke();

  const cols=5, rows=6, pad=24, top=110;
  const cardW = (W-pad*(cols+1))/cols;
  const cardH = (H-top-pad*(rows+1))/rows;
  state.vaults.forEach((v,i)=>{
    const col = i%cols, row = Math.floor(i/cols);
    const x = pad + col*(cardW+pad);
    const y = top + pad + row*(cardH+pad);
    ctx.fillStyle='#111d38';
    roundRect(ctx,x,y,cardW,cardH,10); ctx.fill();
    ctx.strokeStyle = v.level===1?'#00f2fe':(v.level===2?'#ffb703':'#8b5cf6');
    ctx.lineWidth=3; roundRect(ctx,x,y,cardW,cardH,10); ctx.stroke();
    ctx.fillStyle='#ffb703'; ctx.font='bold 17px Arial';
    ctx.fillText('VAULT #'+String(v.id).padStart(2,'0')+' - '+v.points+'PTS', x+10, y+24);
    ctx.fillStyle='#eaf2ff'; ctx.font='13px Arial';
    wrapCanvasText(ctx, v.question, x+10, y+46, cardW-20, 16, 5);
    if(currentPreviewMode==='kunci'){
      ctx.fillStyle='#00e676'; ctx.font='bold 14px Arial';
      ctx.fillText('🔑 '+v.answer, x+10, y+cardH-12);
    }
  });
  canvas.toBlob(blob=>{
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='vault-'+currentPreviewMode+'.png'; a.click();
    URL.revokeObjectURL(url);
  });
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
  const words = text.split(' ');
  let line='', lines=0;
  for(let n=0;n<words.length;n++){
    const test = line+words[n]+' ';
    if(ctx.measureText(test).width>maxWidth && n>0){
      ctx.fillText(line,x,y); y+=lineHeight; line=words[n]+' '; lines++;
      if(lines>=maxLines) return;
    }else{ line=test; }
  }
  ctx.fillText(line,x,y);
}

/* ---- Lembar Kerja Cetak A4 (Halaman @media print) ---- */
function renderPrintWorksheet(){
  const qGrid = document.getElementById('ps-question-grid');
  qGrid.innerHTML = state.vaults.map(v=>
    '<div class="ps-box">'+
      '<div class="ps-label"><span>KARTU VAULT #'+String(v.id).padStart(2,'0')+'</span><span>'+v.points+' PTS</span></div>'+
      '<div class="ps-q">'+escapeHtml(v.question)+'</div>'+
      '<div class="ps-answer-line">Password: ________________________</div>'+
    '</div>'
  ).join('');
  const aGrid = document.getElementById('ps-answer-grid');
  aGrid.innerHTML = state.vaults.map(v=>
    '<div class="ps-key-row"><span>#'+String(v.id).padStart(2,'0')+' ('+v.points+'pt) '+escapeHtml(v.question)+'</span><b>'+escapeHtml(v.answer)+'</b></div>'
  ).join('');
}
