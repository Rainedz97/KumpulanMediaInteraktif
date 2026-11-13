/* =========================================================================
   AUDIO.JS — Musik latar & efek suara (Web Audio API, tanpa file eksternal)
   - gainMusic & gainSFX dipisah supaya SFX bisa dibunyikan BERSAMAAN
     dengan BGM tanpa menghentikan/reset BGM.
   - AudioContext hanya dibuat/di-resume di dalam event handler klik
     pengguna (autoplay policy browser modern).
========================================================================= */
let audioCtx=null, gainMusic=null, gainSFX=null, musicOn=true, musicTimer=null, musicStep=0;

function ensureAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  gainMusic = audioCtx.createGain(); gainMusic.gain.value = musicOn?0.16:0; gainMusic.connect(audioCtx.destination);
  gainSFX = audioCtx.createGain(); gainSFX.gain.value = 0.35; gainSFX.connect(audioCtx.destination);
}

function playTone(freq,dur,type,gainNode,startOffset,vol){
  if(!audioCtx) return;
  const t0 = audioCtx.currentTime + (startOffset||0);
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type||'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol||0.5, t0+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  osc.connect(g); g.connect(gainNode);
  osc.start(t0); osc.stop(t0+dur+0.05);
}

const MUSIC_PATTERN = [261.6,329.6,392.0,329.6, 293.7,349.2,440.0,349.2, 261.6,392.0,440.0,392.0, 220.0,293.7,349.2,293.7];
function scheduleMusicStep(){
  if(!audioCtx) return;
  const freq = MUSIC_PATTERN[musicStep % MUSIC_PATTERN.length];
  playTone(freq,0.28,'triangle',gainMusic,0,0.5);
  playTone(freq/2,0.28,'sine',gainMusic,0,0.25);
  musicStep++;
}
function startMusic(){
  ensureAudio();
  if(audioCtx.state==='suspended') audioCtx.resume();
  if(musicTimer) return;
  scheduleMusicStep();
  musicTimer = setInterval(scheduleMusicStep,300);
}
function stopMusic(){
  if(musicTimer){ clearInterval(musicTimer); musicTimer=null; }
}
function toggleMusic(){
  ensureAudio();
  if(audioCtx.state==='suspended') audioCtx.resume();
  musicOn = !musicOn;
  gainMusic.gain.value = musicOn?0.16:0;
  const btn = document.getElementById('btn-music');
  if(btn) btn.textContent = musicOn?'🔊':'🔇';
}
function sfxSuccess(){
  if(!audioCtx) return;
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>playTone(f,0.22,'sine',gainSFX,i*0.09,0.6));
}
function sfxFail(){
  if(!audioCtx) return;
  playTone(160,0.35,'sawtooth',gainSFX,0,0.55);
  playTone(110,0.4,'square',gainSFX,0.05,0.4);
}
