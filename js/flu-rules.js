/* ===== Kampung Health Radar · flu jab guide logic =====
   Pure functions, no DOM. Rules follow CDA's September 2026 flu vaccination advice,
   the National Adult and Childhood Immunisation Schedules, and CDC advice for travellers. */
'use strict';
const G_DAY=864e5;
function gAddDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function gDay(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function gFmt(d,ref){ return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}${ref&&d.getFullYear()!==ref.getFullYear()?' '+d.getFullYear():''}`; }
function gBy(d){ const x=d.getDate(), M=MONTHS[d.getMonth()]; return x<=10?`by early ${M}`:x<=20?`by mid-${M}`:`by late ${M}`; }

/* data/flu-updates.csv (kind,date,label,value,note,link) -> {nh, sh, peak, prices, updates}
   vaccine_nh / vaccine_sh: value = expected | available; note = text for the vaccine card
   past_peak: value = %;  price_adult / price_child: value = $ per dose;  update: note = summary in plain words */
function parseFluUpdates(text){
  const rows=parseCSV(text);
  const pd=s=>{ const m=/^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s||''); return m? new Date(+m[1],+m[2]-1,+(m[3]||1)) : null; };
  const vax=r=>r&&{label:r.label,date:pd(r.date),available:/^avail/i.test(r.value),note:r.note||'',link:r.link};
  const pk=rows.find(r=>r.kind==='past_peak');
  return {
    nh:vax(rows.find(r=>r.kind==='vaccine_nh')),
    sh:vax(rows.find(r=>r.kind==='vaccine_sh')),
    peak:pk&&{label:pk.label,value:+pk.value,link:pk.link},
    prices:rows.filter(r=>/^price_/.test(r.kind)).map(r=>({group:r.kind.slice(6),label:r.label,value:+r.value,link:r.link})),
    updates:rows.filter(r=>r.kind==='update').map(r=>({date:pd(r.date),title:r.label,text:r.note||r.value,link:r.link})).sort((a,b)=>b.date-a.date)
  };
}

/* Flu right now, from weekly flu positivity {week: %}. Bands are our own: Low <10%, Moderate 10–24%, High 25%+. */
function fluLevel(fp){
  const ws=Object.keys(fp||{}).map(Number).sort((a,b)=>a-b); if(!ws.length) return null;
  const t=ws[ws.length-1], p=fp[t];
  const avg=ks=>{ const v=ks.map(k=>fp[k]).filter(x=>x!=null); return v.length? v.reduce((a,b)=>a+b,0)/v.length : null; };
  const now=avg([t,t-1]), before=avg([t-3,t-4]), d=(now!=null&&before!=null)? now-before : 0;
  const level=p>=25?'High':p>=10?'Moderate':'Low';
  return {t,p,level,dir:d>=3?'rising':d<=-3?'easing':'steady',
    max:Math.max(...ws.map(w=>fp[w])),share:p>=15?`about ${Math.round(p/10)} in 10`:`about 1 in ${Math.max(2,Math.round(100/Math.max(p,1)))}`};
}

/* When flu season usually comes: respiratory polyclinic visits by month, as a share of each year's average.
   Uses every complete past year (40+ weeks), not the current one. */
function seasonCalendar(byYear,curYear,epiStart){
  const years=Object.keys(byYear||{}).map(Number).filter(y=>y<curYear&&Object.keys(byYear[y]).length>=40).sort((a,b)=>a-b);
  const per=Array.from({length:12},()=>[]), peakYears=Array.from({length:12},()=>[]);
  for(const y of years){
    const s=byYear[y], ws=Object.keys(s).map(Number), mean=ws.reduce((a,w)=>a+s[w],0)/ws.length;
    const mon=w=>{ const d=epiStart(y,w); d.setUTCDate(d.getUTCDate()+3); return d.getUTCMonth(); };
    const acc=Array.from({length:12},()=>[]);
    for(const w of ws) acc[mon(w)].push(s[w]/mean);
    acc.forEach((a,m)=>{ if(a.length) per[m].push(a.reduce((x,z)=>x+z,0)/a.length); });
    const pw=ws.reduce((a,w)=>s[w]>s[a]?w:a,ws[0]); peakYears[mon(pw)].push(y);
  }
  const idx=per.map(a=>a.length? a.reduce((x,z)=>x+z,0)/a.length : 1);
  return {years,idx,peakYears,peaks:peakYears.map(a=>a.length)};
}
function yearsText(ys){
  const out=[]; let a=ys[0], b=ys[0];
  for(let i=1;i<=ys.length;i++){ if(ys[i]===b+1){ b=ys[i]; continue; } out.push(a===b?`${a}`:`${a}–${b}`); a=b=ys[i]; }
  return out.length>1? out.slice(0,-1).join(', ')+' and '+out[out.length-1] : out[0]||'';
}

/* Where we are in the flu jab year */
function jabPhase(today,nh){
  const T=gDay(today), m=T.getMonth();
  if(nh&&nh.date){
    const end=new Date(nh.date.getFullYear(),10,30);
    if(!nh.available&&T<=end) return {k:'before',start:nh.date,end};
    if(nh.available&&T<=end&&T>=gAddDays(nh.date,-45)) return {k:'window',start:nh.date,end};
  }
  if(m===11||m<=2) return {k:'peak'};
  return {k:'mid'};
}

const G_WHO={
  me:{s:'you',S:'You',be:'are',pos:'your',Pos:'Your',obj:'you',live:'live',care:'care',need:'need',want:'want'},
  parent:{s:'your parent',S:'Your parent',be:'is',pos:'their',Pos:'Their',obj:'them',live:'lives',care:'cares',need:'needs',want:'wants'},
  child:{s:'your child',S:'Your child',be:'is',pos:'their',Pos:'Their',obj:'them',live:'lives',care:'cares',need:'needs',want:'wants'}
};
const G_AGES={u6m:'under 6 months','6m4':'6 months to 4 years','5to17':'5 to 17','18to64':'18 to 64','65plus':'65 and over'};

/* "Am I due?"
   inp: {who:'me'|'parent'|'child', age:'u6m'|'6m4'|'5to17'|'18to64'|'65plus', risk:'yes'|'no'|'unsure',
         last:'YYYY-MM'|'over'|'never'|'unsure'}
   ctx: {today:Date, nh:{label,date,available}, sh:{label,available}} */
function fluAdvice(inp,ctx){
  const P=G_WHO[inp.who]||G_WHO.me, T=gDay(ctx.today), nh=ctx.nh, sh=ctx.sh;
  const kid=['u6m','6m4','5to17'].includes(inp.age);
  if(inp.age==='u6m') return {tone:'calm',chip:'Too young',title:'Babies under 6 months are too young for a flu jab',
    steps:['Protect your baby by making sure everyone at home has had a flu jab.','A flu jab during pregnancy also helps protect a baby in the first months of life.','See a doctor early if your baby has a fever or is breathing fast.'],
    where:'From 6 months old, at a polyclinic or CHAS GP clinic.',cost:'child',remind:null};

  const rec=inp.age==='65plus'||inp.age==='6m4'||(inp.risk==='yes'&&(inp.age==='18to64'||inp.age==='5to17'));
  const maybe=!rec&&inp.risk==='unsure';
  let lastStart=null,lastEnd=null,lastLabel='';
  const lm=/^(\d{4})-(\d{2})$/.exec(inp.last||'');
  if(lm){ lastStart=new Date(+lm[1],+lm[2]-1,1); lastEnd=new Date(+lm[1],+lm[2],0); if(lastEnd>T) lastEnd=T; lastLabel=`${MONTHS[lastStart.getMonth()]} ${lastStart.getFullYear()}`; }
  const eight=lastEnd? gAddDays(lastEnd,56) : null;
  const shName=sh&&sh.available? `the ${sh.label}` : 'the vaccine in clinics now';

  /* timing for someone in a recommended group */
  function plan(){
    if(nh&&nh.date&&nh.available){
      const nhMonth=new Date(nh.date.getFullYear(),nh.date.getMonth(),1);
      if(lastStart&&lastStart>=nhMonth){
        const next=new Date(lastStart.getFullYear()+1,lastStart.getMonth(),1);
        const same=lastStart.getTime()===nhMonth.getTime();
        return {state:'covered',tone:'good',chip:'Covered',title:`${P.S} ${P.be} covered for this flu season`,
          steps:[`${P.S} had a flu jab in ${lastLabel}, when the new ${nh.label} was in clinics.${same?` If it was before ${gFmt(nh.date,T)}, it was the older vaccine, so get the new one 8 weeks after it.`:''}`,
                 `The next flu jab is usually due about a year later, around ${MONTHS[next.getMonth()]} ${next.getFullYear()}.`],
          remind:{date:next,title:'Check if you are due for a flu jab'}};
      }
      if(!eight||eight<=T) return {state:'due',tone:'crit',chip:'Due now',title:`${P.S} ${P.be} due for a flu jab`,
        steps:[lastStart&&`${P.Pos} last flu jab, in ${lastLabel}, was before the new vaccine arrived.`,`Get the new ${nh.label}. It is in clinics now.`].filter(Boolean),remind:null};
      return {state:'soon',tone:'warn',chip:`Due from ${gFmt(eight,T)}`,title:`Get the new vaccine from ${gFmt(eight,T)}`,
        steps:[`${P.Pos} last flu jab, in ${lastLabel}, was the older vaccine.`,`Get the new ${nh.label} from ${gFmt(eight,T)}, once 8 weeks have passed.`],
        remind:{date:eight,title:'Get the new flu jab'}};
    }
    if(nh&&nh.date){
      if(lastStart&&lastEnd>=gAddDays(T,-183)){
        const late=eight>nh.date, when=late? eight : nh.date;
        return {state:'wait',tone:'calm',chip:'Wait for the new vaccine',title:`Wait for the new vaccine, ${late?'from '+gFmt(eight,T):gBy(nh.date)}`,
          steps:[`${P.S} had a flu jab in ${lastLabel}. CDA advises people who already had ${shName} to wait for the new ${nh.label}.`,
                 late? `It is expected ${gBy(nh.date)}. Get it from ${gFmt(eight,T)}, 8 weeks after the last jab.` : `Get it once it is in clinics, ${gBy(nh.date)}. By then it will be more than 8 weeks since the last jab.`],
          remind:{date:when,title:'Get the new flu jab'}};
      }
      return {state:'due',tone:'crit',chip:'Due now',title:`${P.S} ${P.be} due for a flu jab`,
        steps:[lastStart&&`${P.Pos} last flu jab was in ${lastLabel}, more than 6 months ago.`,
          `Don't wait for the new vaccine. CDA says people in recommended groups who have not had a flu jab can get ${shName} now, and the new ${nh.label} at least 8 weeks later.`,
          `To have just one jab, wait for the new vaccine, expected ${gBy(nh.date)}. With flu high, don't wait longer than that.`].filter(Boolean),
        remind:{date:nh.date,title:'New flu vaccine arrives: book a flu jab'}};
    }
    /* no vaccine news in the data: fall back to the yearly rule */
    if(lastStart&&lastStart>gAddDays(T,-335)) return {state:'covered',tone:'good',chip:'Covered',title:`${P.S} ${P.be} covered for now`,
      steps:[`${P.S} had a flu jab in ${lastLabel}. Most people need one a year.`],remind:{date:new Date(lastStart.getFullYear()+1,lastStart.getMonth(),1),title:'Check if you are due for a flu jab'}};
    return {state:'due',tone:'crit',chip:'Due now',title:`${P.S} ${P.be} due for a flu jab`,steps:['Get the vaccine in clinics now.'],remind:null};
  }

  const p=plan();
  const firstEver=inp.last==='never';
  if(firstEver&&p.state==='due'){
    if(inp.age==='6m4') p.steps.push(`As this is ${P.pos} first flu jab, ${P.s} ${P.need} 2 doses, 4 weeks apart. The clinic will plan the doses.`);
    else if(inp.age==='5to17') p.steps.push('Children under 9 having their first flu jab need 2 doses, 4 weeks apart.');
  }
  if(inp.last==='unsure'){
    p.chip='Check record first'; p.tone='warn'; p.title=`Check ${P.pos} last flu jab first`;
    p.steps=[`Look up ${P.pos} immunisation records in HealthHub. If there is a flu jab in the past year, choose its month above for an exact answer.`,
             `If there is none, ${P.s} ${P.be} due now.`, ...p.steps.filter(s=>!/^(Your|Their) last flu jab/.test(s))];
  }
  const where=kid? 'A polyclinic or CHAS GP clinic. Pharmacies only vaccinate adults.'
    : 'Your Healthier SG clinic if you are enrolled. Otherwise a CHAS GP clinic, polyclinic or participating pharmacy.';

  if(rec) return {...p,where,cost:kid?'child':'adult'};
  if(maybe) return {...p,tone:'warn',chip:'Ask a doctor',title:`${P.S} may be in a recommended group`,
    steps:[`A yearly flu jab is recommended for people with a long-term illness or a weak immune system, pregnant women and people in long-term care. Many of them also get a subsidy.`,
           `Ask a doctor whether this applies to ${P.obj}. If it does:`,...p.steps],where,cost:kid?'child':'adult'};

  /* healthy 5 to 64: optional */
  const timing={covered:`${P.S} ${P.be} already covered for this flu season.`,
    wait:p.steps[1]&&`If ${P.s} ${P.want} a jab, wait for the new vaccine. ${p.steps[1]}`,
    soon:p.steps[1],
    due: nh&&nh.date&&!nh.available? `The best time is when the new vaccine arrives, ${gBy(nh.date)}, and before the end of November.`
       : nh&&nh.available? `The new ${nh.label} is in clinics now.` : 'Any time is fine. Most people who choose to have one get it once a year.'}[p.state];
  return {tone:'calm',chip:'Optional',title:`Optional for ${P.s}, but worth considering`,
    steps:[`The flu jab is not on the national list for healthy people aged ${G_AGES[inp.age]}, but anyone aged 6 months and older can have one.`,
           `It is most worth it if ${P.s} ${P.live} with or ${P.care} for someone at higher risk, such as a baby, an older person or someone with a long-term illness, or before travel.`,
           timing].filter(Boolean),
    where:kid? 'A GP clinic or polyclinic.' : 'A GP clinic, polyclinic or participating pharmacy.',cost:'none',
    remind:p.state==='due'&&nh&&nh.date&&!nh.available? {date:nh.date,title:'New flu vaccine arrives'} : (p.state==='covered'?null:p.remind)};
}

