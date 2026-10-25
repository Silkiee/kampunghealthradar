/* ===== Kampung Health Radar · turning data into what the page shows =====
   Builds the weekly store, the outlook, area shares and colour levels. */
'use strict';
function recompute(){
  const recs=[...baseRecords];
  const key=r=>`${r.year}|${r.week}|${r.indicator}`;
  const idx=new Map(recs.map((r,i)=>[key(r),i]));
  for(const r of extraRecords){ const k=key(r); if(idx.has(k)) recs[idx.get(k)]=r; else {idx.set(k,recs.length);recs.push(r);} }
  S=buildStore(recs);
  CUR=Math.max(...Object.keys(S.dengue_cases).map(Number));
  NW=weeksInYear(CUR);
  const latestOf=ind=>Math.max(...Object.keys(S[ind]?.[CUR]||{0:0}).map(Number));
  const ref=latestOf('dengue_cases');
  END=Math.min(NW,ref+13);
  PAST_YEARS=0;
  for(const d of DIS){
    const y=S[d.ind]?.[CUR]||{}; const t=latestOf(d.ind);
    const prof=seasonalProfile(S[d.ind],CUR);
    const H=Math.max(0,END-t);
    const fc=H? forecastSeries(y,t,H,prof) : {mean:[],lo:[],hi:[],sigma:[]};
    const W={}; let Wsum=0;
    for(const f of AREAS.features){ const a=f.properties; const w=est(a)?d.weight(a):0; W[a.id]=w; Wsum+=w; }
    M[d.id]={y,t,prof,fc,H,W,Wsum,Wk:{},last:S[d.ind]?.[CUR-1]||{}};
    if(prof) PAST_YEARS=Math.max(PAST_YEARS,prof.years);
  }
  // flu lever acts only on the flu share of respiratory visits
  const fp=S.flu_positivity?.[CUR]||{}; const fpl=fp[Math.max(...Object.keys(fp).map(Number))];
  DI.flu.lever.share=Math.min(0.6,(fpl??30)/100);
  for(const d of DIS) M[d.id].bins=makeBins(d);
  if(state.week==null||state.week>END) state.week=M.dengue.t;
}
function value(id,w,withPlan=true){
  const m=M[id]; if(w<1) return m.last[NW+w]??null;
  if(w<=m.t) return m.y[w]??null;
  const h=w-m.t; const base=m.fc.mean[h-1]; if(base==null) return null;
  return withPlan? base*planFactor(h,state.plan[id]/100,DI[id].lever) : base;
}
function band(id,w){ const m=M[id],h=w-m.t; return h>=1&&h<=m.H? [m.fc.lo[h-1],m.fc.hi[h-1],m.fc.lo50[h-1],m.fc.hi50[h-1]]:null; }
/* Illustrative local hot spots: each area's share of the national figure is its population-and-age weight
   times a made-up local factor for that week (data/area-factors.csv). Factors drift week to week, so local
   clusters rise and fade. National totals are unchanged: shares always add up to 1. */
function fac(id,aid,w){ const r=AF[id]?.[aid]; if(!r||w==null) return 1; return r[Math.min(r.length,Math.max(1,w))-1]; }
function areaShare(id,aid,w){ const m=M[id]; if(!m.Wsum) return 0;
  if(w==null) return m.W[aid]/m.Wsum;
  let sum=m.Wk[w]; if(sum==null){ sum=0; for(const k in m.W) sum+=m.W[k]*fac(id,k,w); m.Wk[w]=sum; }
  return sum? m.W[aid]*fac(id,aid,w)/sum : 0; }
function areaValue(id,a,w,withPlan=true){ const v=value(id,w,withPlan); return v==null? null : v*areaShare(id,a.id,w); }
function areaCount(id,a,w,withPlan=true){ const v=areaValue(id,a,w,withPlan); return v==null?null:v*(DI[id].perDay?7:1); }
function areaRate(id,a,w,withPlan=true){ const v=areaValue(id,a,w,withPlan); return v==null||!a.pop? null : v/a.pop*1e5; }
function nationalRate(id,w,withPlan=true){ const v=value(id,w,withPlan); return v==null?null:v/TOTPOP*1e5; }
function nice(v){ if(v<1) return +v.toPrecision(2); if(v<10) return Math.round(v*10)/10; return Math.round(v); }
/* Map colours compare each area with a typical week for Singapore as a whole:
   the median of the 5-year medians where the data has them, otherwise last year or this year's typical week. */
function typicalLevel(id){
  const u=[]; for(let w=1;w<=END;w++){ const x=usual(id,w); if(x) u.push(x.v); }
  return median(u);
}
function makeBins(d){
  const ref=typicalLevel(d.id)/TOTPOP*1e5;
  return [0.5,0.8,1.2,1.6].map(k=>nice(k*ref));
}
function levelOf(id,rate){ if(rate==null) return -1; const b=M[id].bins; let i=0; while(i<4&&rate>=b[i]) i++; return i; }
function usual(id,w){
  const d=DI[id];
  if(d.medianInd){ const v=S[d.medianInd]?.[CUR]?.[w]; if(v!=null) return {v,label:'usual for this week (5-year median)',phrase:'usual level for this week'}; }
  const past=[]; for(let y=CUR-5;y<CUR;y++){ const v=S[d.ind]?.[y]?.[w]; if(v!=null) past.push(v); }
  if(past.length>=3) return {v:median(past),label:`usual for this week (median of ${past.length} years)`,phrase:'usual level for this week'};
  const lv=M[id].last[w]; if(lv!=null) return {v:lv,label:'same week last year',phrase:'same week last year'};
  const ys=Object.entries(M[id].y).filter(([k])=>+k<=M[id].t).map(([,v])=>v);
  return ys.length? {v:median(ys),label:`typical week so far in ${CUR}`,phrase:`typical week so far this year`}:null;
}
function statusOf(id,w){
  const v=value(id,w), u=usual(id,w); if(v==null||!u) return null;
  const r=v/u.v;
  const base=u.label.startsWith('same week')?'last year':u.label.startsWith('typical')?'typical':'usual';
  const words={usual:['Below usual','About usual','Above usual','Well above usual'],'last year':['Below last year','Like last year','Above last year','Well above last year'],typical:['Below typical','About typical','Above typical','Well above typical']}[base];
  const k=r<0.75?0:r<=1.2?1:r<=1.6?2:3;
  return {r,u,cls:['good','calm','warn','crit'][k],text:words[k],icon:['↓','•','↑','⚠'][k]};
}
function trendOf(id,w){
  const v=k=>value(id,k); if(w<5) return {dir:'steady',pct:0};
  const a=(v(w)+v(w-1))/2,b=(v(w-3)+v(w-4))/2; const r=a/b;
  const pct=v(w-4)? (v(w)/v(w-4)-1)*100:0;
  return {dir:r>1.12?'rising':r<0.89?'falling':'steady',pct,r};
}
