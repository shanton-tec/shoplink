import {useState,useEffect,useCallback} from 'react'
async function req(method,url,body){
 let r
 try{r=await fetch('/api'+url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})}
 catch{throw new Error('Cannot reach the server. Check your connection and try again.')}
 const d=await r.json().catch(()=>({}))
 if(!r.ok){const e=new Error(d.error||'Something went wrong');e.status=r.status;e.field=d.field;throw e}
 return d}
export const api={get:u=>req('GET',u),post:(u,b)=>req('POST',u,b||{}),put:(u,b)=>req('PUT',u,b),patch:(u,b)=>req('PATCH',u,b),del:u=>req('DELETE',u)}
export async function upload(file){
 const f=new FormData();f.append('file',file)
 let r;try{r=await fetch('/api/owner/upload',{method:'POST',body:f})}catch{throw new Error('Upload failed. Check your connection.')}
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Upload failed');return d.url}
export function useLoad(fn,deps=[]){
 const [s,set]=useState({data:null,error:null,loading:true})
 const run=useCallback(()=>{set(x=>({...x,loading:true,error:null}));fn().then(data=>set({data,error:null,loading:false}),error=>set(x=>({data:x.data,error,loading:false})))},deps)
 useEffect(run,[run])
 return {...s,reload:run}}
