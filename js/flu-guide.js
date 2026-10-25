/* ===== Kampung Health Radar · flu jab guide page (#flu-jab) ===== */
'use strict';
let FLU=parseFluUpdates(KHR_DATA.flu.trim());
let GUIDE_ON=false, LEGAL_ON=false, guideInit=false, mapStale=false, grz;
const BASE_TITLE=document.title;
const SYRINGE='<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 1.6l3.8 3.8M12.5 3.5l-7.4 7.4-2.4.3.3-2.4 7.4-7.4M8.6 5.4l2 2M6.8 7.2l1.1 1.1M2.7 13.3l1.5-1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const gToday=()=>new Date();
const gCtx=()=>({today:gToday(),nh:FLU.nh,sh:FLU.sh});
const gLevel=()=>fluLevel(S.flu_positivity?.[CUR]||{});
const NBH='\u2011'; // non-breaking hyphen
const short=d=>{ const x=d.getDate(); return `${x<=10?'Early ':x<=20?'Mid'+NBH:'Late '}${MON[d.getMonth()]}`; };
const lvlColor=L=>L.level==='High'?'var(--crit)':L.level==='Moderate'?'var(--warn)':'var(--good)';
const dirChip=L=>L.dir==='rising'?'<span class="chip crit">▲ Rising</span>':L.dir==='easing'?'<span class="chip good">▼ Easing</span>':'<span class="chip calm">▶ Steady</span>';

function heroCopy(){
  const L=gLevel(), nh=FLU.nh, ph=jabPhase(gToday(),nh);
  const lv=L? `Flu is ${L.level.toLowerCase()}${L.dir==='steady'?'':` and ${L.dir}`}` : 'Flu season';
  if(ph.k==='before') return {L,ph,
    title:`${lv}. The new flu vaccine arrives ${gBy(nh.date)}.`,
    lede:'For most people, the best time for a flu jab is when the new vaccine arrives, until the end of November. If you are 65 or older, have a child aged 6 months to 4 years, or have a long-term illness, and have not had a flu jab recently, you do not need to wait. CDA says you can get the vaccine in clinics now and the new one at least 8 weeks later.',
    best:`${short(nh.date)} to end${NBH}Nov`,bestSub:'When the new vaccine arrives, and at least 2 weeks before the usual December to February peak.',
    card:`${lv}. The new flu vaccine is expected ${gBy(nh.date)}. For most people, the best time for a flu jab is from then until the end of November.`};
  if(ph.k==='window') return {L,ph,
    title:'Now is the best time for your flu jab.',
    lede:`The new ${nh.label} is in clinics. Getting it by the end of November gives it 2 weeks to work before flu usually peaks, between December and February.`,
    best:`Now to end${NBH}Nov`,bestSub:'At least 2 weeks before the usual December to February peak.',
    card:'The new flu vaccine is in clinics. Get it by the end of November, before flu usually peaks.'};
  if(ph.k==='peak') return {L,ph,
    title:`${lv}. If you have not had this season's flu jab, get it now.`,
    lede:'Flu in Singapore usually peaks between December and February. A flu jab takes about 2 weeks to work, so the sooner the better.',
    best:'Now, if you are due',bestSub:'Flu usually peaks between December and February.',
    card:"Flu usually peaks between December and February. If you have not had this season's flu jab, get it now."};
  return {L,ph,title:`${lv}.`,
    lede:'Most people need a flu jab once a year. Check below whether you or your family are due.',
    best:'When you are due',bestSub:'Most people need one flu jab a year.',
    card:'Most people need a flu jab once a year. Check whether you are due.'};
}
function jabCardHTML(){
  const h=heroCopy();
  return `<section class="jabcard" aria-label="Flu jab"><div class="hd">${SYRINGE}<span>Flu jab season</span></div><p>${esc(h.card)}</p><a class="btn primary" href="#flu-jab">Am I due? Open the flu jab guide</a></section>`;
}

