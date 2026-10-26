/* ===== Kampung Health Radar · map and timeline ===== */
'use strict';
const svg=d3.select('#map');
let VW=1000,VH=640;
const proj=d3.geoIdentity().reflectY(true);
let fitKey='';
const legendKey=()=>{ const r=$('.mapwrap').getBoundingClientRect(), l=$('#legend').getBoundingClientRect();
  return [r.width,r.height,l.left-r.left,l.top-r.top,l.width,l.height].map(Math.round).join(','); };
function fitProj(){ const r=$('.mapwrap').getBoundingClientRect(); VW=Math.max(320,r.width); VH=Math.max(320,r.height); const narrow=VW<700;
  const base=narrow?[[12,110],[VW-12,VH-118]]:[[40,130],[VW-40,VH-120]];
  proj.fitExtent(base,AREAS);
  // on wider maps, shrink the map away from the legend's side until no estimated area sits under the legend
  const lg=$('#legend').getBoundingClientRect();
  if(!narrow&&lg.height>60){
    const L=[lg.left-r.left-8,lg.top-r.top-8,lg.right-r.left+8,lg.bottom-r.top+8], right=(L[0]+L[2])/2>VW/2;
    const under=c=>{ if(typeof c[0]==='number'){ const p=proj(c); return p[0]>L[0]&&p[0]<L[2]&&p[1]>L[1]&&p[1]<L[3]; } return c.some(under); };
    const ext=[[...base[0]],[...base[1]]], step=Math.max(16,VW*.02);
    for(let cut=0; cut<VW*.35&&AREAS.features.some(f=>est(f.properties)&&under(f.geometry.coordinates)); cut+=step){
      if(right) ext[1][0]-=step; else ext[0][0]+=step; proj.fitExtent(ext,AREAS); }
  }
  fitKey=legendKey(); svg.attr('viewBox',`0 0 ${VW} ${VH}`); }
const path=d3.geoPath(proj);
fitProj();
const defs=svg.append('defs');
const pat=defs.append('pattern').attr('id','hatch').attr('width',6).attr('height',6).attr('patternUnits','userSpaceOnUse').attr('patternTransform','rotate(45)');
pat.append('rect').attr('width',6).attr('height',6).attr('fill','var(--land-none)');
pat.append('line').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',6).attr('stroke','var(--hatch)').attr('stroke-width',2);
const gRoot=svg.append('g');
const gAreas=gRoot.append('g');
const gReg=gRoot.append('g');
const gSel=gRoot.append('g');
const gLab=gRoot.append('g');
const gPill=gRoot.append('g');
const areaSel=gAreas.selectAll('path').data(AREAS.features).join('path')
  .attr('class',f=>'area'+(!est(f.properties)?' empty':'')).attr('d',path)
  .attr('tabindex',f=>est(f.properties)?0:null).attr('role','button').attr('aria-label',f=>f.properties.name)
  .on('click',(ev,f)=>selectArea(f.properties.id,true))
  .on('keydown',(ev,f)=>{ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectArea(f.properties.id,true);} })
  .on('pointermove',(ev,f)=>showMapTip(ev,f.properties)).on('pointerleave',hideMapTip);
// region labels
function regionPos(){ return d3.groups(AREAS.features.filter(f=>est(f.properties)),f=>f.properties.region).map(([r,fs])=>{
  let sx=0,sy=0,sw=0; fs.forEach(f=>{const [px,py]=proj([f.properties.lx,f.properties.ly]); const w=f.properties.pop; sx+=px*w; sy+=py*w; sw+=w;}); return {r,x:sx/sw,y:sy/sw};}); }
