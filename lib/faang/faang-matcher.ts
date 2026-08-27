import { embedText } from './embedder';
import { getPosition, matchRequirementWithResume } from './vector-store';
import { PositionMatchResult, RequirementMatch, RequirementType, JobPosition, EnrichedRequirement } from './types';

export function findMatchingFaangPosition(role: string, company: string): JobPosition | undefined {
  return getPosition(company, role);
}

export async function matchFaangPosition(
  resumeText: string,
  company: string,
  role: string,
  experienceLevel: string = 'Early Career (1-3 yrs)'
): Promise<PositionMatchResult | null> {
  const pos = getPosition(company, role);
  if (!pos) return null;

  const isFresher = experienceLevel.toLowerCase().includes('fresher') || experienceLevel.toLowerCase().includes('student');

  // Runtime embedding for dense semantic vector cosine match
  let resumeVector: number[] | null = null;
  try {
    resumeVector = await embedText(resumeText);
  } catch (err) {
    console.warn('Runtime embedding failed, falling back to lexical matching:', err);
  }

  const matches: RequirementMatch[] = pos.requirements.map(req =>
    matchRequirementWithResume(req, resumeText, resumeVector, isFresher)
  );

  const minMatches = matches.filter(m => m.requirement.type === 'minimum');
  const prefMatches = matches.filter(m => m.requirement.type === 'preferred');

  const minCount = minMatches.length || 1;
  const prefCount = prefMatches.length || 1;

  const minMatchedCount = minMatches.filter(m => m.matched).length;
  const prefMatchedCount = prefMatches.filter(m => m.matched).length;

  const minAvgScore = Math.round(minMatches.reduce((acc, m) => acc + m.score, 0) / minCount);
  const prefAvgScore = Math.round(prefMatches.reduce((acc, m) => acc + m.score, 0) / prefCount);

  // 70% Minimum Qualifications + 30% Preferred Qualifications
  const overallScore = Math.round((minAvgScore * 0.70) + (prefAvgScore * 0.30));

  let fitLevel: PositionMatchResult['fit_level'];
  let verdict: string;

  if (overallScore >= 75 && minMatchedCount >= Math.ceil(minCount * 0.85)) {
    fitLevel = 'High Match';
    verdict = `Strong candidate for ${pos.company} ${pos.role}. Meets essential qualifications with competitive bonus competencies.`;
  } else if (overallScore >= 55 && minMatchedCount >= Math.ceil(minCount * 0.65)) {
    fitLevel = 'Competitive';
    verdict = `Solid potential for ${pos.company} ${pos.role}. Meets core baseline qualifications with a few specific gaps to bridge.`;
  } else if (overallScore >= 35) {
    fitLevel = 'Moderate Match';
    verdict = `Partial alignment with ${pos.company} ${pos.role}. Specific technical bridges needed on core minimum technical bars.`;
  } else {
    fitLevel = 'Low Match';
    verdict = `Early alignment for ${pos.company} ${pos.role}. Profile requires structured building in essential prerequisites.`;
  }

  // Identify Top Gaps
  const topGaps = matches
    .filter(m => !m.matched || m.score < 55)
    .sort((a, b) => {
      if (a.requirement.type === 'minimum' && b.requirement.type !== 'minimum') return -1;
      if (b.requirement.type === 'minimum' && a.requirement.type !== 'minimum') return 1;
      return a.score - b.score;
    })
    .slice(0, 4)
    .map(m => ({
      title: m.requirement.title,
      category: m.requirement.category,
      type: m.requirement.type as RequirementType,
      importance: (m.requirement.type === 'minimum' ? 'Critical' : 'Recommended') as 'Critical' | 'Recommended',
      reason: m.gap_reason || `Score: ${m.score}%. Missing evidence for required skills: ${m.requirement.key_technologies.slice(0, 3).join(', ')}`,
      remediation: m.requirement.remediation
    }));

  // Identify Key Strengths
  const keyStrengths = matches
    .filter(m => m.matched && m.score >= 60)
    .sort((a, b) => b.score - a.score)
    .map(m => `${m.requirement.title} (${m.score}% match)`)
    .slice(0, 4);

  // Build Actionable Recommendations
  const actionable_recommendations: PositionMatchResult['actionable_recommendations'] = [];
  topGaps.forEach((gap, idx) => {
    let priority: PositionMatchResult['actionable_recommendations'][0]['priority'];
    if (gap.importance === 'Critical' && idx === 0) {
      priority = 'Immediate (1-2 Weeks)';
    } else if (gap.importance === 'Critical') {
      priority = 'Short-Term (1 Month)';
    } else {
      priority = 'Long-Term (2-3 Months)';
    }

    actionable_recommendations.push({
      priority,
      action: gap.remediation.action_step,
      details: `Bridge ${gap.title}: Recommended project: "${gap.remediation.project}". Key courses: ${gap.remediation.courses.join(', ')}`,
      related_skill: gap.title
    });
  });

  return {
    company: pos.company,
    company_color: pos.company_color,
    role: pos.role,
    role_summary: pos.role_summary,
    overall_score: overallScore,
    min_qual_score: minAvgScore,
    pref_qual_score: prefAvgScore,
    fit_level: fitLevel,
    verdict,
    matched_count: minMatchedCount + prefMatchedCount,
    total_count: minCount + prefCount,
    min_matched_count: minMatchedCount,
    min_total_count: minCount,
    matches,
    top_gaps: topGaps,
    key_strengths: keyStrengths.length > 0 ? keyStrengths : ['Demonstrated foundational software background'],
    actionable_recommendations
  };
}
