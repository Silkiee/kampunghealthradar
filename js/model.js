/* ===== Kampung Health Radar · data + forecast model =====
   Pure functions, no DOM. Everything re-runs when new data is added,
   so extra past years automatically sharpen the seasonal pattern. */
'use strict';
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const KNOWN_INDICATORS = ['dengue_cases','hfmd_daily','ari_daily','flu_positivity','covid_positivity','dengue_hospital',
  'median5y_dengue_cases','median5y_ari_daily','median5y_hfmd_daily'];

function parseCSV(text){
  const rows=[]; let i=0, field='', row=[], q=false;
  text=text.replace(/\r/g,'');
  while(i<text.length){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else q=false; } else field+=c; }
    else if(c==='"') q=true;
    else if(c===','){ row.push(field); field=''; }
    else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }
    else field+=c;
    i++;
  }
  if(field!==''||row.length){ row.push(field); rows.push(row); }
  const head=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.length>1&&r.some(x=>x.trim()!=='')).map(r=>Object.fromEntries(head.map((h,k)=>[h,(r[k]??'').trim()])));
}

/* MMWR-style epidemiological week: week 1 is the first Sun–Sat week with >= 4 days in January */
function epiWeekStart(year, week){
  const jan1=new Date(Date.UTC(year,0,1)); const dow=jan1.getUTCDay();
  const w1=new Date(jan1); w1.setUTCDate(1-dow + (dow>3?7:0));
  const d=new Date(w1); d.setUTCDate(w1.getUTCDate()+7*(week-1)); return d;
}
function weeksInYear(year){ const a=epiWeekStart(year,1), b=epiWeekStart(year+1,1); return Math.round((b-a)/(7*864e5)); }

/* store[indicator][year][week] = value */
function buildStore(records){
  const S={};
  for(const r of records){
    const ind=r.indicator, y=+r.year, w=+r.week, v=parseFloat(r.value);
    if(!ind||!isFinite(y)||!isFinite(w)||!isFinite(v)) continue;
    ((S[ind]??={})[y]??={})[w]=v;
  }
  // derived: estimated COVID-19 polyclinic visits a day = respiratory visits x COVID-19 positivity
  S.covid_est={};
  for(const y in (S.ari_daily||{})) for(const w in S.ari_daily[y]){
    const p=S.covid_positivity?.[y]?.[w]; if(p==null) continue;
    (S.covid_est[y]??={})[w]=Math.round(S.ari_daily[y][w]*p/100);
  }
  return S;
}

function median(a){ if(!a.length) return null; const s=[...a].sort((x,y)=>x-y), m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; }

/* Seasonal profile from past years: log values, smoothed with a centred 5-week window, averaged across years.
   Returns {fn(w) -> log-shape, years:n} or null when there are no past years. */
function seasonalProfile(byYear, curYear){
  const years=Object.keys(byYear||{}).map(Number).filter(y=>y<curYear);
  const shapes=[];
  for(const y of years){
    const s=byYear[y]; const ws=Object.keys(s).map(Number); if(ws.length<40) continue;
    const n=Math.max(...ws);
    const lg=w=>{ const v=s[w]; return v==null?null:Math.log(Math.max(v,0.5)); };
    const sm={};
    for(let w=1;w<=n;w++){
      let acc=0,c=0; for(let k=-2;k<=2;k++){ let ww=w+k; if(ww<1) ww+=n; if(ww>n) ww-=n; const v=lg(ww); if(v!=null){acc+=v;c++;} }
      if(c) sm[w]=acc/c;
    }
    const mean=Object.values(sm).reduce((a,b)=>a+b,0)/Object.values(sm).length;
    for(const w in sm) sm[w]-=mean;
    shapes.push(sm);
  }
  if(!shapes.length) return null;
  const fn=w=>{ let a=0,c=0; for(const s of shapes){ const v=s[w]??s[Math.min(w,52)]; if(v!=null){a+=v;c++;} } return c?a/c:0; };
  return {fn, years:shapes.length};
}

