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
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        .inp { width:100%; padding:12px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,169,110,0.15); border-radius:6px; color:#e8e2d9; font-family:'Outfit',sans-serif; font-size:14px; outline:none; transition:border-color 0.3s; }
        .inp:focus { border-color:rgba(200,169,110,0.5); }
        .inp::placeholder { color:rgba(255,255,255,0.2); }
        .sel { width:100%; padding:12px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,169,110,0.15); border-radius:6px; color:#e8e2d9; font-family:'Outfit',sans-serif; font-size:14px; outline:none; cursor:pointer; appearance:none; }
        .sel option { background:#0d0d1a; }
        .btn-gold { width:100%; padding:14px; background:linear-gradient(135deg,#c8a96e,#e8c87e); border:none; border-radius:6px; color:#080810; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; cursor:pointer; transition:all 0.3s; font-weight:500; }
        .btn-gold:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,169,110,0.25); }
        .btn-gold:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .lbl { display:block; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.2em; color:rgba(200,169,110,0.7); text-transform:uppercase; margin-bottom:8px; }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, background: 'linear-gradient(135deg,#c8a96e,#e8c87e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
            JobGenie
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.35em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase', marginTop: 6 }}>
            HR Portal
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit, sans-serif' }}>
            Discover top talent from JobGenie AI
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(20px)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.3s',
                  background: mode === m ? 'rgba(200,169,110,0.15)' : 'transparent',
                  color: mode === m ? '#c8a96e' : 'rgba(255,255,255,0.3)',
                }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="lbl">Full Name</label>
                  <input className="inp" placeholder="Your name" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Company Name</label>
                  <input className="inp" placeholder="Company name" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="lbl">Industry</label>
                    <select className="sel" value={form.industry} onChange={e => set('industry', e.target.value)}>
                      <option value="">Select</option>
                      {industries.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="lbl">Team Size</label>
                    <select className="sel" value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                      <option value="">Employees</option>
                      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="lbl">Email</label>
              <input className="inp" type="email" placeholder="hr@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 6, color: '#f09595', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button className="btn-gold" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif' }}>
              {mode === 'login' ? 'New here? ' : 'Already registered? '}
            </span>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#c8a96e', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Outfit, sans-serif' }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
          Powered by JobGenie AI
        </div>
      </motion.div>
    </div>
  )
}
