import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const DEMO = [
  { username: 'preassessor', role: 'Pre Assessor', color: '#1D4ED8' },
  { username: 'assessor',    role: 'Assessor',     color: '#0891B2' },
  { username: 'verifier',    role: 'Verifier',     color: '#7C3AED' },
  { username: 'admin',       role: 'Admin',        color: '#0F172A' },
]

const FEATURES = [
  { icon: '🔐', text: 'End-to-end encrypted claim data with full audit trail' },
  { icon: '⚡', text: 'Role-based pipeline: Pre-Assessor → Assessor → Verifier' },
  { icon: '📊', text: 'Real-time dashboards and claim analytics' },
  { icon: '🛡️', text: 'Auto-lockout after failed attempts with session monitoring' },
]

const LIVE_STATS = [
  { label: 'Claims Today',    value: 48,   decimals: 0, prefix: '',  suffix: ''   },
  { label: 'Pipeline Value',  value: 48.7, decimals: 1, prefix: '₹', suffix: 'L' },
  { label: 'SLA Compliance',  value: 94.2, decimals: 1, prefix: '',  suffix: '%' },
  { label: 'Avg. Resolution', value: 3.2,  decimals: 1, prefix: '',  suffix: 'd' },
]

function useCountUp(target, decimals = 0, duration = 1600, delay = 0) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      let raf
      const t0 = performance.now()
      const tick = now => {
        const p = Math.min((now - t0) / duration, 1)
        setV(parseFloat(((1 - Math.pow(1 - p, 4)) * target).toFixed(decimals)))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay, decimals])
  return v
}

function StatTile({ stat, delay }) {
  const val = useCountUp(stat.value, stat.decimals, 1600, delay)
  return (
    <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'16px', backdropFilter:'blur(8px)' }}>
      <div style={{ fontSize:'26px', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>
        {stat.prefix}{val.toLocaleString()}{stat.suffix}
      </div>
      <div style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.4)', marginTop:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {stat.label}
      </div>
    </div>
  )
}

