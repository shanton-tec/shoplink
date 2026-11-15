import {Router} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {z} from 'zod'
import {findOne,insertOne} from './models.js'
export const r=Router()
const pub=u=>({id:u.id,name:u.name,email:u.email})
const setCookie=(res,id)=>res.cookie('token',jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'}),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*864e5})
export function requireAuth(req,res,next){try{req.uid=jwt.verify(req.cookies.token,process.env.JWT_SECRET).id;next()}catch{res.status(401).json({error:'Please log in'})}}
const creds=z.object({email:z.string().email('Enter a valid email'),password:z.string().min(8,'Password must be at least 8 characters').max(100)})
r.post('/signup',async(req,res)=>{
 const b=creds.extend({name:z.string().min(2,'Enter your name').max(60)}).parse(req.body)
 if(await findOne('users',{email:b.email.toLowerCase()}))return res.status(409).json({error:'This email is already registered'})
 const u=await insertOne('users',{name:b.name,email:b.email.toLowerCase(),passwordHash:await bcrypt.hash(b.password,12)})
 setCookie(res,u.id);res.status(201).json({user:pub(u)})})
r.post('/login',async(req,res)=>{
 const b=creds.parse(req.body),u=await findOne('users',{email:b.email.toLowerCase()})
 if(!u||!(await bcrypt.compare(b.password,u.passwordHash)))return res.status(401).json({error:'Wrong email or password'})
 setCookie(res,u.id);res.json({user:pub(u)})})
r.post('/logout',(req,res)=>{res.clearCookie('token');res.json({ok:true})})
r.get('/me',requireAuth,async(req,res)=>{const u=await findOne('users',{id:req.uid});u?res.json({user:pub(u)}):res.status(401).json({error:'Please log in'})})
