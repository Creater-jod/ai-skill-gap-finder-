import { RoleProfile } from "@/types";

export const MOCK_BACKEND_ENGINEER: RoleProfile = {
  roleName: "Backend Engineer",
  matchConfidence: 0.95,
  isAIGenerated: false,
  description:
    "Mid-level backend engineer building scalable APIs, microservices, and data pipelines.",
  requiredSkills: [
    { skill: "Python", weight: 0.9, category: "programming" },
    { skill: "Node.js", weight: 0.8, category: "programming" },
    { skill: "SQL / PostgreSQL", weight: 0.85, category: "database" },
    { skill: "REST API Design", weight: 0.9, category: "architecture" },
    { skill: "Docker", weight: 0.7, category: "devops" },
    { skill: "Git", weight: 0.6, category: "tools" },
    { skill: "CI/CD", weight: 0.5, category: "devops" },
    { skill: "Testing / TDD", weight: 0.7, category: "engineering" },
    { skill: "System Design", weight: 0.6, category: "architecture" },
    { skill: "Cloud (AWS/GCP)", weight: 0.65, category: "infrastructure" },
  ],
  niceToHaveSkills: ["GraphQL", "Redis", "Kubernetes", "TypeScript", "Message Queues"],
};

export const MOCK_SECURITY_ENGINEER: RoleProfile = {
  roleName: "Security Engineer",
  matchConfidence: 0.9,
  isAIGenerated: false,
  description:
    "Application security engineer focused on vulnerability assessment, secure coding, and security tooling.",
  requiredSkills: [
    { skill: "Python", weight: 0.8, category: "programming" },
    { skill: "Network Security", weight: 0.9, category: "security" },
    { skill: "OWASP Top 10", weight: 0.95, category: "security" },
    { skill: "Penetration Testing", weight: 0.85, category: "security" },
    { skill: "Linux", weight: 0.8, category: "systems" },
    { skill: "Cryptography", weight: 0.6, category: "security" },
    { skill: "SIEM / Log Analysis", weight: 0.5, category: "tools" },
    { skill: "Vulnerability Scanning", weight: 0.7, category: "security" },
    { skill: "Secure Code Review", weight: 0.75, category: "security" },
    { skill: "Cloud Security", weight: 0.6, category: "security" },
  ],
  niceToHaveSkills: ["Burp Suite", "Nmap", "Wireshark", "Docker Security", "SAST/DAST"],
};

export const MOCK_BLOCKCHAIN_DEVELOPER: RoleProfile = {
  roleName: "Blockchain Developer",
  matchConfidence: 0.92,
  isAIGenerated: false,
  description:
    "Smart contract and dApp developer specializing in Ethereum/EVM and decentralized protocols.",
  requiredSkills: [
    { skill: "Solidity", weight: 0.95, category: "smart-contracts" },
    { skill: "JavaScript / TypeScript", weight: 0.85, category: "programming" },
    { skill: "EVM Architecture", weight: 0.8, category: "blockchain" },
    { skill: "Smart Contract Security & Auditing", weight: 0.9, category: "security" },
    { skill: "Hardhat / Foundry", weight: 0.8, category: "tools" },
    { skill: "Ethers.js / Viem", weight: 0.75, category: "web3" },
    { skill: "DeFi Protocols", weight: 0.7, category: "domain" },
    { skill: "Testing (Waffle/Chai)", weight: 0.7, category: "testing" },
  ],
  niceToHaveSkills: ["Rust", "Solana", "IPFS", "Zero Knowledge Proofs", "The Graph"],
};