/* "Travelling soon?" */
const G_DEST={
  nasia:{label:'Japan, Korea, China, HK or Taiwan',place:'North Asia',hemi:'N'},
  europe:{label:'Europe or the UK',place:'Europe',hemi:'N'},
  namer:{label:'USA or Canada',place:'North America',hemi:'N'},
  south:{label:'Australia, New Zealand or South Africa',place:'the southern hemisphere',hemi:'S'},
  tropics:{label:'Southeast Asia, India or other tropical places',place:'the tropics',hemi:'T'}
};
function travelAdvice(inp,ctx){
  const T=gDay(ctx.today), nh=ctx.nh, dest=G_DEST[inp.dest]||G_DEST.nasia;
  if(!(inp.date instanceof Date)||isNaN(inp.date)) return {error:'Choose the date you leave.'};
  const D=gDay(inp.date);
  if(D<T) return {error:'That date has passed. Choose the date you leave.'};
  const mo=D.getMonth(), Mn=MONTHS[mo];
  let inSeason=false, season;
  if(dest.hemi==='N'){ inSeason=mo>=9||mo<=3; const peak=mo===11||mo<=1;
    season=inSeason? `${Mn} is flu season in ${dest.place}. It runs from about October to April${peak?' and is usually worst from December to February':''}.`
                   : `${Mn} is outside the main flu season in ${dest.place}, which runs from about October to April. Flu still spreads there, but less.`; }
  else if(dest.hemi==='S'){ inSeason=mo>=3&&mo<=8;
    season=inSeason? `${Mn} is flu season in ${dest.place}, which runs from about April to September.`
                   : `${Mn} is outside the main flu season in ${dest.place}, which runs from about April to September. Flu still spreads there, but less.`; }
  else season=`Flu spreads all year round in ${dest.place}, as it does in Singapore.`;
  const days=Math.round((D-T)/G_DAY), bookBy=gAddDays(D,-14), early=days>=14;
  const steps=[season, early? `A flu jab takes about 2 weeks to work. Getting it by ${gFmt(bookBy,T)} means you are protected when you fly on ${gFmt(D,T)}.`
                             : 'A flu jab takes about 2 weeks to work, so it may not fully protect you at the start of this trip, but it will for the rest of the season.'];
  if(dest.hemi==='N'&&inSeason&&nh&&nh.date){
    const ready=nh.available||(early?bookBy:T)>=nh.date;
    steps.push(ready? `By then, clinics should have the new ${nh.label}, made for this northern winter.`
                    : `The new ${nh.label} is expected ${gBy(nh.date)}. If you need your jab before then, the vaccine in clinics now still helps.`);
  }
  if(inp.crowd) steps.push('Cruises, tour groups, pilgrimages and big events mix people from many countries, so flu spreads more easily.');
  steps.push('A jab before travel matters most for people aged 65 and over, young children, pregnant women and people with a long-term illness.');
  return {tone:dest.hemi==='T'?'calm':inSeason?'warn':'calm',chip:dest.hemi==='T'?'Flu all year there':inSeason?'Flu season there':'Off-season there',
    title:early? `Aim to get your flu jab by ${gFmt(bookBy,T)}` : 'Get your flu jab as soon as you can',steps,
    remind:days>=21? {date:gAddDays(bookBy,-7),title:'Book your flu jab before your trip'} : null};
}

