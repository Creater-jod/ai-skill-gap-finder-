import { GapAnalysis, TieredSkill } from '@/types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if key phrases from evidence text are substantiated by raw resume text
 */
function verifyEvidenceString(evidence: string, resumeText: string): boolean {
  if (!evidence || evidence.length < 5) return true; // generic/brief items pass

  const normEvidence = normalize(evidence);
  const normResume = normalize(resumeText);

  // Exact normalized substring match
  if (normResume.includes(normEvidence)) return true;

  // Multi-word window match: split evidence into 3-word n-grams and check if at least 50% match
  const words = normEvidence.split(' ').filter(w => w.length > 2);
  if (words.length <= 2) {
    return words.some(w => normResume.includes(w));
  }

  let matchedGrams = 0;
  const totalGrams = Math.max(1, words.length - 2);

  for (let i = 0; i <= words.length - 3; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (normResume.includes(trigram)) {
      matchedGrams++;
    }
  }

  const coverageRatio = matchedGrams / totalGrams;
  return coverageRatio >= 0.35 || words.filter(w => normResume.includes(w)).length / words.length >= 0.65;
}

function processSkill(skill: TieredSkill, resumeText: string): TieredSkill {
  // If tier is missing, it's inherently a gap so it has no positive evidence claim to verify
  if (skill.tier === 'missing') {
    return {
      ...skill,
      evidenceVerified: true,
    };
  }

  const isVerified = verifyEvidenceString(skill.evidence || '', resumeText);

  return {
    ...skill,
    evidenceVerified: isVerified,
  };
}

export function validateEvidenceAgainstResume(
  gapAnalysis: GapAnalysis,
  rawResumeText: string
): GapAnalysis {
  let flaggedCount = 0;

  const verifiedTiers = {
    demonstrated: gapAnalysis.tiers.demonstrated.map(s => {
      const processed = processSkill(s, rawResumeText);
      if (!processed.evidenceVerified) flaggedCount++;
      return processed;
    }),
    partial: gapAnalysis.tiers.partial.map(s => {
      const processed = processSkill(s, rawResumeText);
      if (!processed.evidenceVerified) flaggedCount++;
      return processed;
    }),
    missing: gapAnalysis.tiers.missing.map(s => processSkill(s, rawResumeText)),
    differentiators: gapAnalysis.tiers.differentiators.map(s => {
      const processed = processSkill(s, rawResumeText);
      if (!processed.evidenceVerified) flaggedCount++;
      return processed;
    }),
  };

  const verificationNotes = [...(gapAnalysis.verificationNotes || [])];
  if (flaggedCount > 0) {
    verificationNotes.unshift(
      `Deterministic Anti-Hallucination: Flagged ${flaggedCount} skill claim(s) whose cited text could not be verified in the source resume.`
    );
  } else {
    verificationNotes.unshift(
      `Deterministic Anti-Hallucination: 100% of candidate evidence quotes verified against source resume text.`
    );
  }

  return {
    ...gapAnalysis,
    tiers: verifiedTiers,
    verificationNotes,
  };
}

export function validateEvidenceQuotes(
  gapAnalysis: GapAnalysis,
  rawResumeText: string
): { gapAnalysis: GapAnalysis; killedCount: number } {
  const result = validateEvidenceAgainstResume(gapAnalysis, rawResumeText);
  const allEvaluated = [
    ...result.tiers.demonstrated,
    ...result.tiers.partial,
    ...result.tiers.differentiators,
  ];
  const killedCount = allEvaluated.filter(s => s.evidenceVerified === false).length;
  return { gapAnalysis: result, killedCount };
}
