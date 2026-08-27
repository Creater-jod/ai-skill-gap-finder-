# 🎨 AI Skill Gap Finder — Design System & Visual Specification

This design system establishes a high-density, authoritative visual standard for the **AI Skill Gap Finder**. It eliminates generic AI clichés (such as unmotivated gradients and blurry glassmorphism) in favor of high-contrast, diagnostic clarity tailored for developers, recruiters, and hiring panels.

---

## 1. Core Visual Principles

### 1.1 Precision Over Decoration (Anti-AI Slop Manifesto)
- **No Gratuitous Gradients:** Backgrounds remain solid obsidian (`#0B0F17`) with crisp, hairline borders (`#1F2937`).
- **Semantic Color Tiers Only:** Color conveys status (Emerald = Verified/Demonstrated, Amber = Partial/Stale, Crimson = Missing/Unverified, Violet = Differentiator, Cyan = Unclaimed Strength).
- **Typography Hierarchy:** Clean, crisp modern typography (Inter + JetBrains Mono for code symbols and verification tags).
- **Predictable Rhythms:** 4px baseline grid (4, 8, 12, 16, 24, 32px spacing).

---

## 2. Color Palette & Tokens

| Token | Hex / Value | Usage | WCAG Contrast |
|---|---|---|---|
| `--color-bg` | `#0B0F17` | Root canvas / deep dark background | Base |
| `--color-card` | `#111827` | Primary surface for analysis widgets | Base + 1 |
| `--color-card-hover` | `#1E293B` | Hover feedback state | Smooth transition (150ms) |
| `--color-border` | `#1F2937` | Card borders, dividers, table lines | Subtle separation |
| `--tier-demonstrated` | `#10B981` | 100% Match + GitHub verified code | High (Pass AA) |
| `--tier-partial` | `#F59E0B` | Mentioned on resume, unverified / stale | High (Pass AA) |
| `--tier-missing` | `#EF4444` | Critical skill gap to be addressed | High (Pass AA) |
| `--tier-differentiator`| `#8B5CF6` | Surplus skill beyond role requirements | High (Pass AA) |
| `--accent-cyan` | `#06B6D4` | Unclaimed strength / live web search stream | High (Pass AA) |
| `--text-primary` | `#F9FAFB` | Main headers, metrics, card titles | 16.5:1 on `#0B0F17` |
| `--text-secondary` | `#9CA3AF` | Supporting descriptions, evidence text | 7.8:1 on `#0B0F17` |

---

## 3. UI Component Specifications

### 3.1 Overall Score Gauge (`ScoreHero`)
- **Visual:** Circular SVG radial progress with bold metric numeral (e.g. `78%`) + qualitative badge (`Strong Match` / `Moderate Gap`).
- **Explanation Callout:** Directly below the score, an exact, traceable math formula breakdown: `Score = (Σ Weighted Skills Matched / Total Weight) * 100`.

### 3.2 Skill Tier Chips (`SkillBadge`)
- **Structure:** `[Tier Icon] [Skill Name] • [Evidence Tooltip / Subtext]`
- **Variants:**
  - `Demonstrated:` Emerald background (`rgba(16, 185, 129, 0.12)`), Emerald border (`rgba(16, 185, 129, 0.3)`), Emerald text.
  - `Partial:` Amber background (`rgba(245, 158, 11, 0.12)`), Amber border, Amber text.
  - `Missing:` Crimson background (`rgba(239, 68, 68, 0.12)`), Crimson border, Crimson text.
  - `Differentiator:` Violet background (`rgba(139, 92, 246, 0.12)`), Violet border, Violet text.

### 3.3 GitHub Verification Card (`GitHubAuditPanel`)
- **Header:** `@username` avatar + Total Repos (`42`) + Active Push Events (`128`).
- **Sub-sections:**
  1. `Verified Claims:` Chip list with checkmark icons.
  2. `Unverified Claims:` Crimson warning badge indicating resume skill with 0 matching repos.
  3. `Stale Skills:` Amber badge indicating repository inactive >6 months.
  4. `Unclaimed Superpowers:` Cyan badge for top repo languages not listed on resume.

### 3.4 Portfolio Project Cards (`ProjectCard`)
- **Card Header:** Skill gap addressed (e.g., `Missing: Docker`) + Project Title (e.g., `Containerized Microservices Chat App`).
- **Badges:** Difficulty pill (`Intermediate`) + Estimated Time (`20 hrs`).
- **Body:** 2-line practical description + Tech Stack tags (`Node.js`, `Docker`, `Redis`).
- **Learning Outcomes Checklist:** Specific, verifiable deliverables.

### 3.5 Agentic Live Resource Stream (`LiveResourceTile`)
- **Header:** Pulsing live search indicator (`● Web-Verified Resources`).
- **Item Format:** Title + Source Badge (`[Official Docs]` / `[Tutorial]`) + Verified Checkmark.
- **Link State:** Clean external link with favicon indicator and direct URL preview.

---

## 4. CSS Custom Properties (`src/app/globals.css`)

```css
@layer base {
  :root {
    --bg-main: #0B0F17;
    --card-surface: #111827;
    --card-border: #1F2937;
    --text-main: #F9FAFB;
    --text-muted: #9CA3AF;
    --brand-blue: #2563EB;
    
    --tier-demo-bg: rgba(16, 185, 129, 0.12);
    --tier-demo-text: #10B981;
    --tier-demo-border: rgba(16, 185, 129, 0.3);

    --tier-part-bg: rgba(245, 158, 11, 0.12);
    --tier-part-text: #F59E0B;
    --tier-part-border: rgba(245, 158, 11, 0.3);

    --tier-miss-bg: rgba(239, 68, 68, 0.12);
    --tier-miss-text: #EF4444;
    --tier-miss-border: rgba(239, 68, 68, 0.3);

    --tier-diff-bg: rgba(139, 92, 246, 0.12);
    --tier-diff-text: #8B5CF6;
    --tier-diff-border: rgba(139, 92, 246, 0.3);
  }
}
```
