export const aiEnabled=()=>!!process.env.ANTHROPIC_API_KEY
// Calls the LLM from the server only, so the key never reaches the browser.
export async function ask(system,user,imageUrl){
 if(!aiEnabled())throw Object.assign(new Error('AI is not configured on this server'),{status:503})
 const content=[]
 if(imageUrl&&/^https:\/\//.test(imageUrl))content.push({type:'image',source:{type:'url',url:imageUrl}})
 content.push({type:'text',text:user})
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:AbortSignal.timeout(20000),
  headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
  body:JSON.stringify({model:process.env.AI_MODEL||'claude-sonnet-5-5',max_tokens:600,system,messages:[{role:'user',content}]})})
 if(!r.ok)throw Object.assign(new Error('The AI service is busy. Please try again.'),{status:502})
 return(await r.json()).content.filter(c=>c.type==='text').map(c=>c.text).join('')}
export async function askJSON(system,user,imageUrl){
 const t=await ask(system+' Reply with JSON only, no markdown.',user,imageUrl)
 return JSON.parse(t.replace(/```json|```/g,'').trim())}
