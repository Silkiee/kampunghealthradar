/* ===== Kampung Health Radar · controls =====
   Clicks, search, sliders, the Add data dialog and the update loop. */
'use strict';
function selectArea(id,zoomIn){
  const f=AREAS.features.find(x=>x.properties.id===id); if(!f) return;
  state.area=id; if(zoomIn) zoomTo(f);
  $('#q').value=f.properties.name; $('#q-clear').hidden=false; hideSuggest();
  update(); $('.panel').scrollTop=0;
}
function clearArea(){ state.area=null; $('#q').value=''; $('#q-clear').hidden=true; svg.transition().duration(500).call(zoom.transform,d3.zoomIdentity); update(); }
document.addEventListener('click',ev=>{
  const t=ev.target.closest('[data-dis],[data-area],[data-back],[data-about],[data-close]'); if(!t) return;
  if(t.dataset.dis){ state.disease=t.dataset.dis; update(); }
  else if(t.dataset.area){ selectArea(t.dataset.area,true); }
  else if(t.hasAttribute('data-back')) clearArea();
  else if(t.hasAttribute('data-about')) $('#dlg-about').showModal();
  else if(t.hasAttribute('data-close')) t.closest('dialog').close();
});
document.addEventListener('input',ev=>{
  if(ev.target.id==='plan'){ state.plan[state.disease]=+ev.target.value; updateLight(); }
});
$('#areas-on').addEventListener('change',ev=>{ state.showAreas=ev.target.checked; update(); });
$('#btn-data').onclick=()=>{ renderCoverage(); $('#dlg-data').showModal(); };
document.querySelectorAll('dialog').forEach(dl=>dl.addEventListener('click',ev=>{ if(ev.target===dl) dl.close(); }));

// search
const q=$('#q'), sg=$('#suggest'); let sgIdx=0, sgList=[];
function hideSuggest(){ sg.hidden=true; }
function showSuggest(){
  const s=q.value.trim().toLowerCase(); $('#q-clear').hidden=!s;
  if(!s){ hideSuggest(); return; }
  sgList=AREAS.features.map(f=>f.properties).filter(a=>a.name.toLowerCase().includes(s)).sort((a,b)=>(b.name.toLowerCase().startsWith(s)-a.name.toLowerCase().startsWith(s))||b.pop-a.pop).slice(0,8);
  sgIdx=0;
  sg.innerHTML=sgList.length? sgList.map((a,i)=>`<button type="button" role="option" data-area="${a.id}" class="${i===0?'active':''}"><span>${a.name}</span><small>${a.region}${!est(a)?' · not estimated':''}</small></button>`).join('') : '<div class="muted" style="padding:10px">No planning area matches that name.</div>';
  sg.hidden=false;
}
q.addEventListener('input',showSuggest);
q.addEventListener('keydown',ev=>{
  if(sg.hidden) return;
  if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ ev.preventDefault(); sgIdx=(sgIdx+(ev.key==='ArrowDown'?1:-1)+sgList.length)%sgList.length; sg.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===sgIdx)); }
  else if(ev.key==='Enter'&&sgList[sgIdx]){ ev.preventDefault(); selectArea(sgList[sgIdx].id,true); }
  else if(ev.key==='Escape') hideSuggest();
});
q.addEventListener('blur',()=>setTimeout(hideSuggest,150));
$('#q-clear').onclick=()=>{ clearArea(); q.focus(); };

