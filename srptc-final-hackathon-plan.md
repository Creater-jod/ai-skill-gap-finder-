# AI-Assisted Skill Gap & Portfolio Advisor for Tech Careers
**SRPTC Hackathon — Final Plan**
**Team: Nikil Vardhan V, Bala Swathi S, Gopika Shree R, Ilaya Perumal YM**

---

## 1. Abstract

Students and early-career developers targeting security, blockchain, or software roles don't know precisely which skills separate their resume from a competitive candidate, and generic advice ("learn more DevOps") doesn't say what to actually build to prove it.

Existing AI resume tools (Kickresume, Resumly, Careerflow) score resumes and match keywords, but stop at detection — they don't turn a gap into resume-ready evidence, don't verify that claimed skills are real, and aren't built for technical niches like security or blockchain where hiring bars are specific.

This platform closes both gaps. It classifies every required skill into an evidence tier (Demonstrated / Partial Evidence / Missing / Differentiator) traceable to actual resume text, retrieves the right role benchmark for *any* typed role via RAG instead of a fixed dropdown, cross-checks claimed skills against real GitHub activity, and — for every critical gap — generates a specific, buildable project rather than a generic course link.

**One-line pitch:** *"We don't just tell you what's missing from your resume — we tell you exactly what to build next to fix it, and we check whether your claims are even real."*

---

## 2. Problem Statement

- Users don't know what a target role actually requires vs. what they demonstrate
- Existing tools only score keywords/formatting, not real skill alignment
- Resumes can claim skills with no evidence anywhere else — nothing checks this
- No tool turns a gap into a concrete, prioritized, provable next action

---

## 3. Competitive Landscape

| Tool | What it does | What it lacks |
|---|---|---|
| Kickresume AI Career Coach | Resume-to-job comparison, gap list, resource suggestions | No verification of claims; scoring not explained; generalist |
| Resumly Skills Gap Analyzer | Matches resume to a job description, ranks gaps | Needs a real JD as input; single opaque score |
| Jobscan-style ATS tools | Keyword/embedding match, percentile ranking | No learning roadmap; no verification |
| Careerflow / Resumify AI | ATS score, formatting feedback | Shallow, keyword-based gap detection |
| Enterprise tools (Eightfold, Degreed) | Deep skill inference at org scale | Not self-serve, not for individual students |

**Nobody in this space verifies claims against real evidence, and nobody generates a specific project per gap.**

---

## 4. Our Design — Three Layers of Differentiation

### Layer 1: Evidence-Tiered Gap Analysis (Foundation)
Every skill classified as Demonstrated / Partial Evidence / Missing / Differentiator, tied to specific resume text. AI cannot invent a skill it can't point to evidence for.

### Layer 2: RAG-Based Open Role Matching (Scalability)
Instead of a fixed dropdown of 5 roles, the user types any target role. The system embeds the query and retrieves the closest matching curated role profile from a knowledge base of 20-30 hand-built profiles via in-memory cosine similarity — no vector database needed at this scale. If no good match is found, the AI generates a reasonable profile on the fly, clearly labeled "AI-generated" vs. "curated" so quality is never silently mixed.

### Layer 3: GitHub Verification (The Real Differentiator)
If the user provides a GitHub username, the platform pulls public repo data (GitHub API — no auth needed for public data) and cross-checks resume-claimed skills against real code: languages used, commit history, whether claimed technologies actually appear in repos rather than just being starred/forked. This turns "AI-tiered gap analysis" into **AI-verified gap analysis** — directly addressing the resume-honesty problem that no competitor touches.

### Layer 4 (Stretch): On-Chain Skill Credential
After completing a suggested gap-closing project, generate a simple verifiable credential (testnet attestation or NFT) proving completion — a permanent, checkable artifact rather than a resume bullet point someone can fabricate. Only build if Layers 1-3 are solid and time remains; a mocked testnet mint with a visible transaction hash is enough to demo the concept live.

**Complete loop:** Gap → Verified via GitHub → Project → On-chain Proof (stretch)

---

## 5. MVP Feature Scope

### Must Have
- Resume upload (PDF) + text extraction
- RAG-based role matching (20-30 curated role profiles, in-memory similarity search, fallback AI-generated profile for unmatched roles)
- AI extraction: resume → structured JSON (skills, projects, experience)
- Tiered gap analysis: extracted skills vs. role benchmark → Demonstrated/Partial/Missing/Differentiator + explainable weighted score
- GitHub verification: username → public repo/commit check → flags claims with no supporting evidence
- Project generator: one specific buildable project per critical gap
- Curated resource links per gap
- Results dashboard: score, tiers, verification flags, project ideas, resources

### Should Have (If Time Permits)
- Editable extracted-skills step before analysis runs
- Loading/error states for bad PDFs, low-confidence role matches, private/empty GitHub profiles

### Stretch
- On-chain skill credential (testnet mint) after project completion

### Explicitly Cut
- Auth/accounts, database persistence, progress tracking over time, monetization, analytics, production-grade vector DB infra

---

## 6. User Journey

