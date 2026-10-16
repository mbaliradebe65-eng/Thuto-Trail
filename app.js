const $=s=>document.querySelector(s),KEY='thuto.v1';
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{consent:null,marks:{},mt:'maths',checks:{},dates:{},moods:[],id:crypto.randomUUID()};
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const R=n=>'R'+Math.round(n).toLocaleString('en-ZA');
const cfg=window.THUTO_CONFIG||{};
const sb=cfg.SUPABASE_URL&&window.supabase?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const feed=[],bc=new BroadcastChannel('thuto');let tab='find',sim=null;

// ---- real-time layer: anonymous events only, never personal data ----
function pushFeed(e){feed.unshift({...e,at:e.at||e.created_at});feed.length=Math.min(feed.length,40);if(tab==='partner')render()}
async function emit(type,meta={}){
  if(!S.consent)return;
  const e={type,meta,device:S.id.slice(0,8),at:new Date().toISOString()};
  if(sb){const{error}=await sb.from('events').insert({type,meta,device:e.device});if(error)console.warn(error)}
  else{pushFeed(e);bc.postMessage(e)}
}
bc.onmessage=m=>pushFeed(m.data);
if(sb)sb.channel('ev').on('postgres_changes',{event:'INSERT',schema:'public',table:'events'},p=>pushFeed(p.new)).subscribe();

// ---- data ----
const pts=m=>m>=80?7:m>=70?6:m>=60?5:m>=50?4:m>=40?3:m>=30?2:1;
const SUBJ=[['hl','Home language'],['fal','First additional language'],['maths','Mathematics / Maths Literacy'],['s4','Subject 4'],['s5','Subject 5'],['s6','Subject 6']];
// ILLUSTRATIVE requirements: always confirm in the institution's prospectus.
const COURSES=[
{n:'BCom Accounting',aps:32,m:60,f:'NSFAS, corporate bursaries'},
{n:'BSc Computer Science',aps:34,m:60,f:'NSFAS, tech-sector bursaries'},
{n:'BEd Foundation Phase',aps:26,m:0,f:'Funza Lushaka, NSFAS'},
{n:'BA Social Work',aps:28,m:0,f:'NSFAS, provincial bursaries'},
{n:'Diploma in Information Technology',aps:24,m:0,f:'NSFAS'},
{n:'NC(V) Business Studies (TVET)',aps:0,m:0,f:'NSFAS TVET bursary'}];
const DOCS=['Certified ID copy','Grade 11 / matric results','Parent or guardian ID','Proof of household income','Signed NSFAS consent form','Proof of residence'];
const FUND=[['tui','Tuition per year'],['acc','Accommodation per year'],['boo','Books and equipment per year'],['tra','Transport per year'],['foo','Food per year']];

