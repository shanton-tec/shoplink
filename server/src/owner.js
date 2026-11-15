import {Router} from 'express'
import {z} from 'zod'
import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
import {deleteMany,findMany,findOne,insertMany,insertOne,updateOne} from './models.js'
import {requireAuth} from './auth.js'
import {insights} from './insights.js'
import {slugify} from './util.js'
export const r=Router()
r.use(requireAuth)
const needShop=async(req,res,next)=>{req.shop=await findOne('shops',{ownerId:req.uid});req.shop?next():res.status(404).json({error:'Create your shop first'})}
const hex=z.string().regex(/^#[0-9a-f]{6}$/i,'Use a colour like #0f766e')
const shopSchema=z.object({name:z.string().min(2,'Enter your shop name').max(60),category:z.string().max(40).optional(),
 whatsapp:z.string().regex(/^\+?\d{10,14}$/,'Enter your WhatsApp number with country code, e.g. 919876543210'),tagline:z.string().max(120).optional(),logo:z.string().max(300).optional(),
 theme:z.object({primary:hex,accent:hex,font:z.enum(['sans','serif','rounded']),layout:z.enum(['grid','list'])}).optional(),languages:z.array(z.string().max(20)).max(4).optional(),published:z.boolean().optional()})
r.get('/shop',async(req,res)=>res.json({shop:await findOne('shops',{ownerId:req.uid})}))
r.put('/shop',async(req,res)=>{
 const b=shopSchema.parse(req.body);let s=await findOne('shops',{ownerId:req.uid})
 const changes={...b,whatsapp:b.whatsapp.replace(/\D/g,'')}
 if(!s){
  const base=slugify(b.name);let slug=base,n=0
  while(await findOne('shops',{slug}))slug=`${base}-${++n}`
  s=await insertOne('shops',{...changes,ownerId:req.uid,slug})
 }else s=await updateOne('shops',{id:s._id},changes)
 res.json({shop:s})})
const prod=z.object({name:z.string().min(1,'Enter a product name').max(80),description:z.string().max(1000).optional(),price:z.number({invalid_type_error:'Enter a price'}).nonnegative().max(1e7),
 stock:z.number().int().nonnegative().nullable().optional(),images:z.array(z.string().max(300)).max(5).optional(),category:z.string().max(40).optional(),tags:z.array(z.string().max(30)).max(10).optional(),active:z.boolean().optional()})
r.get('/products',needShop,async(req,res)=>res.json({products:await findMany('products',{shopId:req.shop._id},{orderBy:'createdAt'})}))
r.post('/products',needShop,async(req,res)=>res.status(201).json({product:await insertOne('products',{...prod.parse(req.body),shopId:req.shop._id})}))
r.put('/products/:id',needShop,async(req,res)=>{
 const p=await updateOne('products',{id:req.params.id,shopId:req.shop._id},prod.partial().parse(req.body))
 p?res.json({product:p}):res.status(404).json({error:'Product not found'})})
r.delete('/products/:id',needShop,async(req,res)=>{
 const deleted=await deleteMany('products',{id:req.params.id,shopId:req.shop._id});deleted?res.json({ok:true}):res.status(404).json({error:'Product not found'})})
const bad=m=>Object.assign(new Error(m),{status:400})
const up=multer({storage:multer.diskStorage({destination:'uploads',filename:(q,f,cb)=>cb(null,crypto.randomBytes(12).toString('hex')+path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g,''))}),
 limits:{fileSize:3*1024*1024},fileFilter:(q,f,cb)=>/^image\/(jpeg|png|webp)$/.test(f.mimetype)?cb(null,true):cb(bad('Use a JPG, PNG or WebP image'))})
// For production, swap this for Cloudinary or S3 so images survive redeploys.
r.post('/upload',up.single('file'),(req,res)=>req.file?res.json({url:'/uploads/'+req.file.filename}):res.status(400).json({error:'Choose an image'}))
r.get('/orders',needShop,async(req,res)=>res.json({orders:await findMany('orders',{shopId:req.shop._id},{orderBy:'createdAt',limit:200})}))
r.patch('/orders/:id',needShop,async(req,res)=>{
 const {status}=z.object({status:z.enum(['new','confirmed','delivered','cancelled'])}).parse(req.body)
 const o=await updateOne('orders',{id:req.params.id,shopId:req.shop._id},{status});o?res.json({order:o}):res.status(404).json({error:'Order not found'})})
r.get('/insights',needShop,async(req,res)=>res.json(await insights(req.shop._id)))
r.get('/suggestions',needShop,async(req,res)=>res.json({suggestions:await findMany('suggestions',{shopId:req.shop._id,status:'new'},{orderBy:'createdAt'})}))
r.post('/suggestions/refresh',needShop,async(req,res)=>{
 const i=await insights(req.shop._id)
 const items=[
  ...i.bundles.map(b=>({type:'bundle',payload:b,reason:`${b.names[0]} and ${b.names[1]} were bought together ${b.times} times. Offer them as a bundle.`})),
  ...i.lowStock.map(p=>({type:'restock',payload:p,reason:`${p.name} has only ${p.stock} left.`})),
  ...i.unseen.map(p=>({type:'promote',payload:p,reason:`${p.name} was viewed ${p.views} times but never ordered. Try a better photo, price or description.`}))]
 await deleteMany('suggestions',{shopId:req.shop._id,status:'new'})
 res.json({suggestions:await insertMany('suggestions',items.map(x=>({...x,shopId:req.shop._id})))})})
r.patch('/suggestions/:id',needShop,async(req,res)=>{
 const {status}=z.object({status:z.enum(['done','dismissed'])}).parse(req.body)
 const s=await updateOne('suggestions',{id:req.params.id,shopId:req.shop._id},{status});s?res.json({suggestion:s}):res.status(404).json({error:'Not found'})})
