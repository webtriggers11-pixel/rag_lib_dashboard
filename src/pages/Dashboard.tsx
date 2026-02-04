import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  orgCreateApiKey,
  orgDashboard,
  orgListApiKeys,
  uploadPdf,
  ragQuery,
  setToken,
  getToken,
  type ApiKeyInfo,
  type Org,
  type Upload,
} from '../api'
import './../App.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [org, setOrg] = useState<Org | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    Promise.all([orgDashboard(), orgListApiKeys()])
      .then(([data, keysData]) => {
        setOrg(data.org)
        setUploads(data.uploads)
        setApiKeys(keysData.api_keys)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        if (err instanceof Error && err.message.includes('401')) {
          setToken(null)
          navigate('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!org || !uploadFile) return
    setUploadStatus(null)
    try {
      const res = await uploadPdf(org.id, uploadFile)
      setUploadStatus({ type: 'ok', msg: `${res.message} (${res.chunks_stored} chunks)` })
      setUploadFile(null)
      const data = await orgDashboard()
      setUploads(data.uploads)
    } catch (err) {
      setUploadStatus({ type: 'err', msg: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  async function handleCreateApiKey() {
    if (!org) return
    setApiKeyLoading(true)
    setNewApiKey(null)
    try {
      const res = await orgCreateApiKey()
      setNewApiKey(res.api_key)
      setApiKeys((prev) => [{ id: '', key_prefix: res.key_prefix, created_at: res.created_at }, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setApiKeyLoading(false)
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!org || !question.trim()) return
    setQueryError('')
    setAnswer('')
    setQueryLoading(true)
    try {
      const res = await ragQuery(org.id, question.trim())
      setAnswer(res.answer)
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setQueryLoading(false)
    }
  }

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="app-main">
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="app-main">
        <p className="error-msg">{error || 'Organization not found.'}</p>
        <button className="secondary" onClick={() => navigate('/login')}>Back to login</button>
      </div>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>RAG Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{org.name}</span>
          <button type="button" className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <section className="dashboard-section">
          <p className="section-label">Your organization</p>
          <h2>{org.name}</h2>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{uploads.length}</span>
              <span className="stat-label">Documents uploaded</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">Documents</p>
          <h2>Upload & query</h2>
          <div className="rag-actions">
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Upload PDF</h3>
              <form onSubmit={handleUpload} className="rag-box">
                <div className="upload-area">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadFile && <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>{uploadFile.name}</p>}
                </div>
                <button type="submit" className="primary" disabled={!uploadFile}>
                  Upload
                </button>
                {uploadStatus && (
                  <p className={uploadStatus.type === 'ok' ? 'success-msg' : 'error-msg'}>
                    {uploadStatus.msg}
                  </p>
                )}
              </form>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Ask your documents</h3>
              <form onSubmit={handleQuery} className="rag-box">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know?"
                  rows={3}
                  disabled={queryLoading}
                />
                <button type="submit" className="primary" disabled={queryLoading || !question.trim()}>
                  {queryLoading ? 'Asking…' : 'Ask'}
                </button>
                {queryError && <p className="error-msg">{queryError}</p>}
                {answer && <div className="result">{answer}</div>}
              </form>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">API Keys</p>
          <h2>Chat UI / embed</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Create an API key to use the chat UI on your site. Max 3 keys per org.
          </p>
          <div className="card">
            <button
              type="button"
              className="primary"
              onClick={handleCreateApiKey}
              disabled={apiKeyLoading || apiKeys.length >= 3}
            >
              {apiKeyLoading ? 'Creating…' : apiKeys.length >= 3 ? 'Max 3 keys' : 'Create API key'}
            </button>
            {newApiKey && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <p className="section-label">Copy this key now — it won&apos;t be shown again.</p>
                <code style={{ wordBreak: 'break-all', display: 'block', padding: '0.5rem', background: 'var(--bg-secondary)' }}>{newApiKey}</code>
                <button
                  type="button"
                  className="secondary"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => navigator.clipboard.writeText(newApiKey)}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          {apiKeys.length > 0 && (
            <ul className="uploads-list" style={{ marginTop: '1rem' }}>
              {apiKeys.map((k) => (
                <li key={k.id || k.key_prefix}>
                  <span className="filename">{k.key_prefix}</span>
                  <span className="date">{k.created_at ? new Date(k.created_at).toLocaleString() : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <p className="section-label">Recent uploads</p>
          <h2>Document list</h2>
          {uploads.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No documents yet. Upload a PDF above.</p>
          ) : (
            <ul className="uploads-list">
              {uploads.map((u) => (
                <li key={u.id}>
                  <span className="filename">{u.filename}</span>
                  <span className="date">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
