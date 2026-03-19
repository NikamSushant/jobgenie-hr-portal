import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function HRLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    email: localStorage.getItem('hr_remember_email') || '',
    password: '', full_name: '', company_name: '', company_size: '', industry: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) { setError(error.message); return }
        setSuccess('Reset link sent! Check your email.')
        return
      }
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) { setError(error.message); return }
        if (rememberMe) localStorage.setItem('hr_remember_email', form.email)
        else localStorage.removeItem('hr_remember_email')
        navigate('/dashboard')
      } else {
        if (!form.full_name || !form.company_name) { setError('Please fill all required fields'); return }
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
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0f0f0f; }
        .f-inp {
          width:100%; padding:14px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Inter',sans-serif; font-size:14px;
          outline:none; transition:border-color 0.25s, background 0.25s;
        }
        .f-inp:focus { border-color:#f59e0b; background:#222; }
        .f-inp::placeholder { color:#555; }
        .f-sel {
          width:100%; padding:14px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Inter',sans-serif; font-size:14px;
          outline:none; cursor:pointer; appearance:none;
          transition:border-color 0.25s;
        }
        .f-sel:focus { border-color:#f59e0b; }
        .f-sel option { background:#1a1a1a; }
        .f-lbl {
          display:block; font-size:11px; font-weight:600;
          letter-spacing:0.08em; color:#888;
          text-transform:uppercase; margin-bottom:8px;
        }
        .f-btn {
          width:100%; padding:15px;
          background:linear-gradient(135deg,#f59e0b,#f97316);
          border:none; border-radius:12px;
          color:#0f0f0f; font-family:'Inter',sans-serif;
          font-size:15px; font-weight:700;
          cursor:pointer; transition:all 0.25s;
        }
        .f-btn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(245,158,11,0.35); }
        .f-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }
        .f-tab {
          flex:1; padding:11px 0; border:none; border-radius:10px;
          font-family:'Inter',sans-serif; font-size:14px; font-weight:600;
          cursor:pointer; transition:all 0.25s;
        }
        .f-tab.active { background:linear-gradient(135deg,#f59e0b,#f97316); color:#0f0f0f; box-shadow:0 4px 14px rgba(245,158,11,0.3); }
        .f-tab.inactive { background:transparent; color:#555; }
        .cbx-wrap { display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
        .cbx { width:18px; height:18px; border-radius:5px; border:1.5px solid #3a3a3a; background:#1e1e1e; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
        .cbx.on { background:linear-gradient(135deg,#f59e0b,#f97316); border-color:#f59e0b; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#555; transition:color 0.2s; display:flex; align-items:center; }
        .eye-btn:hover { color:#f59e0b; }
        .link-btn { background:none; border:none; color:#f59e0b; font-size:14px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; }
        .link-btn:hover { text-decoration:underline; }
        .back-btn { background:none; border:none; color:#555; font-size:13px; cursor:pointer; font-family:'Inter',sans-serif; display:flex; align-items:center; gap:6px; margin-bottom:24px; transition:color 0.2s; }
        .back-btn:hover { color:#f59e0b; }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 480 }}>

        {/* ── LOGO ── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* Robot genie icon */}
          <div style={{ marginBottom: 16, display: 'inline-block', position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, rgba(245,158,11,0.25), rgba(249,115,22,0.1))',
              border: '1.5px solid rgba(245,158,11,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(245,158,11,0.2)',
            }}>
              <svg width="46" height="46" viewBox="0 0 64 64" fill="none">
                {/* Lamp base */}
                <ellipse cx="32" cy="52" rx="18" ry="5" fill="rgba(245,158,11,0.15)" />
                <path d="M18 46 Q14 38 20 32 L44 32 Q50 38 46 46 Z" fill="#f59e0b" opacity="0.9" />
                <path d="M20 32 Q26 26 32 24 Q38 26 44 32" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
                {/* Lamp handle */}
                <path d="M14 36 Q10 30 14 24 Q18 18 24 20" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="14" cy="24" r="2.5" fill="#fbbf24" />
                {/* Spout smoke */}
                <path d="M32 24 Q30 16 32 8" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="2 3" />
                {/* Robot head */}
                <rect x="22" y="2" width="20" height="18" rx="6" fill="#1a1a1a" stroke="#f59e0b" strokeWidth="1.5" />
                {/* Eyes */}
                <circle cx="27" cy="9" r="2.5" fill="#f59e0b" />
                <circle cx="37" cy="9" r="2.5" fill="#f59e0b" />
                <circle cx="28" cy="9" r="1" fill="#fff" />
                <circle cx="38" cy="9" r="1" fill="#fff" />
                {/* Smile */}
                <path d="M27 15 Q32 18 37 15" stroke="#f59e0b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                {/* Antenna */}
                <line x1="32" y1="2" x2="32" y2="-2" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="32" cy="-2" r="2" fill="#fbbf24" />
                {/* Briefcase / checkmark on lamp */}
                <circle cx="32" cy="40" r="6" fill="#0f0f0f" opacity="0.5" />
                <path d="M29 40 L31.5 42.5 L35.5 37.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            {/* Glow dot */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: '2px solid #0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            </div>
          </div>

          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            <span style={{ color: '#fff' }}>JobGenie </span>
            <span style={{ color: '#f59e0b' }}>HR</span>
          </div>
          <div style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>Discover top talent from JobGenie AI</div>
        </div>

        {/* ── CARD ── */}
        <div style={{ background: '#171717', borderRadius: 24, padding: '32px 28px', border: '1.5px solid #252525' }}>
          <AnimatePresence mode="wait">

            {/* ── FORGOT PASSWORD ── */}
            {mode === 'forgot' ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <button className="back-btn" onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
                  ← Back to Sign In
                </button>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Forgot Password?</div>
                  <div style={{ fontSize: 14, color: '#555' }}>Enter your email — we'll send a reset link.</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="f-lbl">Email</label>
                    <input className="f-inp" type="email" placeholder="hr@company.com" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                  </div>
                  {error && <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>⚠️ {error}</div>}
                  {success && <div style={{ padding: '11px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, color: '#4ade80', fontSize: 13 }}>✓ {success}</div>}
                  {!success && <button className="f-btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link →'}</button>}
                </div>
              </motion.div>

            ) : (
              /* ── SIGN IN / REGISTER ── */
              <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#111', borderRadius: 14, padding: 4, marginBottom: 28 }}>
                  <button className={`f-tab ${mode === 'login' ? 'active' : 'inactive'}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Sign In</button>
                  <button className={`f-tab ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Register</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {mode === 'signup' && (
                    <>
                      <div>
                        <label className="f-lbl">Full Name</label>
                        <input className="f-inp" placeholder="Your full name" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="f-lbl">Company Name</label>
                        <input className="f-inp" placeholder="Company name" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label className="f-lbl">Industry</label>
                          <select className="f-sel" value={form.industry} onChange={e => set('industry', e.target.value)}>
                            <option value="">Select</option>
                            {industries.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="f-lbl">Team Size</label>
                          <select className="f-sel" value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                            <option value="">Employees</option>
                            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="f-lbl">Email</label>
                    <input className="f-inp" type="email" placeholder="hr@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>

                  <div>
                    <label className="f-lbl">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input className="f-inp" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                        value={form.password} onChange={e => set('password', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        style={{ paddingRight: 48 }} />
                      <button className="eye-btn" type="button" onClick={() => setShowPass(p => !p)}>
                        {showPass ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me + Forgot Password */}
                  {mode === 'login' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
                      <div className="cbx-wrap" onClick={() => setRememberMe(r => !r)}>
                        <div className={`cbx ${rememberMe ? 'on' : ''}`}>
                          {rememberMe && (
                            <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
                              <path d="M1 5L4.5 8.5L11 1" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: '#666' }}>Remember me</span>
                      </div>
                      <button className="link-btn" style={{ fontSize: 13, color: '#888' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#f59e0b')}
                        onMouseOut={e => (e.currentTarget.style.color = '#888')}
                        onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {error && <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>⚠️ {error}</div>}

                  <button className="f-btn" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
                    {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: '#555' }}>
                  {mode === 'login' ? 'New here? ' : 'Already registered? '}
                  <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
                    {mode === 'login' ? 'Register' : 'Sign in'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Powered by JobGenie AI
        </div>
      </motion.div>
    </div>
  )
}