const REGOFF={'Central':[0,40],'North-East':[18,-44],'East':[26,-40],'North':[0,-48],'West':[-30,-38]};
function drawRegions(){ gReg.selectAll('text').data(regionPos()).join('text').attr('class','rlab').attr('x',d=>d.x+(REGOFF[d.r]?.[0]||0)).attr('y',d=>d.y+(REGOFF[d.r]?.[1]||0)).text(d=>d.r); }
drawRegions();
let zk=1;
const zoom=d3.zoom().scaleExtent([1,8]).on('zoom',ev=>{ gRoot.attr('transform',ev.transform); zk=ev.transform.k; drawLabels(); });
svg.call(zoom).on('dblclick.zoom',null);
$('#z-in').onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1.6);
$('#z-out').onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1/1.6);
$('#z-reset').onclick=()=>svg.transition().duration(400).call(zoom.transform,d3.zoomIdentity);
function zoomTo(f){
  const [[x0,y0],[x1,y1]]=path.bounds(f); const k=Math.min(2.4,0.3/Math.max((x1-x0)/VW,(y1-y0)/VH));
  const t=d3.zoomIdentity.translate(VW/2,VH/2+20).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2);
  svg.transition().duration(600).call(zoom.transform,t);
}
function fillFor(f){
  const a=f.properties; if(!est(a)) return 'url(#hatch)';
  const id=state.disease, w=state.week;
  const r=state.showAreas? areaRate(id,a,w) : nationalRate(id,w);
  return HEAT[levelOf(id,r)]||'var(--land-none)';
}
function renderMap(){
  renderLegend();
  const t=d3.zoomTransform(svg.node());
  if(t.k===1&&t.x===0&&t.y===0&&legendKey()!==fitKey){ fitProj(); areaSel.attr('d',path); drawRegions(); }
  areaSel.style('fill',fillFor);
  const d=DI[state.disease], w=state.week, fc=isFc(w);
  $('#map-t').textContent=`${d.name} · ${state.showAreas?'estimated level by planning area':'national level'}`;
  $('#map-s').textContent=`${fc?'Outlook':'Illustrative data'} · week of ${weekRange(w)} ${CUR}${fc&&state.plan[d.id]?` · with your ${state.plan[d.id]}% plan`:''}`;
  gSel.selectAll('path').data(state.area?AREAS.features.filter(f=>f.properties.id===state.area):[]).join('path').attr('class','sel').attr('d',path);
  drawLabels();
}
function drawLabels(){
  const k=zk, d=DI[state.disease], w=state.week;
  gReg.style('display',k<1.8?null:'none');
  // pills for the 3 busiest areas: if one would overlap another pill, try it just above or below its area, else skip it
  const pills=[], boxes=[], off={};
  for(const id of state.showAreas? top3() : []){ const a=RES.find(r=>r.id===id); const [px,py]=proj([a.lx,a.ly]); const sx=px*k, sy=py*k;
    const bw=(a.name.length+4)*7.2+18;
    for(const dy of [0,-30,30]){ const b=[sx-bw/2,sy+dy-14,sx+bw/2,sy+dy+14];
      if(boxes.some(o=>!(b[2]<o[0]||b[0]>o[2]||b[3]<o[1]||b[1]>o[3]))) continue; boxes.push(b); pills.push(id); off[id]=dy; break; } }
  const labs=(k>=1.8? AREAS.features.filter(f=>est(f.properties)) : AREAS.features.filter(f=>f.properties.id===state.area)).filter(f=>!pills.includes(f.properties.id));
  gLab.selectAll('text').data(labs,f=>f.properties.id).join('text').attr('class','alab')
    .attr('transform',f=>{const [x,y]=proj([f.properties.lx,f.properties.ly]);return `translate(${x},${y}) scale(${1/k})`;}).text(f=>f.properties.name);
  const sel=gPill.selectAll('g.mpill').data(pills,x=>x).join(en=>{const g=en.append('g').attr('class','mpill');g.append('rect');g.append('text');return g;});
  sel.classed('on',x=>x===state.area).attr('transform',x=>{const a=RES.find(r=>r.id===x);const [px,py]=proj([a.lx,a.ly]);return `translate(${px},${py}) scale(${1/k}) translate(0,${off[x]||0})`;})
    .on('click',(ev,x)=>selectArea(x,true));
  sel.each(function(x){ const a=RES.find(r=>r.id===x); const g=d3.select(this);
    const av=areaCount(d.id,a,w); const txt=`${a.name} ${av<1?'<1':'~'+fmt(av)}`; const t=g.select('text').text(txt);
    const bw=t.node().getComputedTextLength()+18; g.select('rect').attr('x',-bw/2).attr('y',-13).attr('width',bw).attr('height',26).attr('rx',13); });
}
function top3(){ const id=state.disease,w=state.week; return RES.map(a=>[a.id,areaValue(id,a,w)]).sort((p,q)=>q[1]-p[1]).slice(0,3).map(p=>p[0]); }
function renderLegend(){
  const d=DI[state.disease], b=M[d.id].bins, f=v=>v<10?v.toLocaleString('en-SG',{maximumFractionDigits:2}):fmt(v);
  const ranges=[`under ${f(b[0])}`,`${f(b[0])}–${f(b[1])}`,`${f(b[1])}–${f(b[2])}`,`${f(b[2])}–${f(b[3])}`,`${f(b[3])}+`];
  $('#legend').innerHTML=`<div class="t">${d.rateUnit[0].toUpperCase()+d.rateUnit.slice(1)}</div>
   <div class="muted" style="font-size:11.5px;margin:-4px 0 6px;line-height:1.35">Compared with a typical week for Singapore (${d.medianInd?'5-year median':'this year so far'}). Moderate = typical.</div>
   <div class="items">${[4,3,2,1,0].map(i=>`<div class="it"><i style="background:${HEAT[i]}"></i><span>${LEVELS[i]}</span><span>${ranges[i]}</span></div>`).join('')}
   <div class="it"><i style="background:url(#hatch);background:repeating-linear-gradient(45deg,var(--hatch) 0 2px,var(--land-none) 2px 5px)"></i><span>Not estimated</span><span></span></div></div>
   <div class="foot">${state.showAreas?'Illustrative figures, spread by population, age and made-up hot spots. Not real local data.':'Every area shows the national rate.'} <button type="button" data-about>How this works</button></div>`;
}
const mt=$('#maptip');
function showMapTip(ev,a){
  const box=$('.mapwrap').getBoundingClientRect(); const d=DI[state.disease], w=state.week;
  let html=`<div class="t">${a.name}</div>`;
  if(!est(a)) html+=`<div class="r"><span>Almost no residents. Not estimated.</span></div>`;
  else { const r=state.showAreas?areaRate(d.id,a,w):nationalRate(d.id,w), l=levelOf(d.id,r);
    html+=`<div class="r"><span><i class="k" style="background:${HEAT[l]};border-radius:3px"></i>${LEVELS[l]}</span><b>${approx(r)}</b></div><div class="r"><span>${d.rateShort}</span></div>`;
    if(state.showAreas){ const c=areaCount(d.id,a,w); html+=`<div class="r"><span>Estimated ${d.areaUnit}</span><b>${c<1?'':'~'}${cnt(c)}</b></div>`; }
    html+=`<div class="r" style="margin-top:4px;color:var(--accent)"><span>Click for details</span></div>`; }
  mt.innerHTML=`<div class="tip" style="position:static">${html}</div>`; mt.hidden=false;
  const x=ev.clientX-box.left, y=ev.clientY-box.top;
  mt.style.left=Math.min(box.width-200,x+14)+'px'; mt.style.top=Math.max(8,y-10)+'px';
}
function hideMapTip(){ mt.hidden=true; }

