import requirementsData from './data/requirements.json';
import embeddingsData from './data/embeddings.json';
import { JobPosition, EnrichedRequirement, RequirementMatch } from './types';

export interface StoredEmbedding {
  id: string;
  company: string;
  role: string;
  type: string;
  category: string;
  title: string;
  vector: number[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getAllPositions(): JobPosition[] {
  return requirementsData as unknown as JobPosition[];
}

export function getPosition(company: string, role: string): JobPosition | undefined {
  const normCompany = company.toLowerCase().trim();
  const normRole = role.toLowerCase().trim();

  return getAllPositions().find(pos => {
    const compMatch = pos.company.toLowerCase().includes(normCompany) || normCompany.includes(pos.company.toLowerCase());
    const roleMatch = pos.role.toLowerCase().includes(normRole) || normRole.includes(pos.role.toLowerCase()) ||
      (normRole.includes('ai') && pos.role.toLowerCase().includes('ai')) ||
      (normRole.includes('software') && pos.role.toLowerCase().includes('software')) ||
      (normRole.includes('network') && pos.role.toLowerCase().includes('network'));
    return compMatch && roleMatch;
  });
}

export function getAllEmbeddings(): Record<string, StoredEmbedding> {
  return embeddingsData as unknown as Record<string, StoredEmbedding>;
}

/**
 * Calculates lexical keyword match score between candidate text and requirement metadata
 */
export function calculateLexicalScore(
  resumeText: string,
  requirement: EnrichedRequirement
): { score: number; matchedKeywords: string[] } {
  const lowerResume = resumeText.toLowerCase();
  const matchedKeywords: string[] = [];

  let keyTechMatches = 0;
  for (const tech of requirement.key_technologies) {
    const cleanTech = tech.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${cleanTech}\\b`, 'i');
    if (regex.test(lowerResume) || lowerResume.includes(tech.toLowerCase())) {
      keyTechMatches++;
      matchedKeywords.push(tech);
    }
  }

  let synonymMatches = 0;
  for (const syn of requirement.synonyms_and_keywords) {
    const cleanSyn = syn.toLowerCase();
    if (lowerResume.includes(cleanSyn) && !matchedKeywords.includes(syn)) {
      synonymMatches++;
      matchedKeywords.push(syn);
    }
  }

  const techWeight = requirement.key_technologies.length > 0 ? (keyTechMatches / requirement.key_technologies.length) : 0;
  const synWeight = requirement.synonyms_and_keywords.length > 0 ? (synonymMatches / requirement.synonyms_and_keywords.length) : 0;

  // Composite lexical coverage
  const lexicalScore = Math.min(1.0, (techWeight * 0.7) + (synWeight * 0.3) + (matchedKeywords.length >= 2 ? 0.2 : 0));

  return {
    score: lexicalScore,
    matchedKeywords: Array.from(new Set(matchedKeywords))
  };
}

/**
 * Hybrid search matching candidate resume chunks against a single requirement
 */
export function matchRequirementWithResume(
  requirement: EnrichedRequirement,
  resumeText: string,
  resumeVector?: number[] | null,
  isFresher: boolean = false
): RequirementMatch {
  const lexical = calculateLexicalScore(resumeText, requirement);
  const stored = getAllEmbeddings()[requirement.id];

  let semanticScore = 0;
  if (resumeVector && stored && stored.vector) {
    const rawSim = cosineSimilarity(resumeVector, stored.vector);
    // Normalize cosine similarity (typically ~0.3 - 0.9 for all-MiniLM) to 0.0 - 1.0
    semanticScore = Math.max(0, Math.min(1.0, (rawSim - 0.25) / 0.55));
  } else {
    semanticScore = lexical.score;
  }

  // Anti-Hallucination Hybrid Weighting:
  let compositeScore = (semanticScore * 0.55) + (lexical.score * 0.45);

  // If fresher / student, relax strict years experience penalties on foundational items
  if (isFresher && requirement.proficiency_level === 'Foundational') {
    if (lexical.matchedKeywords.length > 0) {
      compositeScore = Math.min(1.0, compositeScore + 0.15);
    }
  }

  // If there are zero keyword matches and semantic score is mediocre, penalize
  if (lexical.matchedKeywords.length === 0 && semanticScore < 0.65) {
    compositeScore *= 0.6;
  }

  // Bonus for strong explicit keyword presence
  if (lexical.matchedKeywords.length >= 3) {
    compositeScore = Math.min(1.0, compositeScore + 0.15);
  }

  const finalScore = Math.round(compositeScore * 100);

  let status: 'strong_match' | 'partial_match' | 'gap' | 'missing';
  let matched = false;

  if (finalScore >= 75) {
    status = 'strong_match';
    matched = true;
  } else if (finalScore >= 45) {
    status = 'partial_match';
    matched = true;
  } else if (finalScore >= 20) {
    status = 'gap';
    matched = false;
  } else {
    status = 'missing';
    matched = false;
  }

  const evidence: string[] = [];
  if (lexical.matchedKeywords.length > 0) {
    evidence.push(`Found relevant competencies: ${lexical.matchedKeywords.join(', ')}`);
  }

  let gap_reason: string | undefined;
  if (!matched) {
    gap_reason = `Missing verified evidence for: ${requirement.title} (${requirement.key_technologies.slice(0, 3).join(', ')}). Rubric requires: ${requirement.anti_hallucination_rubric}`;
  }

  return {
    requirement,
    score: finalScore,
    matched,
    status,
    evidence,
    gap_reason
  };
}
