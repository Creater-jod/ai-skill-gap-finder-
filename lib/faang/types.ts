export type RequirementType = 'minimum' | 'preferred';
export type ProficiencyLevel = 'Foundational' | 'Intermediate' | 'Advanced' | 'Expert';

export interface RemediationPlan {
  courses: string[];
  project: string;
  action_step: string;
}

export interface EnrichedRequirement {
  id: string;
  type: RequirementType;
  category: string;
  title: string;
  raw_text: string;
  proficiency_level: ProficiencyLevel;
  min_years_experience: number;
  key_technologies: string[];
  synonyms_and_keywords: string[];
  detailed_explanation: string;
  anti_hallucination_rubric: string;
  remediation: RemediationPlan;
}

export interface JobPosition {
  company: 'Google' | 'NVIDIA' | 'Amazon' | 'Microsoft';
  company_color: string;
  role: 'Software Engineer' | 'AI Engineer' | 'Network Administrator';
  role_summary: string;
  requirements: EnrichedRequirement[];
}

export interface RequirementMatch {
  requirement: EnrichedRequirement;
  score: number; // 0 to 100
  matched: boolean;
  status: 'strong_match' | 'partial_match' | 'gap' | 'missing';
  evidence: string[];
  gap_reason?: string;
}

export interface PositionMatchResult {
  company: 'Google' | 'NVIDIA' | 'Amazon' | 'Microsoft';
  company_color: string;
  role: 'Software Engineer' | 'AI Engineer' | 'Network Administrator';
  role_summary: string;
  overall_score: number; // 0 to 100
  min_qual_score: number; // 0 to 100
  pref_qual_score: number; // 0 to 100
  fit_level: 'High Match' | 'Competitive' | 'Moderate Match' | 'Low Match';
  verdict: string;
  matched_count: number;
  total_count: number;
  min_matched_count: number;
  min_total_count: number;
  matches: RequirementMatch[];
  top_gaps: {
    title: string;
    category: string;
    type: RequirementType;
    importance: 'Critical' | 'Recommended';
    reason: string;
    remediation: RemediationPlan;
  }[];
  key_strengths: string[];
  actionable_recommendations: {
    priority: 'Immediate (1-2 Weeks)' | 'Short-Term (1 Month)' | 'Long-Term (2-3 Months)';
    action: string;
    details: string;
    related_skill: string;
  }[];
}
