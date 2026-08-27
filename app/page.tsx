'use client'

import React, { useMemo, useState } from 'react'
import { BriefModal, ProjectBrief } from '../components/BriefModal'

type Screen = 'landing' | 'input' | 'review' | 'analyzing' | 'results'
type Tier = 'Demonstrated' | 'Partial Evidence' | 'Missing' | 'Differentiator'
type Skill = { id: string; name: string; tier: Tier; evidence: string }

const roles = ['AI Engineer', 'Software Engineer', 'Network Administrator']
const companies = ['Google', 'Microsoft', 'Amazon', 'NVIDIA']

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
  }
}

const initialSkills: Skill[] = [
  { id: '1', name: 'Penetration Testing', tier: 'Demonstrated', evidence: "Resume text: 'Led OWASP-based pentest of internal API and documented 14 critical findings.'" },
  { id: '2', name: 'Network Fundamentals', tier: 'Demonstrated', evidence: "Resume text: 'Built packet inspection tooling in Python using raw sockets & scapy.'" },
  { id: '3', name: 'Cloud Security Tooling', tier: 'Missing', evidence: 'No direct resume evidence found for cloud posture management (CSPM) or AWS security tooling.' },
  { id: '4', name: 'Kubernetes Hardening', tier: 'Partial Evidence', evidence: "Resume text: 'Deployed services to containerized environment.' No cluster security policy work specified." },
  { id: '5', name: 'Threat Modeling', tier: 'Differentiator', evidence: "Resume text: 'Facilitated STRIDE threat modeling sessions across three cross-functional product teams.'" }
]

const projectBriefs: ProjectBrief[] = [
  {
    gap: 'Cloud Security Tooling',
    title: 'Build an AWS S3 Posture Scanner',
    description: 'Write an asynchronous Python CLI tool that inventories bucket policies, flags public ACL access, checks encryption standards, and generates signed JSON security reports.',
    effort: '4–6 hours',
    color: 'red',
    deliverables: [
      'CLI tool executable via Python script',
      'Automated boto3 AWS SDK scanner logic',
      'Structured JSON & HTML report exporter',
      'GitHub Actions CI pipeline for unit tests'
    ],
    guide: [
      { step: 'Boto3 AWS Integration', detail: 'Query S3 bucket ACLs, Policy status, and ServerSideEncryption Configuration.' },
      { step: 'Rule Engine', detail: 'Implement rule evaluation for PUBLIC_READ, PUBLIC_WRITE, and MISSING_ENCRYPTION.' },
      { step: 'Report Generation', detail: 'Format findings into an executive report with remediation recommendations.' }
    ]
  },
  {
    gap: 'Kubernetes Hardening',
    title: 'Harden a Cluster with Security Policies',
    description: 'Deploy a deliberately vulnerable microservice cluster, then apply Pod Security Standards, NetworkPolicies, and OPA Gatekeeper admission rules to isolate traffic.',
    effort: '6–8 hours',
    color: 'ochre',
    deliverables: [
      'Kubernetes manifest files with network policies',
      'Kyverno / OPA Gatekeeper policy definitions',
      'Trivy vulnerability scan report of container images',
      'Step-by-step incident response playbook'
    ],
    guide: [
      { step: 'Environment Setup', detail: 'Provision a local Minikube / Kind cluster with CNI network policy support.' },
      { step: 'Policy Enforcement', detail: 'Block root user container execution and enforce read-only root filesystems.' },
      { step: 'Audit & Verification', detail: 'Run kubectl-who-can and Trivy to verify container security compliance.' }
    ]
  }
]

function Mark({ tone = 'green', children }: { tone?: string; children: React.ReactNode }) {
  const formattedTone = tone.toLowerCase().replace(/\s+/g, '-')
  return <span className={`mark mark-${formattedTone}`}>{children}</span>
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
        AN OPEN DIAGNOSTIC FOR TECH CAREERS <span className="rule-dot" /> V.01
      </div>
    </header>
  )
}

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
          Evidence Ledger cross-checks your resume against target roles, asks strategic domain questions, and pinpoints exact portfolio builds that create missing proof.
        </p>
        <button className="primary-button" onClick={start}>
          Analyze my resume <span>→</span>
        </button>
        <p className="honesty">Not a hiring predictor. An objective diagnostic & direction-setting tool.</p>
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
            <p>Answer domain questions tailored specifically to your chosen role & company benchmark.</p>
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

function InputFlow({ goReview }: { goReview: (role: string, company: string, answer: string) => void }) {
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
      goReview(selectedRole, company, answer)
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
          <p>Five guided inputs. One evidence-led report. Your data is analyzed locally in your session.</p>
          <div className="aside-meta">
            <span>EST. READ TIME</span>
            <b>03 MIN</b>
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
              <p className="panel-intro">The diagnostic will combine your resume text, role benchmark, and agent signal.</p>

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
            {step === 5 ? 'Review extracted evidence' : 'Continue'} <span>→</span>
          </button>
        </section>
      </div>
    </main>
  )
}

