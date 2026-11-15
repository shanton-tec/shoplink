import {createContext,useContext,useEffect,useState} from 'react'
import {NavLink,Outlet,useNavigate,useLocation} from 'react-router-dom'
import {api,upload,useLoad} from '../api'
import {useAuth} from '../auth'
import {Field,Spinner,Skel,ErrorState,Empty,Modal,useToast,inr} from '../ui'
import {StoreView,PhoneFrame} from '../store'
import {Logo} from './Marketing'
const Ctx=createContext(null)
export const useShop=()=>useContext(Ctx)
export const copy=(text,toast)=>navigator.clipboard?navigator.clipboard.writeText(text).then(()=>toast('Link copied'),()=>toast('Could not copy','err')):toast('Copying is not supported here','err')

export function AppLayout(){
 const {logout}=useAuth(),nav=useNavigate(),loc=useLocation()
 const [shop,setShop]=useState(undefined),[err,setErr]=useState(null)
 useEffect(()=>{api.get('/owner/shop').then(d=>{setShop(d.shop);if(!d.shop&&loc.pathname!=='/app/onboarding')nav('/app/onboarding',{replace:true})}).catch(setErr)},[])
 if(err)return <ErrorState error={err} retry={()=>location.reload()}/>
 if(shop===undefined)return <div className="center"><Spinner/></div>
 const L=[['/app','Dashboard',1],['/app/products','Products'],['/app/orders','Orders'],['/app/builder','Store'],['/app/settings','Settings']]
 return <Ctx.Provider value={{shop,setShop}}>{shop
  ?<div className="shell"><aside><Logo/><nav aria-label="Dashboard">{L.map(([to,l,end])=><NavLink key={to} to={to} end={!!end}>{l}</NavLink>)}</nav><button className="btn sm out" onClick={async()=>{await logout();nav('/')}}>Log out</button></aside><main><Outlet/></main></div>
  :loc.pathname==='/app/onboarding'?<Outlet/>:<div className="center"><Spinner/></div>}</Ctx.Provider>}

