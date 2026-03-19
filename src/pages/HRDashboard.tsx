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

const SKILL_COLORS = ['#f59e0b','#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c']
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
    <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, animation: 'pulse 1.5s infinite' }}>⚡</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: '#555', letterSpacing: '0.05em' }}>Loading candidates...</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } * { margin:0;padding:0;box-sizing:border-box; }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .hr-inp {
          width:100%; padding:11px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Outfit',sans-serif; font-size:14px;
          outline:none; transition:border-color 0.2s;
        }
        .hr-inp:focus { border-color:#f59e0b; }
        .hr-inp::placeholder { color:#444; }

        .hr-sel {
          width:100%; padding:11px 16px;
          background:#1e1e1e; border:1.5px solid #2a2a2a;
          border-radius:12px; color:#fff;
          font-family:'Outfit',sans-serif; font-size:14px;
          outline:none; cursor:pointer; appearance:none;
        }
        .hr-sel option { background:#1a1a1a; }

        .candidate-card {
          background:#1a1a1a; border:1.5px solid #252525;
          border-radius:20px; padding:22px;
          cursor:pointer; transition:border-color 0.25s, transform 0.2s, box-shadow 0.2s;
        }
        .candidate-card:hover {
          border-color:#f59e0b;
          transform:translateY(-3px);
          box-shadow:0 12px 32px rgba(245,158,11,0.12);
        }

        .skill-tag {
          padding:5px 12px; border-radius:8px;
          font-size:11px; font-weight:600;
          letter-spacing:0.03em;
        }

        .btn-orange {
          padding:11px 24px;
          background:linear-gradient(135deg,#f59e0b,#f97316);
          border:none; border-radius:12px;
          color:#0f0f0f; font-family:'Outfit',sans-serif;
          font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.25s;
        }
        .btn-orange:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,158,11,0.3); }
        .btn-orange:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }

        .btn-outline {
          padding:11px 24px;
          border:1.5px solid #2a2a2a;
          background:transparent; border-radius:12px;
          color:#888; font-family:'Outfit',sans-serif;
          font-size:13px; font-weight:600;
          cursor:pointer; transition:all 0.25s;
        }
        .btn-outline:hover { border-color:#f59e0b; color:#f59e0b; background:rgba(245,158,11,0.05); }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#111; }
        ::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:4px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1.5px solid #1e1e1e',
        padding: '14px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg,#f59e0b,#f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              JobGenie <span style={{ color: '#f59e0b' }}>HR</span>
            </div>
          </div>
          <div style={{ width: 1, height: 20, background: '#2a2a2a', marginLeft: 4 }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Talent Discovery</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {hrProfile && (
            <div style={{
              background: '#1a1a1a', border: '1.5px solid #252525',
              borderRadius: 12, padding: '8px 16px', textAlign: 'right',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{hrProfile.full_name}</div>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.04em' }}>{hrProfile.company_name}</div>
            </div>
          )}
          <button onClick={handleSignOut} style={{
            background: '#1a1a1a', border: '1.5px solid #252525',
            borderRadius: 12, padding: '10px 18px',
            color: '#555', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'color 0.2s',
          }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 48px 80px' }}>

        {/* ── HERO HEADER ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.2)',
            borderRadius: 30, padding: '6px 14px', marginBottom: 16,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.06em' }}>LIVE TALENT POOL</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Find your next{' '}
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              great hire
            </span>
          </h1>
          <p style={{ fontSize: 15, color: '#555', fontWeight: 400 }}>
            {candidates.length} candidates actively looking on JobGenie AI
          </p>
        </div>

        {/* ── SEARCH BAR ── */}
        <div style={{
          background: '#1a1a1a', border: '1.5px solid #252525',
          borderRadius: 20, padding: '24px 28px', marginBottom: 32,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>Skill / Role</label>
              <input className="hr-inp" placeholder="UX Designer, React, Python..." value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchCandidates(skillSearch, locationSearch, expFilter)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>Location</label>
              <input className="hr-inp" placeholder="Mumbai, Remote..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>Experience</label>
              <select className="hr-sel" value={expFilter} onChange={e => setExpFilter(e.target.value)}>
                <option value="">Any</option>
                {[1,2,3,5,7,10].map(y => <option key={y} value={y}>{y}+ yrs</option>)}
              </select>
            </div>
            <button className="btn-orange" onClick={() => fetchCandidates(skillSearch, locationSearch, expFilter)} disabled={searching}
              style={{ whiteSpace: 'nowrap', padding: '11px 28px' }}>
              {searching ? '...' : 'Search →'}
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: '#1a1a1a', borderRadius: 14, padding: 4, width: 'fit-content',
          border: '1.5px solid #252525',
        }}>
          {([['search','All Candidates'],['saved','Saved']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: 11, cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700,
                transition: 'all 0.25s', letterSpacing: '0.02em',
                background: activeTab === tab ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'transparent',
                color: activeTab === tab ? '#0f0f0f' : '#555',
                boxShadow: activeTab === tab ? '0 4px 14px rgba(245,158,11,0.3)' : 'none',
              }}>
              {label}
              {tab === 'saved' && saved.size > 0 && (
                <span style={{
                  marginLeft: 8, background: activeTab === tab ? 'rgba(0,0,0,0.2)' : '#f59e0b',
                  color: activeTab === tab ? '#0f0f0f' : '#0f0f0f',
                  borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 800,
                }}>{saved.size}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── CANDIDATE GRID ── */}
        {displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>{activeTab === 'saved' ? '♡' : '🔍'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#444', letterSpacing: '0.04em' }}>
              {activeTab === 'saved' ? 'No saved candidates yet' : 'No candidates found — try different filters'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {displayList.map((c, i) => (
              <motion.div key={c.user_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="candidate-card" onClick={() => setSelected(c)}>

                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.1))',
                    border: '1.5px solid rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>
                      {c.full_name ? initials(c.full_name) : '??'}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.03em' }}>{c.job_title}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleSave(c.user_id) }}
                    style={{
                      background: saved.has(c.user_id) ? 'rgba(245,158,11,0.15)' : 'transparent',
                      border: `1.5px solid ${saved.has(c.user_id) ? 'rgba(245,158,11,0.3)' : '#2a2a2a'}`,
                      borderRadius: 10, width: 36, height: 36,
                      cursor: 'pointer', fontSize: 16,
                      color: saved.has(c.user_id) ? '#f59e0b' : '#444',
                      transition: 'all 0.25s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {saved.has(c.user_id) ? '♥' : '♡'}
                  </button>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  {c.location && (
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {c.location}
                    </span>
                  )}
                  {c.experience_years && (
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⏱ {c.experience_years}+ yrs
                    </span>
                  )}
                </div>

                {/* Bio */}
                {c.bio && (
                  <p style={{
                    fontSize: 12, color: '#555', lineHeight: 1.6,
                    marginBottom: 14, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                  }}>{c.bio}</p>
                )}

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {(c.skills || []).slice(0, 4).map((s, si) => (
                    <span key={s} className="skill-tag"
                      style={{
                        background: `${SKILL_COLORS[si % SKILL_COLORS.length]}15`,
                        border: `1.5px solid ${SKILL_COLORS[si % SKILL_COLORS.length]}30`,
                        color: SKILL_COLORS[si % SKILL_COLORS.length],
                      }}>
                      {s}
                    </span>
                  ))}
                  {(c.skills || []).length > 4 && (
                    <span className="skill-tag" style={{ background: '#222', border: '1.5px solid #2a2a2a', color: '#555' }}>
                      +{(c.skills || []).length - 4}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #222' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#333', textTransform: 'uppercase' }}>
                    via JobGenie AI
                  </span>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>View Profile →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
              zIndex: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 20,
            }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              style={{
                background: '#1a1a1a', border: '1.5px solid #252525',
                borderRadius: 24, padding: 36,
                maxWidth: 580, width: '100%',
                maxHeight: '88vh', overflowY: 'auto',
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}>

              {/* Close */}
              <button onClick={() => setSelected(null)} style={{
                position: 'absolute', top: 16, right: 20,
                background: '#252525', border: 'none', borderRadius: 10,
                width: 36, height: 36, color: '#888',
                fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>

              {/* Modal Header */}
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 20, flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.1))',
                  border: '2px solid rgba(245,158,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                    {selected.full_name ? initials(selected.full_name) : '??'}
                  </span>
                </div>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    {selected.full_name}
                  </h2>
                  <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{selected.job_title}</div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, marginBottom: 24,
              }}>
                {[
                  ['📍 Location', selected.location],
                  ['⏱ Experience', selected.experience_years ? `${selected.experience_years}+ years` : '—'],
                ].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k as string} style={{
                    background: '#222', border: '1.5px solid #2a2a2a',
                    borderRadius: 14, padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* About */}
              {selected.bio && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 10 }}>About</div>
                  <p style={{ fontSize: 14, color: '#888', lineHeight: 1.75 }}>{selected.bio}</p>
                </div>
              )}

              {/* Skills */}
              {(selected.skills || []).length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(selected.skills || []).map((s, si) => (
                      <span key={s} className="skill-tag"
                        style={{
                          background: `${SKILL_COLORS[si % SKILL_COLORS.length]}15`,
                          border: `1.5px solid ${SKILL_COLORS[si % SKILL_COLORS.length]}30`,
                          color: SKILL_COLORS[si % SKILL_COLORS.length],
                          fontSize: 12, padding: '6px 14px',
                        }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`${JOB_GENIE_APP_URL}/portfolio/${nameToSlug(selected.full_name || '')}`}
                  target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-outline">Portfolio ↗</button>
                </a>
                {selected.linkedin && (
                  <a href={selected.linkedin.startsWith('http') ? selected.linkedin : `https://${selected.linkedin}`}
                    target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="btn-outline">LinkedIn ↗</button>
                  </a>
                )}
                <button className="btn-outline" onClick={() => toggleSave(selected.user_id)}>
                  {saved.has(selected.user_id) ? '♥ Saved' : '♡ Save'}
                </button>
                <button className="btn-orange" style={{ marginLeft: 'auto' }}
                  onClick={() => sendContact(selected)}
                  disabled={contactSent.has(selected.user_id)}>
                  {contactSent.has(selected.user_id) ? '✓ Contacted' : 'Contact →'}
                </button>
              </div>

              {/* Contact Confirmation */}
              {contactSent.has(selected.user_id) && (
                <div style={{
                  marginTop: 14, padding: '12px 16px',
                  background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.2)',
                  borderRadius: 12, fontSize: 13, color: '#34d399', fontWeight: 600,
                }}>
                  ✓ Candidate notified via JobGenie AI
                </div>
              )}

              <div style={{
                marginTop: 24, textAlign: 'center',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                color: '#2a2a2a', textTransform: 'uppercase',
              }}>
                Profile sourced from JobGenie AI
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