function Review({ analyze }: { analyze: () => void }) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const updateSkill = (id: string, field: 'name' | 'evidence', val: string) => {
    setSkills(skills.map(s => (s.id === id ? { ...s, [field]: val } : s)))
  }

  const deleteSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id))
  }

  const filteredSkills = useMemo(() => {
    if (activeFilter === 'ALL') return skills
    return skills.filter(s => s.tier.toUpperCase().includes(activeFilter))
  }, [skills, activeFilter])

  return (
    <main className="review-page">
      <div className="review-top">
        <div>
          <div className="step-kicker">SOURCE REVIEW / EDITABLE</div>
          <h1>Confirm the evidence.</h1>
          <p>Extracted {skills.length} skill signals from source text. Verify or refine before running analysis.</p>

          <div className="filter-bar">
            {['ALL', 'DEMONSTRATED', 'PARTIAL', 'MISSING', 'DIFFERENTIATOR'].map(f => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f} ({f === 'ALL' ? skills.length : skills.filter(s => s.tier.toUpperCase().includes(f)).length})
              </button>
            ))}
          </div>
        </div>
        
        <button className="primary-button" onClick={analyze}>
          Run analysis <span>→</span>
        </button>
      </div>

      <div className="review-table">
        <div className="table-head">
          <span>EXTRACTED SKILL</span>
          <span>TIER PREVIEW</span>
          <span>SOURCE TEXT / EVIDENCE</span>
          <span>ACTION</span>
        </div>

        {filteredSkills.map(skill => (
          <div className="table-row" key={skill.id}>
            <input
              value={skill.name}
              onChange={e => updateSkill(skill.id, 'name', e.target.value)}
              aria-label="Skill name"
            />
            <div>
              <Mark tone={skill.tier}>{skill.tier}</Mark>
            </div>
            <input
              value={skill.evidence}
              onChange={e => updateSkill(skill.id, 'evidence', e.target.value)}
              aria-label="Skill evidence text"
            />
            <button className="delete-row-btn" onClick={() => deleteSkill(skill.id)} title="Delete signal">
              ✕
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

function Pipeline({ finish }: { finish: () => void }) {
  const [current, setCurrent] = useState(0)
  const steps = [
    'Extracting semantic skill nodes from resume',
    'Matching target domain profile & benchmark rules',
    'Running agent answer analysis & weighted scoring',
    'Generating actionable gap remediation briefs'
  ]

  useMemo(() => {
    const t = setInterval(() => {
      setCurrent(c => {
        if (c >= steps.length - 1) {
          clearInterval(t)
          setTimeout(finish, 600)
          return c
        }
        return c + 1
      })
    }, 750)
    return () => clearInterval(t)
  }, [finish, steps.length])

  return (
    <main className="pipeline">
      <div className="pipeline-paper">
        <div className="eyebrow">
          <span className="red-dot" /> ANALYSIS IN PROGRESS
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
                <small>{i < current ? 'Complete' : i === current ? 'Processing domain material…' : 'Queued'}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="pipeline-footer">Every recommendation retains a explicit link to its evidence source.</div>
      </div>
    </main>
  )
}

function Results({
  reset,
  role,
  company,
  answer
}: {
  reset: () => void
  role: string
  company: string
  answer: string
}) {
  const [openRow, setOpenRow] = useState<number | null>(0)
  const [selectedBrief, setSelectedBrief] = useState<ProjectBrief | null>(null)

  return (
    <main className="results">
      <aside className="case-rail">
        <div className="section-label">CASE FILE / 001</div>
        <h1>Alex Chen</h1>
        <div className="rail-rule" />

        <span className="rail-label">AIMING FOR</span>
        <b>{role}{company && ` at ${company}`}</b>

        <span className="rail-label">AGENT SIGNAL</span>
        <div>
          <Mark tone="green">{answer || 'PROFILE MATCHED'}</Mark>
        </div>

        <div className="rail-score">
          <span>TOTAL ALIGNMENT SCORE</span>
          <strong>62</strong>
          <small>/ 100</small>
        </div>

        <Stamp tone="ochre">
          PARTIAL<br />
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
              <span className="red-dot" /> ANALYSIS COMPLETE / 27 AUG 2026
            </div>
            <h1>
              The focus<br />
              <em>is clear.</em>
            </h1>
            <p>
              Your strongest foundation is applied systems & network tools. Focus next on cloud security posture & Kubernetes policies to complete your target profile for <b>{role}</b>.
            </p>
          </div>

          <div className="score-block">
            <div className="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="51" />
                <circle className="score-arc" cx="60" cy="60" r="51" />
              </svg>
              <div>
                <strong>62</strong>
                <span>/ 100</span>
              </div>
            </div>
            <div>
              <div className="section-label">ALIGNMENT INDEX</div>
              <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'var(--muted)' }}>
                Strong systems evidence. Cloud posture gaps identified.
              </p>
            </div>
          </div>
        </div>

        {/* Skill Evidence Section */}
        <section className="evidence-section">
          <div className="section-heading">
            <div>
              <div className="section-label">FINDINGS / 05 SIGNALS</div>
              <h2>Skill evidence</h2>
            </div>
            <span className="source-tag">SOURCE-LINKED</span>
          </div>

          {initialSkills.map((s, i) => (
            <div className={`evidence-row tier-${s.tier.toLowerCase().replace(/\s+/g, '-')}`} key={s.id}>
              <button
                onClick={() => setOpenRow(openRow === i ? null : i)}
                aria-expanded={openRow === i}
              >
                <span className="tier-mark" />
                <span className="skill-name">{s.name}</span>
                <Mark tone={s.tier}>{s.tier}</Mark>
                <span className="chevron">{openRow === i ? '−' : '+'}</span>
              </button>

              {openRow === i && (
                <div className="evidence-detail">
                  <span className="quote">“</span>
                  {s.evidence}
                  <span className="evidence-source">SOURCE RESUME / PAGE {i + 1}</span>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Deterministic GitHub Check */}
        <section className="verification">
          <div>
            <div className="section-label">DETERMINISTIC CHECK / GITHUB</div>
            <h2>Claim vs. commit.</h2>
            <p>Public commit search verified supporting code repositories for 2 of 3 claimed skills.</p>
          </div>
          <Stamp tone="green">
            VERIFIED<br />
            <small>2 / 3 CLAIMS</small>
          </Stamp>

          <div className="verify-list">
            <div>
              <span className="check">✓</span>
              <b>Penetration Testing</b>
              <code>repo: api-audit · 14 commits</code>
            </div>
            <div>
              <span className="check">✓</span>
              <b>Python Sockets</b>
              <code>repo: packet-watch · 38 commits</code>
            </div>
            <div className="flagged">
              <span>!</span>
              <b>Kubernetes Hardening</b>
              <code>No matching public commit evidence found</code>
            </div>
          </div>
          <p className="verify-foot">GitHub checks evaluate public repositories as deterministic signals, not full expertise proof.</p>
        </section>

        {/* Recommended Builds */}
        <section className="projects">
          <div className="section-heading">
            <div>
              <div className="section-label">RECOMMENDED BUILDS / 02 GAPS</div>
              <h2>Build the missing proof.</h2>
            </div>
          </div>

          {projectBriefs.map(p => (
            <article className={`project-card ${p.color}`} key={p.title}>
              <div>
                <Mark tone={p.color}>{p.gap}</Mark>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
              <div className="project-meta">
                <span>EST. EFFORT</span>
                <b>{p.effort}</b>
                <button className="outline-button" onClick={() => setSelectedBrief(p)}>
                  View brief ↗
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Resources Section */}
        <section className="resources">
          <div className="section-label">CURATED RESOURCES / TECHNICAL SPECIFICATIONS</div>
          <div className="resource-links">
            <a href="https://aws.amazon.com/security/" target="_blank" rel="noopener noreferrer">
              AWS Security Best Practices & Posture Benchmarks <span>↗</span>
            </a>
            <a href="https://kubernetes.io/docs/concepts/security/" target="_blank" rel="noopener noreferrer">
              Kubernetes Hardening & Pod Security Standards <span>↗</span>
            </a>
            <a href="https://owasp.org/" target="_blank" rel="noopener noreferrer">
              OWASP Cloud-Native Application Security Top 10 <span>↗</span>
            </a>
          </div>
        </section>
      </section>

      {/* Interactive Modal */}
      <BriefModal brief={selectedBrief} onClose={() => setSelectedBrief(null)} />
    </main>
  )
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [key, setKey] = useState(0)
  const [target, setTarget] = useState({ role: 'Software Engineer', company: '', answer: '' })

  const reset = () => {
    setKey(k => k + 1)
    setScreen('landing')
  }

  const analyze = () => setScreen('analyzing')

  return (
    <div key={key}>
      <Header onReset={reset} />
      {screen === 'landing' && <Landing start={() => setScreen('input')} />}
      {screen === 'input' && (
        <InputFlow
          goReview={(role, company, answer) => {
            setTarget({ role, company, answer })
            setScreen('review')
          }}
        />
      )}
      {screen === 'review' && <Review analyze={analyze} />}
      {screen === 'analyzing' && <Pipeline finish={() => setScreen('results')} />}
      {screen === 'results' && <Results reset={reset} {...target} />}
    </div>
  )
}
