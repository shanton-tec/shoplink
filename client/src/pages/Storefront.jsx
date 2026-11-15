import {useEffect,useMemo,useState} from 'react'
import {useParams} from 'react-router-dom'
import {api,useLoad} from '../api'
import {StoreView,themeVars} from '../store'
import {Field,Skel,ErrorState,Modal,Spinner,inr} from '../ui'
export default function Storefront(){
 const {slug}=useParams(),key='cart:'+slug
 const {data,error,loading,reload}=useLoad(()=>api.get('/public/shops/'+slug),[slug])
 const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))||{}}catch{return{}}})
 const [q,setQ]=useState(''),[cat,setCat]=useState('All'),[open,setOpen]=useState(null),[bag,setBag]=useState(false),[done,setDone]=useState(null)
 const [f,setF]=useState({customerName:'',phone:'',address:'',note:''}),[err,setErr]=useState(null),[busy,setBusy]=useState(false)
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(cart))}catch{}},[cart,key])
 const track=(type,productId)=>api.post(`/public/shops/${slug}/events`,{type,productId}).catch(()=>{})
 useEffect(()=>{track('view')},[slug])
 useEffect(()=>{if(data?.shop)document.title=data.shop.name+' | ShopLink'},[data])
 const products=data?.products||[]
 const cats=useMemo(()=>['All',...new Set(products.map(p=>p.category).filter(Boolean))],[data])
 const shown=products.filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(q.toLowerCase()))
 const add=p=>{setCart(c=>({...c,[p._id]:(c[p._id]||0)+1}));track('add_to_cart',p._id)}
 const lines=products.filter(p=>cart[p._id]).map(p=>({p,qty:cart[p._id]}))
 const total=lines.reduce((t,l)=>t+l.p.price*l.qty,0),count=lines.reduce((t,l)=>t+l.qty,0)
 const setQty=(id,d)=>setCart(c=>{const n=(c[id]||0)+d,x={...c};if(n>0)x[id]=n;else delete x[id];return x})
 const order=async e=>{e.preventDefault();setErr(null);setBusy(true);track('checkout_click')
  try{const r=await api.post(`/public/shops/${slug}/orders`,{...f,address:f.address||undefined,note:f.note||undefined,items:lines.map(l=>({productId:l.p._id,qty:l.qty}))})
   setCart({});setBag(false);setDone(r.whatsappUrl);window.open(r.whatsappUrl,'_blank')}
  catch(x){setErr(x)}finally{setBusy(false)}}
 const set=k=>e=>setF({...f,[k]:e.target.value})
 if(loading&&!data)return <div className="store"><Skel n={4} h={120}/></div>
 if(error&&!data)return error.status===404?<div className="center col"><h1>This store is not available</h1><p>The link may be wrong, or the shop has not been published yet.</p></div>:<ErrorState error={error} retry={reload}/>
 const shop=data.shop
 if(done)return <div className="center col" style={themeVars(shop.theme)}><h1>Order sent</h1><p>Your order is ready in WhatsApp. Tap send to confirm it with {shop.name}.</p><a className="btn p lg" href={done} target="_blank" rel="noreferrer">Open WhatsApp</a><button className="btn" onClick={()=>setDone(null)}>Back to the store</button></div>
 return <div className="store" style={themeVars(shop.theme)}>
  <div className="store-toolbar"><input className="search" type="search" placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search products"/><small>{shown.length} {shown.length===1?'item':'items'}</small></div>
  {cats.length>2&&<div className="chips">{cats.map(c=><button key={c} className={c===cat?'on':''} onClick={()=>setCat(c)}>{c}</button>)}</div>}
  {shown.length?<StoreView shop={shop} products={shown} cart={cart} onAdd={add} onOpen={p=>{setOpen(p);track('view',p._id)}}/>:
   <div className="store-empty"><span className="empty-icon">⌕</span><h2>{products.length?'No products found':'Nothing in the shop yet'}</h2><p>{products.length?'Try another search or category.':'Check back soon for new products.'}</p>
    {(q||cat!=='All')&&<button className="btn" onClick={()=>{setQ('');setCat('All')}}>Clear filters</button>}</div>}
  {count>0&&<button className="fab" onClick={()=>setBag(true)}>View cart ({count}) &middot; {inr(total)}</button>}
  {open&&<Modal title={open.name} onClose={()=>setOpen(null)}>{open.images?.[0]&&<img className="big-img" src={open.images[0]} alt={open.name}/>}<h3>{inr(open.price)}</h3><p>{open.description}</p>
   <div className="chips">{(open.tags||[]).map(t=><b key={t}>{t}</b>)}</div><button className="btn p" disabled={open.stock!=null&&open.stock<1} onClick={()=>{add(open);setOpen(null)}}>{open.stock!=null&&open.stock<1?'Sold out':'Add to cart'}</button></Modal>}
  {bag&&<Modal title="Your cart" onClose={()=>setBag(false)}>
   <ul className="cart">{lines.map(({p,qty})=><li key={p._id}><span>{p.name}</span><div><button aria-label="Remove one" onClick={()=>setQty(p._id,-1)}>&minus;</button>{qty}<button aria-label="Add one" onClick={()=>setQty(p._id,1)}>+</button></div><b>{inr(p.price*qty)}</b></li>)}</ul>
   <p className="tot">Total {inr(total)}</p>
   <form onSubmit={order}><Field label="Your name"><input value={f.customerName} onChange={set('customerName')} autoComplete="name" required/></Field>
    <Field label="Phone number"><input inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required/></Field>
    <Field label="Delivery address (optional)"><textarea rows="2" value={f.address} onChange={set('address')}/></Field>
    <Field label="Note (optional)"><input value={f.note} onChange={set('note')}/></Field>
    {err&&<p className="err" role="alert">{err.message}</p>}<button className="btn p lg" disabled={busy||!lines.length}>{busy?<Spinner/>:'Order on WhatsApp'}</button></form></Modal>}</div>}
