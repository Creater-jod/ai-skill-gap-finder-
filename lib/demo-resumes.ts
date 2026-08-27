export interface DemoResume {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  role: string;
  company: string;
  experienceLevel: string;
  github: string;
  resumeText: string;
}

export const DEMO_RESUMES: DemoResume[] = [
  {
    id: 'fresher-priya',
    name: 'Priya Sharma',
    subtitle: 'B.Tech Computer Science (2026) · Hackathon Winner',
    tag: 'Fresher / Graduate',
    role: 'AI Engineer',
    company: 'Google',
    experienceLevel: 'Student / Fresher (0-1 yr)',
    github: 'priyasharma-dev',
    resumeText: `PRIYA SHARMA
Bengaluru, India | priya.sharma@email.com | github.com/priyasharma-dev | linkedin.com/in/priyasharma-cs

EDUCATION
National Institute of Technology (NIT) Karnataka — B.Tech in Computer Science and Engineering
CGPA: 8.9 / 10 | Expected Graduation: June 2026
Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, Machine Learning, Deep Learning.

TECHNICAL SKILLS
Languages: Python, C++, JavaScript, TypeScript, SQL
Frameworks & Tools: PyTorch, Hugging Face Transformers, LangChain, FastAPI, React.js, Next.js, Git, Docker, Linux
Core Competencies: LLM Application Development, Vector Embeddings, RAG Architectures, REST APIs, Object-Oriented Design

PROJECTS
MedRAG — Clinical Medical QA Assistant (Smart India Hackathon 1st Place)
• Developed an end-to-end Retrieval-Augmented Generation (RAG) system answering clinical queries using Llama-3 and ChromaDB vector search.
• Implemented semantic chunking and cross-encoder re-ranking, improving retrieval precision by 34% over naive cosine similarity.
• Containerized the backend using FastAPI and Docker, serving low-latency inference endpoints with streaming responses.

VisionGuard — Real-Time Defect Detection in Manufacturing
• Built a deep learning computer vision pipeline with PyTorch and YOLOv8 to identify surface anomalies with 94.2% mAP.
• Integrated ONNX runtime export for 3x faster on-device edge inference on NVIDIA Jetson modules.

Multi-Threaded In-Memory Cache (C++)
• Designed an LRU cache in modern C++ (C++20) supporting O(1) reads/writes and thread-safe operations with mutex locks.
• Implemented unit tests with GoogleTest and benchmarked throughput under 100 concurrent worker threads.

ACHIEVEMENTS & LEADERSHIP
• 1st Place — National Smart India Hackathon 2025 (AI & DeepTech Track)
• LeetCode: Knight Badge (Rating 1890+, 450+ Problems Solved in DS&A)
• Technical Head — Google Developer Student Club (GDSC NITK), conducted 8 workshops on LLMs & PyTorch for 300+ students.
`
  },
  {
    id: 'swe-alex',
    name: 'Alexander Johnson',
    subtitle: 'Full-Stack & Backend Engineer · 4 Years Experience',
    tag: 'Experienced SWE',
    role: 'Software Engineer',
    company: 'Google',
    experienceLevel: 'Mid-Senior (3-5+ yrs)',
    github: 'alexjohnson-tech',
    resumeText: `ALEXANDER JOHNSON
Seattle, WA | alex.johnson@email.com | github.com/alexjohnson-tech | linkedin.com/in/alex-johnson-swe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 4 years of experience architecting highly available distributed microservices in Java, Kotlin, and AWS. Proven track record reducing latency by 45% and optimizing multi-tier databases.

EXPERIENCE
CloudScale Technologies — Software Engineer II (Jun 2022 - Present)
• Architected and deployed 6 core Java / Kotlin microservices handling 25,000 requests/sec with Spring Boot and AWS ECS.
• Spearheaded migration from monolithic REST API to event-driven architecture using Apache Kafka, reducing asynchronous processing lag by 40%.
• Designed PostgreSQL and Redis caching layers with read-replicas, achieving sub-20ms p99 query latency across 4M daily active users.
• Implemented robust automated CI/CD pipelines in GitHub Actions with 92% unit and integration test coverage in JUnit 5 & Mockito.

Apex Solutions — Associate Software Engineer (Jul 2020 - May 2022)
• Developed responsive web applications using TypeScript, React, and GraphQL connected to Node.js / Java backends.
• Optimized complex SQL aggregations on DynamoDB and RDS, cutting monthly AWS infrastructure costs by $18,000.
• Participated in weekly on-call rotations, debugging live production incidents with Datadog and AWS CloudWatch.

TECHNICAL SKILLS
Languages: Java 17+, Kotlin, Python, TypeScript, SQL
Backend & Cloud: Spring Boot, Kafka, AWS (ECS, Lambda, S3, RDS, CloudWatch), Docker, Kubernetes, Redis, PostgreSQL
Methodologies: Distributed Systems, System Design, Concurrency, Microservices, Agile Scrum, Test-Driven Development (TDD)

EDUCATION
University of Washington — B.S. in Computer Science (2016 - 2020)
`
  },
  {
    id: 'switcher-jason',
    name: 'Jason Miller',
    subtitle: 'Warehouse Lead → AI & Automation Transitioner',
    tag: 'Career Switcher',
    role: 'AI Engineer',
    company: 'Amazon',
    experienceLevel: 'Student / Fresher (0-1 yr)',
    github: 'jasonmiller-ai',
    resumeText: `JASON MILLER
Nashville, TN | jason.miller@email.com | github.com/jasonmiller-ai

SUMMARY
Operations and Logistics Lead with 3 years experience managing inventory systems, transitioning into AI engineering through rigorous practical coursework and Python scripting.

WORK EXPERIENCE
Amazon Fulfillment — Logistics & Inventory Lead (2021 - Present)
• Supervised facility operations and inventory tracking across 150,000 sq ft warehouse facility.
• Wrote custom Python scripts to parse daily shipment manifests and reconcile barcode discrepancies, saving 6 hours per week.
• Collaborated with IT teams to troubleshoot RF scanner network disconnects and warehouse management database syncing.

RECENT SELF-DIRECTED AI PROJECTS
Warehouse Inventory OCR Scanner (Python, OpenCV, Tesseract)
• Built an automated receipt and barcode OCR extraction tool in Python.
• Uses FastAPI to serve predictions and log recognized items into a SQLite database.

Fast.ai Practical Deep Learning Portfolio
• Fine-tuned pre-trained ResNet computer vision models on custom warehouse damage classification datasets (89% accuracy).
• Deployed interactive demo using HuggingFace Spaces and Gradio.

SKILLS & CERTIFICATIONS
Languages: Python, Basic SQL, Bash
Tools: Git, GitHub, VS Code, Google Colab, Pandas, OpenCV, FastAPI
Certifications: DeepLearning.AI Machine Learning Specialization, Fast.ai Practical Deep Learning for Coders
`
  }
];
