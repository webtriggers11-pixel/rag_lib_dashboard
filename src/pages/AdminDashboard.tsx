import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminDashboard,
  registerOrgUser,
  setToken,
  getToken,
  type OrgWithUploadCount,
} from '../api'
import '../App.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState<OrgWithUploadCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [regOrgName, setRegOrgName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regStatus, setRegStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    adminDashboard()
      .then((data) => setOrgs(data.orgs))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        if (err instanceof Error && (err.message.includes('403') || err.message.includes('401'))) {
          setToken(null)
          navigate('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  async function handleRegisterOrgUser(e: React.FormEvent) {
    e.preventDefault()
    if (!regOrgName.trim() || !regEmail.trim() || !regPassword) return
    setRegStatus(null)
    setRegLoading(true)
    try {
      await registerOrgUser(regOrgName.trim(), regEmail.trim(), regPassword)
      setRegStatus({ type: 'ok', msg: 'Org and user created. They can log in with that email and password.' })
      setRegOrgName('')
      setRegEmail('')
      setRegPassword('')
      const data = await adminDashboard()
      setOrgs(data.orgs)
    } catch (err) {
      setRegStatus({ type: 'err', msg: err instanceof Error ? err.message : 'Failed to register org user' })
    } finally {
      setRegLoading(false)
    }
  }

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  if (error && !loading) {
    return (
      <div className="app-main">
        <p className="error-msg">{error}</p>
        <button className="secondary" onClick={() => navigate('/login')}>Back to login</button>
      </div>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="secondary" onClick={() => navigate('/admin/vector')}>
            PG Vector
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Admin</span>
          <button type="button" className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <section className="dashboard-section">
          <p className="section-label">Organizations</p>
          <h2>All orgs</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
          ) : orgs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No organizations yet. Create one below.</p>
          ) : (
            <ul className="uploads-list org-list-clickable">
              {orgs.map((o) => (
                <li key={o.id} onClick={() => navigate(`/org/${o.id}`)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/org/${o.id}`)}>
                  <span className="filename">{o.name}</span>
                  <span className="date">{o.upload_count} uploads · {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <p className="section-label">Register org + user</p>
          <h2>New org + user (they can log in separately)</h2>
          <div className="card">
            <form onSubmit={handleRegisterOrgUser} className="rag-box">
              <input
                type="text"
                value={regOrgName}
                onChange={(e) => setRegOrgName(e.target.value)}
                placeholder="Organization name"
                required
              />
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="User email"
                required
              />
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                minLength={8}
                required
              />
              <button type="submit" className="primary" disabled={regLoading}>
                {regLoading ? 'Creating…' : 'Create org & user'}
              </button>
              {regStatus && (
                <p className={regStatus.type === 'ok' ? 'success-msg' : 'error-msg'}>{regStatus.msg}</p>
              )}
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
