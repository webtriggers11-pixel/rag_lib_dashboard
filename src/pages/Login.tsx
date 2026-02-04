import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, setToken, getToken } from '../api'
import './../App.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  useEffect(() => {
    if (getToken()) navigate('/', { replace: true })
  }, [navigate])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      setToken(res.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await register(email, password)
      setToken(res.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <p className="section-label">{showRegister ? 'Register first admin' : 'Sign in'}</p>
        <h1>RAG Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Strategize, build, and scale with your documents.
        </p>
        {showRegister ? (
          <form onSubmit={handleRegister}>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </button>
            <button
              type="button"
              className="secondary"
              style={{ marginTop: '0.5rem' }}
              onClick={() => { setShowRegister(false); setError(''); }}
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="secondary"
              style={{ marginTop: '0.5rem' }}
              onClick={() => { setShowRegister(true); setError(''); }}
            >
              First time? Register as admin
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
