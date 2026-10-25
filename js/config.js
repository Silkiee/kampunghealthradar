/* ===== Kampung Health Radar · settings and data hookup =====
   Disease definitions, map levels, the page state, and the data loaded by main.js. */
'use strict';
const $=s=>document.querySelector(s);
const CTX=KHR_DATA.context;
const AREAS=KHR_DATA.areas;
let baseRecords=parseCSV(KHR_DATA.weekly.trim());
let extraRecords=[];
/* data/area-factors.csv (disease,area,w1,w2,...): made-up local factors per planning area and week, see areaShare() */
function parseAreaFactors(t){ const out={}; for(const line of t.trim().split(/\r?\n/).slice(1)){ const c=line.split(','); if(c.length<3) continue; (out[c[0]]??={})[c[1]]=c.slice(2).map(Number); } return out; }
let AF=parseAreaFactors(KHR_DATA.areaFactors);

/* ---------------- configuration ---------------- */
const LEVELS=['Very low','Low','Moderate','High','Very high'];
const HEAT=['var(--heat-1)','var(--heat-2)','var(--heat-3)','var(--heat-4)','var(--heat-5)'];
const REGF={'East':1.3,'North-East':1.15,'Central':1.0,'North':0.9,'West':0.85};
/* Areas left out of the estimates: island groups with almost no residents. All other areas get figures;
   areas marked madeup:true have made-up resident numbers. */
