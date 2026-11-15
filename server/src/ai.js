import {Router} from 'express'
import {z} from 'zod'
import {findMany,findOne} from './models.js'
import {requireAuth} from './auth.js'
import {ask,askJSON} from './aiService.js'
import {insights} from './insights.js'
export const r=Router()
r.use(requireAuth)
r.post('/describe',async(req,res)=>{
 const b=z.object({name:z.string().min(1).max(80),category:z.string().max(40).optional(),imageUrl:z.string().url().optional()}).parse(req.body)
 try{
  const d=await askJSON('You write product listings for small local shops. Return {"description":string (max 40 words, plain and honest, never invent sizes or ingredients you cannot see),"category":string,"tags":string[] (3 to 5 short tags)}.',`Product: ${b.name}. Category hint: ${b.category||'none'}.`,b.imageUrl)
  res.json({description:String(d.description).slice(0,600),category:String(d.category||b.category||'General').slice(0,40),tags:(d.tags||[]).slice(0,8).map(t=>String(t).slice(0,30))})
 }catch(e){console.warn('describe fallback:',e.message)
  res.json({description:`${b.name}. Available now. Order on WhatsApp.`,category:b.category||'General',tags:[b.name.toLowerCase()],fallback:true})}})
r.post('/translate',async(req,res)=>{
 const b=z.object({text:z.string().min(1).max(1000),language:z.enum(['Tamil','Hindi','Telugu','Malayalam','Kannada','English'])}).parse(req.body)
 res.json({text:(await ask(`Translate the shop product text into ${b.language}. Return only the translation.`,b.text)).trim()})})
r.post('/price',async(req,res)=>{
 const b=z.object({name:z.string().max(80),category:z.string().max(40).optional()}).parse(req.body)
 const shop=await findOne('shops',{ownerId:req.uid});if(!shop)return res.status(404).json({error:'Create your shop first'})
 let ps=await findMany('products',{shopId:shop._id,...(b.category?{category:b.category}:{})});let basis=b.category?'your '+b.category+' items':'your other items'
 if(!ps.length){ps=await findMany('products',{shopId:shop._id});basis='your other items'}
 if(!ps.length)return res.status(400).json({error:'Add a few products first so we can compare prices'})
 const p=ps.map(x=>x.price).sort((a,c)=>a-c),med=p[Math.floor(p.length/2)]
 res.json({low:Math.round(med*.9),mid:med,high:Math.round(med*1.15),reason:'based on '+basis})})
r.post('/summary',async(req,res)=>{
 const shop=await findOne('shops',{ownerId:req.uid});if(!shop)return res.status(404).json({error:'Create your shop first'})
 const i=await insights(shop._id)
 const fallback=`In the last 30 days you had ${i.stats.views} visits, ${i.stats.orders} orders and Rs ${i.stats.revenue} in sales.`+(i.bestSellers[0]?` Your best-seller is ${i.bestSellers[0].name}.`:'')
 try{res.json({text:(await ask('You are a friendly advisor for a small shop owner. Write 3 short plain sentences using only the numbers given. No hype.',JSON.stringify(i))).trim()})}
 catch(e){console.warn('summary fallback:',e.message);res.json({text:fallback,fallback:true})}})
