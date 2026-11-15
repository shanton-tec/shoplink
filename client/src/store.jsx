import {inr} from './ui'
const FONTS={sans:'"DM Sans",system-ui,sans-serif',serif:'Georgia,"Times New Roman",serif',rounded:'"Nunito",ui-rounded,system-ui,sans-serif'}
export const themeVars=t=>({'--p':t?.primary||'#0f766e','--a':t?.accent||'#f5b82e','--f':FONTS[t?.font||'sans']})
export const PhoneFrame=({theme,children})=><div className="phone"><div className="notch"/><div className="screen" style={themeVars(theme)}>{children}</div></div>
export function StoreView({shop,products,cart,onAdd,onOpen}){
 return <div className="sv">
  <div className="sv-h">{shop.logo?<img src={shop.logo} alt=""/>:<span className="sv-i">{(shop.name||'S')[0]}</span>}<div><b>{shop.name||'Your shop'}</b><small>{shop.tagline||'Your tagline appears here'}</small></div></div>
  <div className={'sv-g '+(shop.theme?.layout||'grid')}>
   {products.map(p=><div className="sv-c" key={p._id}>
    <button className="sv-img" onClick={()=>onOpen&&onOpen(p)} aria-label={'View '+p.name} disabled={!onOpen}>{p.images?.[0]?<img src={p.images[0]} alt={p.name} loading="lazy"/>:<span>{p.name[0]}</span>}</button>
    <div className="sv-b"><b>{p.name}</b><span>{inr(p.price)}</span>
     <button className="sv-add" onClick={()=>onAdd&&onAdd(p)} disabled={!onAdd||(p.stock!=null&&p.stock<1)}>{p.stock!=null&&p.stock<1?'Sold out':cart&&cart[p._id]?`Added (${cart[p._id]})`:'Add'}</button></div></div>)}
   {!products.length&&<p className="sv-e">Products you add will show here.</p>}
  </div></div>}