1. Landing page → "Analyze My Resume"
2. Upload resume (PDF)
3. Type target role (free text, not fixed dropdown)
4. RAG retrieves closest matching role profile (or flags AI-generated fallback)
5. AI extracts skills/experience → optional user review
6. (Optional) User adds GitHub username → verification check runs
7. AI compares extracted + verified skills vs. role benchmark
8. Results: alignment score, tiered skill breakdown, verification flags, project-per-gap, resources
9. (Stretch) Mark project complete → mint testnet credential

---

## 7. AI & Data Pipeline

```
Resume PDF ──► Text extraction (pdf-parse)
                    │
                    ▼
        Prompt 1 — Structured Extraction
        Output: JSON { skills, projects, experience, education }
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
GitHub API check          RAG Role Retrieval
(claims vs real repos)    (embed query → cosine
        │                  similarity vs curated
        │                  role profiles, JSON store)
        └───────────┬────────────┘
                    ▼
        Prompt 2 — Tiered Gap Analysis
        Input: extracted JSON + verification flags + role profile
        Output: JSON { matched, partial, missing, differentiators,
                        score, explanation, verification_notes }
                    │
                    ▼
        Project Generator (per critical gap)
                    │
                    ▼
        Resource Mapper (curated skill → links dict)
                    │
                    ▼
            Results Dashboard
```

**Anti-hallucination design:** extraction constrained to resume text; gap classification only uses skills defined in the retrieved role profile; GitHub verification is a separate deterministic check, not left to the LLM to guess.

---

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js |
| Backend | Node.js / Express or Next.js API routes |
| Resume parsing | pdf-parse |
| AI / LLM | Claude API — separate calls for extraction, gap analysis, project generation |
| Embeddings | OpenAI or Voyage AI embeddings — role profiles embedded once, offline |
| Retrieval | In-memory cosine similarity over JSON-stored role profiles (no vector DB at this scale) |
| Verification | GitHub REST API (public data, no auth required) |
| Data store | Static JSON — role profiles, skill taxonomy, resource dictionary |
| Hosting | Vercel |
| Stretch: on-chain | Testnet (e.g., Polygon Amoy / Sepolia) simple attestation or NFT mint |

---

## 9. Build Timeline (2 Days)

**Day 1 — Core Pipeline**
1. Scaffold Next.js app + API routes
2. Resume upload UI + PDF-to-text
3. Curate 20-30 role profiles across Security / Blockchain / Backend tracks (JSON)
4. Embed role profiles, build in-memory similarity retrieval function
5. Prompt 1 (extraction) — test on sample resumes
6. Prompt 2 (gap analysis) — validate JSON output, retry on parse failure
7. GitHub API integration — fetch public repo languages/commits, basic claim cross-check
8. End-to-end pipeline working (raw JSON acceptable)

**Day 2 — UI, Verification Polish, Project Generator, Demo Prep**
9. Results dashboard: score, skill tier chips, verification flags
10. Project generator prompt — one buildable project per critical gap
11. Curated resource dictionary (skill → 2-3 links)
12. (If time) Stretch: mocked testnet credential mint with visible tx hash
13. Loading/error states (bad PDF, no GitHub match, low RAG similarity)
14. Test with 3-4 real resumes + real GitHub profiles, fix issues
15. Prepare demo narrative + slide
16. Buffer for bugs

---

## 10. Standout Features Summary

| # | Feature | Why it wins |
|---|---|---|
| 1 | GitHub verification | No competitor checks claims against real code — hardest to fake, most technically impressive live demo moment |
| 2 | RAG-based open role search | Works for any typed role, not 5 hardcoded options — real scalability story |
| 3 | Gap → Project → Evidence loop | Closes the loop competitors stop short of |
| 4 | Evidence-tiered, explainable scoring | Not a black-box percentage |
| 5 | Anti-hallucination design | Every classification traceable to real evidence (resume text + GitHub) |
| 6 | Niche domain depth | Curated by people who know security/blockchain hiring, not scraped keywords |
| 7 | (Stretch) On-chain credential | Permanent, verifiable proof of completed work — ties team's blockchain expertise directly into the product |
| 8 | Honest scope statement | Explicitly not a hiring predictor — builds credibility |

---

## 11. What This Is Not

Not a hiring predictor, not a guarantee of interview success, not a replacement for real project experience. A diagnostic and direction-setting tool, positioned honestly.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| GitHub API rate limits / private repos | Use public unauthenticated endpoint (60 req/hr sufficient for demo); handle gracefully if profile is empty/private |
| RAG retrieval returns wrong role | Show similarity confidence; fallback to AI-generated profile with clear label |
| AI hallucinates skills | Constrain prompts to extracted text + verification data; validate output schema |
| Time runs out before stretch (on-chain) | Cut Layer 4 first — Layers 1-3 alone are a complete, winnable pitch |
| JSON output malformed | Schema validation + retry logic on both prompts |

---

## 13. Demo Narrative

1. Problem: job seekers don't know what they're missing, and resumes can lie
2. Live demo: upload resume → type any role (RAG finds it) → connect GitHub → see verified score, tiered gaps, generated project per gap
3. Technical highlight: GitHub verification catching an unsupported claim, live
4. Closing line: "We don't just tell you what's missing — we tell you what to build next, and we check whether your claims are even real."