const CATS=['Grocery','Bakery & sweets','Fashion','Electronics','Home & kitchen','Beauty','Stationery','Other']
function ShopForm({initial,onSaved}){
 const toast=useToast()
 const [f,setF]=useState({name:initial?.name||'',category:initial?.category||CATS[0],whatsapp:initial?.whatsapp||'',tagline:initial?.tagline||''}),[err,setErr]=useState(null),[busy,setBusy]=useState(false)
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const submit=async e=>{e.preventDefault();setBusy(true);setErr(null)
  try{const d=await api.put('/owner/shop',{...(initial?{theme:initial.theme,logo:initial.logo,published:initial.published}:{}),...f});toast('Shop saved');onSaved(d.shop)}
  catch(x){setErr(x)}finally{setBusy(false)}}
 return <form onSubmit={submit} noValidate>
  <Field label="Shop name"><input value={f.name} onChange={set('name')} maxLength={60} required/></Field>
  <Field label="Category"><select value={f.category} onChange={set('category')}>{CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
  <Field label="WhatsApp number (with country code)"><input inputMode="numeric" placeholder="919876543210" value={f.whatsapp} onChange={set('whatsapp')} required/></Field>
  <Field label="Tagline (optional)"><input value={f.tagline} onChange={set('tagline')} maxLength={120}/></Field>
  {err&&<p className="err" role="alert">{err.message}</p>}
  <button className="btn p" disabled={busy}>{busy?<Spinner/>:'Save'}</button></form>}
export function Onboarding(){
 const {setShop}=useShop(),nav=useNavigate()
 return <div className="center col"><Logo/><div className="card auth"><h2>Set up your shop</h2><p>This takes one minute. You can change everything later.</p><ShopForm onSaved={s=>{setShop(s);nav('/app/products')}}/></div></div>}

function ProductForm({initial,onSaved}){
 const toast=useToast()
 const [f,setF]=useState(initial||{name:'',price:'',stock:null,category:'',description:'',images:[],tags:[]}),[busy,setBusy]=useState(''),[err,setErr]=useState(''),[tr,setTr]=useState('')
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const ai=async(label,fn)=>{setBusy(label);setErr('');try{await fn()}catch(e){setErr(e.message)}finally{setBusy('')}}
 const write=()=>ai('write',async()=>{
  const d=await api.post('/ai/describe',{name:f.name,category:f.category||undefined,imageUrl:f.images[0]?new URL(f.images[0],location.origin).href:undefined})
  setF(x=>({...x,description:d.description,category:x.category||d.category,tags:d.tags}))
  if(d.fallback)toast('AI is not available right now, so a simple template was used','warn')})
 const translate=l=>ai('tr',async()=>setTr((await api.post('/ai/translate',{text:f.description,language:l})).text))
 const suggest=()=>ai('price',async()=>{const d=await api.post('/ai/price',{name:f.name,category:f.category||undefined});toast(`Suggested price: ${inr(d.low)} to ${inr(d.high)}, ${d.reason}`)})
 const up=e=>{const file=e.target.files[0];if(file)ai('up',async()=>{const url=await upload(file);setF(x=>({...x,images:[url]}))})}
 const submit=async e=>{e.preventDefault();setBusy('save');setErr('')
  try{const body={name:f.name,description:f.description||'',price:Number(f.price),stock:f.stock===''||f.stock==null?null:Number(f.stock),category:f.category||'',images:f.images||[],tags:f.tags||[],active:f.active!==false}
   const d=initial?._id?await api.put('/owner/products/'+initial._id,body):await api.post('/owner/products',body);toast('Product saved');onSaved(d.product)}
  catch(x){setErr(x.message);setBusy('')}}
 return <form onSubmit={submit} className="pf">
  <Field label="Photo"><div className="up">{f.images?.[0]&&<img src={f.images[0]} alt="" className="thumb"/>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={up} disabled={!!busy}/></div></Field>
  <Field label="Name"><input value={f.name} onChange={set('name')} required maxLength={80}/></Field>
  <div className="two"><Field label="Price (INR)"><input type="number" min="0" step="1" value={f.price} onChange={set('price')} required/></Field>
   <Field label="Stock (optional)"><input type="number" min="0" step="1" value={f.stock??''} onChange={set('stock')} placeholder="Unlimited"/></Field></div>
  <Field label="Category"><input value={f.category||''} onChange={set('category')} maxLength={40}/></Field>
  <Field label="Description"><textarea rows="3" value={f.description||''} onChange={set('description')} maxLength={1000}/></Field>
  <div className="chips"><button type="button" className="btn sm" disabled={!f.name||!!busy} onClick={write}>{busy==='write'?<Spinner/>:'Write with AI'}</button>
   <button type="button" className="btn sm" disabled={!f.name||!!busy} onClick={suggest}>{busy==='price'?<Spinner/>:'Suggest a price'}</button>
   {['Tamil','Hindi'].map(l=><button key={l} type="button" className="btn sm" disabled={!f.description||!!busy} onClick={()=>translate(l)}>Translate to {l}</button>)}</div>
  {tr&&<div className="card tr"><p>{tr}</p><button type="button" className="btn sm" onClick={()=>{setF(x=>({...x,description:(x.description||'')+'\n\n'+tr}));setTr('')}}>Add to description</button></div>}
  {err&&<p className="err" role="alert">{err}</p>}
  <button className="btn p" disabled={!!busy}>{busy==='save'?<Spinner/>:'Save product'}</button></form>}

export function Products(){
 const {data,error,loading,reload}=useLoad(()=>api.get('/owner/products')),[edit,setEdit]=useState(null),toast=useToast()
 const toggle=async p=>{try{await api.put('/owner/products/'+p._id,{active:!p.active});reload()}catch(e){toast(e.message,'err')}}
 const del=async p=>{if(!confirm(`Delete ${p.name}?`))return;try{await api.del('/owner/products/'+p._id);toast('Product deleted');reload()}catch(e){toast(e.message,'err')}}
 return <div><div className="ph"><h1>Products</h1><button className="btn p" onClick={()=>setEdit({})}>Add product</button></div>
  {error&&!data?<ErrorState error={error} retry={reload}/>:loading&&!data?<Skel n={4} h={72}/>:!data.products.length
   ?<Empty title="No products yet" text="Add your first product. AI can write the description for you."><button className="btn p" onClick={()=>setEdit({})}>Add product</button></Empty>
   :<div className="list">{data.products.map(p=><div className="card item" key={p._id}>
    <div className="th">{p.images[0]?<img src={p.images[0]} alt=""/>:<span>{p.name[0]}</span>}</div>
    <div className="grow"><b>{p.name}</b><small>{inr(p.price)}{p.stock!=null?` \u00B7 ${p.stock} in stock`:''}{p.category?` \u00B7 ${p.category}`:''}</small></div>
    <label className="sw"><input type="checkbox" checked={p.active} onChange={()=>toggle(p)}/><span>Visible</span></label>
    <button className="btn sm" onClick={()=>setEdit(p)}>Edit</button><button className="btn sm danger" onClick={()=>del(p)}>Delete</button></div>)}</div>}
  {edit&&<Modal title={edit._id?'Edit product':'Add product'} onClose={()=>setEdit(null)}><ProductForm initial={edit._id?edit:null} onSaved={()=>{setEdit(null);reload()}}/></Modal>}</div>}

const ST=['new','confirmed','delivered','cancelled']
export function Orders(){
 const {data,error,loading,reload}=useLoad(()=>api.get('/owner/orders')),toast=useToast()
 useEffect(()=>{const t=setInterval(reload,30000);return()=>clearInterval(t)},[reload])
 const set=async(o,status)=>{try{await api.patch('/owner/orders/'+o._id,{status});reload()}catch(e){toast(e.message,'err')}}
 return <div><div className="ph"><h1>Orders</h1><button className="btn sm" onClick={reload}>Refresh</button></div>
  {error&&!data?<ErrorState error={error} retry={reload}/>:loading&&!data?<Skel n={3} h={120}/>:!data.orders.length
   ?<Empty title="No orders yet" text="When customers order from your store link, they appear here."/>
   :<div className="list">{data.orders.map(o=><div className="card" key={o._id}>
    <div className="oh"><b>#{o._id.slice(-6)}</b><small>{new Date(o.createdAt).toLocaleString('en-IN')}</small>
     <select value={o.status} onChange={e=>set(o,e.target.value)} className={'st '+o.status} aria-label="Order status">{ST.map(s=><option key={s}>{s}</option>)}</select></div>
    <ul>{o.items.map(i=><li key={i.productId}>{i.qty} x {i.name} <span>{inr(i.qty*i.price)}</span></li>)}</ul>
    <p><b>Total {inr(o.total)}</b></p>
    <small>{o.customerName}, {o.phone}{o.address?`, ${o.address}`:''}{o.note?` \u2022 Note: ${o.note}`:''}</small>
    <div><a className="btn sm" href={'https://wa.me/'+o.phone} target="_blank" rel="noreferrer">Reply on WhatsApp</a></div></div>)}</div>}</div>}

export function Builder(){
 const {shop,setShop}=useShop(),toast=useToast(),{data}=useLoad(()=>api.get('/owner/products'))
 const [d,setD]=useState({tagline:shop.tagline||'',logo:shop.logo||'',published:!!shop.published,theme:{primary:'#0f766e',accent:'#f5b82e',font:'sans',layout:'grid',...shop.theme}}),[busy,setBusy]=useState(false)
 const th=k=>e=>setD({...d,theme:{...d.theme,[k]:e.target.value}})
 const link=`${location.origin}/s/${shop.slug}`
 const save=async(publish=false)=>{
  const preview=publish?window.open('about:blank','_blank'):null
  if(preview)preview.opener=null
  setBusy(true)
  try{
   const next={...d,...(publish?{published:true}:{})}
   const r=await api.put('/owner/shop',{name:shop.name,category:shop.category,whatsapp:shop.whatsapp,...next})
   setD(next);setShop(r.shop);toast(publish?'Your store is live':'Store saved')
   if(publish&&preview)preview.location.href=link
   else if(publish)toast('Store is live. Allow pop-ups or use Open live store to view it.','warn')
  }catch(e){if(preview)preview.close();toast(e.message,'err')}
  finally{setBusy(false)}
 }
 const logo=async e=>{const f=e.target.files[0];if(!f)return;try{const url=await upload(f);setD(x=>({...x,logo:url}))}catch(x){toast(x.message,'err')}}
 return <div><div className="ph"><div><h1>Store</h1><p className="page-intro">Make your storefront yours, then share it with customers.</p></div><button className="btn p" onClick={()=>save()} disabled={busy}>{busy?<Spinner/>:'Save changes'}</button></div>
  <div className="builder"><div className="card ctl">
   <div className="publish-status"><span className={'status-dot '+(shop.published?'live':'draft')}/><div><b>{shop.published?'Your store is live':'Your store is in draft'}</b><small>{shop.published?'Customers can visit your link.':'Publish when you are ready to welcome customers.'}</small></div></div>
   <Field label="Tagline"><input value={d.tagline} onChange={e=>setD({...d,tagline:e.target.value})} maxLength={120}/></Field>
   <Field label="Logo"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={logo}/></Field>
   <div className="two"><Field label="Main colour"><input type="color" value={d.theme.primary} onChange={th('primary')}/></Field><Field label="Accent colour"><input type="color" value={d.theme.accent} onChange={th('accent')}/></Field></div>
   <div className="two"><Field label="Font"><select value={d.theme.font} onChange={th('font')}><option value="sans">Clean</option><option value="serif">Classic</option><option value="rounded">Friendly</option></select></Field>
    <Field label="Layout"><select value={d.theme.layout} onChange={th('layout')}><option value="grid">Grid</option><option value="list">List</option></select></Field></div>
   <label className="sw"><input type="checkbox" checked={d.published} onChange={e=>setD({...d,published:e.target.checked})}/><span>Store is live</span></label>
   <div className="store-link"><small>YOUR STORE LINK</small><span>{link}</span><button className="btn sm" onClick={()=>copy(link,toast)}>Copy link</button></div>
   <div className="publish-actions">{shop.published&&<a className="btn" href={link} target="_blank" rel="noreferrer">Open live store ↗</a>}
    <button className="btn p" onClick={()=>save(true)} disabled={busy}>{busy?<Spinner/>:shop.published?'Save & open store':'Publish & open store'}</button></div></div>
   <div className="preview-panel"><div className="preview-caption"><span>LIVE PREVIEW</span><small>Changes appear here as you customize</small></div><PhoneFrame theme={d.theme}><StoreView shop={{...shop,...d}} products={(data?.products||[]).filter(p=>p.active)}/></PhoneFrame></div></div></div>}

export function Settings(){
 const {shop,setShop}=useShop(),{user}=useAuth()
 return <div><div className="ph"><h1>Settings</h1></div><div className="card auth wide"><h3>Shop details</h3><ShopForm initial={shop} onSaved={setShop}/></div>
  <div className="card auth wide"><h3>Account</h3><p>{user.name} ({user.email})</p></div></div>}
