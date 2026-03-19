import LOGO_SRC from '../assets/logo'
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
            src={LOGO_SRC}
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
