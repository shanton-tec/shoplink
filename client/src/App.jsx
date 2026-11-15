import {lazy,Suspense} from 'react'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import {AuthProvider,RequireAuth} from './auth'
import {Toasts,Spinner} from './ui'
import {Landing,How,NotFound} from './pages/Marketing'
import AuthPage from './pages/AuthPage'
import {AppLayout,Onboarding,Products,Orders,Builder,Settings} from './pages/Owner'
import Storefront from './pages/Storefront'
const Dashboard=lazy(()=>import('./pages/Dashboard'))
export default function App(){
 return <BrowserRouter><AuthProvider><Toasts><Suspense fallback={<div className="center"><Spinner/></div>}><Routes>
  <Route path="/" element={<Landing/>}/><Route path="/how" element={<How/>}/>
  <Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/>
  <Route path="/app" element={<RequireAuth><AppLayout/></RequireAuth>}>
   <Route index element={<Dashboard/>}/><Route path="onboarding" element={<Onboarding/>}/><Route path="products" element={<Products/>}/>
   <Route path="orders" element={<Orders/>}/><Route path="builder" element={<Builder/>}/><Route path="settings" element={<Settings/>}/></Route>
  <Route path="/s/:slug" element={<Storefront/>}/><Route path="*" element={<NotFound/>}/>
 </Routes></Suspense></Toasts></AuthProvider></BrowserRouter>}
