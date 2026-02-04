import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { getToken, me, setToken, type User } from './api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import OrgDetail from './pages/OrgDetail'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DashboardByRole() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => {
        setToken(null)
        navigate('/login', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="app-main">
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }
  if (!user) {
    return null
  }
  if (user.role === 'admin') return <AdminDashboard />
  return <Dashboard />
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/org/:orgId" element={<ProtectedRoute><OrgDetail /></ProtectedRoute>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardByRole />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
