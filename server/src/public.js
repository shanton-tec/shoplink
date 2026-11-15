import {Router} from 'express'
import {z} from 'zod'
import {findMany,findOne,insertOne,placeOrder} from './models.js'
import {waMessage} from './util.js'
export const r=Router()
const find=slug=>findOne('shops',{slug,published:true})
const gone={error:'This store is not available'}
r.get('/shops/:slug',async(req,res)=>{
 const s=await find(req.params.slug);if(!s)return res.status(404).json(gone)
 const products=await findMany('products',{shopId:s._id,active:true},{orderBy:'createdAt'})
 res.json({shop:{slug:s.slug,name:s.name,tagline:s.tagline,logo:s.logo,category:s.category,theme:s.theme},products})})
const phone=z.string().regex(/^\+?\d{10,14}$/,'Enter a valid phone number')
const orderSchema=z.object({customerName:z.string().min(2,'Enter your name').max(60),phone,address:z.string().max(300).optional(),note:z.string().max(300).optional(),
 items:z.array(z.object({productId:z.string(),qty:z.number().int().min(1).max(50)})).min(1,'Your cart is empty').max(40)})
r.post('/shops/:slug/orders',async(req,res)=>{
 const s=await find(req.params.slug);if(!s)return res.status(404).json(gone)
 const b=orderSchema.parse(req.body)
 const quantities=new Map()
 for(const item of b.items)quantities.set(item.productId,(quantities.get(item.productId)||0)+item.qty)
 const items=[...quantities].map(([productId,qty])=>({productId,qty}))
 if(items.some(item=>item.qty>50))return res.status(400).json({error:'You can order up to 50 of each item'})
 items.sort((a,b)=>a.productId.localeCompare(b.productId))
 let o
 try{o=await placeOrder({shopId:s._id,customerName:b.customerName,phone:b.phone.replace(/\D/g,''),address:b.address,note:b.note,items})}
 catch(error){
  if(error.code==='P0001')return res.status(400).json({error:error.message})
  throw error
 }
 res.status(201).json({orderId:o.id,whatsappUrl:`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(waMessage(s,o))}`})})
r.post('/shops/:slug/events',async(req,res)=>{
 const s=await find(req.params.slug);if(!s)return res.status(404).json(gone)
 const b=z.object({type:z.enum(['view','add_to_cart','checkout_click']),productId:z.string().optional()}).parse(req.body)
 await insertOne('events',{shopId:s._id,...b});res.json({ok:true})})