/* Calendar reminder links: Google Calendar URL and an .ics file (Apple, Outlook) */
function gYmd(d){ return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; }
function calLinks(r){
  const d=gDay(r.date), e=gAddDays(d,1);
  const details='Book at vaccine.gov.sg/flu or your Healthier SG clinic. Check your last flu jab in HealthHub (Immunisation records). From Kampung Health Radar.';
  const gcal=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(r.title)}&dates=${gYmd(d)}/${gYmd(e)}&details=${encodeURIComponent(details)}`;
  const esc=s=>s.replace(/[\\;,]/g,m=>'\\'+m);
  const st=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kampung Health Radar//Flu jab guide//EN','BEGIN:VEVENT',
    `UID:flu-${gYmd(d)}-${st}@kampung-health-radar`,`DTSTAMP:${st}`,`DTSTART;VALUE=DATE:${gYmd(d)}`,`DTEND;VALUE=DATE:${gYmd(e)}`,
    `SUMMARY:${esc(r.title)}`,`DESCRIPTION:${esc(details)}`,'BEGIN:VALARM','TRIGGER:PT9H','ACTION:DISPLAY',`DESCRIPTION:${esc(r.title)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  return {gcal,ics:'data:text/calendar;charset=utf-8,'+encodeURIComponent(ics)};
}
