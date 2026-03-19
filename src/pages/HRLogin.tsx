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
