import {useState} from 'react'
import {Link,useNavigate,useLocation} from 'react-router-dom'
import {useAuth} from '../auth'
import {Field,Spinner} from '../ui'
import {Logo} from './Marketing'
export default function AuthPage({mode}){
 const signup=mode==='signup',{login,signup:doSignup}=useAuth(),nav=useNavigate(),loc=useLocation()
 const [f,setF]=useState({name:'',email:'',password:''}),[err,setErr]=useState(null),[busy,setBusy]=useState(false)
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const submit=async e=>{e.preventDefault();setErr(null);setBusy(true)
  try{await(signup?doSignup(f):login({email:f.email,password:f.password}));nav(loc.state?.from||'/app',{replace:true})}
  catch(x){setErr(x);setBusy(false)}}
 return <div className="center col"><Logo/><form className="card auth" onSubmit={submit} noValidate>
  <h2>{signup?'Create your store':'Welcome back'}</h2>
  {signup&&<Field label="Your name" error={err?.message.includes('name')&&err.message}><input value={f.name} onChange={set('name')} autoComplete="name" required/></Field>}
  <Field label="Email"><input type="email" value={f.email} onChange={set('email')} autoComplete="email" required/></Field>
  <Field label="Password"><input type="password" value={f.password} onChange={set('password')} autoComplete={signup?'new-password':'current-password'} minLength={8} required/></Field>
  {err&&<p className="err" role="alert">{err.message}</p>}
  <button className="btn p lg" disabled={busy}>{busy?<Spinner/>:signup?'Sign up':'Log in'}</button>
  <p className="alt">{signup?<>Already have a store? <Link to="/login">Log in</Link></>:<>New here? <Link to="/signup">Create a store</Link></>}</p></form></div>}
