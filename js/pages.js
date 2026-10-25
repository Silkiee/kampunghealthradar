/* ===== Kampung Health Radar · page switching =====
   Moves between the map, the flu jab guide (#flu-jab) and the Legal & data sources page (#legal),
   and highlights the section being read on the two text pages. */
'use strict';
function route(){
  const g=location.hash==='#flu-jab', l=location.hash==='#legal';
  if(g===GUIDE_ON&&l===LEGAL_ON) return;
  const wasMap=!GUIDE_ON&&!LEGAL_ON;
  GUIDE_ON=g; LEGAL_ON=l; $('.app').hidden=g||l; $('#guide').hidden=!g; $('#legal').hidden=!l;
  $('#btn-jab').setAttribute('aria-current',g?'page':'false');
  if((g||l)&&wasMap) stopPlay();
  if(g){ renderGuide(); $('#guide').scrollTop=0; window.scrollTo(0,0); $('#g-title').focus({preventScroll:true}); document.title='Flu jab guide · '+BASE_TITLE; }
  else if(l){ $('#legal').scrollTop=0; window.scrollTo(0,0); $('#l-title').focus({preventScroll:true}); document.title='Legal & data sources · '+BASE_TITLE; }
  else { document.title=BASE_TITLE; if(mapStale){ mapStale=false; window.dispatchEvent(new Event('resize')); } renderPanel(); }
  if(g||l){ spyLock=0; navOn=null; spy(); }
}
window.addEventListener('hashchange',route);
$('#btn-jab').addEventListener('click',()=>{ if(GUIDE_ON){ $('#guide').scrollTo({top:0}); window.scrollTo(0,0); } });
document.addEventListener('click',ev=>{
  const j=ev.target.closest('[data-jump]'); if(!j) return;
  const id=j.dataset.jump, el=document.getElementById(id); if(!el) return;
  ev.preventDefault();
  const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  spyLock=Date.now()+1000; setNav(id);
  if(id==='g-top'||id==='l-top'){ $(id==='g-top'?'#guide':'#legal').scrollTo({top:0,behavior}); window.scrollTo({top:0,behavior}); }
  else el.scrollIntoView({behavior,block:'start'});
  const h=el.querySelector('h2[tabindex],h3[tabindex]'); if(h) h.focus({preventScroll:true});
});
/* section navigation: highlight the section being read */
const NAVS={guide:{box:'#guide',nav:'#g-nav'},legal:{box:'#legal',nav:'#l-nav'}};
const NAV_IDS={guide:[...document.querySelectorAll('#g-nav [data-jump]')].map(b=>b.dataset.jump),legal:[...document.querySelectorAll('#l-nav [data-jump]')].map(b=>b.dataset.jump)};
const curView=()=>GUIDE_ON?'guide':LEGAL_ON?'legal':null;
let navOn=null, spyRaf=0, spyLock=0;
function setNav(id){
  const v=curView(); if(!v||id===navOn) return; navOn=id; const N=NAVS[v].nav;
  document.querySelectorAll(N+' [data-jump]').forEach(b=>{ const on=b.dataset.jump===id; b.classList.toggle('on',on); on? b.setAttribute('aria-current','location') : b.removeAttribute('aria-current'); });
  const ul=$(N+' ul'), b=ul.querySelector(`[data-jump="${id}"]`);
  if(b&&ul.scrollWidth>ul.clientWidth) ul.scrollTo({left:Math.max(0,b.parentElement.offsetLeft-24),behavior:'smooth'});
}
function spy(){
  spyRaf=0; const v=curView(); if(!v||Date.now()<spyLock) return;
  const ids=NAV_IDS[v], g=$(NAVS[v].box), wide=innerWidth>=1100, line=Math.max(wide?120:$(NAVS[v].nav).offsetHeight+60,innerHeight*0.3);
  let cur=ids[0];
  for(const id of ids){ const el=document.getElementById(id); if(el&&el.getBoundingClientRect().top<=line) cur=id; }
  const bottom=g.scrollHeight>g.clientHeight+4? g.scrollTop+g.clientHeight>=g.scrollHeight-4 : innerHeight+scrollY>=document.documentElement.scrollHeight-4;
  if(bottom&&(g.scrollTop>0||scrollY>0)) cur=ids[ids.length-1];
  setNav(cur);
}
const onGuideScroll=()=>{ if(!spyRaf) spyRaf=requestAnimationFrame(spy); };
$('#guide').addEventListener('scroll',onGuideScroll,{passive:true});
$('#legal').addEventListener('scroll',onGuideScroll,{passive:true});
window.addEventListener('scroll',onGuideScroll,{passive:true});
window.addEventListener('resize',()=>{ if(LEGAL_ON){ mapStale=true; spy(); return; } if(!GUIDE_ON) return; mapStale=true; clearTimeout(grz); grz=setTimeout(()=>{ const L=gLevel(); renderNow(L); renderSeason(L); spy(); },150); });
