import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

const ICONS = {
  success: { Icon: CheckCircle, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  error:   { Icon: XCircle,     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  warning: { Icon: AlertCircle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  info:    { Icon: Info,        color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
}

function ToastItem({ id, type = 'info', title, message, onRemove }) {
  const { Icon, color, bg, border } = ICONS[type] || ICONS.info
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10)
    const t2 = setTimeout(() => { setVisible(false); setTimeout(() => onRemove(id), 300) }, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [id, onRemove])

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      background: bg, border: `1px solid ${border}`,
      borderRadius: '10px', padding: '12px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      minWidth: '280px', maxWidth: '360px',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: '2px', background: color,
        animation: 'toastProgress 3.5s linear forwards',
        opacity: 0.4,
      }} />
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{title}</div>
        {message && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>{message}</div>}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#64748B'}
        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>
        <X size={14} />
      </button>

      <style>{`@keyframes toastProgress { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((type, title, message) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, title, message }])
  }, [])

  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9999, alignItems: 'flex-end',
      }}>
        {toasts.map(t => <ToastItem key={t.id} {...t} onRemove={remove} />)}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
