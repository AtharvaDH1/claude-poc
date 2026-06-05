import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ChevronRight, Home } from 'lucide-react'



const ROUTE_LABELS = {

  dashboard: 'Dashboard',

  'policy-search': 'Policy Search',

  'claim-search': 'Claim Search',

  registration: 'Register Claim',

  'claim-view': 'Claim View',

  'registration-fetch': 'Claim Workspace',

  'pool-selection': 'Pool Selection',

  'my-task': 'My Tasks',

  'add-screen': 'Add Screen',

  'user-management': 'User Management',

  'audit-log': 'Audit Log',

  admin: 'Admin Overview',
  'admin/claim-search': 'Claim Assignment',
  'admin-reports': 'Admin Overview',

  profile: 'My Profile',

  case: 'Case Details',

}



function buildCrumbs(pathname, params) {

  if (pathname.startsWith('/registration-fetch/')) {

    const id = params.claimId || pathname.split('/').pop()

    return [

      { label: 'Home', path: '/dashboard' },

      { label: 'Claim Search', path: '/claim-search' },

      { label: 'View Claim', path: pathname, last: true, detail: id },

    ]

  }

  if (pathname.startsWith('/case/')) {

    return [

      { label: 'Home', path: '/dashboard' },

      { label: 'Add Screen', path: '/add-screen' },

      { label: 'Case Details', path: pathname, last: true },

    ]

  }

  if (pathname.startsWith('/registration')) {

    return [

      { label: 'Home', path: '/dashboard' },

      { label: 'Policy Search', path: '/policy-search' },

      { label: 'New Registration', path: pathname, last: true },

    ]

  }

  if (pathname.startsWith('/claim-view/')) {

    const id = params.claimId || pathname.split('/').pop()

    return [

      { label: 'Home', path: '/dashboard' },

      { label: 'Claim Search', path: '/claim-search' },

      { label: 'Claim View', path: pathname, last: true, detail: id },

    ]

  }



  const segments = pathname.split('/').filter(Boolean)

  return [

    { label: 'Home', path: '/dashboard' },

    ...segments.map((seg, i) => ({

      label:

        ROUTE_LABELS[seg] ||

        (seg.startsWith('CL') ? seg : seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),

      path: '/' + segments.slice(0, i + 1).join('/'),

      last: i === segments.length - 1,

    })),

  ]

}



export default function Breadcrumbs() {

  const location = useLocation()

  const navigate = useNavigate()

  const params = useParams()



  if (location.pathname === '/login') return null



  const crumbs = buildCrumbs(location.pathname, params)

  if (!crumbs.length) return null



  return (

    <nav style={{ display:'flex', alignItems:'center', gap:'4px', padding:'10px 24px', background:'#fff', borderBottom:'1px solid #F1F5F9', fontFamily:'Inter,sans-serif', flexWrap:'wrap' }}>

      {crumbs.map((c, i) => (

        <div key={`${c.path}-${i}`} style={{ display:'flex', alignItems:'center', gap:'4px' }}>

          {i > 0 && <ChevronRight size={13} style={{ color:'#CBD5E1', flexShrink:0 }} />}

          {c.last ? (

            <span style={{ fontSize:'12px', fontWeight:700, color:'#0F172A' }}>

              {i === 0 ? <Home size={13} style={{ verticalAlign:'middle', marginRight:'3px' }} /> : null}

              {c.label}

              {c.detail ? <span style={{ color:'#64748B', fontWeight:600 }}> · {c.detail}</span> : null}

            </span>

          ) : (

            <button type="button" onClick={() => navigate(c.path)}

              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:500, color:'#64748B', fontFamily:'Inter,sans-serif', padding:'2px 4px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'3px', transition:'color 0.15s' }}

              onMouseEnter={e => { e.currentTarget.style.color = '#1D4ED8' }}

              onMouseLeave={e => { e.currentTarget.style.color = '#64748B' }}>

              {i === 0 && <Home size={12} />}

              {c.label}

            </button>

          )}

        </div>

      ))}

    </nav>

  )

}

