'use client'

import React, { useMemo, useRef, useState } from 'react'
import { BriefModal, ProjectBrief } from '../components/BriefModal'
import type {
  PipelineResult,
  GapAnalysis,
  GitHubVerification,
  ProjectSuggestion,
  AgenticResource,
} from '../types'

type Screen = 'landing' | 'input' | 'analyzing' | 'results' | 'error'
type Tier = 'Demonstrated' | 'Partial Evidence' | 'Missing' | 'Differentiator'

const roles = ['AI Engineer', 'Software Engineer', 'Network Administrator', 'Security Engineer', 'Backend Engineer', 'Frontend Engineer']
const companies = ['Google', 'Microsoft', 'Amazon', 'NVIDIA', 'Meta', 'Stripe']

const questions: Record<string, { prompt: string; options: string[] }> = {
  'AI Engineer': {
    prompt: 'Which AI engineering domain best aligns with your next strategic career step?',
    options: ['Production ML systems & MLOps', 'LLM applications and multi-agent systems', 'Computer vision & multimodal models', 'Data & model infrastructure optimization']
  },
  'Software Engineer': {
    prompt: 'What kind of software engineering impact are you targeting?',
    options: ['Scalable backend microservices', 'Full-stack product delivery', 'Developer platform & tooling', 'Distributed systems & database engine']
  },
  'Network Administrator': {
    prompt: 'Which network architecture environment do you want to operate in?',
    options: ['Enterprise infrastructure & BGP', 'Cloud networking & AWS Transit Gateway', 'Zero-Trust Network Security & Pentesting', 'Data center SDN operations']
  },
  'Security Engineer': {
    prompt: 'What security domain are you targeting?',
    options: ['Application security & SAST/DAST', 'Cloud security & CSPM', 'Red team & penetration testing', 'Identity & access management']
  },
  'Backend Engineer': {
    prompt: 'What backend engineering focus best fits your goals?',
    options: ['High-throughput API design', 'Database internals & query optimization', 'Event-driven & message queue systems', 'Platform engineering & developer tooling']
  },
  'Frontend Engineer': {
    prompt: 'Which frontend specialization are you targeting?',
    options: ['Component systems & design engineering', 'Performance & Core Web Vitals', 'Accessibility & inclusive design', 'Micro-frontend architecture']
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Mark({ tone = 'green', children }: { tone?: string; children: React.ReactNode }) {
  const formattedTone = tone.toLowerCase().replace(/\s+/g, '-').replace('_', '-')
  const map: Record<string, string> = {
    demonstrated: 'green',
    partial: 'ochre',
    missing: 'red',
    differentiator: 'blue',
    'partial-evidence': 'ochre',
  }
  return <span className={`mark mark-${map[formattedTone] ?? formattedTone}`}>{children}</span>
}

function Stamp({ tone = 'green', children }: { tone?: string; children: React.ReactNode }) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>
}

function Header({ onReset }: { onReset: () => void }) {
  return (
    <header className="site-header">
      <button className="wordmark" onClick={onReset}>
        <span className="wordmark-mark">EL</span>
        <span>Evidence Ledger</span>
      </button>
      <div className="header-note">
        AN OPEN DIAGNOSTIC FOR TECH CAREERS <span className="rule-dot" /> V.02
      </div>
    </header>
  )
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function Landing({ start }: { start: () => void }) {
  return (
    <main className="landing">
      <section className="hero">
        <div className="eyebrow">
          <span className="red-dot" /> CASE FILE 001 / CAREER EVIDENCE
        </div>
        <h1>
          Know what your<br />
          <em>work</em> can prove.
        </h1>
        <p className="hero-copy">
          Evidence Ledger cross-checks your resume against target roles using AI, asks strategic domain questions, and pinpoints exact portfolio builds that create missing proof.
        </p>
        <button className="primary-button" onClick={start}>
          Analyze my resume <span>→</span>
        </button>
        <p className="honesty">Not a hiring predictor. An objective AI diagnostic &amp; direction-setting tool.</p>
      </section>

      <section className="approach">
        <div className="section-label">THE METHOD / THREE LAYERS</div>
        <div className="method-grid">
          <article>
            <span className="method-number">I</span>
            <h2>Evidence-tiered analysis</h2>
            <p>Every skill signal is categorized by what your resume text actually substantiates.</p>
          </article>
          <article>
            <span className="method-number">II</span>
            <h2>Domain agent interview</h2>
            <p>Answer domain questions tailored specifically to your chosen role &amp; company benchmark.</p>
          </article>
          <article>
            <span className="method-number">III</span>
            <h2>Actionable direction</h2>
            <p>Receive a clear alignment score, targeted gap analysis, and tailored project briefs.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

// ─── Progress ─────────────────────────────────────────────────────────────────

function Progress({ step }: { step: number }) {
  return (
    <div className="progress">
      <div className="progress-line">
        <span style={{ width: `${(step / 5) * 100}%` }} />
      </div>
      <div className="progress-labels">
        <span className={step >= 1 ? 'active' : ''}>01 Upload</span>
        <span className={step >= 2 ? 'active' : ''}>02 Target</span>
        <span className={step >= 3 ? 'active' : ''}>03 Domain</span>
        <span className={step >= 4 ? 'active' : ''}>04 Verify</span>
        <span className={step >= 5 ? 'active' : ''}>05 Summary</span>
      </div>
    </div>
  )
}

// ─── Input Flow ───────────────────────────────────────────────────────────────

function InputFlow({
  onSubmit,
}: {
  onSubmit: (params: { file: File | null; resumeText: string; targetRole: string; company: string; githubUsername: string }) => void
}) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [github, setGithub] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const selectedRole = role || 'Software Engineer'
  const question = questions[selectedRole] || questions['Software Engineer']

  const handleFileChange = (selected?: File) => {
    if (!selected) return
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      return setError('Please upload a valid PDF document.')
    }
    if (selected.size > 10 * 1024 * 1024) {
      return setError('File size exceeds maximum 10 MB limit.')
    }
    setFile(selected)
    setError('')
  }

  const next = () => {
    setError('')
    if (step === 1 && !file) return setError('Please choose a valid PDF resume before continuing.')
    if (step === 2 && !role) return setError('Select a target role to continue.')
    if (step === 3 && !answer) return setError('Choose an answer so the agent can tailor your analysis.')
    if (step < 5) {
      setStep(step + 1)
    } else {
      // Build a combined target role including the domain answer
      const combinedRole = answer ? `${selectedRole} — ${answer}` : selectedRole
      onSubmit({ file, resumeText: '', targetRole: combinedRole, company, githubUsername: github })
    }
  }

  return (
    <main className="flow-page">
      <Progress step={step} />
      <div className="flow-shell">
        <aside className="flow-aside">
          <div className="section-label">NEW ANALYSIS</div>
          <h1>
            Build the<br />
            <em>record.</em>
          </h1>
          <p>Five guided inputs. One evidence-led AI report. Your data is processed securely and never stored.</p>
          <div className="aside-meta">
            <span>EST. ANALYSIS TIME</span>
            <b>30–60 SEC</b>
          </div>
        </aside>

        <section className="flow-panel">
          {step === 1 && (
            <>
              <div className="step-kicker">STEP 01 / RESUME</div>
              <h2>Start with your resume.</h2>
              <p className="panel-intro">Upload the source PDF we need to extract and separate claims from verified proof.</p>

              <label
                className={`dropzone ${file ? 'has-file' : ''} ${dragActive ? 'drag-active' : ''}`}
                htmlFor="resume-upload"
                onDragOver={e => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragActive(false)
                  if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0])
                }}
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                <div className="upload-glyph">↑</div>
                <strong>{file ? file.name : 'Drop your PDF here'}</strong>
                <span>{file ? `${(file.size / 1024).toFixed(0)} KB · PDF ready for text extraction` : 'or click to browse · PDF format only · 10 MB max'}</span>
              </label>

              <div className="state-note">
                <span className="note-bar" />
                Text extraction mode active. Password protected PDFs are flagged prior to parsing.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="step-kicker">STEP 02 / TARGET</div>
              <h2>Where are you aiming?</h2>
              <p className="panel-intro">Choose your target career path, then optionally select a company benchmark.</p>

              <label className="field-label">AIMING FOR ROLE</label>
              <div className="choice-grid">
                {roles.map(r => (
                  <button
                    className={`choice-chip ${role === r ? 'selected' : ''}`}
                    key={r}
                    onClick={() => { setRole(r); setAnswer('') }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <label className="field-label">
                TARGET BENCHMARK <span>OPTIONAL</span>
              </label>
              <div className="choice-grid">
                {companies.map(c => (
                  <button
                    className={`choice-chip ${company === c ? 'selected' : ''}`}
                    key={c}
                    onClick={() => setCompany(company === c ? '' : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="step-kicker">STEP 03 / DOMAIN AGENT</div>
              <h2>Domain intelligence signal.</h2>
              <p className="panel-intro">
                Your agent is tailoring questions for <b>{selectedRole}</b>{company && <> at <b>{company}</b></>}.
              </p>

              <div className="agent-card">
                <span className="agent-badge">AGENT QUESTION</span>
                <h3>{question.prompt}</h3>
                <div className="choice-grid">
                  {question.options.map(opt => (
                    <button
                      className={`choice-chip ${answer === opt ? 'selected' : ''}`}
                      key={opt}
                      onClick={() => setAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="step-kicker">STEP 04 / VERIFY</div>
              <h2>Show your public work.</h2>
              <p className="panel-intro">Optional GitHub verification adds a deterministic signal to your claims.</p>

              <label className="field-label" htmlFor="github">
                GITHUB USERNAME <span>OPTIONAL</span>
              </label>
              <input
                id="github"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="e.g. alexchen-dev"
                className="text-field"
              />

              <div className="state-note">
                <span className="note-bar" />
                Public repositories are inspected for commit markers. Private code is never accessed.
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="step-kicker">STEP 05 / SUMMARY</div>
              <h2>Review your inputs.</h2>
              <p className="panel-intro">The AI diagnostic will combine your resume text, role benchmark, and domain signal.</p>

              <div className="summary-block">
                <b>{file?.name || 'Resume.pdf'}</b>
                <span>Target: {selectedRole} {company && `(${company})`}</span>
                <span>Focus: {answer}</span>
                <small>{github ? `GitHub check: @${github}` : 'GitHub verification: Skipped'}</small>
              </div>
            </>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button flow-next" onClick={next}>
            {step === 5 ? 'Run AI Analysis' : 'Continue'} <span>→</span>
          </button>
        </section>
      </div>
    </main>
  )
}

// ─── Analyzing / Loading ───────────────────────────────────────────────────────

function Analyzing() {
  const [current, setCurrent] = useState(0)
  const steps = [
    'Parsing PDF — extracting text from your resume',
    'Running LLM extraction — identifying skills & experience',
    'Matching target role profile against AI benchmark',
    'Verifying GitHub public repositories',
    'Analyzing skill gaps with evidence tiers',
    'Generating portfolio project recommendations',
    'Fetching verified learning resources',
  ]

  useMemo(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setCurrent(c => Math.min(c + 1, steps.length - 1))
      if (i >= steps.length - 1) clearInterval(t)
    }, 4000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="pipeline">
      <div className="pipeline-paper">
        <div className="eyebrow">
          <span className="red-dot" /> AI PIPELINE IN PROGRESS
        </div>
        <h1>
          Reading the<br />
          <em>record.</em>
        </h1>

        <div className="pipeline-list">
          {steps.map((s, i) => (
            <div
              className={`pipeline-step ${i < current ? 'done' : i === current ? 'working' : ''}`}
              key={s}
            >
              <span>{i < current ? '✓' : i === current ? '◌' : '—'}</span>
              <div>
                <b>{s}</b>
                <small>{i < current ? 'Complete' : i === current ? 'Processing…' : 'Queued'}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="pipeline-footer">Every recommendation retains an explicit link to its evidence source.</div>
      </div>
    </main>
  )
}

// ─── Results (Real Data) ───────────────────────────────────────────────────────

function Results({
  data,
  role,
  company,
  reset,
}: {
  data: PipelineResult
  role: string
  company: string
  reset: () => void
}) {
  const [openRow, setOpenRow] = useState<number | null>(0)
  const [selectedBrief, setSelectedBrief] = useState<ProjectBrief | null>(null)

  const ga: GapAnalysis = data.gapAnalysis
  const gh: GitHubVerification | undefined = data.githubVerification
  const projects: ProjectSuggestion[] = data.projectSuggestions
  const resources: AgenticResource[] = data.resources
  const candidateName = data.resumeExtraction.summary
    ? data.resumeExtraction.summary.split(' ').slice(0, 2).join(' ')
    : 'Candidate'

  // Flatten all skills for the evidence table
  const allSkills = [
    ...ga.tiers.demonstrated.map(s => ({ ...s, tierLabel: 'Demonstrated' as const })),
    ...ga.tiers.partial.map(s => ({ ...s, tierLabel: 'Partial Evidence' as const })),
    ...ga.tiers.missing.map(s => ({ ...s, tierLabel: 'Missing' as const })),
    ...ga.tiers.differentiators.map(s => ({ ...s, tierLabel: 'Differentiator' as const })),
  ]

  const scoreLabel = ga.score >= 80 ? 'strong' : ga.score >= 55 ? 'partial' : 'early'
  const stampTone = ga.score >= 80 ? 'green' : ga.score >= 55 ? 'ochre' : 'red'

  return (
    <main className="results">
      <aside className="case-rail">
        <div className="section-label">CASE FILE / 001</div>
        <h1 style={{ textTransform: 'capitalize' }}>{candidateName}</h1>
        <div className="rail-rule" />

        <span className="rail-label">AIMING FOR</span>
        <b>{role}{company && ` at ${company}`}</b>

        <span className="rail-label">ROLE PROFILE</span>
        <div>
          <Mark tone="green">{data.roleProfile.roleName}</Mark>
        </div>

        <div className="rail-score">
          <span>TOTAL ALIGNMENT SCORE</span>
          <strong>{ga.score}</strong>
          <small>/ 100</small>
        </div>

        <Stamp tone={stampTone}>
          {scoreLabel.toUpperCase()}<br />
          <small>RECORD</small>
        </Stamp>

        <button className="text-button" onClick={reset} style={{ marginTop: '20px', font: '12px var(--font-mono)', cursor: 'pointer' }}>
          Start new analysis ↗
        </button>
      </aside>

      <section className="report">
        <div className="report-header">
          <div>
            <div className="eyebrow">
              <span className="red-dot" /> AI ANALYSIS COMPLETE
            </div>
            <h1>
              The focus<br />
              <em>is clear.</em>
            </h1>
            <p>{ga.explanation}</p>
          </div>

          <div className="score-block">
            <div className="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="51" />
                <circle
                  className="score-arc"
                  cx="60" cy="60" r="51"
                  style={{ strokeDashoffset: `${320 - (ga.score / 100) * 320}` }}
                />
              </svg>
              <div>
                <strong>{ga.score}</strong>
                <span>/ 100</span>
              </div>
            </div>
            <div>
              <div className="section-label">ALIGNMENT INDEX</div>
              <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'var(--muted)' }}>
                {ga.tiers.demonstrated.length} demonstrated · {ga.tiers.missing.length} gaps identified
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Verification */}
        {gh && (
          <section className="verification">
            <div>
              <div className="section-label">DETERMINISTIC CHECK / GITHUB @{gh.username}</div>
              <h2>Claim vs. commit.</h2>
              <p>
                {gh.repoCount} public repos · {gh.totalCommits} commits scanned.{' '}
                Verified {gh.verified.length} of {gh.verified.length + gh.unverified.length} claimed skills.
              </p>
            </div>
            <Stamp tone={gh.verified.length > 0 ? 'green' : 'ochre'}>
              {gh.verified.length > 0 ? 'VERIFIED' : 'PARTIAL'}<br />
              <small>{gh.verified.length} / {gh.verified.length + gh.unverified.length} CLAIMS</small>
            </Stamp>

            <div className="verify-list">
              {gh.verified.map(skill => (
                <div key={skill}>
                  <span className="check">✓</span>
                  <b>{skill}</b>
                  <code>public repo evidence found</code>
                </div>
              ))}
              {gh.unverified.map(skill => (
                <div className="flagged" key={skill}>
                  <span>!</span>
                  <b>{skill}</b>
                  <code>No matching public commit evidence found</code>
                </div>
              ))}
              {gh.stale.map(skill => (
                <div className="flagged" key={skill}>
                  <span>~</span>
                  <b>{skill}</b>
                  <code>Repo found but no activity in 6+ months</code>
                </div>
              ))}
            </div>
            {gh.unclaimed.length > 0 && (
              <p className="verify-foot">
                <strong>Unclaimed tech found in repos:</strong> {gh.unclaimed.join(', ')} — consider adding to resume.
              </p>
            )}
            <p className="verify-foot">GitHub checks evaluate public repositories as deterministic signals, not full expertise proof.</p>
          </section>
        )}

        {/* Skill Evidence Section */}
        <section className="evidence-section">
          <div className="section-heading">
            <div>
              <div className="section-label">FINDINGS / {allSkills.length} SIGNALS</div>
              <h2>Skill evidence</h2>
            </div>
            <span className="source-tag">AI-TIERED</span>
          </div>

          {allSkills.map((s, i) => (
            <div className={`evidence-row tier-${s.tier}`} key={`${s.skill}-${i}`}>
              <button
                onClick={() => setOpenRow(openRow === i ? null : i)}
                aria-expanded={openRow === i}
              >
                <span className="tier-mark" />
                <span className="skill-name">{s.skill}</span>
                {s.lineCitations && s.lineCitations.length > 0 && (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginRight: 'auto', marginLeft: '8px' }}>
                    {s.lineCitations.map(l => `[Line ${l}]`).join(' ')}
                  </span>
                )}
                <Mark tone={s.tier}>{s.tierLabel}</Mark>
                <span className="chevron">{openRow === i ? '−' : '+'}</span>
              </button>

              {openRow === i && (
                <div className="evidence-detail">
                  <span className="quote">"</span>
                  {s.evidence}
                </div>
              )}
            </div>
          ))}

          {ga.verificationNotes.length > 0 && (
            <div className="state-note" style={{ marginTop: '16px' }}>
              <span className="note-bar" />
              {ga.verificationNotes[0]}
            </div>
          )}
        </section>

        {/* Recommended Builds */}
        {projects.length > 0 && (
          <section className="projects">
            <div className="section-heading">
              <div>
                <div className="section-label">RECOMMENDED BUILDS / {projects.length} PROJECTS</div>
                <h2>Build the missing proof.</h2>
              </div>
            </div>

            {projects.map((p, idx) => {
              const brief: ProjectBrief = {
                gap: p.skillGap,
                title: p.projectTitle,
                description: p.description,
                effort: `${p.estimatedHours}h · ${p.difficulty}`,
                color: idx % 3 === 0 ? 'red' : idx % 3 === 1 ? 'ochre' : 'blue',
                deliverables: p.learningOutcomes,
                guide: p.techStack.map(t => ({ step: t, detail: `Use ${t} in this project` })),
              }
              return (
                <article className={`project-card ${brief.color}`} key={p.projectTitle}>
                  <div>
                    <Mark tone={brief.color}>{p.skillGap}</Mark>
                    <h3>{p.projectTitle}</h3>
                    <p>{p.description}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {p.techStack.map(t => (
                        <code key={t} style={{ fontSize: '11px', background: 'var(--paper-darker)', padding: '2px 6px', borderRadius: '2px' }}>{t}</code>
                      ))}
                    </div>
                  </div>
                  <div className="project-meta">
                    <span>EST. EFFORT</span>
                    <b>{p.estimatedHours}h · {p.difficulty}</b>
                    <button className="outline-button" onClick={() => setSelectedBrief(brief)}>
                      View brief ↗
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* Learning Resources */}
        {resources.length > 0 && (
          <section className="resources">
            <div className="section-label">CURATED RESOURCES / AI-VERIFIED LEARNING PATHS</div>
            <div className="resource-links">
              {resources.flatMap(r =>
                r.resources.map(res => (
                  <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer">
                    <span style={{ color: 'var(--muted)', fontSize: '10px', marginRight: '8px', textTransform: 'uppercase' }}>{r.skill}</span>
                    {res.title} <span>↗</span>
                  </a>
                ))
              )}
            </div>
          </section>
        )}
      </section>

      <BriefModal brief={selectedBrief} onClose={() => setSelectedBrief(null)} />
    </main>
  )
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, reset }: { message: string; reset: () => void }) {
  return (
    <main className="pipeline">
      <div className="pipeline-paper">
        <div className="eyebrow">
          <span className="red-dot" /> PIPELINE ERROR
        </div>
        <h1>Something went<br /><em>wrong.</em></h1>
        <p style={{ color: 'var(--wax)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '24px', lineHeight: 1.6 }}>
          {message}
        </p>
        <button className="primary-button" style={{ marginTop: '32px' }} onClick={reset}>
          Try again <span>→</span>
        </button>
      </div>
    </main>
  )
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [key, setKey] = useState(0)
  const [target, setTarget] = useState({ role: '', company: '' })
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setKey(k => k + 1)
    setScreen('landing')
    setPipelineResult(null)
    setErrorMsg('')
  }

  const runAnalysis = async (params: {
    file: File | null
    resumeText: string
    targetRole: string
    company: string
    githubUsername: string
  }) => {
    setTarget({ role: params.targetRole, company: params.company })
    setScreen('analyzing')

    try {
      let body: FormData | string
      let headers: Record<string, string> = {}

      if (params.file) {
        const fd = new FormData()
        fd.append('file', params.file)
        fd.append('targetRole', params.targetRole)
        fd.append('githubUsername', params.githubUsername)
        body = fd
        // Content-Type set automatically by browser for FormData
      } else {
        body = JSON.stringify({
          resumeText: params.resumeText,
          targetRole: params.targetRole,
          githubUsername: params.githubUsername,
        })
        headers['Content-Type'] = 'application/json'
      }

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        body,
        headers,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || err.details || `Server error ${res.status}`)
      }

      const result: PipelineResult = await res.json()
      setPipelineResult(result)
      setScreen('results')
    } catch (err) {
      setErrorMsg((err as Error).message || 'Unknown error occurred during pipeline execution.')
      setScreen('error')
    }
  }

  return (
    <div key={key}>
      <Header onReset={reset} />
      {screen === 'landing' && <Landing start={() => setScreen('input')} />}
      {screen === 'input' && <InputFlow onSubmit={runAnalysis} />}
      {screen === 'analyzing' && <Analyzing />}
      {screen === 'results' && pipelineResult && (
        <Results data={pipelineResult} role={target.role} company={target.company} reset={reset} />
      )}
      {screen === 'error' && <ErrorScreen message={errorMsg} reset={reset} />}
    </div>
  )
}
