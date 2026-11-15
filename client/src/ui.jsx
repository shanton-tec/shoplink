import {createContext,useContext,useState,useCallback,useEffect} from 'react'
export const inr=n=>'\u20B9'+Number(n||0).toLocaleString('en-IN')
export const Spinner=()=><span className="spin" role="status" aria-label="Loading"/>
export const Skel=({h=80,n=1})=>Array.from({length:n},(_,i)=><div key={i} className="skel" style={{height:h}}/>)
export function ErrorState({error,retry}){return <div className="state" role="alert"><h3>Something went wrong</h3><p>{error?.message||'Please try again.'}</p>{retry&&<button className="btn" onClick={retry}>Try again</button>}</div>}
export const Empty=({title,text,children})=><div className="state"><h3>{title}</h3><p>{text}</p>{children}</div>
export const Field=({label,error,children})=><label className="field"><span>{label}</span>{children}{error&&<em role="alert">{error}</em>}</label>
const T=createContext(()=>{})
export const useToast=()=>useContext(T)
export function Toasts({children}){
 const [l,set]=useState([])
 const add=useCallback((msg,kind='ok')=>{const id=Math.random();set(x=>[...x,{id,msg,kind}]);setTimeout(()=>set(x=>x.filter(t=>t.id!==id)),4000)},[])
 return <T.Provider value={add}>{children}<div className="toasts" aria-live="polite">{l.map(t=><div key={t.id} className={'toast '+t.kind}>{t.msg}</div>)}</div></T.Provider>}
export function Modal({title,onClose,children}){
 useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[onClose])
 return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="mh"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">&times;</button></div>{children}</div></div>}
