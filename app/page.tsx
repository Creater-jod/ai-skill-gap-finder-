'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { BriefModal, ProjectBrief } from '../components/BriefModal'
import type {
  PipelineResult,
  GapAnalysis,
  GitHubVerification,
  ProjectSuggestion,
  AgenticResource,
  PositionMatchResult,
} from '../types'

type Screen = 'landing' | 'input' | 'analyzing' | 'results' | 'error'
type TierFilter = 'all' | 'demonstrated' | 'partial' | 'missing' | 'quick_win'
type ResultsTab = 'overview' | 'evidence' | 'faang' | 'github' | 'roadmap'

const roles = [
  'AI Engineer',
  'Software Engineer',
  'Network Administrator',
  'DevOps / Cloud Engineer',
  'Security Engineer',
  'Full-Stack Developer',
]

const companies = ['Google', 'Microsoft', 'Amazon', 'NVIDIA', 'Meta', 'Stripe']

const experienceLevels = [
  'Student / Fresher (0-1 yr)',
  'Early Career (1-3 yrs)',
  'Mid-Senior (3-5+ yrs)',
]

const questions: Record<string, { prompt: string; options: string[] }> = {
  'AI Engineer': {
    prompt: 'Which AI engineering domain best aligns with your target strategic role?',
    options: [
      'Production ML systems & MLOps',
      'LLM applications, RAG & multi-agent systems',
      'Computer vision & multimodal edge models',
      'Data & model infrastructure optimization',
    ],
  },
  'Software Engineer': {
    prompt: 'What architectural scope of software engineering are you aiming for?',
    options: [
      'Scalable backend microservices & APIs',
      'Full-stack product delivery & UI systems',
      'Developer platform, pipelines & tooling',
      'Distributed systems & database engines',
    ],
  },
  'Network Administrator': {
    prompt: 'Which network architecture environment do you want to operate in?',
    options: [
      'Enterprise infrastructure, BGP & OSPF routing',
      'Cloud networking & AWS Transit Gateway / VPC',
      'Zero-Trust Network Security & Firewall access',
      'Data center SDN & high-availability switching',
    ],
  },
  'DevOps / Cloud Engineer': {
    prompt: 'What cloud/DevOps domain is your primary focus?',
    options: [
      'Kubernetes orchestration & container platforms',
      'Terraform / IaC and multi-region cloud architecture',
      'CI/CD automated release engineering & observability',
      'Cloud cost optimization & FinOps infrastructure',
    ],
  },
  'Security Engineer': {
    prompt: 'What security specialization are you targeting?',
    options: [
      'Application security, SAST/DAST & secure SDLC',
      'Cloud security posture (CSPM) & IAM governance',
      'Red team operations & penetration testing',
      'SOC operations, SIEM & threat detection',
    ],
  },
  'Full-Stack Developer': {
    prompt: 'What full-stack balance best describes your target impact?',
    options: [
      'Next.js / React frontend with Node/Python APIs',
      'High-throughput web applications with SQL/Redis caching',
      'Component design systems & UX performance',
      'End-to-end SaaS architecture from database to UI',
    ],
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
    'quick-win': 'blue',
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
        <span className="wordmark-mark">SF</span>
        <span>SkillForge</span>
      </button>
      <div className="header-note">
        AI SKILL GAP &amp; PORTFOLIO ADVISOR <span className="rule-dot" /> V.02
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
          <span className="red-dot" /> AI SKILL GAP &amp; PORTFOLIO ENGINE
        </div>
        <h1>
          Know what your<br />
          <em>work</em> can prove.
        </h1>
        <p className="hero-copy">
          SkillForge cross-checks your resume against target technical benchmarks using anti-hallucination RAG, validates claims with GitHub commit checks, and pinpoints exact portfolio builds that create missing proof.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <button className="primary-button" onClick={start}>
            Analyze my resume <span>→</span>
          </button>
        </div>

        <p className="honesty">
          Not a generic keyword matcher. An objective, grounded AI diagnostic &amp; portfolio remediation engine.
        </p>
      </section>

      <section className="approach">
        <div className="method-grid">
          {/* Feature 1: RAG Cross-Checking */}
          <article>
            <div className="method-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0-6 6c0 1.6.64 3.05 1.7 4.1L7 17h10l-.7-3.9A6 6 0 0 0 12 3Z" />
                <path d="M9 17v2a3 3 0 0 0 6 0v-2" />
                <circle cx="18.5" cy="8.5" r="2.5" />
                <path d="M18.5 5v1m0 5v1m-3-3.5h1m5 0h1" />
                <circle cx="5.5" cy="12.5" r="1.5" />
              </svg>
            </div>
            <h2>RAG Cross-Checking</h2>
            <p>
              Uses anti-hallucination Retrieval-Augmented Generation to cross-reference your resume claims with actual technical benchmarks.
            </p>
          </article>

          {/* Feature 2: GitHub Validation */}
          <article>
            <div className="method-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <circle cx="18" cy="18" r="4.5" fill="var(--forest)" stroke="none" />
                <path d="M16 18l1.5 1.5 3-3" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2>GitHub Validation</h2>
            <p>
              Connects to your GitHub to verify code contributions and project involvement, ensuring claims are backed by real work.
            </p>
          </article>

          {/* Feature 3: Portfolio Pinpointing */}
          <article>
            <div className="method-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                <path d="M12 14h4v-4" />
                <path d="M16 10l-6 6" />
              </svg>
            </div>
            <h2>Portfolio Pinpointing</h2>
            <p>
              Identifies gaps in your demonstrated skills and suggests specific projects to build that directly address missing evidence.
            </p>
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
        <span className={step >= 2 ? 'active' : ''}>02 Target &amp; Level</span>
        <span className={step >= 3 ? 'active' : ''}>03 Domain Signal</span>
        <span className={step >= 4 ? 'active' : ''}>04 GitHub Check</span>
        <span className={step >= 5 ? 'active' : ''}>05 Summary</span>
      </div>
    </div>
  )
}