/* Core forecast from origin t: recent level x seasonal change x damped recent momentum */
function forecastFrom(y, t, H, prof){
  const lv=k=>Math.log(Math.max(y[k]??y[k-1]??0.5,0.5));
  const wts=[0.5,0.3,0.2];
  const L=wts[0]*lv(t)+wts[1]*lv(t-1)+wts[2]*lv(t-2);
  const shrink=prof? prof.years/(prof.years+0.5) : 0;      // 1 past year -> 0.67, 5 years -> 0.91
  const P=w=>prof? shrink*prof.fn(w) : 0;
  const Pref=wts[0]*P(t)+wts[1]*P(t-1)+wts[2]*P(t-2);
  // momentum: slope of seasonally-adjusted log values over the last 6 weeks
  const xs=[],ys=[]; for(let k=t-5;k<=t;k++){ if(y[k]==null) continue; xs.push(k); ys.push(lv(k)-P(k)); }
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length, my=ys.reduce((a,b)=>a+b,0)/ys.length;
  let num=0,den=0; xs.forEach((x,i)=>{num+=(x-mx)*(ys[i]-my);den+=(x-mx)**2;});
  const m=Math.max(-0.12,Math.min(0.12,den?num/den:0));
  const phi=0.82; const out=[]; let ps=0;
  for(let h=1;h<=H;h++){ ps+=phi**h; out.push(Math.exp(L + P(t+h)-Pref + m*ps)); }
  return {mean:out, slope:m};
}

/* Forecast with an uncertainty band calibrated by back-testing on the current year.
   Two parts: (1) how far the underlying level drifted from past forecasts, measured against a
   3-week smoothed level, and (2) ordinary week-to-week noise around that level. */
function forecastSeries(y, t, H, prof){
  const base=forecastFrom(y,t,H,prof);
  const lg=w=>Math.log(Math.max(y[w],0.5));
  const sm=w=>(y[w-1]!=null&&y[w+1]!=null)?(lg(w-1)+lg(w)+lg(w+1))/3:null;
  const nz=[]; for(let w=2;w<t;w++){ const s=sm(w); if(s!=null&&y[w]!=null) nz.push(lg(w)-s); }
  const noise=nz.length? Math.sqrt(nz.reduce((a,b)=>a+b*b,0)/nz.length)*1.22 : 0.15;
  const errs=Array.from({length:H},()=>[]);
  for(let t0=8;t0<t-1;t0++){
    const f=forecastFrom(y,t0,H,prof).mean;
    for(let h=1;h<=H&&t0+h<t;h++){ const s=sm(t0+h); if(s!=null) errs[h-1].push(s-Math.log(f[h-1])); }
  }
  const sig=[]; let lastGood=null;
  for(let h=1;h<=H;h++){
    const e=errs[h-1]; let sl;
    if(e.length>=6){ sl=Math.sqrt(e.reduce((a,b)=>a+b*b,0)/e.length); lastGood=[h,sl]; }
    else sl=lastGood? lastGood[1]*Math.sqrt(h/lastGood[0]) : 0.1*Math.sqrt(h);
    let s=Math.sqrt(sl*sl+noise*noise);
    s=Math.max(s, sig[h-2]??0);
    sig.push(s);
  }
  const z=1.2816; // 80% range
  const z50=0.6745; // 50% range
  return {mean:base.mean, lo:base.mean.map((m,i)=>m*Math.exp(-z*sig[i])), hi:base.mean.map((m,i)=>m*Math.exp(z*sig[i])),
          lo50:base.mean.map((m,i)=>m*Math.exp(-z50*sig[i])), hi50:base.mean.map((m,i)=>m*Math.exp(z50*sig[i])),
          sigma:sig, noise, slope:base.slope, backtests:errs.map(e=>e.length)};
}

/* "What if we act now" — each generation of infection shrinks in proportion to the cut in spread, after a delay.
   floor = share of cases that the action cannot reach (e.g. infections picked up overseas). */
function planFactor(h, x, lever){
  const g=Math.max(0,(h-lever.lag))/lever.gen;
  const f=lever.floor+(1-lever.floor)*Math.pow(1-x,g);
  return 1-(lever.share??1)*(1-f);
}
