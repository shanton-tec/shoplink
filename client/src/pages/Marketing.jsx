import {Link} from 'react-router-dom'
import {StoreView,PhoneFrame} from '../store'
import {useAuth} from '../auth'
export const Logo=()=><Link to="/" className="logo"><span className="mark">S</span>ShopLink</Link>
const demo={name:'Anna Bakery',tagline:'Fresh bakes, delivered today',theme:{primary:'#0f766e',accent:'#f5b82e',font:'sans',layout:'grid'}}
const demoP=[['Butter Cake',320],['Veg Puff',25],['Chocolate Brownie',90],['Whole Wheat Bread',55]].map(([name,price],i)=>({_id:String(i),name,price,images:[]}))
function Nav(){
 const {user}=useAuth()
 return <header className="nav"><Logo/><nav><Link to="/how">How it works</Link>{user?<Link className="btn p" to="/app">Open dashboard</Link>:<><Link to="/login">Log in</Link><Link className="btn p" to="/signup">Start free</Link></>}</nav></header>}
const Footer=()=><footer className="foot">&copy; 2026 ShopLink. Built by Yazhini R and Shanton Jeffry Rudolf B.</footer>
export function Landing(){
 return <div className="mk"><Nav/>
  <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot"/> A simpler way to sell online</span><h1>Your shop,<br/>one link.</h1><p>Put your products online in minutes. Customers browse on their phone and send you the order on WhatsApp. No website skills needed.</p>
   <div className="row"><Link className="btn p lg" to="/signup">Create your store</Link><Link className="btn lg" to="/how">See how it works</Link></div></div>
   <PhoneFrame theme={demo.theme}><StoreView shop={demo} products={demoP}/></PhoneFrame></section>
  <section className="feats">{[['Live in minutes','Add products, pick colours and publish. Share the link anywhere.'],['Orders on WhatsApp','Every order arrives as a clear message with items, total and address.'],['AI that helps you sell','Product descriptions, price ideas, translations and bundle suggestions.'],['Your numbers, simply','See visits, carts, orders and best-sellers in one dashboard.']].map(([t,d])=><div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</section>
  <section className="cta"><h2>Ready to open your online shop?</h2><Link className="btn p lg" to="/signup">Start free</Link></section><Footer/></div>}
export function How(){
 const S=[['Add your products','Enter a name and price, or upload a photo and let AI write the description and tags.'],['Share your link','Pick your colours and publish. Your store lives at one short link you can post anywhere.'],['Get orders on WhatsApp','Customers fill their cart and tap order. You get a ready-to-read WhatsApp message and manage it in your dashboard.']]
 return <div className="mk"><Nav/><section className="how"><h1>How ShopLink works</h1>
  <ol>{S.map(([t,d],i)=><li className="card" key={t}><span className="num">{i+1}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}</ol>
  <h2>What the AI does for you</h2>
  <ul className="ck">{['Writes product descriptions and tags from a name or photo','Translates descriptions into regional languages','Suggests prices based on your own catalogue','Finds items customers buy together and suggests bundles','Summarises your week in plain words'].map(x=><li key={x}>{x}</li>)}</ul>
  <p className="note">You approve every suggestion before it goes live.</p><Link className="btn p lg" to="/signup">Start free</Link></section><Footer/></div>}
export const NotFound=()=><div className="center col"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><Link className="btn p" to="/">Go home</Link></div>
