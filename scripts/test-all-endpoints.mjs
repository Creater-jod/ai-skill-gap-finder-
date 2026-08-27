// Local Testing Script for AI Skill Gap Finder
// Run with: node scripts/test-all-endpoints.mjs

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function testEndpoint(name, url, method, body) {
  process.stdout.write(`Testing [${name}] ... `);
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`❌ FAIL (${res.status}): ${errText}`);
      return false;
    }

    const data = await res.json();
    console.log(`✅ PASS (${res.status})`);
    return true;
  } catch (err) {
    console.log(`❌ FAIL (Network): ${err.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`\n🧪 Running Local API Test Suite against ${BASE_URL}\n`);

  // 1. GitHub Verifier
  await testEndpoint(
    "1. GitHub Verification",
    "/api/verify-github",
    "POST",
    { username: "torvalds", claimedSkills: ["C", "Git", "Linux", "Python"] }
  );

  // 2. Resume Extraction
  await testEndpoint(
    "2. Resume Extraction",
    "/api/extract",
    "POST",
    { resumeText: "Senior backend developer with 4 years designing distributed services in Python, PostgreSQL, and Docker." }
  );

  // 3. Gap Analysis
  await testEndpoint(
    "3. Gap Analysis",
    "/api/analyze",
    "POST",
    {
      extraction: {
        skills: [{ name: "Python" }, { name: "PostgreSQL" }],
        projects: [],
        experience: [],
        education: []
      },
      roleProfile: {
        roleName: "Backend Engineer",
        requiredSkills: [
          { skill: "Python", weight: 0.9, category: "backend" },
          { skill: "Docker", weight: 0.8, category: "devops" }
        ],
        niceToHaveSkills: ["Kubernetes"],
        description: "Backend engineer role"
      }
    }
  );

  // 4. Project Generator
  await testEndpoint(
    "4. Project Generator",
    "/api/generate-projects",
    "POST",
    {
      missingSkills: [{ skill: "Docker", weight: 0.8 }],
      roleProfile: { roleName: "Backend Engineer", description: "Backend role" }
    }
  );

  // 5. Master Pipeline
  await testEndpoint(
    "5. Master Pipeline E2E",
    "/api/pipeline",
    "POST",
    {
      resumeText: "Experienced software engineer with 3 years building cloud APIs in Python, PostgreSQL, and REST.",
      targetRole: "Backend Engineer",
      githubUsername: "nikil-dev"
    }
  );

  console.log(`\n🎉 All local testing requests completed!\n`);
}

runAllTests();
