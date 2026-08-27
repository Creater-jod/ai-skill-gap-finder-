'use client'

import React from 'react'

export type ProjectBrief = {
  gap: string
  title: string
  description: string
  effort: string
  color: string
  deliverables?: string[]
  architecture?: string
  guide?: { step: string; detail: string }[]
}

interface BriefModalProps {
  brief: ProjectBrief | null
  onClose: () => void
}

export function BriefModal({ brief, onClose }: BriefModalProps) {
  if (!brief) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="eyebrow">
            <span className="red-dot" /> PROJECT BRIEF & REMEDIATION PLAN
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <span className={`mark mark-${brief.color}`}>{brief.gap}</span>
          <h2 className="modal-title">{brief.title}</h2>
          <p className="modal-desc">{brief.description}</p>

          <div className="modal-stats">
            <div>
              <span className="stat-label">ESTIMATED EFFORT</span>
              <strong>{brief.effort}</strong>
            </div>
            <div>
              <span className="stat-label">TARGET SIGNAL</span>
              <strong>EVIDENCE PROOF</strong>
            </div>
            <div>
              <span className="stat-label">COMPLEXITY</span>
              <strong>INTERMEDIATE</strong>
            </div>
          </div>

          <section className="modal-section">
            <h3>Implementation Guide</h3>
            <div className="guide-steps">
              {brief.guide ? (
                brief.guide.map((g, i) => (
                  <div className="guide-step" key={i}>
                    <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{g.step}</strong>
                      <p>{g.detail}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="guide-step">
                    <span className="step-num">01</span>
                    <div>
                      <strong>Repository & Environment Setup</strong>
                      <p>Initialize a dedicated GitHub repository with boilerplate, GitHub Actions CI workflow, and clear README documentation.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-num">02</span>
                    <div>
                      <strong>Core Functional Build</strong>
                      <p>Implement core business logic, automated test suites, and robust exception handling for production readiness.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-num">03</span>
                    <div>
                      <strong>Proof & Documentation</strong>
                      <p>Publish architecture diagrams, sample execution outputs, and link the repository to your SkillForge portfolio.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="modal-section">
            <h3>Key Deliverables</h3>
            <ul className="deliverables-list">
              {(brief.deliverables || [
                'Public GitHub repository with automated commit history',
                'Comprehensive README detailing setup, architectural decisions, and usage instructions',
                'Clean API / CLI design with integration tests',
                'Signed JSON test reports & output artifacts'
              ]).map((d, i) => (
                <li key={i}>
                  <span className="check-icon">✓</span> {d}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="modal-footer">
          <button className="primary-button" onClick={onClose}>
            Close brief preview
          </button>
        </footer>
      </div>
    </div>
  )
}
