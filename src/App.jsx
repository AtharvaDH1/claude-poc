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

// Auth disabled — all pages open freely
// Re-enable by switching: return user ? children : <Navigate to="/login" replace />
function ProtectedRoute({ children }) {
  return children
}

function PublicRoute({ children }) {
  return children
}

function IdleWarningBanner() {
  const { idleWarning, extendSession } = useAuth()
  if (!idleWarning) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#92400E', color:'#FEF3C7', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
      <span style={{ fontSize:'13px', fontWeight:600 }}>⚠️ Your session will expire in 1 minute due to inactivity.</span>
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
            <Route path="/login"             element={<PublicRoute><Login/></PublicRoute>} />
            <Route path="/dashboard"         element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
            <Route path="/policy-search"     element={<ProtectedRoute><PolicySearch/></ProtectedRoute>} />
            <Route path="/claim-search"      element={<ProtectedRoute><ClaimSearch/></ProtectedRoute>} />
            <Route path="/registration"      element={<ProtectedRoute><Registration/></ProtectedRoute>} />
            <Route path="/registration/:claimId" element={<ProtectedRoute><Registration/></ProtectedRoute>} />
            <Route path="/claim-view/:claimId"   element={<ProtectedRoute><ClaimView/></ProtectedRoute>} />
            <Route path="/pool-selection"    element={<ProtectedRoute><PoolSelection/></ProtectedRoute>} />
            <Route path="/my-task"           element={<ProtectedRoute><MyTask/></ProtectedRoute>} />
            <Route path="/add-screen"        element={<ProtectedRoute><AddScreen/></ProtectedRoute>} />
            <Route path="/fraud-prevention"  element={<ProtectedRoute><FraudPrevention/></ProtectedRoute>} />
            <Route path="/user-management"   element={<ProtectedRoute><UserManagement/></ProtectedRoute>} />
            <Route path="/audit-log"         element={<ProtectedRoute><AdminAuditLog/></ProtectedRoute>} />
            <Route path="/admin-reports"     element={<ProtectedRoute><AdminReports/></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><Profile/></ProtectedRoute>} />
            <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
