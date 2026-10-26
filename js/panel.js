/* ===== Kampung Health Radar · left panel =====
   Number formatting, the Singapore and area views, and the outlook chart. */
'use strict';
/* ---------------- formatting ---------------- */
const fmt=v=>v==null?'–':Math.round(v).toLocaleString('en-SG');
const wkStart=w=>epiWeekStart(CUR,w);
const dstr=d=>`${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
function weekRange(w){ const a=wkStart(w), b=new Date(a); b.setUTCDate(a.getUTCDate()+6);
  return a.getUTCMonth()===b.getUTCMonth()? `${a.getUTCDate()}–${b.getUTCDate()} ${MON[b.getUTCMonth()]}` : `${dstr(a)} – ${dstr(b)}`; }
const weekEnd=w=>{const a=wkStart(w);a.setUTCDate(a.getUTCDate()+6);return dstr(a);};
const monthOf=w=>{const a=wkStart(w);a.setUTCDate(a.getUTCDate()+3);return MONTHS[a.getUTCMonth()];};
const isFc=w=>w>M[state.disease].t;
const cnt=v=>v==null?'–':v<1?'<1':fmt(v);
const approx=v=>v==null?'–':(v<5? (Math.round(v*10)/10).toLocaleString('en-SG') : fmt(v));
const trendText=t=>t.dir==='rising'?`<span class="trend" style="color:var(--crit)">▲ Rising</span>`:t.dir==='falling'?`<span class="trend" style="color:var(--good)">▼ Easing</span>`:`<span class="trend" style="color:var(--ink-2)">▶ Steady</span>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- panel: national view ---------------- */
function sparkSVG(id,w){
  const from=Math.max(1,w-11), pts=[]; for(let k=from;k<=w;k++){ const v=value(id,k); if(v!=null) pts.push([k,v]); }
  if(pts.length<2) return '';
  const mx=Math.max(...pts.map(p=>p[1]))*1.1||1, W=64,H=22;
  const x=k=>(k-from)/(w-from)*(W-4)+2, y=v=>H-2-(v/mx)*(H-4);
  const t=M[id].t;
  const seg=(arr)=>arr.map((p,i)=>`${i?'L':'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
  const act=pts.filter(p=>p[0]<=t), fut=pts.filter(p=>p[0]>=t);
  const last=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <path d="${seg(act)}" fill="none" stroke="var(--s-actual)" stroke-width="1.6" stroke-linejoin="round"/>
    ${fut.length>1?`<path d="${seg(fut)}" fill="none" stroke="var(--s-fc)" stroke-width="1.6" stroke-dasharray="3 2"/>`:''}
    <circle cx="${x(last[0])}" cy="${y(last[1])}" r="2.4" fill="${last[0]>t?'var(--s-fc)':'var(--s-actual)'}"/></svg>`;
}
function cardsHTML(){
  const w=state.week;
  return `<div class="cards" role="group" aria-label="Choose a disease">${DIS.map(d=>{
    const v=value(d.id,w), st=statusOf(d.id,w), tr=trendOf(d.id,w);
    return `<button class="dcard" type="button" data-dis="${d.id}" aria-pressed="${state.disease===d.id}">
      <span class="dname"><span>${d.name}</span>${isFc(w)?'<span class="chip fc">Outlook</span>':''}</span>
      <span class="big num">${isFc(w)?'~':''}${fmt(v)}</span>
      <span class="unit">${d.cardUnit}</span>
      <span class="row">${trendText(tr)}${sparkSVG(d.id,w)}</span>
      ${st?`<span class="chip ${st.cls}" title="Compared with the ${esc(st.u.label)}: ${fmt(st.u.v)}">${st.icon} ${st.text}</span>`:''}
    </button>`;}).join('')}</div>`;
}
function peakInfo(id){ const m=M[id]; let pk=0,pw=1; for(let w=1;w<=m.t;w++){ const v=m.y[w]; if(v!=null&&v>pk){pk=v;pw=w;} } return {pk,pw}; }
function posSeries(ind){ return S[ind]?.[CUR]||{}; }
function storyHTML(){
  const d=DI[state.disease], id=d.id, w=state.week, v=value(id,w), tr=trendOf(id,w), st=statusOf(id,w), fc=isFc(w);
  let title, facts=[], watch='';
  const chg=Math.abs(tr.pct)>=5? `${tr.pct>0?'up':'down'} ${Math.round(Math.abs(tr.pct))}% from 4 weeks earlier`:'about the same as 4 weeks earlier';
  const when=fc?`is expected in the week of ${weekRange(w)}`:`in the week of ${weekRange(w)}`;
  const vs=st? (st.r<0.75?`well below the ${st.u.phrase} (${fmt(st.u.v)})`:st.r<=1.2?`close to the ${st.u.phrase} (${fmt(st.u.v)})`:`above the ${st.u.phrase} (${fmt(st.u.v)})`):'';
  const dirWord={rising:'rising',falling:'easing',steady:'holding steady'}[tr.dir];
  if(id==='dengue'){
    title=fc?`Dengue outlook: ${dirWord}`:`Dengue is ${dirWord}`;
    facts.push(fc?`About ${fmt(v)} cases are expected in the week of ${weekRange(w)}, ${chg}. That is ${vs}.`:`${fmt(v)} cases in the week of ${weekRange(w)}, ${chg}. That is ${vs}.`);
    const {pk,pw}=peakInfo(id); if(!fc&&w>pw+2&&v<pk*0.8) facts.push(`This year's cases peaked at ${fmt(pk)} a week in ${monthOf(pw)} and have fallen since. The main serotype now is ${CTX.serotype_main}.`);
  } else if(id==='flu'){
    const fp=posSeries('flu_positivity'); const pw=Math.min(w,M.flu.t); const p=fp[pw], p4=fp[pw-4];
    const maxSoFar=Math.max(...Object.entries(fp).filter(([k])=>+k<=pw).map(([,x])=>x));
    title=fc?`Coughs & colds outlook: ${dirWord}`:(p>=30&&p>=maxSoFar?'Flu season is here':`Coughs and colds are ${dirWord}`);
    facts.push(`${fc?'About ':''}${fmt(v)} people a day ${fc?'are expected at':'visited'} polyclinics with coughs, colds and flu in the week of ${weekRange(w)}${vs?`, ${vs}`:''}.`);
    if(p!=null) facts.push(`In week ${pw}, flu was found in <b>${p}%</b> of people tested with flu-like illness, ${p>=maxSoFar?'the highest so far this year':`against ${maxSoFar}% at this year's peak`}${p4!=null?` (${p4}% four weeks earlier)`:''}.`);
    const fcTr=M.flu.fc.mean.length? M.flu.fc.mean[3]/value('flu',M.flu.t):1;
    if(!fc&&p4!=null&&(p>=maxSoFar||p>p4*1.15)&&p>p4&&fcTr<1.05) watch=`<div class="watch"><b>Watch</b><span>The outlook below follows last year's pattern and recent clinic visits. Flu positivity rose from ${p4}% to ${p}% in four weeks and is at this year's high, so clinic visits could rise above it.</span></div>`;
  } else if(id==='hfmd'){
    title=fc?`HFMD outlook: ${dirWord}`:`HFMD is ${dirWord}`;
    facts.push(`${fc?'About ':''}${fmt(v)} people a day ${fc?'are expected at':'visited'} polyclinics with HFMD in the week of ${weekRange(w)}, ${chg}. That is ${vs}.`);
    if(!fc) facts.push('Most cases are in children under 5, and outbreaks often start in childcare centres.');
  } else {
    const cp=posSeries('covid_positivity'); const pw=Math.min(w,M.covid.t); const p=cp[pw];
    let pk=0,pkw=1; for(const [k,x] of Object.entries(cp)) if(x>pk){pk=x;pkw=+k;}
    title=fc?`COVID-19 outlook: ${dirWord}`:(p!=null&&p<5?'COVID-19 is quiet':`COVID-19 is ${dirWord}`);
    facts.push(`${p!=null&&!fc?`${p<1?'Under 1':p}% of respiratory samples tested positive for COVID-19 in week ${pw}. `:''}That works out to roughly ${fmt(v)} polyclinic visits a day${fc?` expected in the week of ${weekRange(w)}`:''}.`);
    if(!fc) facts.push(`This year's wave peaked at ${pk}% positivity in ${monthOf(pkw)}.`);
  }
  return `<section class="story" aria-live="polite">
    <h2>${title}</h2>
    <div class="meta">${fc?'Outlook':'Singapore'} · week of ${weekRange(w)}</div>
    <p>${facts.join(' ')}</p>${watch}</section>`;
}
function outlookSummary(id,sc){
  const m=M[id]; if(!m.H) return ''; const unit=sc?sc.unit:DI[id].unitShort;
  const endV=value(id,END,false), b=band(id,END);
  const r=endV/((value(id,m.t)+value(id,m.t-1)+value(id,m.t-2))/3);
  const word=r>1.12?'rise':r<0.88?'ease':'stay about where it is';
  const s=sc?sc.fn:(x=>x);
  const nm={dengue:'dengue',hfmd:'HFMD',flu:'coughs, colds and flu',covid:'COVID-19'}[id];
  const F=v=>sc?cnt(s(v,END)):approx(s(v,END));
  return `If nothing changes, expect ${nm} to ${word}: around <b class="num">${F(endV)}</b> ${unit} by ${weekEnd(END)}, most likely between ${F(b[2])} and ${F(b[3])}. ${b[1]>endV*2?`An unexpected wave could push it as high as ${F(b[1])}.`:`The wider range is ${F(b[0])} to ${F(b[1])}.`}`;
}
function planHTML(sc){
  const d=DI[state.disease], m=M[d.id]; if(!m.H) return '';
  const x=state.plan[d.id], s=sc?sc.fn:(v=>v), unit=sc?sc.unit:d.unitShort, f=sc?cnt:approx;
  let avoided=0; for(let w=m.t+1;w<=END;w++) avoided+=(value(d.id,w,false)-value(d.id,w,true))*(d.perDay?7:1)*(sc?sc.share(w):1);
  const endB=value(d.id,END,false), endP=value(d.id,END,true);
  return `<div class="plan">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
      <label for="plan">${d.lever.text}</label><span class="val num" id="plan-val">${x}%</span></div>
    <input class="rng" type="range" id="plan" min="0" max="${d.lever.max}" step="5" value="${x}" aria-describedby="plan-hint">
    <div class="muted" id="plan-hint">${d.lever.hint}</div>
    <div class="plan-out">
      <div><small>Over the next ${END-m.t} weeks</small><b class="num" style="color:var(--s-plan)">${x?'~'+fmt(avoided):'0'}</b><small>${d.avoidedWord}</small></div>
      <div><small>Week ending ${weekEnd(END)}</small><b class="num">${f(s(endP,END))}</b><small>${unit}${x?`, against ${f(s(endB,END))} with no action`:' with no action'}</small></div>
    </div></div>`;
}
function actionsHTML(){ const d=DI[state.disease]; return `<section class="section"><div class="section-head"><h3>What you can do</h3></div><ul class="todo">${d.actions.map(a=>`<li>${tick}<span>${a}</span></li>`).join('')}</ul></section>`; }
function topAreasHTML(){
  if(!state.showAreas) return '';
  const d=DI[state.disease], w=state.week;
  const list=RES.map(a=>({a,v:areaCount(d.id,a,w),r:areaRate(d.id,a,w)})).sort((p,q)=>q.v-p.v).slice(0,5);
  const mr=Math.max(...RES.map(a=>areaRate(d.id,a,w)));
  return `<section class="section"><div class="section-head"><h3>Where it's likely busiest</h3><span class="illus">Illustrative</span></div>
   <div class="rank">${list.map((o,i)=>`<button type="button" data-area="${o.a.id}"><span class="n num">${i+1}</span><span><b>${o.a.name}</b></span>
     <span class="bar" style="width:${Math.max(6,o.r/mr*90)}px;background:${HEAT[levelOf(d.id,o.r)]}"></span><span class="v num">${o.v<1?'':'~'}${cnt(o.v)}</span></button>`).join('')}</div>
   <div class="muted">Estimated ${d.areaUnit}. Big towns rank high because more people live there. The map colours adjust for population.</div></section>`;
}
function plannerHTML(){
  const d=DI[state.disease], id=d.id, w=Math.min(state.week,M[id].t), rows=[];
  const y=M[id].y, last=M[id].last, u=usual(id,w);
  rows.push([`Week ${w} (${weekRange(w)})`,fmt(y[w])],[`Week ${w-1}`,fmt(y[w-1])]); if(last[w]!=null) rows.push([`Same week ${CUR-1}`,fmt(last[w])]);
  if(u) rows.push([u.label[0].toUpperCase()+u.label.slice(1),fmt(u.v)]);
  let extra='';
  if(id==='dengue'){
    let cum=0; for(let k=1;k<=w;k++) cum+=y[k]||0; let cumL=0; for(let k=1;k<=w;k++) cumL+=last[k]||0;
    if(w===CTX.latest_week&&CUR===2026&&CTX.cumulative_dengue_2026){ cum=CTX.cumulative_dengue_2026; cumL=CTX.cumulative_dengue_2025; }
    rows.push([`Total so far in ${CUR}`,fmt(cum)],[`Same period in ${CUR-1}`,fmt(cumL)]);
    const h=S.dengue_hospital?.[CUR]?.[w]; if(h!=null) rows.push(['Hospital admissions this week',fmt(h)]);
    extra=`<div class="note"><b>Serotypes (${monthOf(M.dengue.t)} samples, illustrative):</b> ${esc(CTX.serotype)}. A change in the dominant serotype can signal a bigger wave, because fewer people are immune to it.</div>`;
  }
  if(id==='flu'||id==='covid'){
    const fp=S.flu_positivity?.[CUR]?.[w], cp=S.covid_positivity?.[CUR]?.[w];
    if(fp!=null) rows.push(['Flu positivity (flu-like illness samples)',fp+'%']);
    if(cp!=null) rows.push(['COVID-19 positivity (respiratory samples)',(cp<1?'<1':cp)+'%']);
    extra=`<div class="chart" id="pos-chart"></div><div class="note"><b>Top respiratory viruses, latest week (illustrative).</b> Adults: ${esc(CTX.pathogens_adult)}. Children: ${esc(CTX.pathogens_child)}.<br><br>${esc(CTX.flu_subtypes)}</div>`;
  }
  if(d.thresholdNote) extra+=`<div class="note">${d.thresholdNote}</div>`;
  const pb=M[id].prof? `${M[id].prof.years} past year${M[id].prof.years>1?'s':''}`:'no past years (trend only)';
  extra+=`<div class="note"><b>Model check.</b> Seasonal pattern from ${pb}. The uncertainty band comes from testing the method on ${M[id].fc.backtests?.[0]??0} earlier weeks of ${CUR}.</div>`;
  return `<details class="more" id="planner"><summary>More detail for planners</summary><div class="body">
    <table class="kv"><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>${extra}
    <div class="muted">Illustrative figures, not real data. <a href="#legal">Legal &amp; data sources</a></div></div></details>`;
}
function chartBlockHTML(title){
  const d=DI[state.disease];
  const planOn=state.plan[d.id]>0;
  return `<section class="section"><div class="section-head"><h3>${title}</h3><span class="muted num">${MON[wkStart(1).getUTCMonth()]} – ${weekEnd(END)}</span></div>
   <div class="chart-legend"><span><i class="sw" style="border-color:var(--s-actual)"></i>${CUR} (illustrative)</span><span><i class="sw band"></i>Outlook if nothing changes (darker = more likely)</span>${planOn?`<span><i class="sw" style="border-color:var(--s-plan)"></i>With your plan</span>`:''}<span><i class="sw" style="border-color:var(--s-last)"></i>${CUR-1}</span></div>
   <div class="chart" id="chart"></div>
   <div class="muted" id="outlook-sum">${outlookSummary(d.id, areaScale(d.id))}</div></section>`;
}
function renderNational(){
  const d=DI[state.disease];
  $('#panel-body').innerHTML=`<div class="stack" data-lead="2">
    ${cardsHTML()}
    ${storyHTML()}
    ${state.disease==='flu'?jabCardHTML():''}
    ${chartBlockHTML('Next 3 months')}
    <section class="section"><div class="section-head"><h3>What if we act now?</h3></div>${planHTML()}</section>
    ${actionsHTML()}
    ${topAreasHTML()}
    ${plannerHTML()}
  </div>`;
  drawChart($('#chart'),d.id,null);
  if($('#pos-chart')) drawPositivity($('#pos-chart'));
}

/* ---------------- panel: area view ---------------- */
function renderArea(){
  const a=AREAS.features.find(f=>f.properties.id===state.area).properties;
  const d=DI[state.disease], w=state.week, fc=isFc(w);
  if(!est(a)){
    $('#panel-body').innerHTML=`<div class="stack" data-lead="5"><button class="back" type="button" data-back>← All of Singapore</button>
      <div class="area-head"><h2>${a.name}</h2><div class="meta">${a.region} region · ${a.pop? 'about '+fmt(a.pop)+' residents':'no resident population'}</div></div>
      <div class="note">Almost no one lives on the ${a.name}, so we do not estimate disease levels here.</div></div>`;
    return;
  }
  const on=state.showAreas; const sc=areaScale(d.id);
  const v=on?areaCount(d.id,a,w):value(d.id,w), r=on?areaRate(d.id,a,w):nationalRate(d.id,w), nr=nationalRate(d.id,w);
  const ratio=r/nr, lvl=levelOf(d.id,r);
  // made-up local factor this week vs the population-and-age estimate
  const lf=areaShare(d.id,a.id,w)/areaShare(d.id,a.id,null), baseRatio=areaShare(d.id,a.id,null)*TOTPOP/a.pop;
  let why=d.why(a);
  if(on&&(lf>=1.25||lf<=0.8)){ const same=(baseRatio>1)===(ratio>1); why=[lf>1?'an illustrative local cluster is showing here this week (made-up figures)':'fewer cases are showing here this week than its population would suggest (made-up local variation)',...(same?why:[])]; }
  const cmp=Math.abs(ratio-1)<0.06?'about the same as the Singapore average':`${ratio.toFixed(1)}× the Singapore average`;
  $('#panel-body').innerHTML=`<div class="stack" data-lead="5">
    <button class="back" type="button" data-back>← All of Singapore</button>
    <div class="area-head"><h2>${a.name}</h2><div class="meta">${a.region} region · About ${fmt(a.pop)} residents · ${a.kid}% under 10 · ${a.sen}% aged 65+ (${a.madeup?'made-up numbers':'approximate'})</div></div>
    ${on?'<span class="illus">⚠ Illustrative estimate: national figures spread by population, age and made-up local hot spots, not local reports</span>':'<div class="note">Area estimates are switched off, so you are seeing national figures. Turn on “Show area estimates” on the map to see an illustrative local view.</div>'}
    ${tabsHTML()}
    <section class="section">
      <div class="eyebrow">${d.longName||d.name} · ${fc?'outlook for':'week of'} ${weekRange(w)}</div>
      <div class="statline"><span class="big num">${on?(v<1?'':'~')+cnt(v):(fc?'~':'')+fmt(v)}</span><span style="padding-bottom:4px">${on?d.areaUnit+' in '+a.name:d.cardUnit+' in Singapore'}${fc?' (outlook)':''}</span></div>
      ${on?`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="lvl"><i style="background:${HEAT[lvl]}"></i>${LEVELS[lvl]} for ${d.name}</span><span class="muted num">${approx(r)} ${d.rateShort} · ${cmp}</span></div>
      ${why.length?`<p style="margin:0;color:var(--ink-2)">Why ${ratio>1.05?'higher':ratio<0.95?'lower':'this level'}: ${why.join(', and ')}.</p>`:''}`:''}
    </section>
    ${chartBlockHTML(on?`Next 3 months in ${a.name}`:'Next 3 months')}
    <section class="section"><div class="section-head"><h3>What if we act now?</h3></div>${planHTML(sc)}</section>
    <section class="section"><div class="section-head"><h3>All four in ${a.name}</h3><span class="muted">${fc?'outlook':'this week'}</span></div>
      <div class="alld">${DIS.map(o=>{const rr=on?areaRate(o.id,a,w):nationalRate(o.id,w), l=levelOf(o.id,rr);
        return `<button type="button" data-dis="${o.id}" aria-current="${o.id===d.id}"><span><b>${o.name}</b><br><span class="muted">${(()=>{const vv=on?areaCount(o.id,a,w):value(o.id,w);return (vv<1?'':'~')+cnt(vv);})()} ${on?o.areaUnit:o.cardUnit}</span></span><span class="lvl"><i style="background:${HEAT[l]}"></i>${LEVELS[l]}</span>${trendText(trendOf(o.id,w))}</button>`;}).join('')}</div></section>
    ${state.disease==='flu'?jabCardHTML():''}
    ${actionsHTML()}
  </div>`;
  drawChart($('#chart'),d.id,sc);
}
function tabsHTML(){ return `<div class="tabs" role="group" aria-label="Choose a disease">${DIS.map(d=>`<button type="button" data-dis="${d.id}" aria-pressed="${state.disease===d.id}">${d.name}</button>`).join('')}</div>`; }
function areaScale(id){ if(!(state.area&&state.showAreas)) return null; const aid=state.area; const k=DI[id].perDay?7:1; return {share:w=>areaShare(id,aid,w),fn:(v,w)=>v*areaShare(id,aid,w)*k,unit:DI[id].areaUnit.replace(/^est\. clinic /,'est. ').replace('polyclinic ','')}; }
function renderPanel(){ state.area? renderArea() : renderNational(); }

/* ---------------- charts ---------------- */
// weeks of the current year that start a month: [[week, 'Jan'], ...]
function monthStarts(upto){ const mt=[]; for(let w=1;w<=upto;w++){ const a=wkStart(w); if(a.getUTCDate()<=7) mt.push([w,MON[a.getUTCMonth()]]); } return mt; }
// horizontal grid lines and y-axis labels; returns the labels so callers can style them
function yGrid(svg,y,n,x0,x1,label,dy=3.5){
  svg.append('g').attr('class','grid').selectAll('line').data(y.ticks(n)).join('line').attr('x1',x0).attr('x2',x1).attr('y1',y).attr('y2',y);
  return svg.append('g').selectAll('text').data(y.ticks(n)).join('text').attr('x',x0-6).attr('y',v=>y(v)+dy).attr('text-anchor','end').text(label);
}
function monthLabels(svg,x,upto,yPos,every2=true){
  svg.append('g').selectAll('text').data(monthStarts(upto).filter((_,i)=>!every2||i%2===0)).join('text').attr('x',p=>x(p[0])).attr('y',yPos).attr('text-anchor','middle').text(p=>p[1]);
}
function drawChart(el,id,sc){
  if(!el) return; el.innerHTML='';
  const scaleFn=sc?sc.fn:null;
  const d=DI[id], m=M[id], s=scaleFn||(v=>v), planOn=state.plan[id]>0;
  const W=400,H=220,mg={l:40,r:14,t:12,b:24};
  const weeks=d3.range(1,END+1);
  const act=weeks.filter(w=>w<=m.t&&m.y[w]!=null).map(w=>[w,s(m.y[w],w)]);
  const last=weeks.filter(w=>m.last[w]!=null).map(w=>[w,s(m.last[w],null)]);
  const fcw=d3.range(m.t,END+1);
  const base=fcw.map(w=>[w,s(w===m.t?m.y[w]:value(id,w,false),w)]);
  const plan=fcw.map(w=>[w,s(w===m.t?m.y[w]:value(id,w,true),w)]);
  const bnd=fcw.map(w=>{const b=w===m.t?[m.y[w],m.y[w],m.y[w],m.y[w]]:band(id,w);return [w,s(b[0],w),s(b[1],w),s(b[2],w),s(b[3],w)];});
  const dataMax=d3.max([...act,...last,...base].map(p=>p[1]));
  const thr=scaleFn?[]:d.thresholds.filter(t=>t.v<=dataMax*1.7);
  let yMax=Math.max(dataMax,d3.max(thr,t=>t.v)||0);
  yMax=Math.max(yMax,Math.min(d3.max(bnd,b=>b[2]),dataMax*1.6))*1.06;
  const dataMin=d3.min([...act,...last,...bnd.map(b=>[b[0],b[1]])].map(p=>p[1]));
  const y0=dataMin>yMax*0.45? Math.floor(dataMin*0.85/500)*500 : 0;
  const x=d3.scaleLinear([1,END],[mg.l,W-mg.r]), y=d3.scaleLinear([y0,yMax],[H-mg.b,mg.t]).nice(4);
  const svg=d3.select(el).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','img')
    .attr('aria-label',`${d.name}: weekly values for ${CUR}, last year, and the 3-month outlook`);
  const cid='clip'+Math.random().toString(36).slice(2);
  svg.append('clipPath').attr('id',cid).append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',H-mg.t-mg.b);
  yGrid(svg,y,4,mg.l,W-mg.r,v=>v>=1000?(v/1000)+'k':v).attr('class','num');
  monthLabels(svg,x,END,H-6);
  // outlook zone
  svg.append('rect').attr('x',x(m.t)).attr('y',mg.t).attr('width',x(END)-x(m.t)).attr('height',H-mg.t-mg.b).attr('fill','var(--surface-2)');
  svg.append('text').attr('x',x(END)-2).attr('y',mg.t+11).attr('text-anchor','end').style('font-weight',600).text('Outlook');
  const g=svg.append('g').attr('clip-path',`url(#${cid})`);
  thr.forEach(t=>{ g.append('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',y(t.v)).attr('y2',y(t.v)).attr('stroke','var(--crit)').attr('stroke-width',1).attr('stroke-dasharray','2 3').attr('opacity',.7);
  }); thr.forEach((t,i)=>{ const below=thr.length>1&&i===0&&Math.abs(y(thr[0].v)-y(thr[1].v))<16;
    svg.append('text').attr('x',mg.l+4).attr('y',below?y(t.v)+12:y(t.v)-4).style('fill','var(--crit)').style('font-size','10.5px').style('paint-order','stroke').style('stroke','var(--surface)').style('stroke-width','3px').style('stroke-linejoin','round').text(`${t.label} · ${fmt(t.v)}`); });
  const line=d3.line().x(p=>x(p[0])).y(p=>y(p[1])).curve(d3.curveMonotoneX);
  g.append('path').datum(bnd).attr('fill','var(--band)').attr('d',d3.area().x(p=>x(p[0])).y0(p=>y(p[1])).y1(p=>y(p[2])).curve(d3.curveMonotoneX));
  g.append('path').datum(bnd).attr('fill','var(--band)').attr('d',d3.area().x(p=>x(p[0])).y0(p=>y(p[3])).y1(p=>y(p[4])).curve(d3.curveMonotoneX));
  g.append('path').datum(last).attr('fill','none').attr('stroke','var(--s-last)').attr('stroke-width',1.5).attr('d',line);
  g.append('path').datum(act).attr('fill','none').attr('stroke','var(--s-actual)').attr('stroke-width',2).attr('d',line);
  g.append('path').datum(base).attr('fill','none').attr('stroke','var(--s-fc)').attr('stroke-width',2).attr('stroke-dasharray','5 3').attr('d',line);
  if(planOn) g.append('path').datum(plan).attr('fill','none').attr('stroke','var(--s-plan)').attr('stroke-width',2.2).attr('d',line);
  // latest marker
  const lt=act[act.length-1];
  svg.append('circle').attr('cx',x(lt[0])).attr('cy',y(lt[1])).attr('r',4).attr('fill','var(--s-actual)').attr('stroke','var(--surface)').attr('stroke-width',2);
  if(state.week!==m.t){ svg.append('line').attr('x1',x(state.week)).attr('x2',x(state.week)).attr('y1',mg.t).attr('y2',H-mg.b).attr('stroke','var(--accent)').attr('stroke-width',1); }
  // hover
  const cross=svg.append('line').attr('y1',mg.t).attr('y2',H-mg.b).attr('stroke','var(--ink-3)').attr('stroke-width',1).style('display','none');
  const tip=d3.select(el).append('div').attr('class','tip').style('display','none');
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',H-mg.t-mg.b).attr('fill','transparent')
   .on('pointermove',ev=>{
     const [px]=d3.pointer(ev); const w=Math.max(1,Math.min(END,Math.round(x.invert(px))));
     cross.attr('x1',x(w)).attr('x2',x(w)).style('display',null);
     const rows=[];
     if(w<=m.t) rows.push(['var(--s-actual)',`${CUR} (illustrative)`,approx(s(m.y[w],w))]);
     else { const b=band(id,w); rows.push(['var(--s-fc)','If nothing changes',`~${approx(s(value(id,w,false),w))}`]); rows.push(['transparent','Most likely',`${approx(s(b[2],w))}–${approx(s(b[3],w))}`]); rows.push(['transparent','Wider range',`${approx(s(b[0],w))}–${approx(s(b[1],w))}`]); if(planOn) rows.push(['var(--s-plan)','With your plan',`~${approx(s(value(id,w,true),w))}`]); }
     if(m.last[w]!=null) rows.push(['var(--s-last)',`${CUR-1}`,approx(s(m.last[w],null))]);
     tip.html(`<div class="t">Week of ${weekRange(w)}</div>${rows.map(r=>`<div class="r"><span><i class="k" style="background:${r[0]}"></i>${r[1]}</span><b>${r[2]}</b></div>`).join('')}<div class="r" style="margin-top:3px"><span>${sc?sc.unit:d.unitShort}</span></div>`);
     const bw=el.clientWidth, fx=x(w)/W*bw; tip.style('display',null).style('left',Math.min(bw-180,Math.max(0,fx+12))+'px').style('top','10px');
   }).on('pointerleave',()=>{cross.style('display','none');tip.style('display','none');});
}
function drawPositivity(el){
  const W=400,H=150,mg={l:34,r:14,t:18,b:22}; const fp=S.flu_positivity?.[CUR]||{}, cp=S.covid_positivity?.[CUR]||{};
  const t=M.flu.t, x=d3.scaleLinear([1,t],[mg.l,W-mg.r]), y=d3.scaleLinear([0,Math.max(50,d3.max(Object.values(fp)))],[H-mg.b,mg.t]);
  const svg=d3.select(el).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','img').attr('aria-label','Flu and COVID-19 test positivity by week');
  svg.append('text').attr('x',mg.l).attr('y',10).style('font-weight',600).style('fill','var(--ink-2)').text('Share of tested samples that were positive, %');
  yGrid(svg,y,4,mg.l,W-mg.r,v=>v+'%');
  monthLabels(svg,x,t,H-6);
  const line=d3.line().x(p=>x(p[0])).y(p=>y(p[1])).curve(d3.curveMonotoneX);
  const f=Object.entries(fp).map(([k,v])=>[+k,v]).sort((a,b)=>a[0]-b[0]), c=Object.entries(cp).map(([k,v])=>[+k,v]).sort((a,b)=>a[0]-b[0]);
  svg.append('path').datum(f).attr('fill','none').attr('stroke','var(--s-fc)').attr('stroke-width',2).attr('d',line);
  svg.append('path').datum(c).attr('fill','none').attr('stroke','var(--s-actual)').attr('stroke-width',2).attr('d',line);
  const lf=f[f.length-1], lc=c[c.length-1];
  svg.append('text').attr('x',x(lf[0])-4).attr('y',y(lf[1])-7).attr('text-anchor','end').style('fill','var(--ink)').style('font-weight',600).text(`Flu ${lf[1]}%`);
  svg.append('text').attr('x',x(lc[0])-4).attr('y',y(lc[1])+(lc[1]<8?-14:-7)).attr('text-anchor','end').style('fill','var(--ink)').style('font-weight',600).text(`COVID-19 ${lc[1]<1?'<1':lc[1]}%`);
}
