import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Apple, ArrowDownRight, ArrowRight, Bell, Check, CheckCircle2, ChevronDown,
  CircleAlert, Clock3, Leaf, LogOut, Menu, Package, Plus, Search, ShieldCheck,
  Sprout, Trash2, TrendingDown, Utensils, X, Pencil, LayoutDashboard
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Meat & Seafood', 'Bakery', 'Grains', 'Snacks', 'Beverages', 'Other']
const units = ['pcs', 'kg', 'g', 'L', 'ml', 'packs', 'bottles']

function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target - today) / 86400000)
}

function freshness(item) {
  if (item.status !== 'available') return item.status
  const days = daysUntil(item.expiry_date)
  if (days < 0) return 'expired'
  if (days <= 3) return 'soon'
  return 'fresh'
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (authError) throw authError
        if (data.session) onAuth(data.session.user)
        else setMessage('Account created. Check your email to confirm your account, then sign in.')
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
        onAuth(data.user)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand brand-light"><span className="brand-mark"><Leaf size={21} /></span><span>freshtrack</span></div>
        <div className="auth-visual-copy">
          <span className="eyebrow light-eyebrow">A FRESHER WAY TO LIVE</span>
          <h1>Love your food.<br /><em>Waste less.</em></h1>
          <p>A little more planning. A lot less waste. Keep your kitchen fresh and make every ingredient count.</p>
          <div className="visual-pills"><span><Sprout size={15}/> Eat mindfully</span><span><Apple size={15}/> Save food</span></div>
        </div>
        <div className="produce-art" aria-hidden="true">
          <div className="produce-circle circle-one"><Apple size={76}/></div>
          <div className="produce-circle circle-two"><Leaf size={66}/></div>
          <div className="produce-circle circle-three"><Sprout size={54}/></div>
          <span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✳</span>
        </div>
        <div className="auth-visual-footer">SMALL HABITS. BIG IMPACT.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-top-note">YOUR KITCHEN, IN GOOD HANDS <span>✳</span></div>
        <div className="auth-card">
          <div className="mobile-brand brand"><span className="brand-mark"><Leaf size={20}/></span><span>freshtrack</span></div>
          <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'START FRESH'}</span>
          <h2>{mode === 'login' ? 'Sign in to FreshTrack' : 'Create your account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Your fresh food journey continues here.' : 'Join us and make food waste a thing of the past.'}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required minLength={2}/></label>}
            <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
            <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></label>
            {error && <div className="alert error"><CircleAlert size={17}/>{error}</div>}
            {message && <div className="alert success"><CheckCircle2 size={17}/>{message}</div>}
            <button className="primary-btn full-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17}/></button>
          </form>
          <div className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('')}}>{mode==='login'?'Create account':'Sign in'}</button></div>
          <div className="auth-secure"><ShieldCheck size={15}/> Your food inventory is private to your account.</div>
        </div>
        <div className="auth-bottom">FRESH FOOD, LESS WASTE, BETTER TOMORROW.</div>
      </section>
    </main>
  )
}

const emptyForm = { name:'', category:'Fruits', quantity:'1', unit:'pcs', expiry_date:'', notes:'' }

function FoodModal({ item, onClose, onSave, saving }) {
  const [form, setForm] = useState(item ? {
    name:item.name, category:item.category, quantity:String(item.quantity), unit:item.unit,
    expiry_date:item.expiry_date, notes:item.notes || '',
  } : emptyForm)
  const [error, setError] = useState('')
  function update(key, value) { setForm(old=>({...old,[key]:value})) }
  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please enter a food name.')
    if (!form.expiry_date) return setError('Please select an expiry date.')
    if (Number(form.quantity) <= 0) return setError('Quantity must be greater than zero.')
    const result = await onSave({...form, name:form.name.trim(), quantity:Number(form.quantity)})
    if (result?.error) setError(result.error)
  }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <form className="food-modal" onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">{item?'UPDATE INVENTORY':'ADD TO YOUR PANTRY'}</span><h2>{item?'Edit food item':'Add food item'}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={19}/></button></div>
      <label>Food name<input autoFocus value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Avocados" maxLength={80}/></label>
      <div className="form-grid">
        <label>Category<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Expiry date<input type="date" value={form.expiry_date} onChange={e=>update('expiry_date',e.target.value)} min="2000-01-01"/></label>
        <label>Quantity<input type="number" min="0.01" step="0.01" value={form.quantity} onChange={e=>update('quantity',e.target.value)}/></label>
        <label>Unit<select value={form.unit} onChange={e=>update('unit',e.target.value)}>{units.map(u=><option key={u}>{u}</option>)}</select></label>
      </div>
      <label>Notes <span className="optional">(optional)</span><textarea value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Storage tips, meal ideas…" rows="3" maxLength="300"/></label>
      {error && <div className="alert error"><CircleAlert size={16}/>{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving}>{saving?'Saving…':item?'Save changes':'Add to inventory'} <ArrowRight size={16}/></button></div>
    </form>
  </div>
}

