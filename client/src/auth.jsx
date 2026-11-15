import {createContext,useContext,useEffect,useState} from 'react'
import {Navigate,useLocation} from 'react-router-dom'
import {api} from './api'
import {Spinner} from './ui'
const A=createContext(null)
export const useAuth=()=>useContext(A)
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[ready,setReady]=useState(false)
 useEffect(()=>{api.get('/auth/me').then(d=>setUser(d.user)).catch(()=>{}).finally(()=>setReady(true))},[])
 const login=async b=>setUser((await api.post('/auth/login',b)).user)
 const signup=async b=>setUser((await api.post('/auth/signup',b)).user)
 const logout=async()=>{await api.post('/auth/logout');setUser(null)}
 return <A.Provider value={{user,ready,login,signup,logout}}>{children}</A.Provider>}
export function RequireAuth({children}){
 const {user,ready}=useAuth(),loc=useLocation()
 if(!ready)return <div className="center"><Spinner/></div>
 return user?children:<Navigate to="/login" state={{from:loc.pathname}} replace/>}
