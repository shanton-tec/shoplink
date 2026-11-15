import {findMany} from './models.js'
export async function insights(shopId){
 const since=new Date(Date.now()-30*864e5)
 const [orders,events,products]=await Promise.all([
  findMany('orders',{shopId},{gte:{createdAt:since.toISOString()},neq:{status:'cancelled'}}),
  findMany('events',{shopId},{gte:{createdAt:since.toISOString()}}),
  findMany('products',{shopId})
 ])
 const sold={},views={},pair={},daily={}
 for(const o of orders){
  const ids=[...new Set(o.items.map(i=>String(i.productId)))]
  o.items.forEach(i=>{sold[i.productId]=(sold[i.productId]||0)+i.qty})
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){const k=[ids[a],ids[b]].sort().join('|');pair[k]=(pair[k]||0)+1}
  const d=o.createdAt.slice(5,10);daily[d]=(daily[d]||0)+o.total}
 events.filter(e=>e.type==='view'&&e.productId).forEach(e=>{views[e.productId]=(views[e.productId]||0)+1})
 const by=Object.fromEntries(products.map(p=>[String(p._id),p]))
 const n=t=>events.filter(e=>e.type===t).length
 return {
  stats:{views:n('view'),carts:n('add_to_cart'),checkouts:n('checkout_click'),orders:orders.length,revenue:orders.reduce((s,o)=>s+o.total,0)},
  bestSellers:Object.entries(sold).filter(([id])=>by[id]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,qty])=>({id,name:by[id].name,qty})),
  unseen:products.filter(p=>p.active&&(views[p._id]||0)>=3&&!sold[p._id]).map(p=>({id:String(p._id),name:p.name,views:views[p._id]})),
  lowStock:products.filter(p=>p.active&&p.stock!=null&&p.stock<=3).map(p=>({id:String(p._id),name:p.name,stock:p.stock})),
  bundles:Object.entries(pair).filter(([k,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,times])=>{const [a,b]=k.split('|');return by[a]&&by[b]?{ids:[a,b],names:[by[a].name,by[b].name],times}:null}).filter(Boolean),
  daily:Object.entries(daily).sort().map(([date,revenue])=>({date,revenue}))}}
