// Vercel serverless function: WhatsApp Business Cloud API webhook. Stateless by design.
const crypto=require('crypto');
const {SUPABASE_URL:SB,SUPABASE_SERVICE_KEY:KEY,WA_TOKEN,WA_PHONE_ID,WA_VERIFY_TOKEN}=process.env;
const db=(p,o={})=>fetch(`${SB}/rest/v1/${p}`,{...o,headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates',...o.headers}});
const pts=m=>m>=80?7:m>=70?6:m>=60?5:m>=50?4:m>=40?3:m>=30?2:1;
const send=(to,body)=>fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,{method:'POST',headers:{Authorization:`Bearer ${WA_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body}})});
const MENU=`Hi, I'm Thuto Trail. Reply with:
APS 75 70 65 60 55 50 (your 6 marks) - find your APS
FUND - how to fund your studies
DEADLINES - what to prepare
JOIN - share anonymous stats to help improve support
STOP - delete your data
Your data stays yours.`;
async function reply(from,text){
  const wa=crypto.createHash('sha256').update(from).digest('hex'),t=text.trim().toUpperCase(),log=async(type,meta)=>{
    const r=await (await db(`bot_users?wa_hash=eq.${wa}&select=consent`)).json();
    if(r[0]?.consent)await db('events',{method:'POST',body:JSON.stringify({type,meta:{channel:'whatsapp',...meta},device:wa.slice(0,8)})})};
  if(t.startsWith('APS')){const m=(t.match(/\d+/g)||[]).map(Number).slice(0,6);if(m.length<3)return'Send your marks like: APS 75 70 65 60 55 50';
    const aps=m.reduce((a,v)=>a+pts(v),0);await log('aps_calculated',{aps});return`Your APS is ${aps}. Many degrees ask for 24 to 34, and TVET NC(V) courses have lower entry points. Confirm with each institution. Reply FUND next.`}
  if(t==='FUND')return'Check NSFAS first (household income up to R350,000). Teaching? Look at Funza Lushaka. Also ask the institution about bursaries. Do not pay anyone to apply for you. Indicative only: check current rules.';
  if(t==='DEADLINES')return'Prepare: certified ID, results, parent ID, proof of income, signed NSFAS consent form, proof of residence. Scan each one clearly. Deadlines differ per institution: write them down today.';
  if(t==='JOIN'){await db('bot_users',{method:'POST',body:JSON.stringify({wa_hash:wa,consent:true})});return'Thanks. We now count your activity anonymously. We never store your number, only a one-way hash. Reply STOP any time to delete it.'}
  if(t==='STOP'){await db(`bot_users?wa_hash=eq.${wa}`,{method:'DELETE'});return'Done. Your data has been deleted.'}
  return MENU}
module.exports=async(req,res)=>{
  if(req.method==='GET'){const q=req.query;return q['hub.verify_token']===WA_VERIFY_TOKEN?res.status(200).send(q['hub.challenge']):res.status(403).end()}
  try{const m=req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(m?.type==='text')await send(m.from,await reply(m.from,m.text.body))}catch(e){console.error(e)}
  res.status(200).end()};