function AppDashboard({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase.from('food_items').select('*').order('expiry_date', { ascending:true })
    if (error) setToast(error.message)
    else setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const active = items.filter(i=>i.status==='available')
  const soon = active.filter(i=>freshness(i)==='soon')
  const expired = active.filter(i=>freshness(i)==='expired')
  const consumed = items.filter(i=>i.status==='consumed')
  const wasted = items.filter(i=>i.status==='wasted')
  const filtered = useMemo(()=>items.filter(item=>{
    const matchesQuery = `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    const state = freshness(item)
    const matchesFilter = filter==='all' || (filter==='available' && item.status==='available') || state===filter || item.status===filter
    return matchesQuery && matchesFilter
  }),[items,query,filter])

  async function saveItem(form) {
    setSaving(true)
    const payload = {...form, user_id:user.id}
    const request = modal?.item
      ? supabase.from('food_items').update(payload).eq('id',modal.item.id)
      : supabase.from('food_items').insert(payload)
    const {error} = await request
    setSaving(false)
    if (error) return {error:error.message}
    setModal(null); setToast(modal?.item?'Food item updated.':'Food item added.'); await loadItems()
    return {ok:true}
  }

  async function changeStatus(item, status) {
    const {error} = await supabase.from('food_items').update({status}).eq('id',item.id)
    if (error) setToast(error.message)
    else {setToast(status==='consumed'?'Marked as consumed.':'Marked as wasted.'); await loadItems()}
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete ${item.name} from your inventory?`)) return
    const {error} = await supabase.from('food_items').delete().eq('id',item.id)
    if (error) setToast(error.message)
    else {setToast('Food item deleted.'); await loadItems()}
  }

  async function signOut() { await supabase.auth.signOut() }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  const wasteRate = consumed.length+wasted.length ? Math.round(wasted.length/(consumed.length+wasted.length)*100) : 0

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}>
      <div className="brand"><span className="brand-mark"><Leaf size={21}/></span><span>freshtrack</span></div>
      <div className="side-label">WORKSPACE</div>
      <button className="side-link active"><LayoutDashboard size={18}/> Overview</button>
      <button className="side-link" onClick={()=>{setFilter('available');setMobileNav(false)}}><Package size={18}/> My inventory <span className="side-count">{active.length}</span></button>
      <button className="side-link" onClick={()=>{setFilter('soon');setMobileNav(false)}}><Clock3 size={18}/> Expiring soon <span className="side-count warning-count">{soon.length}</span></button>
      <div className="sidebar-bottom">
        <div className="impact-card"><div className="impact-icon"><Sprout size={19}/></div><strong>Every bite counts.</strong><p>Use what you have before buying more. Your planet says thanks.</p><span>✳ SMALL STEPS, BIG CHANGE</span></div>
        <div className="profile-row"><div className="avatar">{displayName.slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{displayName}</strong><span>{user.email}</span></div><button className="logout-btn" onClick={signOut} title="Sign out"><LogOut size={17}/></button></div>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-btn" onClick={()=>setMobileNav(!mobileNav)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})}</span><div className="top-avatar">{displayName.slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">YOUR FRESH STARTS HERE</span><h1>Good food, <em>good mood.</em></h1><p>Here's what's happening in your kitchen today, {displayName}.</p></div><button className="primary-btn add-main" onClick={()=>setModal({item:null})}><Plus size={18}/> Add food item</button></section>
        <section className="hero-banner"><div className="hero-banner-copy"><span className="hero-tag"><Leaf size={14}/> FRESHNESS CHECK</span><h2>{soon.length ? `${soon.length} ${soon.length===1?'item needs':'items need'} your attention.` : 'Your kitchen is looking fresh!'}</h2><p>{soon.length ? 'Use these items soon to keep good food out of the bin.' : 'Keep adding your groceries and we’ll help you stay ahead of expiry dates.'}</p><button onClick={()=>setFilter('soon')}>View expiring items <ArrowRight size={16}/></button></div><div className="banner-illustration"><div className="banner-plate"><Apple size={67}/><Leaf size={38}/></div><span className="banner-star star-a">✳</span><span className="banner-star star-b">✳</span><span className="banner-dot"/></div></section>
        <section className="stats-grid">
          <StatCard icon={<Package/>} label="Total in pantry" value={active.length} note="Currently available" tone="green"/>
          <StatCard icon={<Clock3/>} label="Expiring soon" value={soon.length} note="Within 3 days" tone="amber"/>
          <StatCard icon={<CircleAlert/>} label="Past expiry" value={expired.length} note="Needs your attention" tone="rose"/>
          <StatCard icon={<CheckCircle2/>} label="Food saved" value={consumed.length} note="Items consumed" tone="blue"/>
        </section>
        <section className="content-card inventory-card">
          <div className="section-heading"><div><span className="eyebrow">KEEP AN EYE ON IT</span><h2>Your food inventory <span className="item-total">{items.length}</span></h2><p>A little visibility goes a long way.</p></div><button className="secondary-btn" onClick={()=>setModal({item:null})}><Plus size={16}/> Add item</button></div>
          <div className="inventory-tools"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search food or category…"/></div><div className="filter-wrap"><ChevronDown size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All items</option><option value="available">Available</option><option value="fresh">Fresh</option><option value="soon">Expiring soon</option><option value="expired">Expired</option><option value="consumed">Consumed</option><option value="wasted">Wasted</option></select></div></div>
          {loading ? <div className="loading-state">Loading your pantry…</div> : filtered.length===0 ? <div className="empty-state"><div className="empty-icon"><Apple size={26}/></div><h3>{items.length?'No matching food items':'Your pantry is waiting!'}</h3><p>{items.length?'Try another search or filter.':'Add your first food item to start tracking freshness.'}</p>{!items.length && <button className="primary-btn" onClick={()=>setModal({item:null})}><Plus size={17}/> Add your first item</button>}</div> : <div className="food-list">{filtered.map(item=><FoodRow key={item.id} item={item} onEdit={()=>setModal({item})} onStatus={changeStatus} onDelete={deleteItem}/>)}</div>}
        </section>
        <section className="bottom-grid">
          <div className="content-card waste-card"><div className="mini-card-head"><div className="mini-icon"><TrendingDown size={18}/></div><span className="eyebrow">WASTE WATCH</span></div><h3>{wasteRate}% <span>waste rate</span></h3><div className="progress-track"><div className="progress-fill" style={{width:`${wasteRate}%`}}/></div><p>{wasted.length} wasted · {consumed.length} consumed. {wasteRate===0?'Keep making mindful choices!':'Every improvement makes a difference.'}</p></div>
          <div className="content-card tip-card"><div className="tip-icon"><Utensils size={19}/></div><div><span className="eyebrow">FRESH TIP</span><h3>First in, first out.</h3><p>Place older groceries at the front of your fridge so they get used before newer ones.</p></div></div>
        </section>
        <footer className="app-footer"><span>freshtrack <span className="footer-dot">✳</span> eat fresh, waste less.</span><span>Made for a fresher tomorrow.</span></footer>
      </div>
    </main>
    {modal && <FoodModal item={modal.item} onClose={()=>setModal(null)} onSave={saveItem} saving={saving}/>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>
}

function StatCard({icon,label,value,note,tone}) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function FoodRow({item,onEdit,onStatus,onDelete}) {
  const state = freshness(item)
  const days = daysUntil(item.expiry_date)
  const statusText = item.status==='consumed'?'Consumed':item.status==='wasted'?'Wasted':state==='expired'?'Expired':state==='soon'?(days===0?'Expires today':`Expires in ${days}d`):'Fresh'
  const emoji = ({Fruits:'🍎',Vegetables:'🥬',Dairy:'🥛','Meat & Seafood':'🐟',Bakery:'🥖',Grains:'🌾',Snacks:'🥨',Beverages:'🧃',Other:'🥫'})[item.category] || '🥫'
  return <article className="food-row"><div className="food-emoji">{emoji}</div><div className="food-info"><strong>{item.name}</strong><span>{item.category} · {item.quantity} {item.unit}</span></div><div className="food-expiry"><span>BEST BEFORE</span><strong>{formatDate(item.expiry_date)}</strong></div><span className={`status-pill ${state}`}>{state==='fresh'&&<Check size={12}/>}{state==='soon'&&<Clock3 size={12}/>}{state==='expired'&&<CircleAlert size={12}/>}{statusText}</span><div className="row-actions">{item.status==='available' && <><button title="Mark consumed" onClick={()=>onStatus(item,'consumed')}><CheckCircle2 size={16}/></button><button title="Mark wasted" onClick={()=>onStatus(item,'wasted')}><Trash2 size={16}/></button><button title="Edit" onClick={onEdit}><Pencil size={16}/></button></>}<button title="Delete" onClick={()=>onDelete(item)}><X size={16}/></button></div></article>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) { setChecking(false); return }
    supabase.auth.getSession().then(({data})=>{setUser(data.session?.user || null);setChecking(false)})
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user || null))
    return ()=>subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <div className="setup-screen"><div className="setup-card"><div className="brand"><span className="brand-mark"><Leaf size={21}/></span><span>freshtrack</span></div><h1>One quick setup before your fresh start.</h1><p>Add your Supabase project URL and public anon key to the <code>.env</code> file. Then run the app again.</p><ol><li>Copy <code>.env.example</code> to <code>.env</code>.</li><li>Fill in <code>VITE_SUPABASE_URL</code>.</li><li>Fill in <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Run <code>npm run dev</code>.</li></ol></div></div>
  if (checking) return <div className="loading-screen"><div className="loader-leaf"><Leaf size={28}/></div><span>Getting things fresh…</span></div>
  return user ? <AppDashboard user={user}/> : <AuthScreen onAuth={setUser}/>
}