/* ---------------- data dialog ---------------- */
function renderCoverage(){
  const inds=['dengue_cases','hfmd_daily','ari_daily','flu_positivity','covid_positivity','dengue_hospital'];
  const years=[...new Set(inds.flatMap(i=>Object.keys(S[i]||{})))].map(Number).sort();
  const names={dengue_cases:'Dengue cases (weekly)',hfmd_daily:'HFMD polyclinic visits (daily avg)',ari_daily:'Respiratory polyclinic visits (daily avg)',flu_positivity:'Flu positivity (%)',covid_positivity:'COVID-19 positivity (%)',dengue_hospital:'Dengue hospital admissions'};
  $('#coverage').innerHTML=`<div style="overflow-x:auto"><table class="cov"><thead><tr><th>Indicator</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead><tbody>${inds.map(i=>`<tr><td>${names[i]}</td>${years.map(y=>{const ws=Object.keys(S[i]?.[y]||{}).map(Number);return `<td class="n">${ws.length?`${ws.length} wks`:'–'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
   <p class="muted" style="margin:0">The outlook currently learns seasonal patterns from <b>${PAST_YEARS} past year${PAST_YEARS===1?'':'s'}</b>. More past years give a steadier, more trustworthy outlook.</p>`;
}
$('#copy-tpl').onclick=async()=>{ const txt=$('#tpl').textContent; try{ await navigator.clipboard.writeText(txt); $('#copy-msg').textContent='Copied'; }catch(e){ const r=document.createRange(); r.selectNodeContents($('#tpl')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); $('#copy-msg').textContent='Selected. Press Ctrl+C or ⌘C to copy.'; } };
function ingest(text,name){
  let rows; try{ rows=parseCSV(text); }catch(e){ rows=[]; }
  const msg=$('#upload-msg');
  if(!rows.length||!('year' in rows[0])||!('week' in rows[0])||!('indicator' in rows[0])||!('value' in rows[0])){ msg.innerHTML='<div class="msg err">That file needs the columns year, week, indicator and value. Copy the template above to see the format.</div>'; return; }
  const good=rows.filter(r=>KNOWN_INDICATORS.includes(r.indicator)&&isFinite(+r.year)&&isFinite(+r.week)&&r.value!==''&&isFinite(+r.value));
  const bad=rows.length-good.length;
  if(!good.length){ msg.innerHTML='<div class="msg err">No usable rows found. Check the indicator names against the list above.</div>'; return; }
  extraRecords.push(...good); const before=PAST_YEARS; recompute(); update(); renderCoverage();
  const yrs=[...new Set(good.map(r=>r.year))].sort().join(', ');
  msg.innerHTML=`<div class="msg ok">Added ${good.length} rows from ${esc(name)} (years: ${yrs}).${bad?` Skipped ${bad} rows with unknown indicators or missing values.`:''} ${PAST_YEARS>before?`The outlook now learns from ${PAST_YEARS} past years.`:''}</div>`;
}
function readFile(f){ if(!f) return; const r=new FileReader(); r.onload=()=>ingest(r.result,f.name); r.readAsText(f); }
$('#file').addEventListener('change',ev=>{ readFile(ev.target.files[0]); ev.target.value=''; });
const drop=$('#drop');
['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
drop.addEventListener('drop',ev=>readFile(ev.dataTransfer.files[0]));
$('#reset-data').onclick=()=>{ extraRecords=[]; recompute(); update(); renderCoverage(); $('#upload-msg').innerHTML='<div class="msg ok">Uploaded rows removed. Showing the site\'s data only.</div>'; };

/* ---------------- update loop ---------------- */
function update(){
  $('#l-latest').textContent=`Illustrative data up to week ${M.dengue.t} of ${CUR} (${weekRange(M.dengue.t)} ${CUR})`;
  renderPanel(); renderMap(); renderTimeline();
  if(GUIDE_ON) renderGuide();
}
function updateLight(){ // slider drag: keep focus on the slider, refresh numbers, chart and map only
  const d=DI[state.disease], x=state.plan[d.id];
  const holder=document.querySelector('.plan'); const scale=areaScale(d.id);
  const tmp=document.createElement('div'); tmp.innerHTML=planHTML(scale);
  holder.querySelector('.plan-out').replaceWith(tmp.querySelector('.plan-out'));
  $('#plan-val').textContent=x+'%';
  const leg=document.querySelector('.chart-legend'); const os=$('#outlook-sum'); if(os) os.innerHTML=outlookSummary(d.id,scale);
  if(leg){ const has=leg.textContent.includes('With your plan'); if((x>0)!==has){ const t=document.createElement('div'); t.innerHTML=chartBlockHTML('x'); leg.replaceWith(t.querySelector('.chart-legend')); } }
  drawChart($('#chart'),d.id,scale);
  renderMap(); renderTimeline();
  if(state.area) { const statBig=document.querySelector('.statline .big'); if(statBig&&isFc(state.week)){ const a=RES.find(r=>r.id===state.area); const vv=state.showAreas?areaCount(d.id,a,state.week):value(d.id,state.week); statBig.textContent=(vv<1?'':'~')+cnt(vv); } }
  document.querySelectorAll('.dcard').forEach(b=>{ if(b.dataset.dis===d.id&&isFc(state.week)) b.querySelector('.big').textContent='~'+fmt(value(d.id,state.week)); });
}
let rz; window.addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ fitProj(); areaSel.attr('d',path); drawRegions(); svg.call(zoom.transform,d3.zoomIdentity); renderMap(); renderTimeline(); },150); });