function renderGuide(){
  if(!GUIDE_ON) return;
  const h=heroCopy(), L=h.L, nh=FLU.nh;
  $('#g-eyebrow').textContent=L? `Flu jab guide · Singapore · illustrative data, week ${L.t}, ${weekRange(L.t)} ${CUR}` : 'Flu jab guide · Singapore';
  $('#g-title').textContent=h.title;
  $('#g-lede').textContent=h.lede;
  $('#g-tiles').innerHTML=
    (L?`<div class="g-tile"><div class="eyebrow">Flu right now</div><div class="v"><span style="color:${lvlColor(L)}">${L.level}</span>${dirChip(L)}</div><div class="s">${L.share.charAt(0).toUpperCase()+L.share.slice(1)} people tested for flu-like illness had flu (${L.p}%), week of ${weekRange(L.t)}</div></div>`:'')+
    (nh?`<div class="g-tile"><div class="eyebrow">New vaccine</div><div class="v">${nh.available?'In clinics now':`Expected ${gBy(nh.date).replace(/^by (early|mid-|late) ?(\w{3})\w*/,(m,a,b)=>`by ${a.replace('-',NBH)}${a==='mid-'?'':' '}${b}`)}`}</div><div class="s">${esc(nh.label)}${nh.available&&nh.date?`, since ${gFmt(nh.date)}`:''}</div></div>`:'')+
    `<div class="g-tile"><div class="eyebrow">Best time for your jab</div><div class="v">${h.best}</div><div class="s">${h.bestSub}</div></div>`;
  renderNow(L); renderSeason(L); renderVax(); renderWhere(); renderNews();
  if(!guideInit){ initChecker(); initTrip(); guideInit=true; }
  updateChk(); updateTrip();
}

