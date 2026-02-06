import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  adminGetOrg,
  createOrgApiKey,
  getDefaultPrompt,
  listOrgApiKeys,
  setOrgLimits,
  setOrgPrompt,
  setToken,
  getToken,
  type ApiKeyInfo,
  type OrgDetailResponse,
  type Upload,
} from '../api'
import '../App.css'

export default function OrgDetail() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [org, setOrg] = useState<OrgDetailResponse | null>(null)
  const [defaultPrompt, setDefaultPrompt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customPromptInput, setCustomPromptInput] = useState('')
  const [promptStatus, setPromptStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [limitsMaxPdfs, setLimitsMaxPdfs] = useState<string>('')
  const [limitsMaxChars, setLimitsMaxChars] = useState<string>('')
  const [limitsUploadEnabled, setLimitsUploadEnabled] = useState<boolean>(true)
  const [limitsStatus, setLimitsStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(false)

  useEffect(() => {
    if (!getToken() || !orgId) {
      if (!orgId) navigate('/')
      else navigate('/login')
      return
    }
    Promise.all([adminGetOrg(orgId), getDefaultPrompt(), listOrgApiKeys(orgId)])
      .then(([orgData, promptData, keysData]) => {
        setOrg(orgData)
        setDefaultPrompt(promptData.content)
        setCustomPromptInput(orgData.custom_prompt ?? '')
        setApiKeys(keysData.api_keys)
        setLimitsMaxPdfs(String(orgData.max_pdfs ?? ''))
        setLimitsMaxChars(String(orgData.max_chars ?? ''))
        setLimitsUploadEnabled(orgData.upload_enabled ?? true)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load org')
        if (err instanceof Error && err.message.includes('401')) {
          setToken(null)
          navigate('/login')
        }
        if (err instanceof Error && err.message.includes('403')) {
          navigate('/')
        }
      })
      .finally(() => setLoading(false))
  }, [orgId, navigate])

  async function handleCreateApiKey() {
    if (!orgId) return
    setApiKeyLoading(true)
    setNewApiKey(null)
    try {
      const res = await createOrgApiKey(orgId)
      setNewApiKey(res.api_key)
      setApiKeys((prev) => [{ id: '', key_prefix: res.key_prefix, created_at: res.created_at }, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setApiKeyLoading(false)
    }
  }

  async function handleSetOrgPrompt(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setPromptStatus(null)
    setPromptLoading(true)
    try {
      await setOrgPrompt(orgId, customPromptInput.trim() || null)
      setPromptStatus({ type: 'ok', msg: 'Org prompt saved.' })
      setOrg((prev) => (prev ? { ...prev, custom_prompt: customPromptInput.trim() || null } : null))
    } catch (err) {
      setPromptStatus({ type: 'err', msg: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setPromptLoading(false)
    }
  }

  async function handleDeleteOrgPrompt() {
    if (!orgId) return
    setPromptStatus(null)
    setPromptLoading(true)
    try {
      await setOrgPrompt(orgId, null)
      setCustomPromptInput('')
      setOrg((prev) => (prev ? { ...prev, custom_prompt: null } : null))
      setPromptStatus({ type: 'ok', msg: 'Custom org prompt deleted.' })
    } catch (err) {
      setPromptStatus({ type: 'err', msg: err instanceof Error ? err.message : 'Failed to delete' })
    } finally {
      setPromptLoading(false)
    }
  }

  async function handleSetOrgLimits(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setLimitsStatus(null)
    setLimitsLoading(true)
    try {
      await setOrgLimits(orgId, {
        max_pdfs: limitsMaxPdfs.trim() ? parseInt(limitsMaxPdfs, 10) : undefined,
        max_chars: limitsMaxChars.trim() ? parseInt(limitsMaxChars, 10) : undefined,
        upload_enabled: limitsUploadEnabled,
      })
      setLimitsStatus({ type: 'ok', msg: 'Limits saved.' })
      const orgData = await adminGetOrg(orgId)
      setOrg(orgData)
      setLimitsMaxPdfs(String(orgData.max_pdfs ?? ''))
      setLimitsMaxChars(String(orgData.max_chars ?? ''))
      setLimitsUploadEnabled(orgData.upload_enabled ?? true)
    } catch (err) {
      setLimitsStatus({ type: 'err', msg: err instanceof Error ? err.message : 'Failed to save limits' })
    } finally {
      setLimitsLoading(false)
    }
  }

  function handleBack() {
    navigate('/')
  }

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  if (error && !loading) {
    return (
      <div className="app-main">
        <p className="error-msg">{error}</p>
        <button className="secondary" onClick={handleBack}>Back to dashboard</button>
      </div>
    )
  }

  if (!loading && !org) {
    return (
      <div className="app-main">
        <p className="error-msg">Org not found.</p>
        <button className="secondary" onClick={handleBack}>Back to dashboard</button>
      </div>
    )
  }

  const hasCustomPrompt = org?.custom_prompt != null && org?.custom_prompt.trim() !== ''

  return (
    <>
      <header className="app-header">
        <h1>Org: {org?.name ?? '—'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="secondary" onClick={handleBack}>
            Back to dashboard
          </button>
          <button type="button" className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <section className="dashboard-section">
          <p className="section-label">Organization</p>
          <h2>{org?.name ?? '—'}</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            ID: {org?.id ?? '—'} · Created: {org?.created_at ? new Date(org.created_at).toLocaleString() : '—'}
          </p>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{loading ? '—' : (org?.upload_count ?? 0)}</span>
              <span className="stat-label">Documents uploaded</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">Default prompt (always)</p>
          <h2>RAG default prompt</h2>
          <div className="card prompt-box">
            <pre className="prompt-content">{defaultPrompt || '—'}</pre>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">Org prompt (from outside)</p>
          <h2>Custom org prompt</h2>
          {hasCustomPrompt && (
            <div className="card prompt-box important-prompt">
              <span className="important-badge">Important</span>
              <pre className="prompt-content">{org?.custom_prompt}</pre>
              <button
                type="button"
                className="secondary"
                style={{ marginTop: '0.75rem' }}
                onClick={handleDeleteOrgPrompt}
                disabled={promptLoading}
              >
                {promptLoading ? 'Deleting…' : 'Delete custom org prompt'}
              </button>
            </div>
          )}
          <div className="card">
            <form onSubmit={handleSetOrgPrompt} className="rag-box">
              <textarea
                value={customPromptInput}
                onChange={(e) => setCustomPromptInput(e.target.value)}
                placeholder="Add org prompt from outside. When provided, it is shown with Important mark."
                rows={4}
              />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="submit" className="primary" disabled={promptLoading}>
                  {promptLoading ? 'Saving…' : 'Save org prompt'}
                </button>
                {(hasCustomPrompt || customPromptInput.trim()) && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={handleDeleteOrgPrompt}
                    disabled={promptLoading}
                  >
                    {promptLoading ? 'Clearing…' : 'Clear / delete custom prompt'}
                  </button>
                )}
              </div>
              {promptStatus && (
                <p className={promptStatus.type === 'ok' ? 'success-msg' : 'error-msg'}>{promptStatus.msg}</p>
              )}
            </form>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">Upload limits</p>
          <h2>Max PDFs, max chars, disable upload</h2>
          <div className="card">
            <form onSubmit={handleSetOrgLimits} className="rag-box">
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Max PDFs per org (default from server): <input type="number" min={0} value={limitsMaxPdfs} onChange={(e) => setLimitsMaxPdfs(e.target.value)} placeholder="e.g. 100" style={{ width: '8rem', marginLeft: '0.5rem' }} />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Max characters per PDF (default from server): <input type="number" min={0} value={limitsMaxChars} onChange={(e) => setLimitsMaxChars(e.target.value)} placeholder="e.g. 5000000" style={{ width: '10rem', marginLeft: '0.5rem' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="checkbox" checked={limitsUploadEnabled} onChange={(e) => setLimitsUploadEnabled(e.target.checked)} />
                Upload enabled
              </label>
              <button type="submit" className="primary" disabled={limitsLoading}>{limitsLoading ? 'Saving…' : 'Save limits'}</button>
              {limitsStatus && <p className={limitsStatus.type === 'ok' ? 'success-msg' : 'error-msg'} style={{ marginTop: '0.5rem' }}>{limitsStatus.msg}</p>}
            </form>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="section-label">API Keys</p>
          <h2>Chat UI / embed</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Create an API key for this org. Only one key active; creating a new one revokes the old.
          </p>
          <div className="card">
            <button
              type="button"
              className="primary"
              onClick={handleCreateApiKey}
              disabled={apiKeyLoading || !org}
            >
              {apiKeyLoading ? 'Creating…' : 'Create API key'}
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
          <p className="section-label">Documents</p>
          <h2>Upload list</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
          ) : (org?.uploads?.length ?? 0) === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No documents yet.</p>
          ) : (
            <ul className="uploads-list">
              {((org?.uploads ?? []) as Upload[]).map((u) => (
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