/* ---------------- timeline ---------------- */
const tl=$('#tl');
function renderTimeline(){
  tl.max=END; tl.value=state.week;
  const id=state.disease, m=M[id], box=$('#tl-svg').getBoundingClientRect(), W=Math.max(200,box.width), Hh=56, top=2, base=28;
  const x=w=>3+(w-1)/(END-1)*(W-6);
  const vals=d3.range(1,END+1).map(w=>value(id,w)); const mx=d3.max(vals)||1;
  const bw=Math.max(2,(W-6)/END-2);
  const s=d3.select('#tl-svg').attr('viewBox',`0 0 ${W} ${Hh}`); s.selectAll('*').remove();
  s.append('rect').attr('x',x(m.t+0.5)).attr('y',0).attr('width',x(END)-x(m.t+0.5)+bw/2).attr('height',base+2).attr('fill','var(--surface-2)').attr('rx',4);
  s.append('line').attr('x1',3).attr('x2',W-3).attr('y1',37).attr('y2',37).attr('stroke','var(--line)').attr('stroke-width',3).attr('stroke-linecap','round');
  s.append('line').attr('x1',3).attr('x2',x(state.week)).attr('y1',37).attr('y2',37).attr('stroke','var(--accent)').attr('stroke-width',3).attr('stroke-linecap','round');
  s.append('text').attr('x',x(END)).attr('y',10).attr('text-anchor','end').style('font-weight',600).text('Outlook');
  s.selectAll('rect.b').data(vals).join('rect').attr('class','b').attr('x',(v,i)=>x(i+1)-bw/2).attr('width',bw)
    .attr('y',v=>base-(v/mx)*(base-top-10)).attr('height',v=>(v/mx)*(base-top-10)).attr('rx',1.5)
    .attr('fill',(v,i)=>i+1===state.week?'var(--accent)':i+1>m.t?'var(--s-fc)':'var(--ink-3)').attr('opacity',(v,i)=>i+1===state.week?1:.45);
  s.append('line').attr('x1',x(m.t)+bw/2+1).attr('x2',x(m.t)+bw/2+1).attr('y1',0).attr('y2',base+4).attr('stroke','var(--ink-2)').attr('stroke-width',1);
  s.append('text').attr('x',x(m.t)-2).attr('y',10).attr('text-anchor','end').text('Latest data');
  for(const [w,mon] of monthStarts(END)) if(W>520||MON.indexOf(mon)%2===0) s.append('text').attr('x',x(w)).attr('y',55).text(mon);
  $('#tl-week').textContent=`Week of ${weekRange(state.week)} ${CUR}`;
  $('#tl-kind').innerHTML=isFc(state.week)?'<span class="chip fc">Outlook</span>':state.week===m.t?'<span class="chip calm">Latest data</span>':'';
}
tl.addEventListener('input',()=>{ state.week=+tl.value; stopPlay(); update(); });
let timer=null;
function stopPlay(){ if(timer){clearInterval(timer);timer=null;} $('#play-ico').innerHTML='<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>'; $('#play').setAttribute('aria-label','Play the year'); }
$('#play').onclick=()=>{
  if(timer){stopPlay();return;}
  if(state.week>=END) state.week=1;
  $('#play-ico').innerHTML='<path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor"/>'; $('#play').setAttribute('aria-label','Pause');
  timer=setInterval(()=>{ if(state.week>=END){stopPlay();return;} state.week++; update(); },320);
  update();
};