/* Flu right now */
function renderNow(L){
  const fp=S.flu_positivity?.[CUR]||{}, pk=FLU.peak;
  if(!L){ $('#g-now-p').textContent='There is no flu test data for this year yet.'; $('#g-pos').innerHTML=''; return; }
  const p4=fp[L.t-4];
  const adv=L.level==='High'?'Flu is spreading widely. If you are unwell, stay home. If you must go out, wear a mask and avoid crowded places.'
    :L.level==='Moderate'?'Flu is going around. Stay home if you are unwell.':'Flu is quiet for now.';
  $('#g-now-p').innerHTML=`In the week of ${weekRange(L.t)}, ${L.share} people tested for flu-like illness had flu (${L.p}%)${L.p>=L.max?', the highest so far this year.':`. This year's high was ${L.max}%.`}${p4!=null?` Four weeks earlier it was ${p4}%.`:''}${pk?` The last big peak was ${pk.value}% in ${esc(pk.label)}.`:''} <b>${adv}</b>`;
  $('#g-now-cap').textContent=`Share of flu-like illness samples that tested positive for flu, ${CUR}`;
  $('#g-now-note').textContent=CTX.flu_subtypes? `Which flu is going around (illustrative): ${CTX.flu_subtypes}`:'';
  drawGuidePos($('#g-pos'),fp,pk);
}
function guideTip(el){ let t=el.querySelector('.tip'); if(!t){ t=document.createElement('div'); t.className='tip'; t.hidden=true; el.appendChild(t); } return t; }
function placeTip(el,tip,x,y){ const w=el.clientWidth, tw=tip.offsetWidth||180; tip.style.left=Math.max(0,Math.min(w-tw,x+12))+'px'; tip.style.top=Math.max(0,y-10)+'px'; }
function drawGuidePos(el,fp,pk){
  el.innerHTML='';
  const pts=Object.entries(fp).map(([k,v])=>[+k,v]).sort((a,b)=>a[0]-b[0]); if(pts.length<2) return;
  const W=Math.max(280,Math.round(el.clientWidth)), narrow=W<520, H=narrow?210:240, mg={l:36,r:44,t:14,b:26};
  const t=pts[pts.length-1][0], lv=pts[pts.length-1][1];
  const yMax=Math.ceil((Math.max(50,d3.max(pts,p=>p[1]),pk?pk.value:0)+2)/10)*10;
  const x=d3.scaleLinear([1,t],[mg.l,W-mg.r]), y=d3.scaleLinear([0,yMax],[H-mg.b,mg.t]);
  const svg=d3.select(el).append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`).attr('role','img')
    .attr('aria-label',`Weekly flu positivity in ${CUR}, latest ${lv}% in week ${t}`);
  yGrid(svg,y,5,mg.l,W-mg.r,v=>v+'%',4);
  monthLabels(svg,x,t,H-6,narrow);
  const area=d3.area().x(p=>x(p[0])).y0(y(0)).y1(p=>y(p[1])).curve(d3.curveMonotoneX);
  const line=d3.line().x(p=>x(p[0])).y(p=>y(p[1])).curve(d3.curveMonotoneX);
  svg.append('path').datum(pts).attr('d',area).attr('fill','var(--s-fc)').attr('fill-opacity',.12);
  if(pk){
    svg.append('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',y(pk.value)).attr('y2',y(pk.value)).attr('stroke','var(--ink-3)').attr('stroke-dasharray','4 4').attr('stroke-width',1.2);
    svg.append('text').attr('x',mg.l+6).attr('y',y(pk.value)-6).style('fill','var(--ink-2)').style('font-weight',600).text(`${pk.label} peak: ${pk.value}%`);
  }
  svg.append('path').datum(pts).attr('d',line).attr('fill','none').attr('stroke','var(--s-fc)').attr('stroke-width',2.2).attr('stroke-linejoin','round');
  svg.append('circle').attr('cx',x(t)).attr('cy',y(lv)).attr('r',4.5).attr('fill','var(--s-fc)').attr('stroke','var(--surface)').attr('stroke-width',2);
  svg.append('text').attr('x',x(t)+8).attr('y',y(lv)+(pk&&pk.value>=lv&&pk.value-lv<3?12:4)).attr('text-anchor','start').style('fill','var(--ink)').style('font-weight',700).style('font-size','13px').text(`${lv}%`);
  // hover: crosshair and tooltip
  const tip=guideTip(el), cross=svg.append('line').attr('y1',mg.t).attr('y2',H-mg.b).attr('stroke','var(--ink-3)').attr('stroke-width',1).style('display','none');
  const dot=svg.append('circle').attr('r',4).attr('fill','var(--s-fc)').attr('stroke','var(--surface)').attr('stroke-width',2).style('display','none');
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',H-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',ev=>{ const [mx]=d3.pointer(ev); const w=Math.max(1,Math.min(t,Math.round(x.invert(mx)))); const p=pts.find(q=>q[0]===w); if(!p) return;
      cross.style('display',null).attr('x1',x(w)).attr('x2',x(w)); dot.style('display',null).attr('cx',x(w)).attr('cy',y(p[1]));
      tip.innerHTML=`<div class="t">Week ${w} · ${weekRange(w)}</div><div class="r"><span>Tested positive for flu</span><b>${p[1]}%</b></div>`; tip.hidden=false; placeTip(el,tip,x(w),y(p[1])); })
    .on('pointerleave',()=>{ cross.style('display','none'); dot.style('display','none'); tip.hidden=true; });
}

/* When flu season usually comes */
function renderSeason(L){
  const cal=seasonCalendar(S.ari_daily,CUR,epiWeekStart), n=cal.years.length;
  if(!n){ $('#g-season-p').textContent='Add past years of data to see the usual flu season pattern.'; $('#g-strip').innerHTML=''; return; }
  const winter=cal.peaks[11]+cal.peaks[0]+cal.peaks[1];
  const others=[...new Set(cal.peakYears.map((ys,m)=>ys.length&&![11,0,1].includes(m)?MONTHS[m]:null).filter(Boolean))];
  const late=L&&L.p>=L.max&&L.t>=31? ` This year the mid-year season has run late: flu is still at its highest in ${monthOf(L.t)}.`:'';
  $('#g-season-p').innerHTML=`CDA says flu in Singapore usually peaks twice a year, from May to August and from December to March. The illustrative polyclinic visits show the year-end peak is usually the bigger one: in <b>${winter} of the ${n} years</b> we looked at (${yearsText(cal.years)}), the busiest week for coughs, colds and flu fell between December and February.${others.length&&n>winter?` In the other ${n-winter}, it came in ${others.join(' or ')}.`:''}${late} A flu jab takes about 2 weeks to work, so getting it by the end of November means you are protected before the usual peak.`;
  const ph=jabPhase(gToday(),FLU.nh), win=(ph.k==='before'||ph.k==='window')? ph : null;
  drawSeason($('#g-strip'),cal,win);
  $('#g-strip-leg').innerHTML=`${['Quieter (3% or more below average)','About average','Busier (3 to 8% above)','Busiest (8% or more above)'].map((l,i)=>`<span><i class="sw-b" style="background:var(--heat-${i+1})"></i>${l}</span>`).join('')}<span><i class="dot-k"></i> Busiest week of one year</span><span><i class="today-k"></i> Today</span>${win?'<span><i class="win-k"></i> Best time for your jab</span>':''}`;
  $('#g-season-table').innerHTML=`<div style="overflow-x:auto"><table class="kv"><tbody><tr><td><b>Month</b></td><td><b>Visits vs yearly average</b></td><td><b>Busiest week in</b></td></tr>${cal.idx.map((v,m)=>`<tr><td>${MONTHS[m]}</td><td>${gPct(v)}</td><td>${cal.peakYears[m].join(', ')||'–'}</td></tr>`).join('')}</tbody></table></div><div class="muted">Average daily polyclinic visits for acute respiratory infections each month, compared with that year's average, for ${yearsText(cal.years)}.</div>`;
}
const gPct=v=>{ const r=Math.round((v-1)*100); return r===0?'0%':`${r>0?'+':'−'}${Math.abs(r)}%`; };
/* month colour bands, compared with the yearly average */
const seasonBand=v=>v<0.97?0:v<1.03?1:v<1.08?2:3;
function drawSeason(el,cal,win){
  el.innerHTML='';
  const W=Math.max(280,Math.round(el.clientWidth)), narrow=W<560, top=narrow?14:30, ch=narrow?40:50, cw=W/12;
  const BAND=['var(--heat-1)','var(--heat-2)','var(--heat-3)','var(--heat-4)'];
  const sp=narrow?6:8, r=narrow?2.3:3, perRow=Math.max(1,Math.floor((cw-6)/sp));
  const rows=Math.max(1,...cal.peaks.map(k=>Math.ceil(k/perRow))), dotsY=top+ch+28, H=dotsY+(rows-1)*sp+r+4;
  const N=cal.years.length, pct=gPct;
  const svg=d3.select(el).append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`).attr('role','img')
    .attr('aria-label',`Busiest months for coughs, colds and flu: ${cal.idx.map((v,m)=>`${MON[m]} ${pct(v)}`).join(', ')}`);
  const xd=d=>{ const dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); return (d.getMonth()+(d.getDate()-1)/dim)*cw; };
  const tip=guideTip(el);
  const show=(m,cx)=>{ tip.innerHTML=`<div class="t">${MONTHS[m]}</div><div class="r"><span>Visits vs yearly average</span><b>${pct(cal.idx[m])}</b></div><div class="r"><span>Busiest week of the year</span><b>${cal.peaks[m]} of ${N} years</b></div>${cal.peakYears[m].length?`<div class="r"><span>${cal.peakYears[m].join(', ')}</span></div>`:''}`; tip.hidden=false; placeTip(el,tip,cx,top+ch+6); };
  const g=svg.selectAll('g.cell').data(d3.range(12)).join('g').attr('class','cell').attr('tabindex',0).attr('role','img')
    .attr('aria-label',m=>`${MONTHS[m]}: visits ${pct(cal.idx[m])} against the yearly average; busiest week in ${cal.peaks[m]} of ${N} years`)
    .on('pointerenter focus',(ev,m)=>show(m,m*cw+cw/2)).on('pointerleave blur',()=>{ tip.hidden=true; });
  g.append('rect').attr('x',m=>m*cw+1).attr('y',top).attr('width',cw-2).attr('height',ch).attr('rx',4).attr('fill',m=>BAND[seasonBand(cal.idx[m])]);
  if(!narrow) g.append('text').attr('x',m=>m*cw+cw/2).attr('y',top+ch/2+4).attr('text-anchor','middle').style('font-weight',700).style('font-size','12px')
    .style('fill',m=>seasonBand(cal.idx[m])>=3?'var(--surface)':'var(--ink)').text(m=>pct(cal.idx[m]));
  svg.append('g').selectAll('text').data(MON).join('text').attr('x',(s,m)=>m*cw+cw/2).attr('y',top+ch+16).attr('text-anchor','middle')
    .style('font-size',narrow?'11px':'12px').style('font-weight',600).style('fill','var(--ink-2)').text(s=>narrow?s.slice(0,1):s);
  const dots=[]; cal.peaks.forEach((k,m)=>{ for(let i=0;i<k;i++){ const inRow=Math.min(k-Math.floor(i/perRow)*perRow,perRow), col=i%perRow; dots.push([m*cw+cw/2+(col-(inRow-1)/2)*sp, dotsY+Math.floor(i/perRow)*sp]); } });
  svg.append('g').selectAll('circle').data(dots).join('circle').attr('cx',d=>d[0]).attr('cy',d=>d[1]).attr('r',r).attr('fill','var(--ink-2)');
  let lab=null;
  if(win){
    const x1=xd(win.start), x2=xd(win.end)+cw/30;
    svg.append('path').attr('d',`M${x1},${top-3}V${top-9}H${x2}V${top-3}`).attr('fill','none').attr('stroke','var(--s-plan)').attr('stroke-width',2).attr('stroke-linejoin','round');
    if(!narrow){ const cx=Math.max(78,Math.min(W-78,(x1+x2)/2)); lab=[cx-76,cx+76];
      svg.append('text').attr('x',cx).attr('y',top-14).attr('text-anchor','middle').style('fill','var(--ink)').style('font-weight',700).text('Best time for your jab'); }
  }
  const tx=xd(gToday());
  svg.append('line').attr('x1',tx).attr('x2',tx).attr('y1',top-4).attr('y2',top+ch+4).attr('stroke','var(--ink)').attr('stroke-width',2).attr('stroke-linecap','round');
  if(!narrow&&(!lab||tx-6<lab[0]||tx-48>lab[1])) svg.append('text').attr('x',tx-6).attr('y',top-14).attr('text-anchor','end').style('fill','var(--ink)').style('font-weight',700).text('Today');
}

/* Which vaccine, and when */
function renderVax(){
  const nh=FLU.nh, sh=FLU.sh, T=gToday();
  const card=(v,cls,chip,txt)=>`<div class="g-card"><span class="chip ${cls}" style="align-self:flex-start">${chip}</span><h4>${esc(v.label)}</h4><p>${esc(txt)}</p></div>`;
  let h='';
  if(sh) h+=card(sh,sh.available?'good':'calm',sh.available?'In clinics now':'Not in clinics',sh.note||'Made for the southern hemisphere winter, which lines up with Singapore\'s mid-year flu season.');
  if(nh) h+=card(nh,nh.available?'good':'fc',nh.available?`In clinics${nh.date?' since '+gFmt(nh.date,T):''}`:`Expected ${gBy(nh.date)}`,nh.note||'Made for the northern hemisphere winter, which lines up with Singapore\'s year-end flu season.');
  $('#g-vax').innerHTML=h;
  const before=nh&&!nh.available;
  const rules=[
    before? ['In a recommended group, and no flu jab recently?','Don\'t wait. Get the vaccine in clinics now, and the new one at least 8 weeks later.'] : ['In a recommended group?','Get the newest vaccine if you have not had it yet.'],
    ['Already had the Southern Hemisphere vaccine this year?', before? 'Wait for the new vaccine, and leave at least 8 weeks between the two jabs.' : 'Get the new vaccine once 8 weeks have passed since that jab.'],
    ['Child under 9 having a first flu jab?','2 doses, 4 weeks apart. After that, one dose a year.'],
    ['Who is it recommended for?','People aged 65 and over, children aged 6 months to 4 years, people with a long-term illness or a weak immune system, pregnant women, and people in long-term care. Anyone aged 6 months and older can have one.']];
  $('#g-rules').innerHTML=rules.map(r=>`<li><b>${r[0]}</b><span>${r[1]}</span></li>`).join('');
}

/* Where to get it, and what it costs */
const price=p=>p.value===0?'Free':'$'+p.value;
function renderWhere(){
  $('#g-prices').innerHTML=FLU.prices.map(p=>`<tr><td>${esc(p.label)}</td><td>${price(p)}</td></tr>`).join('');
  $('#g-price-note').innerHTML='Adult subsidies are for Singapore Citizens aged 65 and over, or aged 18 to 64 with certain medical conditions. At polyclinics, Pioneer Generation seniors get an extra 50% off and Merdeka Generation seniors an extra 25% off. Healthy adults pay the clinic\'s or pharmacy\'s own price. <a href="https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/healthier-sg-vaccinations" target="_blank" rel="noopener">MOH subsidy details</a>';
}

/* Latest from CDA */
function renderNews(){
  const fd=d=>d? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`:'';
  $('#g-updates').innerHTML=FLU.updates.length? FLU.updates.map(u=>`<article><div class="eyebrow">${fd(u.date)} · CDA</div><h4><a href="${esc(u.link)}" target="_blank" rel="noopener">${esc(u.title)}</a></h4><p>${esc(u.text)}</p></article>`).join('') : '<p class="g-p">No updates yet.</p>';
}

