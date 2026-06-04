import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import PolicySearch   from './pages/PolicySearch'
import ClaimSearch    from './pages/ClaimSearch'
import Registration   from './pages/Registration/index'
import ClaimView      from './pages/ClaimView'
import PoolSelection  from './pages/PoolSelection'
import MyTask         from './pages/MyTask'
import AddScreen      from './pages/AddScreen'
import UserManagement from './pages/UserManagement'
import AdminAuditLog  from './pages/AdminAuditLog'
import AdminReports   from './pages/AdminReports'
import FraudPrevention from './pages/FraudPrevention'
import Profile        from './pages/Profile'

function ProtectedRoute({ children, requiredRole }) {
  const { authenticated, loading, hasRole } = useAuth()
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'Inter,sans-serif', color:'#64748B' }}>
        Loading…
      </div>
    )
  }
  if (!authenticated) return <Navigate to="/login" replace />
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { authenticated, loading } = useAuth()
  if (loading) return null
  if (authenticated) return <Navigate to="/dashboard" replace />
  return children
}

function IdleWarningBanner() {
  const { idleWarning, extendSession } = useAuth()
  if (!idleWarning) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#92400E', color:'#FEF3C7', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
      <span style={{ fontSize:'13px', fontWeight:600 }}>Your session will expire in 1 minute due to inactivity.</span>
      <button onClick={extendSession} style={{ padding:'6px 16px', borderRadius:'6px', border:'1px solid #FDE68A', background:'rgba(255,255,255,0.15)', color:'#FEF3C7', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
        Keep me signed in
      </button>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <IdleWarningBanner />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login/></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
            <Route path="/policy-search" element={<ProtectedRoute requiredRole={['Pre Assessor']}><PolicySearch/></ProtectedRoute>} />
            <Route path="/claim-search" element={<ProtectedRoute><ClaimSearch/></ProtectedRoute>} />
            <Route path="/registration" element={<ProtectedRoute requiredRole={['Pre Assessor']}><Registration/></ProtectedRoute>} />
            <Route path="/registration/:claimId" element={<ProtectedRoute requiredRole={['Pre Assessor']}><Registration/></ProtectedRoute>} />
            <Route path="/claim-view/:claimId" element={<ProtectedRoute><ClaimView/></ProtectedRoute>} />
            <Route path="/pool-selection" element={<ProtectedRoute requiredRole={['Assessor','Verifier']}><PoolSelection/></ProtectedRoute>} />
            <Route path="/my-task" element={<ProtectedRoute requiredRole={['Assessor','Verifier']}><MyTask/></ProtectedRoute>} />
            <Route path="/add-screen" element={<ProtectedRoute requiredRole={['Assessor','Verifier']}><AddScreen/></ProtectedRoute>} />
            <Route path="/fraud-prevention" element={<ProtectedRoute requiredRole={['Assessor','Verifier','Admin','admin']}><FraudPrevention/></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute requiredRole={['Admin','admin']}><UserManagement/></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute requiredRole={['Admin','admin']}><AdminAuditLog/></ProtectedRoute>} />
            <Route path="/admin-reports" element={<ProtectedRoute requiredRole={['Admin','admin']}><AdminReports/></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
