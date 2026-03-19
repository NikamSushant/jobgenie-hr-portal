import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function HRLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', company_name: '',
    company_size: '', industry: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) { setError(error.message); return }
        navigate('/dashboard')
      } else {
        if (!form.full_name || !form.company_name) { setError('Please fill all fields'); return }
        const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
        if (error) { setError(error.message); return }
        if (data.user) {
          await supabase.from('hr_users').insert({
            user_id: data.user.id, full_name: form.full_name,
            company_name: form.company_name, company_size: form.company_size,
            industry: form.industry, email: form.email,
          })
          navigate('/dashboard')
        }
      }
    } finally { setLoading(false) }
  }

  const industries = ['Technology','Finance','Healthcare','E-Commerce','Education','Manufacturing','Consulting','Media','Real Estate','Other']
  const sizes = ['1-10','11-50','51-200','201-500','500+']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        .hr-inp {
          width:100%; padding:13px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Outfit',sans-serif; font-size:14px;
          outline:none; transition:border-color 0.2s, background 0.2s;
        }
        .hr-inp:focus { border-color:#f59e0b; background:#222; }
        .hr-inp::placeholder { color:#555; }
        .hr-sel {
          width:100%; padding:13px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Outfit',sans-serif; font-size:14px;
          outline:none; cursor:pointer; appearance:none;
        }
        .hr-sel option { background:#1a1a1a; }
        .hr-lbl {
          display:block; font-size:11px; font-weight:600;
          letter-spacing:0.08em; color:#888;
          text-transform:uppercase; margin-bottom:8px;
        }
        .hr-btn-primary {
          width:100%; padding:15px;
          background:linear-gradient(135deg,#f59e0b,#f97316);
          border:none; border-radius:12px;
          color:#0f0f0f; font-family:'Outfit',sans-serif;
          font-size:15px; font-weight:700;
          cursor:pointer; transition:all 0.3s;
          letter-spacing:0.02em;
        }
        .hr-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(245,158,11,0.35); }
        .hr-btn-primary:disabled { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }
        .hr-tab-btn {
          flex:1; padding:11px; border:none; border-radius:10px;
          cursor:pointer; font-family:'Outfit',sans-serif;
          font-size:13px; font-weight:600; transition:all 0.25s;
          letter-spacing:0.03em;
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="data:image/jpeg;base64,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"
            alt="JobGenie AI"
            style={{
              width: 88, height: 88, objectFit: 'contain',
              marginBottom: 16,
              filter: 'drop-shadow(0 8px 24px rgba(245,158,11,0.35))',
            }}
          />
          <div style={{
            fontSize: 32, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            JobGenie <span style={{ color: '#f59e0b' }}>HR</span>
          </div>
          <div style={{ fontSize: 13, color: '#555', fontWeight: 400 }}>
            Discover top talent from JobGenie AI
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#1a1a1a', border: '1.5px solid #252525',
          borderRadius: 24, padding: '32px 28px',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: '#111', borderRadius: 14, padding: 4, marginBottom: 28,
          }}>
            {(['login','signup'] as const).map(m => (
              <button key={m} className="hr-tab-btn" onClick={() => { setMode(m); setError('') }}
                style={{
                  background: mode === m ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'transparent',
                  color: mode === m ? '#0f0f0f' : '#555',
                  boxShadow: mode === m ? '0 4px 14px rgba(245,158,11,0.3)' : 'none',
                }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="hr-lbl">Full Name</label>
                  <input className="hr-inp" placeholder="Your name" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className="hr-lbl">Company Name</label>
                  <input className="hr-inp" placeholder="Company name" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="hr-lbl">Industry</label>
                    <select className="hr-sel" value={form.industry} onChange={e => set('industry', e.target.value)}>
                      <option value="">Select</option>
                      {industries.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="hr-lbl">Team Size</label>
                    <select className="hr-sel" value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                      <option value="">Employees</option>
                      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="hr-lbl">Email</label>
              <input className="hr-inp" type="email" placeholder="hr@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="hr-lbl">Password</label>
              <input className="hr-inp" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, color: '#f87171', fontSize: 13, fontWeight: 500,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button className="hr-btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: '#555' }}>
              {mode === 'login' ? "New here? " : "Already registered? "}
            </span>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              style={{
                background: 'none', border: 'none', color: '#f59e0b',
                fontSize: 13, cursor: 'pointer', fontWeight: 600,
                textDecoration: 'underline',
              }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 11, color: '#333', letterSpacing: '0.08em',
          textTransform: 'uppercase', fontWeight: 600,
        }}>
          Powered by JobGenie AI
        </div>
      </motion.div>
    </div>
  )
}
