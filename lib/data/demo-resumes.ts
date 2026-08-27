export interface DemoPreset {
  id: string;
  name: string;
  badge: string;
  targetRole: string;
  githubUsername: string;
  resumeText: string;
  highlightStory: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "solidity-gap",
    name: "Alex Rivera — Web3 / Solidity Dev",
    badge: "DeFi / Smart Contracts",
    targetRole: "Smart Contract Developer",
    githubUsername: "alex-rivera-web3",
    highlightStory: "Has built basic ERC-20 dApps, but lacks formal testing with Foundry, Gas Optimization, and Auditing skills.",
    resumeText: `ALEX RIVERA
Email: alex.rivera@example.com | GitHub: alex-rivera-web3 | Location: San Francisco, CA

SUMMARY
Passionate Web3 and dApp developer with 2 years of experience building decentralized applications on Ethereum and Polygon. Strong frontend React background with practical Solidity smart contract experience.

TECHNICAL SKILLS
Languages: Solidity, JavaScript, TypeScript, HTML/CSS, Python (Basics)
Frameworks & Libraries: React, Next.js, Ethers.js, Wagmi, Tailwind CSS, Hardhat
Blockchain & Web3: Ethereum, Polygon, ERC-20, ERC-721, Metamask Integration, IPFS
Tools: Git, VS Code, Remix IDE, NPM, Vercel

PROJECTS
1. Decentralized NFT Marketplace (2024)
- Built a fullstack NFT minting and trading marketplace on Ethereum Sepolia testnet.
- Developed ERC-721 smart contracts using OpenZeppelin libraries and deployed using Hardhat.
- Integrated Wagmi and Ethers.js with Next.js App Router for wallet connection and metadata rendering via IPFS.
- Technologies: Solidity, React, Next.js, Hardhat, Ethers.js, IPFS.

2. Simple DeFi Token Staking Vault (2023)
- Created an ERC-20 yield staking contract allowing users to stake tokens and earn simulated APY rewards.
- Deployed on Polygon Mumbai testnet with Remix IDE.
- Created interactive dashboard using React and Tailwind CSS.
- Technologies: Solidity, JavaScript, React, Tailwind CSS, Remix.

3. Web3 Crowdfunding Portal (2023)
- Built a Kickstarter-style crowdfunding platform governed by smart contracts.
- Allowed contributors to vote on milestone budget releases.
- Technologies: Solidity, TypeScript, Next.js, Ethers.js.

EDUCATION
B.S. in Computer Science, University of California, Davis (2020 - 2024)
Relevant Coursework: Data Structures, Distributed Systems, Cryptography Basics, Web Architecture.`
  },
  {
    id: "backend-unverified",
    name: "Jordan Lee — Backend & API Engineer",
    badge: "Cloud / Microservices",
    targetRole: "Backend Engineer (Node.js & TypeScript)",
    githubUsername: "jordanlee-dev",
    highlightStory: "Claims Docker and Kubernetes on resume, but GitHub shows 0 container files and mostly raw JavaScript repos.",
    resumeText: `JORDAN LEE
Email: jordan.lee@example.com | GitHub: jordanlee-dev | Location: Austin, TX

PROFESSIONAL SUMMARY
Backend Engineer with 3+ years of experience engineering high-volume REST APIs, relational databases, and microservices in Node.js and TypeScript. Experienced with containerization and cloud architectures.

CORE COMPETENCIES
Languages: TypeScript, JavaScript, SQL (PostgreSQL), Python
Backend & APIs: Node.js, Express.js, Fastify, REST API Design, GraphQL
Databases & Storage: PostgreSQL, MongoDB, Redis, Prisma ORM
DevOps & Cloud: Docker, Kubernetes, AWS (S3, EC2), CI/CD (GitHub Actions), Git
Testing: Jest, Supertest, Postman

EXPERIENCE
Backend Developer | CloudScale Solutions (Jan 2023 - Present)
- Architected and deployed 15+ RESTful microservice endpoints in TypeScript handling over 2M requests/day.
- Optimized PostgreSQL database queries and implemented Redis caching, cutting P99 latency by 38%.
- Integrated third-party payment gateways (Stripe, PayPal) with robust webhook idempotency and retry handlers.
- Collaborated on CI/CD pipeline modernization using GitHub Actions.

Junior Web Developer | Apex Tech Media (Jun 2021 - Dec 2022)
- Built internal tooling dashboards using Node.js, Express, and MongoDB.
- Maintained legacy REST APIs and authored automated integration tests in Jest.

PROJECTS
1. Real-Time Distributed Task Queue (2024)
- Built an asynchronous distributed job scheduler using Node.js, Redis Streams, and PostgreSQL.
- Implemented worker pool management with exponential backoff retries.
- Technologies: Node.js, TypeScript, Redis, PostgreSQL.

2. Multi-Tenant E-Commerce API (2023)
- Built an authenticated multi-vendor API backend with JWT authentication and role-based access control (RBAC).
- Technologies: TypeScript, Express, PostgreSQL, Prisma, Jest.

EDUCATION
B.Tech in Information Technology, Texas State University (2021)`
  },
  {
    id: "appsec-pentest",
    name: "Sarah Chen — Security & Vulnerability Analyst",
    badge: "Cybersecurity / AppSec",
    targetRole: "Application Security (AppSec) Engineer",
    githubUsername: "sarahchen-sec",
    highlightStory: "Solid Linux and Burp Suite skills, but needs automated SAST/DAST tooling in CI/CD and Threat Modeling proof.",
    resumeText: `SARAH CHEN
Email: sarah.chen@securitylab.io | GitHub: sarahchen-sec | Location: Boston, MA

OBJECTIVE
Motivated Application Security Analyst with a strong foundation in ethical hacking, vulnerability identification, OWASP Top 10 remediation, and Linux system security.

SECURITY SKILLS
Security Domains: OWASP Top 10, Web Application Security, Network Penetration Testing, Threat Analysis
Tools: Burp Suite, Nmap, Wireshark, Metasploit, OWASP ZAP, Nessus, Git
Programming & Scripting: Python, Bash, JavaScript, SQL
Operating Systems: Kali Linux, Ubuntu Server, Windows Server

SECURITY EXPERIENCE & PROJECTS
1. Web Vulnerability Scanner & Crawler (2024)
- Developed an automated Python tool that crawls web applications and identifies common misconfigurations like XSS, SQLi, and open directory listings.
- Integrated CVE lookup database to correlate outdated server headers with known exploits.
- Technologies: Python, BeautifulSoup, Requests, SQLite.

2. HackTheBox & TryHackMe Competitive Security (2023 - 2024)
- Top 5% ranking on TryHackMe (Completed 60+ vulnerable machine rooms including web exploits, privilege escalation, and network pivots).
- Completed practical labs on SQL Injection, SSRF, IDOR, and Broken Authentication.

3. Secure File Vault with Cryptographic Sharding (2023)
- Built a secure file storage server implementing AES-256-GCM client-side encryption and PBKDF2 key derivation.
- Technologies: Python, Cryptography library, Flask.

EDUCATION & CERTIFICATIONS
B.S. in Computer Science (Cybersecurity Concentration), Northeastern University (2024)
Certifications: CompTIA Security+ (2023), eJPT (Junior Penetration Tester - 2024)`
  }
];