const NO_EST=new Set(['WI','NE']);
const est=a=>!NO_EST.has(a.id);
const MON=MONTHS.map(m=>m.slice(0,3));
const RES=AREAS.features.filter(f=>est(f.properties)).map(f=>f.properties);
const TOTPOP=RES.reduce((a,p)=>a+p.pop,0);
const KID=RES.reduce((a,p)=>a+p.pop*p.kid,0)/TOTPOP;
const SEN=RES.reduce((a,p)=>a+p.pop*p.sen,0)/TOTPOP;
const tick='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor" opacity=".14"/><path d="M4.8 8.2l2.1 2.1 4.3-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DIS=[
 {id:'dengue',name:'Dengue',ind:'dengue_cases',perDay:false,
  cardUnit:'cases this week',unitLong:'dengue cases a week',unitShort:'cases a week',areaUnit:'cases this week',
  rateUnit:'weekly cases per 100,000 residents',rateShort:'per 100k a week',
  medianInd:'median5y_dengue_cases',
  thresholds:[{v:298,label:'Alert line'},{v:442,label:'Epidemic line'}],
  thresholdNote:'The alert and epidemic lines are our own illustrative lines: 1 and 2 standard deviations above the average week in 2016 to 2025 of this data.',
  lever:{text:'Cut mosquito breeding by',hint:'For example: more homes clearing stagnant water every week, more inspections, and faster action at dengue clusters.',lag:2,gen:2.5,floor:0.15,max:60,def:30},
  avoidedWord:'fewer dengue cases',
  blurb:'Spread by Aedes mosquitoes that breed in clean, stagnant water around homes.',
  weight:a=>a.pop*REGF[a.region]*(a.landed?1.2:1),
  why:a=>{const r=[];if(REGF[a.region]>1)r.push(`${a.region==='East'?'eastern':'north-eastern'} estates have historically seen more dengue clusters`);if(a.landed)r.push('it has many landed homes with gardens, where mosquitoes breed more easily');if(REGF[a.region]<1)r.push(`${a.region.toLowerCase()} estates have historically seen fewer dengue clusters`);return r;},
  actions:['Check for stagnant water at home every week: flowerpot plates, pails, roof gutters and drains.','Use insect repellent, especially in the early morning and late afternoon when Aedes mosquitoes bite.','See a doctor early if you have a sudden high fever with headache, eye pain, or joint and muscle pain.','If you have dengue, rest, drink plenty of fluids, and avoid aspirin and ibuprofen unless a doctor says otherwise.']},
 {id:'hfmd',name:'HFMD',longName:'Hand, foot and mouth disease',ind:'hfmd_daily',perDay:true,
  cardUnit:'polyclinic visits a day',unitLong:'polyclinic visits a day for HFMD',unitShort:'visits a day',areaUnit:'polyclinic visits a week',
  rateUnit:'daily polyclinic visits per 100,000 residents',rateShort:'per 100k a day',
  medianInd:'median5y_hfmd_daily',thresholds:[],
  lever:{text:'Cut spread in childcare centres and schools by',hint:'For example: handwashing routines, daily health checks at the gate, cleaning toys, and keeping sick children at home.',lag:1,gen:1.5,floor:0.15,max:50,def:25},
  avoidedWord:'fewer polyclinic visits',
  blurb:'A common viral infection in young children, spread through saliva, blister fluid and stools.',
  weight:a=>a.pop*Math.pow(a.kid/KID,1.3),
  why:a=>a.kid/KID>1.15?[`it has many young children (about ${a.kid}% of residents are under 10, against ${KID.toFixed(0)}% nationally), and HFMD mostly affects young children`]:a.kid/KID<0.85?[`it has fewer young children than most areas (about ${a.kid}% under 10), and HFMD mostly affects young children`]:[],
  actions:['Wash hands with soap before meals and after changing diapers or using the toilet.','Keep a sick child at home until the blisters have dried and the doctor says they can go back.','Clean toys, door handles and shared surfaces often.','See a doctor if your child has a fever with mouth ulcers, or a rash on the hands and feet.']},
 {id:'flu',name:'Flu & colds',longName:'Flu and respiratory infections',ind:'ari_daily',perDay:true,
  cardUnit:'polyclinic visits a day',unitLong:'polyclinic visits a day for coughs, colds and flu',unitShort:'visits a day',areaUnit:'polyclinic visits a week',
  rateUnit:'daily polyclinic visits per 100,000 residents',rateShort:'per 100k a day',
  medianInd:'median5y_ari_daily',
  thresholds:[{v:2689,label:'Busy'},{v:2840,label:'Very busy'}],
  thresholdNote:'"Busy" and "very busy" are our own illustrative lines: the 70th and 90th percentile weeks of 2021 to 2025 in this data.',
  lever:{text:'Cut flu spread by',hint:'For example: more flu vaccinations, masks when unwell, and staying home when sick. Applies only to the flu share of respiratory illness.',lag:1,gen:1.5,floor:0.15,max:50,def:25},
  avoidedWord:'fewer polyclinic visits',
  blurb:'People seen at polyclinics with coughs, colds, sore throats and flu.',
  weight:a=>a.pop*(0.55+0.25*a.kid/KID+0.20*a.sen/SEN),
  why:a=>{const r=[];if(a.sen/SEN>1.15)r.push(`it has more older residents (about ${a.sen}% aged 65+, against ${SEN.toFixed(0)}% nationally), who visit polyclinics more often`);if(a.kid/KID>1.2)r.push('it has many young children, who catch respiratory infections often');if(!r.length&&a.sen/SEN<0.85&&a.kid/KID<1)r.push('it has a younger adult population, who visit polyclinics less often');return r;},
  actions:['Get your yearly flu jab, especially if you are 65 or older, pregnant, or have a long-term illness.','Stay home when unwell, and wear a mask if you must go out.','Cover coughs and sneezes, and wash your hands often.','Seek care early if you are breathless, or if a fever lasts more than 3 days.']},
 {id:'covid',name:'COVID-19',ind:'covid_est',perDay:true,
  cardUnit:'est. clinic visits a day',unitLong:'estimated COVID-19 polyclinic visits a day',unitShort:'est. visits a day',areaUnit:'est. clinic visits a week',
  rateUnit:'estimated daily visits per 100,000 residents',rateShort:'per 100k a day',
  medianInd:null,thresholds:[],
  lever:{text:'Cut COVID-19 spread by',hint:'For example: staying home when sick, masks in crowded places, and keeping vaccinations up to date for those at higher risk.',lag:1,gen:1.5,floor:0.15,max:50,def:25},
  avoidedWord:'fewer clinic visits (est.)',
  blurb:'Estimated from the share of respiratory samples that test positive for COVID-19.',
  weight:a=>a.pop*(0.6+0.4*a.sen/SEN),
  why:a=>a.sen/SEN>1.15?[`it has more older residents (about ${a.sen}% aged 65+), who are more likely to need care`]:a.sen/SEN<0.8?['it has a younger population, who are less likely to need care']:[],
  actions:['Keep COVID-19 vaccinations up to date if you are at higher risk, following current national advice.','Test with an ART if you have symptoms, and stay home if you are unwell.','Wear a mask in crowded places, and when visiting older or vulnerable people.','Seek medical care if you have difficulty breathing or symptoms get worse.']}
];
const DI=Object.fromEntries(DIS.map(d=>[d.id,d]));

/* ---------------- state ---------------- */
const state={disease:'dengue',week:null,area:null,plan:{},showAreas:true};
DIS.forEach(d=>state.plan[d.id]=d.lever.def);
let S,CUR,END,NW,M={},PAST_YEARS=0;