// ─── Input Flow ───────────────────────────────────────────────────────────────

function InputFlow({
  onSubmit,
}: {
  onSubmit: (params: {
    file: File | null
    resumeText: string
    targetRole: string
    company: string
    experienceLevel: string
    githubUsername: string
  }) => void
}) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [company, setCompany] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Early Career (1-3 yrs)')
  const [file, setFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [github, setGithub] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const effectiveRole = customRole.trim() || role || 'Software Engineer'
  const question = questions[effectiveRole] || questions['Software Engineer']

  const handleFileChange = (selected?: File) => {
    if (!selected) return
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      return setError('Please upload a valid PDF document.')
    }
    if (selected.size > 10 * 1024 * 1024) {
      return setError('File size exceeds maximum 10 MB limit.')
    }
    setFile(selected)
    setResumeText('')
    setError('')
  }

  const next = () => {
    setError('')
    if (step === 1 && !file && !resumeText.trim()) {
      return setError('Please choose a valid PDF resume before continuing.')
    }
    if (step === 2 && !effectiveRole) {
      return setError('Please select a target role or type a custom role.')
    }
    if (step === 3 && !answer) {
      return setError('Choose a domain answer so the engine can tailor your assessment.')
    }

    if (step < 5) {
      setStep(step + 1)
    } else {
      const combinedRole = answer ? `${effectiveRole} — ${answer}` : effectiveRole
      onSubmit({
        file,
        resumeText,
        targetRole: combinedRole,
        company,
        experienceLevel,
        githubUsername: github,
      })
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
          <p>Five guided inputs. Grounded AI verification. Your data is processed securely in memory.</p>
          <div className="aside-meta">
            <span>CALIBRATION</span>
            <b>{experienceLevel.includes('Fresher') ? 'UNIVERSITY / GRAD' : 'INDUSTRY STANDARD'}</b>
          </div>
        </aside>

        <section className="flow-panel">
          {step === 1 && (
            <>
              <div className="step-kicker">STEP 01 / RESUME SOURCE</div>
              <h2>Upload your resume.</h2>
              <p className="panel-intro">Upload your source PDF resume for text extraction, skill verification, and RAG gap analysis.</p>

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
                <strong>
                  {file ? file.name : 'Drop your PDF here'}
                </strong>
                <span>
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB · PDF ready for text extraction`
                    : 'or click to browse · PDF format · 10 MB max'}
                </span>
              </label>

              <div className="state-note" style={{ marginTop: '20px' }}>
                <span className="note-bar" />
                Text extraction mode active. In-memory parsing only — your document is never stored.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="step-kicker">STEP 02 / TARGET &amp; LEVEL</div>
              <h2>Where are you aiming?</h2>
              <p className="panel-intro">Select your target role, optional company benchmark, and experience level to calibrate the hiring bar.</p>

              <label className="field-label">TARGET TECHNICAL ROLE</label>
              <div className="choice-grid">
                {roles.map(r => (
                  <button
                    className={`choice-chip ${role === r && !customRole ? 'selected' : ''}`}
                    key={r}
                    onClick={() => { setRole(r); setCustomRole(''); setAnswer('') }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="custom-role-wrapper">
                <input
                  className="custom-role-input"
                  placeholder="Or type any custom role (e.g. Lead Blockchain Security Architect, Site Reliability Engineer)..."
                  value={customRole}
                  onChange={e => {
                    setCustomRole(e.target.value)
                    setRole('')
                    setAnswer('')
                  }}
                />
              </div>

              <label className="field-label" style={{ marginTop: '24px' }}>
                TARGET COMPANY BENCHMARK <span>OPTIONAL</span>
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

              <label className="field-label" style={{ marginTop: '24px' }}>
                CANDIDATE EXPERIENCE LEVEL
              </label>
              <div className="choice-grid">
                {experienceLevels.map(lvl => (
                  <button
                    className={`choice-chip ${experienceLevel === lvl ? 'selected' : ''}`}
                    key={lvl}
                    onClick={() => setExperienceLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="state-note" style={{ marginTop: '16px' }}>
                <span className="note-bar" />
                {experienceLevel.includes('Fresher')
                  ? 'Fresher Mode: Evaluates foundational CS theory, personal projects, and hackathons rather than multi-year enterprise tenure.'
                  : 'Industry Mode: Evaluates production microservices, system scale, concurrency, and architecture rigor.'}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="step-kicker">STEP 03 / DOMAIN AGENT</div>
              <h2>Domain intelligence signal.</h2>
              <p className="panel-intro">
                Tailoring assessment for <b>{effectiveRole}</b>{company && <> at <b>{company}</b></>} ({experienceLevel}).
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
              <div className="step-kicker">STEP 04 / PUBLIC PROOF</div>
              <h2>Show your public work.</h2>
              <p className="panel-intro">Optional GitHub verification inspects real commit markers to substantiate claimed skills.</p>

              <label className="field-label" htmlFor="github">
                GITHUB USERNAME <span>OPTIONAL</span>
              </label>
              <input
                id="github"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="e.g. alexchen-dev or octocat"
                className="text-field"
              />

              <div className="state-note" style={{ marginTop: '20px' }}>
                <span className="note-bar" />
                Public repositories are inspected for commit markers. Private code is never accessed.
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="step-kicker">STEP 05 / SUMMARY</div>
              <h2>Review assessment parameters.</h2>
              <p className="panel-intro">Your record will be analyzed against verified benchmarks and anti-hallucination rubrics.</p>

              <div className="summary-block">
                <b>{file ? file.name : 'Uploaded Resume PDF'}</b>
                <span>Target: {effectiveRole} {company && `(${company})`}</span>
                <span>Experience: {experienceLevel}</span>
                <span>Domain Focus: {answer}</span>
                <small>{github ? `GitHub Check: @${github}` : 'GitHub Verification: Skipped'}</small>
              </div>
            </>
          )}

          {error && <p className="form-error" role="alert" style={{ marginTop: '16px' }}>{error}</p>}

          <button className="primary-button flow-next" onClick={next}>
            {step === 5 ? 'Run AI Analysis' : 'Continue'} <span>→</span>
          </button>
        </section>
      </div>
    </main>
  )
}

// ─── Analyzing Screen ─────────────────────────────────────────────────────────

function Analyzing() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Parsing resume PDF & indexing structural line tokens',
    'Extracting skills, projects & verified experience',
    'Retrieving FAANG technical benchmarks & role rubrics',
    'Executing dense vector cosine & lexical BM25 matching',
    'Scanning public GitHub commit markers',
    'Executing Layer 6 Deterministic Hallucination Killer',
    'Synthesizing quick-win rewrites & portfolio build briefs',
  ]

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(s => (s < steps.length - 1 ? s + 1 : s))
    }, 3000)

    return () => {
      clearInterval(stepTimer)
    }
  }, [steps.length])

  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / steps.length) * 100))

  return (
    <main className="pipeline">
      <div className="pipeline-paper">
        <div className="eyebrow">
          <span className="red-dot" /> AI PIPELINE ACTIVE · MULTI-LAYER AUDIT
        </div>
        <h1>
          Reading the<br />
          <em>record.</em>
        </h1>

        <div className="pipeline-progress-bar">
          <div className="pipeline-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="pipeline-list">
          {steps.map((title, i) => {
            const isDone = i < currentStep
            const isWorking = i === currentStep
            return (
              <div
                className={`pipeline-step ${isDone ? 'done' : isWorking ? 'working' : ''}`}
                key={title}
              >
                <div className="pipeline-step-left">
                  <span className="pipeline-step-icon">{isDone ? '✓' : isWorking ? '◌' : '—'}</span>
                  <b>{title}</b>
                </div>
                <span className={`pipeline-badge ${isDone ? 'complete' : isWorking ? 'processing' : 'queued'}`}>
                  {isDone ? 'COMPLETE' : isWorking ? 'PROCESSING...' : 'QUEUED'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="pipeline-footer">
          Layer 6 Active: Every recommendation is deterministically grounded to source text.
        </div>
      </div>
    </main>
  )
}

// ─── Results Tabbed Executive Dossier ──────────────────────────────────────────

function Results({
  data,
  role,
  company,
  experienceLevel,
  reset,
}: {
  data: PipelineResult
  role: string
  company: string
  experienceLevel: string
  reset: () => void
}) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('overview')
  const [openRows, setOpenRows] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
  const [selectedBrief, setSelectedBrief] = useState<ProjectBrief | null>(null)
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const ga: GapAnalysis = data.gapAnalysis || {
    score: 50,
    tiers: { demonstrated: [], partial: [], missing: [], differentiators: [] },
    explanation: '',
    verificationNotes: [],
  }
  const gh: GitHubVerification | undefined = data.githubVerification
  const faang: PositionMatchResult | undefined = data.faangMatch
  const projects: ProjectSuggestion[] = data.projectSuggestions || []
  const resources: AgenticResource[] = data.resources || []

  const rawSummary =
    typeof data?.resumeExtraction?.summary === 'string'
      ? data.resumeExtraction.summary
      : typeof data?.resumeExtraction?.summary === 'object' && data?.resumeExtraction?.summary !== null
      ? JSON.stringify(data.resumeExtraction.summary)
      : ''

  const candidateName =
    data?.resumeExtraction?.contactInfo?.fullName && typeof data.resumeExtraction.contactInfo.fullName === 'string'
      ? data.resumeExtraction.contactInfo.fullName
      : rawSummary
      ? rawSummary.trim().split(/\s+/).slice(0, 2).join(' ')
      : 'Candidate'

  const demonstrated = ga.tiers?.demonstrated || []
  const partial = ga.tiers?.partial || []
  const missing = ga.tiers?.missing || []
  const differentiators = ga.tiers?.differentiators || []

  // Flatten all skills for the evidence table
  const allSkills = useMemo(() => [
    ...demonstrated.map(s => ({ ...s, tierLabel: 'Proven in Resume' as const, baseTier: 'demonstrated' })),
    ...partial.map(s => ({ ...s, tierLabel: 'Needs Metrics' as const, baseTier: 'partial' })),
    ...missing.map(s => ({ ...s, tierLabel: 'Missing' as const, baseTier: 'missing' })),
    ...differentiators.map(s => ({ ...s, tierLabel: 'Bonus Differentiator' as const, baseTier: 'differentiator' })),
  ], [demonstrated, partial, missing, differentiators])

  // Count metrics for filters
  const counts = useMemo(() => ({
    all: allSkills.length,
    demonstrated: demonstrated.length,
    partial: partial.length,
    missing: missing.length,
    quick_win: allSkills.filter(s => s.gapType === 'quick_win').length,
  }), [allSkills, demonstrated, partial, missing])

  // Filtered skills
  const filteredSkills = useMemo(() => {
    if (tierFilter === 'all') return allSkills
    if (tierFilter === 'quick_win') return allSkills.filter(s => s.gapType === 'quick_win')
    return allSkills.filter(s => s.baseTier === tierFilter)
  }, [allSkills, tierFilter])

  const toggleRow = (idx: number) => {
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleAll = () => {
    if (openRows.size >= filteredSkills.length) {
      setOpenRows(new Set())
    } else {
      setOpenRows(new Set(filteredSkills.map((_, i) => i)))
    }
  }

  const scoreLabel = ga.score >= 80 ? 'Strong Match' : ga.score >= 55 ? 'Competitive Match' : 'Needs Targeted Proof'
  const stampTone = ga.score >= 80 ? 'green' : ga.score >= 55 ? 'ochre' : 'red'

  const copyRewrite = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="results-container">
      {/* Top Executive Header Banner */}
      <section className="dossier-hero">
        <div className="dossier-hero-info">
          <div className="section-label">AI SKILL GAP &amp; MATCH REPORT</div>
          <h1 style={{ textTransform: 'capitalize' }}>{candidateName}</h1>
          <div className="dossier-meta-chips">
            <span className="meta-chip">🎯 Target Role: {role}</span>
            {company && <span className="meta-chip">🏢 Target Company: {company}</span>}
            <span className="meta-chip">🎓 Level: {experienceLevel}</span>
            {gh && <span className="meta-chip">🐙 GitHub: @{gh.username}</span>}
          </div>
        </div>

        <div className="dossier-hero-score">
          <div className="score-circle-wrap">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" />
              <circle
                className="score-arc"
                cx="50"
                cy="50"
                r="42"
                style={{ strokeDashoffset: `${264 - (ga.score / 100) * 264}`, strokeDasharray: 264 }}
              />
            </svg>
            <div>
              <strong>{ga.score}</strong>
              <span>/ 100</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Stamp tone={stampTone}>
              {scoreLabel.toUpperCase()}<br />
              <small>{counts.demonstrated} OF {allSkills.length} SKILLS PROVEN</small>
            </Stamp>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="outline-button" onClick={() => window.print()}>
              Export PDF Report ↗
            </button>
            <button className="text-button" onClick={reset} style={{ font: '11px var(--font-mono)', cursor: 'pointer', textAlign: 'center' }}>
              Analyze Another Resume ↗
            </button>
          </div>
        </div>
      </section>

      {/* Tab Navigation Bar */}
      <nav className="dossier-tab-bar" aria-label="Results tabs">
        <button
          className={`dossier-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          1. Summary Overview
        </button>

        <button
          className={`dossier-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          2. Skill Evidence Ledger
          <span className="tab-counter">{allSkills.length}</span>
        </button>

        {faang && (
          <button
            className={`dossier-tab-btn ${activeTab === 'faang' ? 'active' : ''}`}
            onClick={() => setActiveTab('faang')}
          >
            3. {faang.company} Benchmark
            <span className="tab-counter">{faang.overall_score}%</span>
          </button>
        )}

        {gh && (
          <button
            className={`dossier-tab-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            4. GitHub Code Audit
            <span className="tab-counter">{gh.verified.length} verified</span>
          </button>
        )}

        <button
          className={`dossier-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          5. Action Roadmap
          <span className="tab-counter">{projects.length} projects</span>
        </button>
      </nav>

      {/* ─── TAB 1: EXECUTIVE OVERVIEW ────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="tab-panel">
          <div className="verdict-card">
            <div className="eyebrow">
              <span className="red-dot" /> WHERE YOU STAND TODAY
            </div>
            <h2>Clear, actionable diagnostic.</h2>
            <p>
              {ga.explanation && !ga.explanation.toLowerCase().includes('score calculation:') && !ga.explanation.includes('*')
                ? ga.explanation
                : demonstrated.length > 0 && missing.length > 0
                ? `You have strong, verified evidence in ${demonstrated.slice(0, 3).map(s => s.skill).join(', ')}, but lack direct proof in ${missing.slice(0, 3).map(s => s.skill).join(', ')} which are critical for ${role}.`
                : demonstrated.length > 0
                ? `You demonstrate verified technical proof in ${demonstrated.slice(0, 4).map(s => s.skill).join(', ')}, satisfying primary requirements for ${role}.`
                : `Your resume currently lacks direct proof in core requirements including ${missing.slice(0, 3).map(s => s.skill).join(', ')}. Complete the recommended projects to bridge these gaps.`}
            </p>

            {/* Quick 3-Step Action Plan */}
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'var(--paper-darker)', padding: '12px 14px', borderRadius: '4px', borderLeft: '3px solid #6366F1' }}>
                <strong style={{ fontSize: '12px', color: '#6366F1', display: 'block', textTransform: 'uppercase', font: '10px var(--font-mono)' }}>Step 1 · Instant Fix</strong>
                <span style={{ fontSize: '13px', color: 'var(--ink)', display: 'block', marginTop: '2px' }}>
                  {counts.quick_win > 0 ? `Copy the ${counts.quick_win} Quick-Win rewrite to your resume (+15% score boost)` : 'Fine-tune metrics in your existing bullet points'}
                </span>
              </div>

              <div style={{ background: 'var(--paper-darker)', padding: '12px 14px', borderRadius: '4px', borderLeft: '3px solid var(--forest)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--forest)', display: 'block', textTransform: 'uppercase', font: '10px var(--font-mono)' }}>Step 2 · Build Proof</strong>
                <span style={{ fontSize: '13px', color: 'var(--ink)', display: 'block', marginTop: '2px' }}>
                  {projects.length > 0 ? `Build ${projects[0]?.projectTitle} to prove ${projects[0]?.skillGap}` : 'Build targeted portfolio projects for missing skills'}
                </span>
              </div>

              <div style={{ background: 'var(--paper-darker)', padding: '12px 14px', borderRadius: '4px', borderLeft: '3px solid var(--blue)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--blue)', display: 'block', textTransform: 'uppercase', font: '10px var(--font-mono)' }}>Step 3 · Re-Verify</strong>
                <span style={{ fontSize: '13px', color: 'var(--ink)', display: 'block', marginTop: '2px' }}>
                  Push code to GitHub and re-run analysis to verify 85%+ match score
                </span>
              </div>
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card kpi-demonstrated">
              <span className="kpi-label">Proven in Resume</span>
              <strong>{counts.demonstrated}</strong>
              <small>Backed by verified text &amp; projects</small>
            </div>
            <div className="kpi-card kpi-partial">
              <span className="kpi-label">Needs Metrics / Context</span>
              <strong>{counts.partial}</strong>
              <small>Mentioned but lacks quantified impact</small>
            </div>
            <div className="kpi-card kpi-missing">
              <span className="kpi-label">Missing Skills</span>
              <strong>{counts.missing}</strong>
              <small>Required skills not found on resume</small>
            </div>
            <div className="kpi-card kpi-quickwin">
              <span className="kpi-label">Quick-Win Rewrites</span>
              <strong style={{ color: '#6366F1' }}>{counts.quick_win}</strong>
              <small>Ready-to-paste bullet fixes available</small>
            </div>
          </div>

          <div className="strengths-gaps-grid">
            <div className="column-card">
              <h3><span style={{ color: 'var(--forest)' }}>✓</span> Verified Strengths (Keep These Strong)</h3>
              <div className="overview-items-list">
                {demonstrated.slice(0, 4).map((s, i) => (
                  <div className="overview-skill-item" key={i}>
                    <div className="overview-skill-top">
                      <span className="overview-skill-name">{s.skill}</span>
                      <span className="verified-tag">✓ PROVEN IN RESUME</span>
                    </div>
                    <div className="overview-skill-quote">Found in resume: "{s.evidence}"</div>
                  </div>
                ))}
                {demonstrated.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No verified competencies detected in resume text.</p>
                )}
              </div>
            </div>

            <div className="column-card">
              <h3><span style={{ color: 'var(--wax)' }}>!</span> Critical Gaps to Bridge</h3>
              <div className="overview-items-list">
                {missing.slice(0, 4).map((s, i) => (
                  <div className="overview-skill-item gap" key={i}>
                    <div className="overview-skill-top">
                      <span className="overview-skill-name">{s.skill}</span>
                      <span className="unverified-tag">NOT FOUND</span>
                    </div>
                    <div className="overview-skill-quote">Required for this role. Follow the recommended build blueprint in the Action Roadmap.</div>
                  </div>
                ))}
                {missing.length === 0 && (
                  <p style={{ color: 'var(--forest)', fontSize: '13px' }}>Zero critical gaps detected against target role!</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button className="primary-button" onClick={() => setActiveTab('evidence')}>
              View Detailed Skill-by-Skill Breakdown <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* ─── TAB 2: EVIDENCE LEDGER ───────────────────────────────────────────── */}
      {activeTab === 'evidence' && (
        <section className="tab-panel">
          <div className="section-heading" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="section-label">EXACT EVIDENCE AUDIT · {allSkills.length} SKILLS EVALUATED</div>
              <h2 style={{ margin: '8px 0' }}>Where each skill was found in your resume</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="outline-button"
                style={{ font: '11px var(--font-mono)', padding: '6px 14px', cursor: 'pointer' }}
                onClick={toggleAll}
              >
                {openRows.size >= filteredSkills.length ? '− Collapse All' : '+ Expand All'}
              </button>
            </div>
          </div>

          {/* Interactive Tier Filter Tabs */}
          <div className="tier-filter-tabs">
            <button
              className={`tier-filter-btn ${tierFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTierFilter('all')}
            >
              All Skills ({counts.all})
            </button>
            <button
              className={`tier-filter-btn ${tierFilter === 'demonstrated' ? 'active' : ''}`}
              onClick={() => setTierFilter('demonstrated')}
            >
              ✓ Proven ({counts.demonstrated})
            </button>
            <button
              className={`tier-filter-btn ${tierFilter === 'partial' ? 'active' : ''}`}
              onClick={() => setTierFilter('partial')}
            >
              ⚠ Needs Metrics ({counts.partial})
            </button>
            <button
              className={`tier-filter-btn ${tierFilter === 'missing' ? 'active' : ''}`}
              onClick={() => setTierFilter('missing')}
            >
              ✗ Missing ({counts.missing})
            </button>
            {counts.quick_win > 0 && (
              <button
                className={`tier-filter-btn ${tierFilter === 'quick_win' ? 'active' : ''}`}
                onClick={() => setTierFilter('quick_win')}
                style={{ color: '#6366F1', borderColor: '#C4B5FD' }}
              >
                ⚡ Quick-Wins ({counts.quick_win})
              </button>
            )}
          </div>

          <div className="evidence-list">
            {filteredSkills.map((s, i) => (
              <div className="evidence-row" key={`${s.skill}-${i}`}>
                <button
                  className="evidence-row-header"
                  onClick={() => toggleRow(i)}
                  aria-expanded={openRows.has(i)}
                >
                  <div className="evidence-row-left">
                    <span className={`tier-dot ${s.baseTier}`} />
                    <span className="skill-title">{s.skill}</span>
                    {s.gapType === 'quick_win' && (
                      <span className="quick-win-tag">30-SEC REWRITE</span>
                    )}
                  </div>

                  <div className="evidence-row-right">
                    {s.lineCitations && s.lineCitations.length > 0 && (
                      <span className="citation-pill">
                        {s.lineCitations.map(l => `Resume Line ${l}`).join(', ')}
                      </span>
                    )}

                    <Mark tone={s.tier}>{s.tierLabel}</Mark>
                    <span className="chevron-icon">{openRows.has(i) ? '−' : '+'}</span>
                  </div>
                </button>

                {openRows.has(i) && (
                  <div className="evidence-detail-box">
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', font: '10px var(--font-mono)', color: 'var(--muted)', marginBottom: '4px' }}>
                      Exact Evidence from Resume:
                    </div>
                    <div className="evidence-quote">
                      "{s.evidence}"
                    </div>

                    {/* Quick-Win Rewrite Card */}
                    {s.gapType === 'quick_win' && s.rewriteSuggestion && (
                      <div className="qw-card">
                        <div className="qw-top">
                          <span className="qw-label">⚡ RECOMMENDED RESUME BULLET (COPY &amp; PASTE)</span>
                          <button
                            className="qw-copy-button"
                            onClick={() => copyRewrite(s.rewriteSuggestion!, i)}
                          >
                            {copiedIndex === i ? '✓ Copied to Clipboard!' : 'Copy Bullet Point'}
                          </button>
                        </div>
                        <div className="qw-text">
                          "{s.rewriteSuggestion}"
                        </div>
                      </div>
                    )}

                    {s.baseTier === 'missing' && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px', color: 'var(--ink-light)' }}>
                        💡 <strong>How to close this gap:</strong> Build a focused project demonstrating this skill. See recommended blueprints in the <strong>Action Roadmap</strong> tab.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── TAB 3: FAANG BENCHMARK ───────────────────────────────────────────── */}
      {activeTab === 'faang' && faang && (
        <section className="tab-panel">
          <div className="faang-card">
            <div className="faang-header">
              <div className="faang-brand">
                <span className="faang-badge" style={{ background: faang.company_color || '#4285F4' }}>
                  {faang.company.toUpperCase()}
                </span>
                <div>
                  <strong style={{ fontSize: '20px', display: 'block' }}>{faang.role} Hiring Bar</strong>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{faang.role_summary}</span>
                </div>
              </div>
              <Stamp tone={faang.overall_score >= 70 ? 'green' : faang.overall_score >= 50 ? 'ochre' : 'red'}>
                {faang.fit_level.toUpperCase()}<br />
                <small>{faang.overall_score}% COMPATIBILITY</small>
              </Stamp>
            </div>

            <div className="faang-body">
              <div className="faang-scores">
                <div className="faang-score-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Required Minimum Qualifications (70% Weight)</span>
                    <strong style={{ font: '14px var(--font-mono)' }}>{faang.min_qual_score}%</strong>
                  </div>
                  <div className="faang-score-bar">
                    <div className="faang-score-fill" style={{ width: `${faang.min_qual_score}%` }} />
                  </div>
                </div>

                <div className="faang-score-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Preferred / Bonus Qualifications (30% Weight)</span>
                    <strong style={{ font: '14px var(--font-mono)' }}>{faang.pref_qual_score}%</strong>
                  </div>
                  <div className="faang-score-bar">
                    <div className="faang-score-fill" style={{ width: `${faang.pref_qual_score}%`, background: 'var(--blue)' }} />
                  </div>
                </div>
              </div>

              <div className="section-label" style={{ marginBottom: '14px' }}>
                REQUIREMENT-BY-REQUIREMENT EVALUATION
              </div>

              <div className="faang-req-list">
                {faang.matches.slice(0, 6).map(m => (
                  <div className="faang-req-item" key={m.requirement.id}>
                    <div className="faang-req-top">
                      <div>
                        <strong style={{ fontSize: '15px' }}>{m.requirement.title}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>
                          [{m.requirement.category} · {m.requirement.type === 'minimum' ? 'REQUIRED' : 'BONUS'}]
                        </span>
                      </div>
                      <Mark tone={m.status === 'strong_match' ? 'demonstrated' : m.status === 'partial_match' ? 'partial' : 'missing'}>
                        {m.status === 'strong_match' ? '✓ MATCHED' : m.status === 'partial_match' ? '⚠ PARTIAL MATCH' : '✗ NOT FOUND'} ({m.score}%)
                      </Mark>
                    </div>
                    <div className="faang-req-rubric">
                      <strong>Employer Evaluation Rubric:</strong> {m.requirement.anti_hallucination_rubric}
                    </div>
                    {m.evidence.length > 0 && (
                      <div style={{ fontSize: '13px', color: 'var(--forest)', fontWeight: 500 }}>
                        ✓ Grounded in your resume: {m.evidence.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 4: GITHUB AUDIT ──────────────────────────────────────────────── */}
      {activeTab === 'github' && gh && (() => {
        const CS_CONCEPTS = new Set(['dsa', 'oop', 'dbms', 'os', 'computer networks', 'sdlc', 'rest apis', 'problem solving', 'git', 'github', 'linux', 'html5', 'css3'])
        const concreteUnverified = gh.unverified.filter(s => !CS_CONCEPTS.has(s.toLowerCase()))
        const conceptualSkills = gh.unverified.filter(s => CS_CONCEPTS.has(s.toLowerCase()))

        const getVerificationAdvice = (skill: string) => {
          const lower = skill.toLowerCase()
          if (lower.includes('java') || lower.includes('spring')) return 'Publish a repository with a clean REST API and unit test suite.'
          if (lower.includes('sql') || lower.includes('postgres') || lower.includes('mongo')) return 'Add database schema scripts & queries to an existing project.'
          if (lower.includes('docker') || lower.includes('kubernetes')) return 'Add a Dockerfile & docker-compose.yml configuration to your repos.'
          if (lower.includes('react') || lower.includes('next') || lower.includes('vue')) return 'Deploy a live frontend demo with a public GitHub repo.'
          if (lower.includes('aws') || lower.includes('cloud')) return 'Include cloud deployment scripts or Terraform configs in your repo.'
          if (lower.includes('llm') || lower.includes('rag') || lower.includes('ai')) return 'Build and push a small RAG or LangChain retrieval tool repo.'
          return `Create a focused GitHub repository demonstrating real ${skill} code.`
        }

        return (
          <section className="tab-panel">
            <div className="github-audit-card">
              <div className="github-audit-header">
                <div>
                  <div className="section-label">PUBLIC CODE EVIDENCE · GITHUB @{gh.username}</div>
                  <h2>GitHub Commit &amp; Code Audit</h2>
                  <p>
                    We scanned {gh.repoCount} public repositories and {gh.totalCommits} commits to substantiate skills listed on your resume with verifiable code evidence.
                  </p>
                </div>
                <Stamp tone={gh.verified.length > 0 ? 'green' : 'ochre'}>
                  {gh.verified.length > 0 ? 'VERIFIED' : 'PARTIAL'}<br />
                  <small>{gh.verified.length} CONFIRMED</small>
                </Stamp>
              </div>

              {/* 1. Verified Technologies */}
              <div style={{ marginBottom: '28px' }}>
                <div className="section-label" style={{ color: 'var(--forest)' }}>
                  ✓ PROVEN IN PUBLIC REPOSITORIES ({gh.verified.length})
                </div>
                {gh.verified.length > 0 ? (
                  <div className="gh-verified-grid">
                    {gh.verified.map(skill => (
                      <div className="gh-verified-item" key={skill}>
                        <span style={{ color: 'var(--forest)', fontWeight: 700 }}>✓</span>
                        <strong>{skill}</strong>
                        <small>Code Confirmed</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
                    No public repositories found matching your claimed tech stack.
                  </p>
                )}
              </div>

              {/* 2. Actionable Improvement Quality: How to Verify Core Tech */}
              {concreteUnverified.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <div className="section-label" style={{ color: 'var(--ochre)' }}>
                    🛠️ HIGH-IMPACT SKILLS TO PROVE ON GITHUB ({concreteUnverified.length})
                  </div>
                  <div className="gh-action-list">
                    {concreteUnverified.slice(0, 6).map(skill => (
                      <div className="gh-action-item" key={skill}>
                        <div>
                          <strong>{skill}</strong>
                          <span style={{ display: 'block', fontSize: '13px', color: 'var(--ink-light)', marginTop: '2px' }}>
                            {getVerificationAdvice(skill)}
                          </span>
                        </div>
                        <span style={{ font: '11px var(--font-mono)', color: 'var(--muted)', background: 'var(--paper)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: '2px' }}>
                          Needs Public Repo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Conceptual / Foundational Skills (Clean Summary) */}
              {conceptualSkills.length > 0 && (
                <div style={{ padding: '14px 18px', background: 'var(--paper-darker)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
                  <span style={{ font: '10px var(--font-mono)', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Foundational &amp; Theory Skills ({conceptualSkills.length})
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--ink-light)', margin: '0 0 8px' }}>
                    Concepts like <strong>{conceptualSkills.slice(0, 4).join(', ')}</strong> are typically evaluated via technical interview rounds rather than standalone repos.
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {conceptualSkills.map(c => (
                      <span key={c} style={{ font: '11px var(--font-mono)', background: 'var(--paper)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: '2px', color: 'var(--muted)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Bonus Unclaimed Tech Discovered */}
              {gh.unclaimed.length > 0 && (
                <div className="gh-bonus-box">
                  <div className="gh-bonus-top">💡 BONUS TECH DISCOVERED IN YOUR REPOSITORIES</div>
                  <p style={{ fontSize: '13px', color: '#312E81', margin: 0 }}>
                    We found active commit code for these technologies in your GitHub repositories, but they aren't on your resume. Add them for an instant match boost!
                  </p>
                  <div className="gh-bonus-tags">
                    {gh.unclaimed.map(tech => (
                      <span className="gh-bonus-tag" key={tech}>
                        + {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* ─── TAB 5: ACTION ROADMAP ────────────────────────────────────────────── */}
      {activeTab === 'roadmap' && (
        <section className="tab-panel">
          {projects.length > 0 && (
            <div>
              <div className="section-heading" style={{ marginBottom: '20px' }}>
                <div>
                  <div className="section-label">PORTFOLIO ACTION PLAN · {projects.length} BUILD BLUEPRINTS</div>
                  <h2 style={{ margin: '8px 0' }}>Build projects that prove your missing skills</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
                    Employers want to see working code. Building these open-source blueprints gives you undeniable proof for your resume.
                  </p>
                </div>
              </div>

              <div className="projects-container">
                {projects.map((p, idx) => {
                  // Sanitize robotic rubric prompts into clean human-friendly project summaries
                  let displayDesc = p.description
                  if (displayDesc.includes('Targeted remediation benchmark for') || displayDesc.includes('Rubric requires:')) {
                    const parts = displayDesc.split('Rubric requires:')
                    if (parts[1]) {
                      displayDesc = `Build this project to satisfy employer evaluation standards: ${parts[1].trim()}`
                    } else {
                      displayDesc = `A focused portfolio build engineered to prove real-world competency in ${p.skillGap}.`
                    }
                  }

                  const brief: ProjectBrief = {
                    gap: p.skillGap,
                    title: p.projectTitle,
                    description: displayDesc,
                    effort: `${p.estimatedHours}h · ${p.difficulty}`,
                    color: idx % 3 === 0 ? 'red' : idx % 3 === 1 ? 'ochre' : 'blue',
                    deliverables: p.learningOutcomes,
                    guide: p.techStack.map(t => ({ step: t, detail: `Use ${t} to satisfy ${p.skillGap} evaluation criteria` })),
                  }

                  return (
                    <article className={`project-card ${brief.color}`} key={p.projectTitle}>
                      <div className="project-card-header">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="project-step-badge">Step {idx + 1}</span>
                          <Mark tone={brief.color}>Bridges: {p.skillGap}</Mark>
                        </div>
                        <span className="project-time-badge">⏱ {p.estimatedHours} Hours · {p.difficulty}</span>
                      </div>

                      <h3>{p.projectTitle}</h3>
                      <p>{displayDesc}</p>

                      <div className="project-tech-tags">
                        <span style={{ font: '10px var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', marginRight: '4px' }}>Tech Stack:</span>
                        {p.techStack.map(t => (
                          <span className="project-tech-tag" key={t}>{t}</span>
                        ))}
                      </div>

                      <div className="project-card-footer">
                        <span className="project-deliverable-hint">
                          ✓ {p.learningOutcomes.length} verifiable build milestones
                        </span>
                        <button className="primary-button" style={{ fontSize: '12px', padding: '8px 18px' }} onClick={() => setSelectedBrief(brief)}>
                          View Step-by-Step Guide ↗
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {/* Curated Resources */}
          {resources.length > 0 && (
            <div className="resources" style={{ marginTop: '36px', borderTop: '1px solid var(--line)' }}>
              <div className="section-label" style={{ marginTop: '24px' }}>VERIFIED LEARNING PATHS &amp; DOCUMENTATION</div>
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
            </div>
          )}
        </section>
      )}

      {/* Brief Modal */}
      <BriefModal brief={selectedBrief} onClose={() => setSelectedBrief(null)} />
    </div>
  )
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, reset }: { message: string; reset: () => void }) {
  return (
    <main className="pipeline">
      <div className="pipeline-paper">
        <div className="eyebrow">
          <span className="red-dot" /> PIPELINE DIAGNOSTIC
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
  const [target, setTarget] = useState({ role: '', company: '', experienceLevel: 'Early Career (1-3 yrs)' })
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
    experienceLevel: string
    githubUsername: string
  }) => {
    setTarget({
      role: params.targetRole,
      company: params.company,
      experienceLevel: params.experienceLevel,
    })
    setScreen('analyzing')

    try {
      let body: FormData | string
      const headers: Record<string, string> = {}

      if (params.file) {
        const fd = new FormData()
        fd.append('file', params.file)
        fd.append('targetRole', params.targetRole)
        fd.append('company', params.company)
        fd.append('experienceLevel', params.experienceLevel)
        fd.append('githubUsername', params.githubUsername)
        body = fd
      } else {
        body = JSON.stringify({
          resumeText: params.resumeText,
          targetRole: params.targetRole,
          company: params.company,
          experienceLevel: params.experienceLevel,
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
        const fullMsg = err.details ? `${err.error || 'Error'}: ${err.details}` : (err.error || `Server error ${res.status}`)
        throw new Error(fullMsg)
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
      {screen === 'landing' && (
        <Landing
          start={() => setScreen('input')}
        />
      )}
      {screen === 'input' && (
        <InputFlow
          onSubmit={runAnalysis}
        />
      )}
      {screen === 'analyzing' && <Analyzing />}
      {screen === 'results' && pipelineResult && (
        <Results
          data={pipelineResult}
          role={target.role}
          company={target.company}
          experienceLevel={target.experienceLevel}
          reset={reset}
        />
      )}
      {screen === 'error' && <ErrorScreen message={errorMsg} reset={reset} />}
    </div>
  )
}
