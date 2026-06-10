import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import wrapper from '../util/ApiWrapper'
import { User, Mail, Phone, Key, Shield, Save, Eye, EyeOff, Clock } from 'lucide-react'

const T = { primary:'#1D4ED8', card:'#fff', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }

/** Password is managed in Keycloak — keep UI visible but submit disabled. */
const PASSWORD_CHANGE_ENABLED = false

const inp = (focused) => ({
  width:'100%', height:'42px', padding:'0 12px',
  border:`1.5px solid ${focused ? T.primary : T.border}`,
  borderRadius:'8px', background: focused ? '#fff' : '#F8FAFC',
  fontSize:'13px', fontWeight:500, color:T.textPrimary,
  fontFamily:'Inter,sans-serif', outline:'none',
  boxShadow: focused ? '0 0 0 3px rgba(29,78,216,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
  transition:'all 0.15s', boxSizing:'border-box',
})

function Field({ label, children, icon: Icon }) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'6px' }}>
        {Icon && <Icon size={13} style={{ color:T.textMuted }}/>}
        {label}
      </label>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     '',
  })

  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' })
  const [showPw, setShowPw]   = useState({ current:false, newPw:false, confirm:false })
  const [focus, setFocus]     = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw]           = useState(false)

  const ROLE_COLORS = {
    'Pre Assessor':{ bg:'#EFF6FF', color:T.primary, border:'#BFDBFE' },
    'Assessor':    { bg:'#F5F3FF', color:'#7C3AED', border:'#DDD6FE' },
    'Verifier':    { bg:'#ECFDF5', color:'#059669', border:'#A7F3D0' },
    'Admin':       { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
  }
  const rc = ROLE_COLORS[user?.role] || { bg:'#F8FAFC', color:T.textMuted, border:T.border }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await wrapper.fetchWithToken(`/user/user/${user?.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_Name: profileForm.firstName,
          last_Name: profileForm.lastName,
          email: profileForm.email,
          phoneNumber: profileForm.phone,
        }),
      })
      await res.json().catch(() => null)
      toast('success', 'Profile Updated', 'Your profile details have been saved.')
    } catch (err) {
      toast('error', 'Update Failed', err.message)
    } finally { setSavingProfile(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!PASSWORD_CHANGE_ENABLED) return
    if (!pwForm.current) { toast('warning','Missing','Enter your current password.'); return }
    if (pwForm.newPw.length < 8) { toast('warning','Too Short','New password must be at least 8 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm) { toast('error','Mismatch','New passwords do not match.'); return }
    setSavingPw(true)
    try {
      await wrapper.fetchWithToken(`/user/user/${user?.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwForm.newPw }),
      })
      toast('success', 'Password Changed', 'Your password has been updated. Please log in again.')
      setPwForm({ current:'', newPw:'', confirm:'' })
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (err) {
      toast('error', 'Failed', err.message)
    } finally { setSavingPw(false) }
  }

  const tf = (key) => ({ focused: !!focus[key], onFocus:()=>setFocus(p=>({...p,[key]:true})), onBlur:()=>setFocus(p=>({...p,[key]:false})) })

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>My Profile</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>Manage your personal details and account security.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px', alignItems:'start' }}>
          {/* Profile card */}
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'24px', textAlign:'center' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:T.primary, color:'#fff', fontSize:'28px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(29,78,216,0.3)' }}>
              {user?.avatar}
            </div>
            <div style={{ fontWeight:800, fontSize:'16px', color:T.textPrimary }}>{user?.name}</div>
            <div style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px' }}>@{user?.username}</div>
            <div style={{ marginTop:'12px' }}>
              <span style={{ fontSize:'12px', fontWeight:700, padding:'4px 14px', borderRadius:'99px', background:rc.bg, border:`1px solid ${rc.border}`, color:rc.color }}>
                <Shield size={11} style={{ marginRight:'5px', verticalAlign:'middle' }}/>{user?.role}
              </span>
            </div>
            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${T.borderSubtle}`, textAlign:'left' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Account Info</div>
              {[
                ['Email',      user?.email || '—'],
                ['Last Login', user?.loginTime ? new Date(user.loginTime).toLocaleString('en-IN') : '—'],
              ].map(([k,v])=>(
                <div key={k} style={{ marginBottom:'8px' }}>
                  <div style={{ fontSize:'10px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{k}</div>
                  <div style={{ fontSize:'12px', fontWeight:500, color:T.textSecondary, marginTop:'2px', wordBreak:'break-all' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* Personal details */}
            <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', gap:'10px' }}>
                <User size={16} style={{ color:T.primary }}/>
                <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Personal Details</div>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Field label="First Name" icon={User}>
                    <input value={profileForm.firstName} onChange={e=>setProfileForm(p=>({...p,firstName:e.target.value}))} placeholder="First name" style={inp(focus.fn)} {...tf('fn')}/>
                  </Field>
                  <Field label="Last Name">
                    <input value={profileForm.lastName} onChange={e=>setProfileForm(p=>({...p,lastName:e.target.value}))} placeholder="Last name" style={inp(focus.ln)} {...tf('ln')}/>
                  </Field>
                  <Field label="Email Address" icon={Mail}>
                    <input type="email" value={profileForm.email} onChange={e=>setProfileForm(p=>({...p,email:e.target.value}))} placeholder="email@dhdigital.co.in" style={inp(focus.em)} {...tf('em')}/>
                  </Field>
                  <Field label="Phone Number" icon={Phone}>
                    <input value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210" maxLength={15} style={inp(focus.ph)} {...tf('ph')}/>
                  </Field>
                  <Field label="Username">
                    <input value={user?.username || ''} readOnly style={{ ...inp(false), background:'#F8FAFC', color:T.textMuted, cursor:'not-allowed' }}/>
                  </Field>
                  <Field label="Role">
                    <input value={user?.role || ''} readOnly style={{ ...inp(false), background:'#F8FAFC', color:T.textMuted, cursor:'not-allowed' }}/>
                  </Field>
                </div>
                <div style={{ padding:'14px 20px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'flex-end' }}>
                  <button type="submit" disabled={savingProfile}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:savingProfile?'wait':'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.25)', transition:'all 0.15s' }}>
                    <Save size={14}/> {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change password */}
            <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', gap:'10px' }}>
                <Key size={16} style={{ color:'#D97706' }}/>
                <div>
                  <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Change Password</div>
                  <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'1px' }}>
                    {PASSWORD_CHANGE_ENABLED
                      ? 'After changing your password, you will be logged out.'
                      : 'Password changes are managed by your administrator (Keycloak).'}
                  </div>
                </div>
              </div>
              <form onSubmit={handleChangePassword}>
                <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
                  {[
                    { key:'current', label:'Current Password' },
                    { key:'newPw',   label:'New Password' },
                    { key:'confirm', label:'Confirm New Password' },
                  ].map(f=>(
                    <Field key={f.key} label={f.label}>
                      <div style={{ position:'relative' }}>
                        <input
                          type={showPw[f.key] ? 'text' : 'password'}
                          value={pwForm[f.key]}
                          onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}
                          placeholder="••••••••"
                          style={{ ...inp(!!focus[f.key]), paddingRight:'40px' }}
                          onFocus={()=>setFocus(p=>({...p,[f.key]:true}))}
                          onBlur={()=>setFocus(p=>({...p,[f.key]:false}))}
                        />
                        <button type="button" onClick={()=>setShowPw(p=>({...p,[f.key]:!p[f.key]}))}
                          style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex', padding:'4px' }}>
                          {showPw[f.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </Field>
                  ))}
                </div>
                {pwForm.newPw && pwForm.newPw.length < 8 && (
                  <div style={{ margin:'0 20px', padding:'10px 14px', borderRadius:'8px', background:'#FEF2F2', border:'1px solid #FECACA', fontSize:'12px', fontWeight:600, color:'#DC2626' }}>
                    Password must be at least 8 characters long.
                  </div>
                )}
                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <div style={{ margin:'8px 20px 0', padding:'10px 14px', borderRadius:'8px', background:'#FEF2F2', border:'1px solid #FECACA', fontSize:'12px', fontWeight:600, color:'#DC2626' }}>
                    Passwords do not match.
                  </div>
                )}
                <div style={{ padding:'14px 20px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'flex-end' }}>
                  <button type="submit" disabled={!PASSWORD_CHANGE_ENABLED || savingPw}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'8px', border:'none', background: PASSWORD_CHANGE_ENABLED ? '#D97706' : '#CBD5E1', color:'#fff', fontSize:'13px', fontWeight:700, cursor: (!PASSWORD_CHANGE_ENABLED || savingPw) ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif', boxShadow: PASSWORD_CHANGE_ENABLED ? '0 4px 12px rgba(217,119,6,0.25)' : 'none', transition:'all 0.15s' }}>
                    <Key size={14}/> {savingPw ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
