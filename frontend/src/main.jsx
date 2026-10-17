import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search, Plus, Landmark, X, ArrowUpRight, CircleCheck, Clock3, AlertCircle, Inbox } from 'lucide-react'
import './styles.css'

const statuses = ['New', 'Contacted', 'In Progress', 'Approved', 'Declined']
const types = ['Home Loan', 'Refinance', 'Investment', 'Vehicle Finance']
const blank = { customer_name: '', email: '', loan_type: 'Home Loan', amount: '', notes: '' }
const money = amount => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount)

async function api(path, options = {}) {
  let response
  try { response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }) }
  catch { throw new Error('Cannot connect to the API. Check that the backend is running.') }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = Array.isArray(data.detail) ? data.detail.map(e => e.msg).join('; ') : data.detail
    throw new Error(message || `Request failed (${response.status})`)
  }
  return response.json()
}

function App() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh() {
    setLoading(true)
    try { setItems(await api('/enquiries')); setError('') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [])
  const filtered = useMemo(() => items.filter(item => item.customer_name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All statuses' || item.status === statusFilter)), [items, search, statusFilter])
  const approved = items.filter(item => item.status === 'Approved').length
  const active = items.filter(item => ['New', 'Contacted', 'In Progress'].includes(item.status)).length

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const result = await api('/enquiries', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      setItems(old => [result, ...old]); setForm(blank); setOpen(false); setNotice('Enquiry created successfully.')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  async function changeStatus(id, status) {
    setError('')
    try {
      const updated = await api(`/enquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setItems(old => old.map(item => item.id === id ? updated : item))
      setNotice('Status updated.')
    } catch (err) { setError(err.message) }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Landmark size={22}/></div><span>mortgage<span className="brand-accent">flow</span><small>Enquiry workspace</small></span></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav-selected"><Inbox size={18}/> Enquiries <span className="nav-count">{items.length}</span></div>
      <div className="sidebar-bottom"><div className="avatar">MF</div><div><strong>Demo workspace</strong><small>Local portfolio application</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><span>Workspace <span className="crumb">/ Enquiries</span></span><span className="demo-pill"><span className="dot"/> DEMO ENVIRONMENT</span></header>
      <div className="content">
        <div className="heading-row"><div><div className="eyebrow">CUSTOMER RELATIONSHIPS</div><h1>Enquiry management</h1><p className="subtitle">Keep track of enquiries, follow-ups and application progress.</p></div><button className="primary" onClick={() => { setError(''); setOpen(true) }}><Plus size={18}/> New enquiry</button></div>
        <div className="stats">
          <div className="stat"><div className="stat-title">Total enquiries <ArrowUpRight size={16}/></div><div className="stat-value">{items.length}</div><div className="stat-sub">All enquiries recorded</div></div>
          <div className="stat"><div className="stat-title">Active pipeline <Clock3 size={16}/></div><div className="stat-value">{active}</div><div className="stat-sub">Awaiting a final outcome</div></div>
          <div className="stat"><div className="stat-title">Approved <CircleCheck size={16}/></div><div className="stat-value">{approved}</div><div className="stat-sub">Applications marked approved</div></div>
        </div>
        {error && <div className="alert error"><AlertCircle size={18}/>{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
        {notice && <div className="alert success"><CircleCheck size={18}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16}/></button></div>}
        <section className="panel"><div className="panel-head"><div><h2>All enquiries</h2><p>Manage your customer enquiry pipeline</p></div><span className="results">{filtered.length} results</span></div>
          <div className="toolbar"><label className="search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name..." aria-label="Search by customer name"/></label><select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>LOAN TYPE</th><th>AMOUNT</th><th>CREATED</th><th>STATUS</th></tr></thead><tbody>
            {filtered.map(item => <tr key={item.id}><td><div className="customer"><div className="initial">{item.customer_name.charAt(0).toUpperCase()}</div><div><strong>{item.customer_name}</strong><small>{item.email}</small></div></div></td><td>{item.loan_type}</td><td className="amount">{money(item.amount)}</td><td>{new Date(item.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><select className={'status status-' + item.status.toLowerCase().replaceAll(' ', '-')} value={item.status} onChange={e => changeStatus(item.id, e.target.value)} aria-label={`Status for ${item.customer_name}`}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan="5"><div className="empty"><Inbox size={30}/><strong>No enquiries found</strong><span>{items.length ? 'Try another search or filter.' : 'Create your first enquiry to get started.'}</span></div></td></tr>}
            {loading && <tr><td colSpan="5" className="loading">Loading enquiries...</td></tr>}
          </tbody></table></div>
        </section><footer>MortgageFlow · Demonstration software only · Use fictional customer data</footer>
      </div>
    </main>
    {open && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><h2 id="modal-title">New enquiry</h2><p>Add a fictional customer enquiry to the pipeline.</p></div><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={20}/></button></div><form onSubmit={submit}><div className="form-grid"><label>Customer name<input required minLength="2" maxLength="120" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="e.g. Jordan Smith"/></label><label>Email address<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jordan@example.test"/></label><label>Loan type<select value={form.loan_type} onChange={e => setForm({ ...form, loan_type: e.target.value })}>{types.map(t => <option key={t}>{t}</option>)}</select></label><label>Requested amount (AUD)<input type="number" min="1" max="100000000" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="450000"/></label><label className="full">Notes (optional)<textarea rows="3" maxLength="2000" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this enquiry"/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Create enquiry'}</button></div></form></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
