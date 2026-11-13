/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
(function(){
  const art=document.getElementById('heroArt');
  if(!art)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stack=document.getElementById('deviceStack');
  const cycleEl=document.getElementById('heroCycle');
  const words=['in motion.','jadi gim.','jadi kuis.','jadi simulasi.'];
  const scenes=[...document.querySelectorAll('.stage-scene')];
  let wi=0,si=0,timers=[],running=true;

  function setWord(){
    cycleEl.style.animation='none';cycleEl.offsetHeight;cycleEl.style.animation='';
    cycleEl.textContent=words[wi=(wi+1)%words.length];
  }
  function setScene(){
    scenes.forEach((s,i)=>s.classList.toggle('is-active',i===si));
    si=(si+1)%scenes.length;
  }
  function tick(){
    if(!running)return;
    setWord();setScene();
  }
  function startLoop(){
    stopLoop();
    if(reduce){scenes[0]?.classList.add('is-active');return;}
    tick();
    timers.push(setInterval(tick,3200));
  }
  function stopLoop(){timers.forEach(clearInterval);timers=[];}

  if(!reduce){
    let raf=null;
    art.addEventListener('pointermove',e=>{
      const r=art.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        stack.style.transform=`rotate(-8deg) rotateY(${px*10}deg) rotateX(${-py*10}deg)`;
        raf=null;
      });
    });
    art.addEventListener('pointerleave',()=>{stack.style.transform='rotate(-8deg)';});
  }

  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{running=e.isIntersecting;if(running)startLoop();else stopLoop();});
  },{threshold:.2});
  io.observe(art);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopLoop();}else if(running){startLoop();}
  });
})();
