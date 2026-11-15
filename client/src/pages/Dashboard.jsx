import {useState} from 'react'
import {Link} from 'react-router-dom'
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {api,useLoad} from '../api'
import {useShop,copy} from './Owner'
import {Skel,ErrorState,Empty,Spinner,useToast,inr} from '../ui'
export default function Dashboard(){
 const {shop}=useShop(),toast=useToast()
 const ins=useLoad(()=>api.get('/owner/insights')),sug=useLoad(()=>api.get('/owner/suggestions'))
 const [sum,setSum]=useState(null),[busy,setBusy]=useState('')
 const link=`${location.origin}/s/${shop.slug}`
 const run=async(k,fn)=>{setBusy(k);try{await fn()}catch(e){toast(e.message,'err')}finally{setBusy('')}}
 const refresh=()=>run('r',async()=>{await api.post('/owner/suggestions/refresh');sug.reload();ins.reload()})
 const act=(s,status)=>run(s._id,async()=>{await api.patch('/owner/suggestions/'+s._id,{status});sug.reload()})
 const summary=()=>run('s',async()=>setSum((await api.post('/ai/summary')).text))
 const d=ins.data,s=d?.stats
 return <div><div className="ph"><h1>Dashboard</h1></div>
  <div className="card share"><div className="grow"><b>{shop.published?'Your store is live':'Your store is not published yet'}</b><small>{link}</small></div>
   <button className="btn sm" onClick={()=>copy(link,toast)}>Copy link</button>{shop.published?<a className="btn sm" href={link} target="_blank" rel="noreferrer">Open</a>:<Link className="btn sm p" to="/app/builder">Publish</Link>}</div>
  {ins.error&&!d?<ErrorState error={ins.error} retry={ins.reload}/>:!d?<Skel n={3} h={90}/>:<>
   <div className="stats">{[['Visits',s.views],['Carts',s.carts],['Checkouts',s.checkouts],['Orders',s.orders],['Sales, 30 days',inr(s.revenue)]].map(([l,v])=><div className="card stat" key={l}><small>{l}</small><b>{v}</b></div>)}</div>
   <div className="card"><h3>Sales per day</h3>{d.daily.length?<div style={{height:220}}><ResponsiveContainer><LineChart data={d.daily}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/><XAxis dataKey="date" fontSize={12}/><YAxis fontSize={12}/><Tooltip formatter={v=>inr(v)}/><Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div>:<p className="muted">No sales yet. Share your store link to get your first order.</p>}</div>
   <div className="two-col"><div className="card"><h3>Best sellers</h3>{d.bestSellers.length?<ol>{d.bestSellers.map(b=><li key={b.id}>{b.name} <span>{b.qty} sold</span></li>)}</ol>:<p className="muted">Best sellers appear after your first orders.</p>}</div>
    <div className="card"><h3>Weekly summary</h3>{sum?<p>{sum}</p>:<p className="muted">Get a plain-language summary of how your shop is doing.</p>}<button className="btn sm" onClick={summary} disabled={!!busy}>{busy==='s'?<Spinner/>:'Summarise with AI'}</button></div></div>
   <div className="card"><div className="ph"><h3>Ideas for you</h3><button className="btn sm" onClick={refresh} disabled={!!busy}>{busy==='r'?<Spinner/>:'Refresh ideas'}</button></div>
    {sug.error&&!sug.data?<ErrorState error={sug.error} retry={sug.reload}/>:!sug.data?<Skel h={60}/>:!sug.data.suggestions.length?<Empty title="No ideas yet" text="Tap Refresh ideas after you have some visits and orders."/>
     :<ul className="sug">{sug.data.suggestions.map(x=><li key={x._id}><span className={'tag '+x.type}>{x.type}</span><p>{x.reason}</p><div><button className="btn sm" disabled={busy===x._id} onClick={()=>act(x,'done')}>Done</button><button className="btn sm" disabled={busy===x._id} onClick={()=>act(x,'dismissed')}>Dismiss</button></div></li>)}</ul>}</div></>}</div>}
