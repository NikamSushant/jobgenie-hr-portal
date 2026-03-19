import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

interface Candidate {
  user_id: string
  full_name: string | null
  job_title: string | null
  bio: string | null
  skills: string[] | null
  location: string | null
  experience_years: number | null
  portfolio: string | null
  linkedin: string | null
  email: string | null
}

interface HRProfile {
  full_name: string | null
  company_name: string | null
  industry: string | null
}

const SKILL_COLORS = ['#c8a96e','#7eb8c8','#b8c87e','#c87e9e','#9e7ec8','#7ec8a9']
const JOB_GENIE_APP_URL = import.meta.env.VITE_APP_URL || 'https://your-app.vercel.app'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [hrProfile, setHRProfile] = useState<HRProfile | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [contactSent, setContactSent] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [selected, setSelected] = useState<Candidate | null>(null)

  const [skillSearch, setSkillSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [expFilter, setExpFilter] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      const { data: hr } = await supabase.from('hr_users').select('*').eq('user_id', user.id).single()
      if (hr) setHRProfile(hr)
      const { data: savedData } = await supabase.from('hr_saved_candidates').select('candidate_user_id').eq('hr_user_id', user.id)
      if (savedData) setSaved(new Set(savedData.map((s: any) => s.candidate_user_id)))
      await fetchCandidates('', '', '')
      setLoading(false)
    }
    init()
  }, [navigate])

  const fetchCandidates = useCallback(async (skill: string, loc: string, exp: string) => {
    setSearching(true)
    try {
      let query = supabase.from('profiles')
        .select('user_id, full_name, job_title, bio, skills, location, experience_years, portfolio, linkedin, email')
        .not('full_name', 'is', null)
        .not('skills', 'is', null)
        .limit(60)
      if (loc) query = query.ilike('location', `%${loc}%`)
      if (exp) query = query.gte('experience_years', parseInt(exp))
      const { data } = await query
      let results = data || []
      if (skill) {
        const sl = skill.toLowerCase()
        results = results.filter((c: any) => (c.skills || []).some((s: string) => s.toLowerCase().includes(sl)))
      }
      setCandidates(results as Candidate[])
    } finally { setSearching(false) }
  }, [])

  const toggleSave = async (candidateId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (saved.has(candidateId)) {
      await supabase.from('hr_saved_candidates').delete().eq('hr_user_id', user.id).eq('candidate_user_id', candidateId)
      setSaved(s => { const n = new Set(s); n.delete(candidateId); return n })
    } else {
      await supabase.from('hr_saved_candidates').insert({ hr_user_id: user.id, candidate_user_id: candidateId })
      setSaved(s => new Set([...s, candidateId]))
      // Notify job seeker
      const company = hrProfile?.company_name || 'A recruiter'
      await supabase.from('notifications').insert({
        user_id: candidateId,
        title: `🎯 ${company} saved your profile!`,
        description: `A recruiter from ${company} saved your profile on JobGenie AI. Make sure your portfolio is up to date!`,
        type: 'hr_saved',
      })
    }
  }

  const sendContact = async (candidate: Candidate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const company = hrProfile?.company_name || 'a company'
    await supabase.from('hr_contact_requests').insert({
      hr_user_id: user.id,
      candidate_user_id: candidate.user_id,
      message: `Hi ${candidate.full_name}, we found your profile on JobGenie AI and are interested in connecting with you regarding opportunities at ${company}.`,
    })
    await supabase.from('notifications').insert({
      user_id: candidate.user_id,
      title: `📩 ${company} wants to connect!`,
      description: `A recruiter from ${company} found your profile on JobGenie AI and is interested in you. Check your email or LinkedIn!`,
      type: 'hr_contact',
    })
    setContactSent(s => new Set([...s, candidate.user_id]))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const displayList = activeTab === 'search' ? candidates : candidates.filter(c => saved.has(c.user_id))

  if (loading) return (
    <div style={{ background: '#080810', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '2px solid #c8a96e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { margin:0; padding:0; box-sizing:border-box; }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#e8e2d9', fontFamily: 'Outfit, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        .inp { width:100%; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,169,110,0.15); border-radius:6px; color:#e8e2d9; font-family:'Outfit',sans-serif; font-size:13px; outline:none; transition:border-color 0.3s; }
        .inp:focus { border-color:rgba(200,169,110,0.4); }
        .inp::placeholder { color:rgba(255,255,255,0.2); }
        .sel { width:100%; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,169,110,0.15); border-radius:6px; color:#e8e2d9; font-family:'Outfit',sans-serif; font-size:13px; outline:none; cursor:pointer; appearance:none; }
        .sel option { background:#0d0d1a; }
        .card { background:rgba(13,13,26,0.9); border:1px solid rgba(200,169,110,0.1); border-radius:12px; transition:border-color 0.3s, transform 0.2s; cursor:pointer; }
        .card:hover { border-color:rgba(200,169,110,0.3); transform:translateY(-2px); }
        .tag { padding:4px 10px; border:1px solid rgba(200,169,110,0.15); border-radius:4px; font-size:11px; font-family:'DM Mono',monospace; }
        .btn-gold { padding:10px 22px; background:linear-gradient(135deg,#c8a96e,#e8c87e); border:none; border-radius:6px; color:#080810; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:all 0.3s; }
        .btn-gold:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(200,169,110,0.2); }
        .btn-gold:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .btn-ghost { padding:10px 22px; border:1px solid rgba(200,169,110,0.25); background:none; border-radius:6px; color:#c8a96e; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:all 0.3s; }
        .btn-ghost:hover { background:rgba(200,169,110,0.08); }
        ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:rgba(200,169,110,0.2); }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,169,110,0.1)', padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, background: 'linear-gradient(135deg,#c8a96e,#e8c87e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JobGenie
          </div>
          <div style={{ width: 1, height: 18, background: 'rgba(200,169,110,0.2)' }} />
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase' }}>HR Portal</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {hrProfile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{hrProfile.full_name}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(200,169,110,0.5)', letterSpacing: '0.1em' }}>{hrProfile.company_name}</div>
            </div>
          )}
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 14px', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'DM Mono, monospace', cursor: 'pointer', letterSpacing: '0.1em' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.3em', color: 'rgba(200,169,110,0.6)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 1, background: '#c8a96e' }} />
            Talent Discovery
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 300, lineHeight: 1 }}>
            Find your next{' '}
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#c8a96e,#e8c87e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>hire</em>
          </h1>
          <div style={{ marginTop: 8, fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            {candidates.length} candidates on JobGenie AI
          </div>
        </div>

        {/* Search */}
        <div style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(200,169,110,0.12)', borderRadius: 16, padding: 28, marginBottom: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>Skill / Role</label>
              <input className="inp" placeholder="React, UX Designer, Python..." value={skillSearch} onChange={e => setSkillSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCandidates(skillSearch, locationSearch, expFilter)} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>Location</label>
              <input className="inp" placeholder="Mumbai, Remote..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>Min Experience</label>
              <select className="sel" value={expFilter} onChange={e => setExpFilter(e.target.value)}>
                <option value="">Any</option>
                {[1,2,3,5,7,10].map(y => <option key={y} value={y}>{y}+ yrs</option>)}
              </select>
            </div>
            <button className="btn-gold" onClick={() => fetchCandidates(skillSearch, locationSearch, expFilter)} disabled={searching}>
              {searching ? '...' : 'Search →'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([['search','All Candidates'],['saved','Saved']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.3s',
                background: activeTab === tab ? 'rgba(200,169,110,0.15)' : 'transparent',
                color: activeTab === tab ? '#c8a96e' : 'rgba(255,255,255,0.3)',
              }}>
              {label}{tab === 'saved' && saved.size > 0 && <span style={{ marginLeft: 6, background: '#c8a96e', color: '#080810', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{saved.size}</span>}
            </button>
          ))}
        </div>

        {/* Grid */}
        {displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, opacity: 0.2, marginBottom: 12 }}>{activeTab === 'saved' ? '♡' : '◎'}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {activeTab === 'saved' ? 'No saved candidates' : 'No candidates found'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {displayList.map((c, i) => (
              <motion.div key={c.user_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card" style={{ padding: 24 }} onClick={() => setSelected(c)}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,rgba(200,169,110,0.2),rgba(200,169,110,0.05))', border: '1px solid rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#c8a96e' }}>{c.full_name ? initials(c.full_name) : '??'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(200,169,110,0.7)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>{c.job_title}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleSave(c.user_id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: saved.has(c.user_id) ? '#c8a96e' : 'rgba(255,255,255,0.2)', transition: 'color 0.3s', padding: 4, flexShrink: 0 }}>
                    {saved.has(c.user_id) ? '♥' : '♡'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                  {c.location && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>📍 {c.location}</span>}
                  {c.experience_years && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>⏱ {c.experience_years}+ yrs</span>}
                </div>

                {c.bio && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{c.bio}</p>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(c.skills || []).slice(0, 4).map((s, si) => (
                    <span key={s} className="tag" style={{ borderColor: `${SKILL_COLORS[si % SKILL_COLORS.length]}30`, color: SKILL_COLORS[si % SKILL_COLORS.length] }}>{s}</span>
                  ))}
                  {(c.skills || []).length > 4 && <span className="tag" style={{ color: 'rgba(255,255,255,0.3)' }}>+{(c.skills || []).length - 4}</span>}
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(200,169,110,0.25)', textTransform: 'uppercase' }}>via JobGenie AI</span>
                  <span style={{ fontSize: 11, color: 'rgba(200,169,110,0.4)' }}>View →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              style={{ background: '#0d0d1a', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 20, padding: 40, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
              onClick={e => e.stopPropagation()}>

              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 22, cursor: 'pointer' }}>✕</button>

              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg,rgba(200,169,110,0.2),rgba(200,169,110,0.05))', border: '1px solid rgba(200,169,110,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, color: '#c8a96e' }}>{selected.full_name ? initials(selected.full_name) : '??'}</span>
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 300, marginBottom: 4 }}>{selected.full_name}</h2>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(200,169,110,0.7)' }}>{selected.job_title}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(200,169,110,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                {[['Location', selected.location],['Experience', selected.experience_years ? `${selected.experience_years}+ years` : '—']].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k as string} style={{ padding: '14px 18px', background: 'rgba(13,13,26,0.9)' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(200,169,110,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 14 }}>{v}</div>
                  </div>
                ))}
              </div>

              {selected.bio && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>About</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{selected.bio}</p>
                </div>
              )}

              {(selected.skills || []).length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase', marginBottom: 12 }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(selected.skills || []).map((s, si) => (
                      <span key={s} className="tag" style={{ borderColor: `${SKILL_COLORS[si % SKILL_COLORS.length]}33`, color: SKILL_COLORS[si % SKILL_COLORS.length], fontSize: 12 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`${JOB_GENIE_APP_URL}/portfolio/${nameToSlug(selected.full_name || '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost">Portfolio ↗</button>
                </a>
                {selected.linkedin && (
                  <a href={selected.linkedin.startsWith('http') ? selected.linkedin : `https://${selected.linkedin}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="btn-ghost">LinkedIn ↗</button>
                  </a>
                )}
                <button className="btn-ghost" onClick={() => toggleSave(selected.user_id)}>
                  {saved.has(selected.user_id) ? '♥ Saved' : '♡ Save'}
                </button>
                <button className="btn-gold" style={{ marginLeft: 'auto' }} onClick={() => sendContact(selected)} disabled={contactSent.has(selected.user_id)}>
                  {contactSent.has(selected.user_id) ? '✓ Contacted' : 'Contact →'}
                </button>
              </div>

              {contactSent.has(selected.user_id) && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(40,200,64,0.08)', border: '1px solid rgba(40,200,64,0.15)', borderRadius: 8, fontSize: 12, color: 'rgba(40,200,64,0.7)', fontFamily: 'DM Mono, monospace' }}>
                  ✓ Candidate notified via JobGenie AI
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(200,169,110,0.2)', textTransform: 'uppercase' }}>
                Profile sourced from JobGenie AI
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
