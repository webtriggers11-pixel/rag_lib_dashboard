import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVectorStore, getToken, me, setToken, type User } from '../api'
import type { VectorStoreResponse } from '../api'
import '../App.css'

export default function VectorStore() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<VectorStoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    me()
      .then((u) => {
        setUser(u)
        if (u.role !== 'admin') {
          navigate('/')
          return
        }
        return getVectorStore()
      })
      .then((res) => {
        if (res) setData(res)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load vector store')
        if (err instanceof Error && (err.message.includes('403') || err.message.includes('401'))) {
          setToken(null)
          navigate('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading || !user) {
    return (
      <div className="app-main">
        <p style={{ color: 'var(--text-muted)' }}>Loading PG Vector…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-main">
        <p className="error-msg">{error}</p>
        <button className="secondary" onClick={() => navigate('/')}>Back to dashboard</button>
      </div>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>PG Vector Store</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="secondary" onClick={() => navigate('/')}>
            Back to Admin
          </button>
        </div>
      </header>
      <main className="app-main">
        <section className="dashboard-section">
          <p className="section-label">Stats</p>
          <h2>Collection: {data?.collection_name ?? '—'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Total embeddings: <strong>{data?.total_embeddings ?? 0}</strong>
          </p>
        </section>
        <section className="dashboard-section">
          <p className="section-label">Recent chunks (up to 100)</p>
          {data?.recent?.length ? (
            <ul className="uploads-list" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {data.recent.map((r) => (
                <li key={r.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {r.id}
                    {Object.keys(r.metadata).length > 0 && (
                      <span style={{ marginLeft: '0.5rem' }}> · {JSON.stringify(r.metadata)}</span>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {r.document_preview || '(empty)'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No embeddings yet.</p>
          )}
        </section>
      </main>
    </>
  )
}