const V={
find:()=>`<h2>Find your trail</h2><p class=m>Enter your latest marks (%). Life Orientation is not counted in APS.</p>
${SUBJ.map(([k,n])=>`<label>${n}<input type=number min=0 max=100 data-m=${k} value="${S.marks[k]??''}"></label>`).join('')}
<label>Maths type<select id=mt><option value=maths ${S.mt=='maths'?'selected':''}>Mathematics</option><option value=lit ${S.mt=='lit'?'selected':''}>Maths Literacy</option></select></label>
<button class=p data-act=calc>Match me to courses</button><div id=out></div>`,
fund:()=>`<h2>Fund your trail</h2>
<label>Household income per year (R)<input type=number id=inc></label>
${FUND.map(([k,n])=>`<label>${n} (R)<input type=number id=${k}></label>`).join('')}
<button class=p data-act=budget>Work out my budget</button><div id=out></div>`,
apply:()=>{const d=DOCS.filter((_,i)=>S.checks[i]).length;return`<h2>Apply without stress</h2>
<p class=m>One checklist for every application. Progress: <b>${Math.round(d/DOCS.length*100)}%</b></p>
${DOCS.map((n,i)=>`<div class=c><label style="margin:0;color:inherit"><input type=checkbox data-ck=${i} ${S.checks[i]?'checked':''}> ${n}</label></div>`).join('')}
<label>My application deadline<input type=date data-dl value="${S.dates.main||''}"></label>
<p id=dl class=m>${dlText()}</p>`},
stay:()=>{const m=S.moods.slice(-5),low=m.length>1&&m.slice(-2).every(x=>x<=2);return`<h2>Stay on the trail</h2>
<p>How are you coping this week?</p>
${[1,2,3,4,5].map(n=>`<button class=p data-act=mood data-v=${n}>${n}</button>`).join('')}<p class=m>1 = struggling, 5 = great</p>
<p class=m>Recent: ${m.join(' · ')||'no check-ins yet'}</p>
${low?`<div class=c><p class=warn>You've had two tough weeks. You are not alone.</p><p>Talk to your campus support office or tutor. SADAG helpline (free): <b>0800 456 789</b>.</p></div>`:''}`},
partner:()=>{const cnt={};feed.forEach(e=>cnt[e.type]=(cnt[e.type]||0)+1);return`<h2>Partner dashboard</h2>
<p><span class=b>${sb?'LIVE · Supabase real-time':'DEMO · local mode'}</span></p>
<p class=m>Anonymous activity from learners who opted in. No names, marks or documents are ever shown.</p>
<div class=c>${Object.entries(cnt).map(([k,v])=>`<b>${v}</b> ${k}`).join(' &nbsp; ')||'Waiting for activity…'}</div>
<button class=p data-act=sim>${sim?'Stop':'Start'} simulated learners</button>
${feed.slice(0,10).map(e=>`<div class=c><b>${e.type}</b> ${e.meta?.sim?'<span class=b>SIM</span>':''}<br><span class=m>${JSON.stringify(e.meta)} · ${new Date(e.at).toLocaleTimeString()}</span></div>`).join('')}
<h3>Revenue model (from pitch assumptions)</h3>
<label>Institutions<input type=number id=ri value=3></label><label>Funders<input type=number id=rf value=5></label>
<label>Bank referrals<input type=number id=rr value=500></label><label>Active learners<input type=number id=rl value=50000></label>
<button class=p data-act=rev>Calculate</button><div id=out></div>`},
privacy:()=>`<h2>My data</h2>
<p>Your marks, documents and check-ins stay <b>on this device</b>. You own them.</p>
<p>Anonymous activity sharing: <b class=ok>${S.consent?'ON':'OFF'}</b></p>
<button class=p data-act=consent data-v=${S.consent?0:1}>${S.consent?'Turn sharing off':'Turn sharing on'}</button>
<button class=p data-act=export>Download my data</button><button class=p data-act=wipe style="background:#b91c1c">Delete everything</button>
<p class=m>Built to POPIA principles: consent first, purpose limited, delete on request.</p>`
};
function dlText(){if(!S.dates.main)return'Set a date and Thuto Trail will count down for you.';const d=Math.ceil((new Date(S.dates.main)-new Date())/864e5);return d<0?'<span class=warn>That date has passed.</span>':`<span class=${d<14?'warn':'ok'}>${d} days left.</span>`}
function render(){
  $('#nav').innerHTML=Object.entries({find:'Find',fund:'Fund',apply:'Apply',stay:'Stay',partner:'Partners',privacy:'My data'}).map(([k,n])=>`<button data-tab=${k} class="${k==tab?'on':''}">${n}</button>`).join('');
  $('#app').innerHTML=V[tab]();
  const b=$('#bn');b.hidden=S.consent!==null;
  b.innerHTML=`Share anonymous progress stats with partner institutions to help improve support? No personal data leaves your phone.<br><button class=p data-act=consent data-v=1>Yes</button><button class=p data-act=consent data-v=0 style="background:#555">No</button>`;
}
const out=h=>$('#out').innerHTML=h;
const A={
calc(){document.querySelectorAll('[data-m]').forEach(i=>{if(i.value==='')delete S.marks[i.dataset.m];else S.marks[i.dataset.m]=+i.value});S.mt=$('#mt').value;save();
  const aps=Object.values(S.marks).reduce((a,v)=>a+pts(v),0),mm=S.marks.maths??0;
  const rows=COURSES.map(c=>{const mathOk=!c.m||(S.mt=='maths'&&mm>=c.m),gap=c.aps-aps;return{c,ok:gap<=0&&mathOk,gap,mathOk}}).sort((a,b)=>b.ok-a.ok||a.gap-b.gap);
  out(`<div class=c><b>Your APS: ${aps}</b></div>`+rows.map(({c,ok,gap,mathOk})=>`<div class=c><b>${c.n}</b> <span class=${ok?'ok':'warn'}>${ok?'You meet the minimum':!mathOk?`Needs Maths ${c.m}%+`:`${gap} APS points short`}</span><br><span class=m>Min APS ${c.aps} · Funding: ${c.f}</span></div>`).join('')+'<p class=m>Illustrative requirements. Confirm with each institution.</p>');
  emit('aps_calculated',{aps})},
budget(){const g=k=>+($('#'+k).value||0),tot=FUND.reduce((a,[k])=>a+g(k),0),inc=g('inc');
  out(`<div class=c><b>Total cost: ${R(tot)} a year</b> (${R(tot/10)} a month over 10 months)</div>
  <div class=c>${inc&&inc<=350000?'<span class=ok>Household income is within the NSFAS threshold of R350,000.</span> Apply on the NSFAS portal.':inc?'<span class=warn>Above the NSFAS income threshold.</span> Look at bursaries and student loans.':'Enter household income to check NSFAS.'}</div>
  <p class=m>Teaching? Look at Funza Lushaka. Indicative only: check current NSFAS rules.</p>`);emit('budget_planned',{band:tot<60000?'<60k':tot<100000?'60-100k':'100k+'})},
mood(e){S.moods.push(+e.dataset.v);save();emit('checkin',{score:+e.dataset.v});if(S.moods.slice(-2).every(x=>x<=2)&&S.moods.length>1)emit('early_warning',{});render()},
consent(e){S.consent=!!+e.dataset.v;save();render()},
sim(){if(sim){clearInterval(sim);sim=null}else sim=setInterval(()=>pushFeed({type:['aps_calculated','budget_planned','checkin','apply_progress'][Math.random()*4|0],meta:{sim:true},at:new Date().toISOString()}),2500);render()},
rev(){const g=k=>+$('#'+k).value||0,rev=g('ri')*2e5+g('rf')*12e4+g('rr')*100,cost=g('rl')*10;out(`<div class=c>Revenue <b>${R(rev)}</b><br>Cost to serve <b>${R(cost)}</b><br>Margin <b>${R(rev-cost)}</b><br><span class=m>R200k per institution, R120k per funder, R100 per referral, R10 per learner. Team assumptions, to be validated in pilots.</span></div>`)},
export(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='my-thuto-data.json';a.click()},
wipe(){if(confirm('Delete all your Thuto Trail data from this device?')){localStorage.removeItem(KEY);location.reload()}}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab],[data-act]');if(!t)return;if(t.dataset.tab){tab=t.dataset.tab;render()}else A[t.dataset.act](t)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.ck!==undefined){S.checks[t.dataset.ck]=t.checked;save();emit('apply_progress',{done:DOCS.filter((_,i)=>S.checks[i]).length});render()}
  if(t.dataset.dl!==undefined){S.dates.main=t.value;save();$('#dl').innerHTML=dlText()}});
render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