/* "Am I due?" form */
const AGE_OPTS={me:[['18to64','18 to 64'],['65plus','65 and over'],['5to17','Under 18']],
  parent:[['18to64','Under 65'],['65plus','65 and over']],
  child:[['u6m','Under 6 months'],['6m4','6 months to 4 years'],['5to17','5 to 17 years']]};
const AGE_DEF={me:'18to64',parent:'65plus',child:'6m4'};
function renderAgeSeg(who,keep){
  const opts=AGE_OPTS[who], val=opts.some(o=>o[0]===keep)? keep : AGE_DEF[who];
  $('#age-seg').innerHTML=opts.map(([v,l])=>`<label><input type="radio" name="age" value="${v}" id="age-${v}"${v===val?' checked':''}><span>${l}</span></label>`).join('');
  $('#age-q').textContent={me:'How old are you?',parent:'How old are they?',child:'How old is your child?'}[who];
}
function initChecker(){
  renderAgeSeg('parent','65plus');
  const T=gToday(), o=[];
  for(let i=0;i<=12;i++){ const d=new Date(T.getFullYear(),T.getMonth()-i,1), v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    o.push(`<option value="${v}">${i===0?`This month (${MONTHS[d.getMonth()]} ${d.getFullYear()})`:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`}</option>`); }
  o.push('<option value="over" selected>More than a year ago</option>','<option value="never">Never had one</option>','<option value="unsure">Not sure</option>');
  $('#last').innerHTML=o.join('');
  $('#chk-form').addEventListener('change',ev=>{ if(ev.target.name==='who') renderAgeSeg(ev.target.value,$('#chk-form').elements.age.value); $('#chk-ex').hidden=true; updateChk(); });
  $('#chk-form').addEventListener('submit',ev=>ev.preventDefault());
}
function remindHTML(rem){
  const T=gToday(); if(!rem||!rem.date||rem.date<=T) return '';
  const c=calLinks(rem);
  return `<div class="remind"><b>Remind me on ${gFmt(rem.date,T)}</b><div class="acts"><a class="btn ext" href="${c.gcal}" target="_blank" rel="noopener">Google Calendar </a><a class="btn" href="${c.ics}" download="flu-jab-reminder.ics">Apple or Outlook calendar</a></div></div>`;
}
function costHTML(kind){
  if(kind==='none') return 'Not subsidised. Clinics and pharmacies set their own price.';
  const ps=FLU.prices.filter(p=>p.group===kind); if(!ps.length) return '';
  const free=ps.filter(p=>p.value===0), paid=ps.filter(p=>p.value>0).map(p=>p.value);
  const parts=[...free.map(p=>`Free for ${esc(p.label.charAt(0).toLowerCase()+p.label.slice(1)).replace(/^(healthier|pioneer|merdeka|singapore|chas)/i,m=>m.charAt(0).toUpperCase()+m.slice(1))}.`)];
  if(paid.length) parts.push(`Otherwise $${Math.min(...paid)}${paid.length>1?` to $${Math.max(...paid)}`:''} a dose at CHAS GP clinics, depending on your card.`);
  return parts.join(' ')+` <button type="button" class="linkbtn" data-jump="g-where">See prices</button>`;
}
function updateChk(){
  const f=$('#chk-form').elements, who=f.who.value, age=f.age.value, risk=f.risk.value, last=$('#last').value;
  $('#risk-q').hidden=['u6m','6m4','65plus'].includes(age);
  $('#last-q').hidden=age==='u6m';
  $('#risk-legend').textContent={me:'Do any of these apply to you?',parent:'Do any of these apply to them?',child:'Does your child have any of these?'}[who];
  $('#risk-hint').textContent=who==='child'? 'A long-term illness such as asthma, diabetes, or heart, lung or kidney disease. A weak immune system. Long-term aspirin treatment.'
    : 'A long-term illness such as diabetes, asthma, or heart, lung, kidney or liver disease. A weak immune system. Pregnancy. Long-term care at home or in a nursing home.';
  $('#last-label').textContent=who==='me'?'When was your last flu jab?':'When was their last flu jab?';
  const a=fluAdvice({who,age,risk,last},gCtx());
  const book=!['Too young','Covered'].includes(a.chip);
  const cost=costHTML(a.cost);
  $('#chk-out').innerHTML=`<div class="res"><span class="chip ${a.tone}">${esc(a.chip)}</span><h4>${esc(a.title)}</h4>
    <ul>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
    <dl><div><dt>Where</dt><dd>${esc(a.where)}</dd></div>${cost?`<div><dt>Cost</dt><dd>${cost}</dd></div>`:''}</dl>
    ${book?'<div class="acts"><a class="btn primary ext" href="https://vaccine.gov.sg/flu" target="_blank" rel="noopener">Book a flu jab </a><button class="btn" type="button" data-jump="g-record">Check the record in HealthHub</button></div>':''}
    ${remindHTML(a.remind)}</div>`;
}

/* "Travelling soon?" form */
function initTrip(){
  const T=gToday(), iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('#trip-dest').innerHTML=Object.entries(G_DEST).map(([k,d])=>`<option value="${k}">${d.label}</option>`).join('');
  const dec=new Date(T.getFullYear(),11,12), ex=T<new Date(T.getFullYear(),10,20)? dec : new Date(T.getFullYear(),T.getMonth(),T.getDate()+60);
  $('#trip-date').value=iso(ex); $('#trip-date').min=iso(T);
  const f=$('#trip-form'); ['change','input'].forEach(e=>f.addEventListener(e,()=>{ $('#trip-ex').hidden=true; updateTrip(); }));
  f.addEventListener('submit',ev=>ev.preventDefault());
}
function updateTrip(){
  const v=$('#trip-date').value, m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const a=travelAdvice({dest:$('#trip-dest').value,date:m?new Date(+m[1],+m[2]-1,+m[3]):null,crowd:$('#trip-crowd').checked},gCtx());
  if(a.error){ $('#trip-out').innerHTML=`<div class="err">${esc(a.error)}</div>`; return; }
  $('#trip-out').innerHTML=`<div class="res"><span class="chip ${a.tone}">${esc(a.chip)}</span><h4>${esc(a.title)}</h4>
    <ul>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
    <div class="acts"><a class="btn primary ext" href="https://vaccine.gov.sg/flu" target="_blank" rel="noopener">Book a flu jab </a><button class="btn" type="button" data-jump="g-check">Check if my last jab still counts</button></div>
    ${remindHTML(a.remind)}</div>`;
}
