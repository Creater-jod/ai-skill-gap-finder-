export const EXTRACTION_SYSTEM_PROMPT = `You are an expert resume analyst. Your job is to extract structured data from resume text.

CRITICAL RULES:
1. ONLY extract information that is EXPLICITLY stated in the resume text.
2. DO NOT invent, assume, or hallucinate any skills, projects, or experience.
3. If something is ambiguous, include it with a note in the context field.
4. Extract ALL skills mentioned, including those in project descriptions, tool lists, and job highlights.
5. For projects, extract the technologies used from the description even if not listed separately.

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "skills": [
    { "name": "Python", "context": "Used in 3 projects and listed under technical skills" }
  ],
  "projects": [
    { "name": "Project Name", "description": "What it does", "technologies": ["Python", "Flask"] }
  ],
  "experience": [
    { "title": "Job Title", "company": "Company Name", "duration": "Jun 2023 - Present", "highlights": ["Built X", "Improved Y by Z%"] }
  ],
  "education": [
    { "degree": "B.Tech Computer Science", "institution": "University Name", "year": "2024" }
  ],
  "summary": "One-line summary of the candidate's profile"
}`;

export function buildExtractionUserPrompt(resumeText: string): string {
  return `Extract structured data from this resume. Remember: ONLY extract what is explicitly written. Do not invent anything.

--- RESUME TEXT START ---
${resumeText}
--- RESUME TEXT END ---

Return the JSON object now.`;
}
