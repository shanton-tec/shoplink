import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import {ZodError} from 'zod'
import {r as authRoutes} from './auth.js'
import {r as ownerRoutes} from './owner.js'
import {r as publicRoutes} from './public.js'
import {r as aiRoutes} from './ai.js'
import {connectSupabase} from './models.js'
for(const k of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','JWT_SECRET'])if(!process.env[k]){console.error(`Missing ${k}. Copy server/.env.example to server/.env`);process.exit(1)}
fs.mkdirSync('uploads',{recursive:true})
const app=express()
app.set('trust proxy',1)
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}))
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',credentials:true}))
app.use(express.json({limit:'100kb'}))
app.use(cookieParser())
app.use('/uploads',express.static('uploads',{maxAge:'7d'}))
const limit=(max,minutes=15)=>rateLimit({windowMs:minutes*60*1000,max,standardHeaders:true,legacyHeaders:false,message:{error:'Too many requests. Please try again soon.'}})
app.get('/api/health',(q,s)=>s.json({ok:true}))
app.use('/api/auth',limit(30),authRoutes)
app.use('/api/owner',ownerRoutes)
app.use('/api/public',limit(300),publicRoutes)
app.use('/api/ai',limit(40,60),aiRoutes)
app.use('/api',(q,s)=>s.status(404).json({error:'Not found'}))
app.use((err,req,res,next)=>{
 if(err instanceof ZodError)return res.status(400).json({error:err.issues[0].message,field:err.issues[0].path.join('.')})
 if(err.name==='CastError')return res.status(400).json({error:'Invalid id'})
 if(err.code==='23505')return res.status(409).json({error:'That already exists'})
 if(err.code==='22P02')return res.status(400).json({error:'Invalid id'})
 if(err.code==='LIMIT_FILE_SIZE')return res.status(400).json({error:'Image must be under 3 MB'})
 if(err.status)return res.status(err.status).json({error:err.message})
 console.error(err);res.status(500).json({error:'Server error. Please try again.'})})
await connectSupabase()
app.listen(process.env.PORT||4000,()=>console.log('ShopLink API ready'))
