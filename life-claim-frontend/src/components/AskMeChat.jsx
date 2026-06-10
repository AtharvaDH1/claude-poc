import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

const REPLIES = [
  'I can help you navigate Life Claims — try Policy Search, Claim Search, or My Tasks from the sidebar.',
  'For assessor work, open a claim from My Task or Claim Search to use the claim workspace.',
  'ADD operations (case search, pools, upload) are under Advance Investigation for Assessors and Verifiers.',
  'Use Claim Search, Advance Investigation, or My Tasks for claim workflows.',
  'This assistant is a UI preview only — no live AI backend is connected yet.',
]

const T = {
  primary: '#1D4ED8',
  card: '#fff',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
}

export default function AskMeChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi — I\'m the Ask Me assistant (frontend preview). How can I help?' },
  ])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)]
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: reply }])
    }, 400)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask me"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 9000,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(135deg, ${T.primary}, #1E40AF)`,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(29,78,216,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '92px',
            zIndex: 9000,
            width: 'min(380px, calc(100vw - 48px))',
            height: 'min(480px, calc(100vh - 140px))',
            background: T.card,
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, background: '#EFF6FF' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: T.text }}>Ask me</div>
            <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>Preview · no backend</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  background: msg.role === 'user' ? T.primary : '#F1F5F9',
                  color: msg.role === 'user' ? '#fff' : T.text,
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '12px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask a question…"
              style={{
                flex: 1,
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: `1px solid ${T.border}`,
                fontSize: '13px',
                fontFamily: 'Inter,sans-serif',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={send}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: T.primary,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