function FloatingInput({ label, type='text', value, onChange, onKeyDown, onKeyUp, autoFocus, inputRef, rightSlot, error }) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div style={{ position:'relative', marginBottom: error ? '6px' : '0' }}>
      <div style={{
        position:'relative', borderRadius:'10px', overflow:'hidden',
        border:`1.5px solid ${error ? '#FCA5A5' : focused ? '#1D4ED8' : '#E2E8F0'}`,
        background: error ? '#FFF5F5' : focused ? '#fff' : '#F8FAFC',
        boxShadow: error
          ? '0 0 0 3px rgba(239,68,68,0.1)'
          : focused
          ? '0 0 0 3px rgba(29,78,216,0.12), 0 1px 4px rgba(0,0,0,0.04)'
          : '0 1px 2px rgba(0,0,0,0.04)',
        transition:'all 0.2s ease',
      }}>
        <label style={{
          position:'absolute', left:'14px',
          top: lifted ? '8px' : '50%',
          transform: lifted ? 'translateY(0) scale(0.8)' : 'translateY(-50%)',
          transformOrigin:'left',
          fontSize:'14px', fontWeight:600,
          color: error ? '#EF4444' : focused ? '#1D4ED8' : '#94A3B8',
          pointerEvents:'none', transition:'all 0.18s ease', letterSpacing:'-0.01em',
        }}>
          {label}
        </label>
        <input
          ref={inputRef} type={type} value={value}
          onChange={onChange} onKeyDown={onKeyDown} onKeyUp={onKeyUp}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          autoComplete={type === 'password' ? 'current-password' : 'username'}
          style={{
            width:'100%', height:'56px', padding:'20px 14px 8px',
            paddingRight: rightSlot ? '48px' : '14px',
            background:'transparent', border:'none', outline:'none',
            fontSize:'15px', fontWeight:600, color:'#0F172A',
            fontFamily:'Inter,sans-serif', letterSpacing:'-0.01em',
          }}
        />
        {rightSlot && <div style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)' }}>{rightSlot}</div>}
      </div>
      {error && <div style={{ fontSize:'12px', fontWeight:600, color:'#EF4444', marginTop:'5px', paddingLeft:'2px' }}>{error}</div>}
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const passRef   = useRef(null)

  const [form,      setForm]      = useState({ username:'', password:'' })
  const [showPass,  setShowPass]  = useState(false)
  const [capsLock,  setCapsLock]  = useState(false)
  const [rememberMe,setRememberMe]= useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [errors,    setErrors]    = useState({ username:'', password:'', general:'' })
  const [shake,     setShake]     = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [activeRole,setActiveRole]= useState(null)
  const [lastLogin, setLastLogin] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('poc_remember_user')
    if (saved) setForm(f => ({ ...f, username: saved }))
    const t = setTimeout(() => setMounted(true), 80)
    // Only fetch last login if user was previously logged in (has stored session)
    const storedUser = sessionStorage.getItem('poc_user')
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser)
        if (u.loginTime) setLastLogin(u.loginTime)
      } catch {}
    }
    return () => clearTimeout(t)
  }, [])

  const handleCaps = e => setCapsLock(e.getModifierState?.('CapsLock') ?? false)

  const validate = () => {
    const e = { username:'', password:'', general:'' }
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 4) e.password = 'Password too short'
    setErrors(e)
    return !e.username && !e.password
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) { triggerShake(); return }
    setLoading(true); setErrors({ username:'', password:'', general:'' })
    try {
      await login(form.username.trim(), form.password)
      if (rememberMe) localStorage.setItem('poc_remember_user', form.username.trim())
      else localStorage.removeItem('poc_remember_user')
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      setErrors(p => ({ ...p, general: err.message }))
      triggerShake()
    } finally { setLoading(false) }
  }

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600) }

  const fillRole = r => {
    setActiveRole(r.username)
    setForm({ username: r.username, password: 'password123' })
    setErrors({ username:'', password:'', general:'' })
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Inter,sans-serif', overflow:'hidden' }}>

      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex"
        style={{
          width:'45%', flexShrink:0, position:'relative', overflow:'hidden',
          background:'linear-gradient(160deg, #060E1F 0%, #0A1628 40%, #0D2244 70%, #0F2B5B 100%)',
          display:'flex', flexDirection:'column', padding:'48px',
          transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
          opacity: mounted ? 1 : 0,
          transition:'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease',
        }}>
        <div style={{ position:'absolute', top:'-24px', left:'-24px', width:'360px', height:'360px', borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-80px', right:'-80px', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, opacity:0.04, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', position:'relative', zIndex:1, animation:'fadeUp 0.5s 0.1s ease both' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', flexShrink:0, background:'#1D4ED8', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(29,78,216,0.5)', fontSize:'20px' }}>🛡️</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:'17px', letterSpacing:'-0.02em' }}>DH Digital</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', marginTop:'1px' }}>Life Claims Platform</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', justifyContent:'center', animation:'fadeUp 0.6s 0.2s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(29,78,216,0.2)', border:'1px solid rgba(29,78,216,0.35)', borderRadius:'99px', padding:'5px 14px', marginBottom:'24px', width:'fit-content' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 6px #4ADE80' }} />
            <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', fontWeight:600 }}>System Online</span>
          </div>

          <h1 style={{ color:'#fff', fontSize:'38px', fontWeight:900, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:'16px' }}>
            Resolving claims<br />
            <span style={{ background:'linear-gradient(90deg, #93C5FD, #60A5FA)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>faster than ever.</span>
          </h1>

          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'15px', lineHeight:1.7, maxWidth:'360px', marginBottom:'40px' }}>
            A modern platform for managing life insurance claims — from registration to resolution.
          </p>

          {/* Live stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
            {LIVE_STATS.map((s, i) => <StatTile key={s.label} stat={s} delay={400 + i * 80} />)}
          </div>

          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>{f.icon}</div>
                <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13.5px', lineHeight:1.6, paddingTop:'6px' }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position:'relative', zIndex:1, animation:'fadeUp 0.6s 0.4s ease both' }}>
          <div style={{ height:'1px', background:'rgba(255,255,255,0.08)', marginBottom:'20px' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'rgba(255,255,255,0.35)', fontSize:'12px' }}>✉️ claimssupport@dhdigital.co.in</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'rgba(255,255,255,0.35)', fontSize:'12px' }}>📞 +91 98923 94104</div>
          </div>
          <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', marginTop:'16px' }}>© 2025 Dark Horse Digital. All rights reserved.</div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div style={{
        flex:1, background:'#fff', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'40px 24px',
        position:'relative', overflow:'hidden',
        transform: mounted ? 'translateX(0)' : 'translateX(30px)',
        opacity: mounted ? 1 : 0,
        transition:'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease',
      }}>
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, #EFF6FF 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, #F0F9FF 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:'400px', position:'relative', zIndex:1 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'36px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#1D4ED8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', boxShadow:'0 4px 12px rgba(29,78,216,0.35)' }}>🛡️</div>
            <span style={{ fontWeight:800, fontSize:'15px', color:'#0F172A' }}>DH Digital — Life Claims</span>
          </div>

          <div style={{ marginBottom:'28px', animation:'fadeUp 0.5s 0.25s ease both', opacity:0, animationFillMode:'both' }}>
            <h2 style={{ fontSize:'26px', fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em', marginBottom:'6px' }}>Welcome back</h2>
            <p style={{ fontSize:'14px', color:'#64748B', fontWeight:500 }}>Sign in to continue to the claims platform.</p>
          </div>

          {/* Demo */}
          <div style={{ marginBottom:'24px', animation:'fadeUp 0.5s 0.35s ease both', opacity:0, animationFillMode:'both' }}>
            <p style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>Demo Accounts — password: password123</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {DEMO.map(d => {
                const on = activeRole === d.username
                return (
                  <button key={d.username} onClick={() => fillRole(d)}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', border:`1px solid ${on ? d.color : '#E2E8F0'}`, background: on ? d.color + '08' : '#fff', cursor:'pointer', transition:'all 0.15s ease', textAlign:'left', fontFamily:'Inter,sans-serif', boxShadow: on ? `0 0 0 3px ${d.color}20` : 'none' }}
                    onMouseEnter={e => { if(!on) { e.currentTarget.style.borderColor=d.color; e.currentTarget.style.background='#F8FAFC' } }}
                    onMouseLeave={e => { if(!on) { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#fff' } }}
                  >
                    <div style={{ width:'24px', height:'24px', borderRadius:'6px', background: on ? d.color : d.color + '15', color: on ? '#fff' : d.color, fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {d.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:700, color: on ? d.color : '#0F172A', fontFamily:'monospace' }}>{d.username}</div>
                      <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>{d.role}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {errors.general && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'10px', padding:'12px 14px', marginBottom:'20px', animation: shake ? 'shake 0.5s ease' : 'fadeIn 0.2s ease' }}>
              <span style={{ fontSize:'15px', flexShrink:0, marginTop:'1px' }}>⚠️</span>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#B91C1C' }}>Authentication failed</div>
                <div style={{ fontSize:'12px', color:'#991B1B', marginTop:'2px', fontWeight:500 }}>{errors.general}</div>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:'10px', padding:'12px 14px', marginBottom:'20px', animation:'fadeIn 0.2s ease' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#059669', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#065F46' }}>Login successful!</div>
                <div style={{ fontSize:'12px', color:'#047857', marginTop:'1px' }}>Redirecting to your dashboard...</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ animation:'fadeUp 0.5s 0.4s ease both', opacity:0, animationFillMode:'both' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'18px' }}>
              <FloatingInput label="Username" value={form.username}
                onChange={e => { setForm(p => ({ ...p, username: e.target.value })); if(errors.username) setErrors(p => ({ ...p, username:'' })) }}
                onKeyDown={e => e.key === 'Enter' && passRef.current?.focus()}
                autoFocus error={errors.username}
              />
              <div>
                <FloatingInput inputRef={passRef} label="Password" type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if(errors.password) setErrors(p => ({ ...p, password:'' })) }}
                  onKeyUp={handleCaps} onKeyDown={handleCaps}
                  error={errors.password}
                  rightSlot={
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(0,0,0,0.04)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:'15px', transition:'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(29,78,216,0.08)'; e.currentTarget.style.color='#1D4ED8' }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.04)'; e.currentTarget.style.color='#94A3B8' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  }
                />
                {capsLock && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'8px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'7px', padding:'4px 10px', fontSize:'12px', fontWeight:600, color:'#92400E' }}>
                    🔒 Caps Lock is on
                  </div>
                )}
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', userSelect:'none' }}>
                <div onClick={() => setRememberMe(p => !p)}
                  style={{ width:'18px', height:'18px', borderRadius:'5px', border:`1.5px solid ${rememberMe ? '#1D4ED8' : '#D1D5DB'}`, background: rememberMe ? '#1D4ED8' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', cursor:'pointer', flexShrink:0 }}>
                  {rememberMe && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize:'13px', fontWeight:500, color:'#374151' }}>Remember username</span>
              </label>
              <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'#1D4ED8', fontFamily:'Inter,sans-serif', padding:0, transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#1E40AF'}
                onMouseLeave={e => e.currentTarget.style.color='#1D4ED8'}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading || success}
              style={{
                width:'100%', height:'46px', borderRadius:'8px', border:'none',
                cursor: loading || success ? 'not-allowed' : 'pointer',
                background: success ? '#059669' : loading ? '#3B82F6' : '#1D4ED8',
                color:'#fff', fontSize:'14px', fontWeight:700, letterSpacing:'-0.01em',
                fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                transition:'all 0.2s ease', boxShadow:'0 4px 12px rgba(29,78,216,0.35)',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { if(!loading && !success) { e.currentTarget.style.background='#1E40AF'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(29,78,216,0.4)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = success ? '#059669' : '#1D4ED8'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 12px rgba(29,78,216,0.35)' }}
            >
              {loading ? (<><svg style={{ width:'16px', height:'16px', animation:'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Authenticating...</>)
              : success ? '✓ Signed in successfully'
              : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'22px 0', animation:'fadeUp 0.5s 0.5s ease both', opacity:0, animationFillMode:'both' }}>
            <div style={{ flex:1, height:'1px', background:'#E2E8F0' }} />
            <span style={{ fontSize:'12px', color:'#94A3B8', fontWeight:600 }}>or</span>
            <div style={{ flex:1, height:'1px', background:'#E2E8F0' }} />
          </div>

          {/* SSO */}
          <button type="button"
            onClick={() => alert('SSO integration requires Keycloak setup in production.')}
            style={{ width:'100%', height:'46px', borderRadius:'8px', border:'1.5px solid #E2E8F0', background:'#FAFAFA', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer', transition:'all 0.15s', fontFamily:'Inter,sans-serif', animation:'fadeUp 0.5s 0.55s ease both', opacity:0, animationFillMode:'both' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#1D4ED8'; e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#FAFAFA'; e.currentTarget.style.transform='' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect width="8.5" height="8.5" fill="#F25022"/><rect x="9.5" width="8.5" height="8.5" fill="#7FBA00"/><rect y="9.5" width="8.5" height="8.5" fill="#00A4EF"/><rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/></svg>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#374151' }}>Continue with Microsoft SSO</span>
          </button>

          {/* Trust badges */}
          <div style={{ marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', animation:'fadeUp 0.5s 0.6s ease both', opacity:0, animationFillMode:'both' }}>
            {[{ icon:'🔒', text:'256-bit SSL' },{ icon:'🛡️', text:'ISO 27001' },{ icon:'✅', text:'IRDAI Compliant' }].map(b => (
              <div key={b.text} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600, color:'#94A3B8' }}>
                <span style={{ fontSize:'12px' }}>{b.icon}</span>{b.text}
              </div>
            ))}
          </div>

          {lastLogin && (
            <div style={{ marginTop:'16px', padding:'10px 14px', borderRadius:'10px', background:'#F0F9FF', border:'1px solid #BAE6FD', display:'flex', alignItems:'center', gap:'10px', animation:'fadeIn 0.3s ease' }}>
              <div style={{ fontSize:'15px' }}>🕒</div>
              <div>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#075985', textTransform:'uppercase', letterSpacing:'0.06em' }}>Last Login</div>
                <div style={{ fontSize:'12px', fontWeight:600, color:'#0369A1', marginTop:'1px' }}>
                  {new Date(lastLogin).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeUp 0.5s 0.65s ease both', opacity:0, animationFillMode:'both' }}>
            <span style={{ fontSize:'12px', color:'#94A3B8', fontWeight:500 }}>DH Digital Life Claims v2.0</span>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#94A3B8', fontWeight:500 }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 5px #22C55E' }}/>
              All systems normal
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-7px)} 30%{transform:translateX(7px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(5px)} 75%{transform:translateX(-2px)} 90%{transform:translateX(2px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
