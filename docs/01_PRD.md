# DOCUMENT 1 — Product Requirement Document (PRD)

> **Product:** AutoApply AI  
> **Version:** 1.0.0-DRAFT  
> **Last Updated:** 2026-07-17  
> **Owner:** Product & Architecture Office  
> **Status:** Draft — Pending Stakeholder Review  

---

## 1. Executive Summary

AutoApply AI is a first-of-its-kind, AI-native career automation platform designed to fundamentally eliminate the manual drudgery of the job application lifecycle. Instead of treating job boards as passive listing directories, AutoApply AI transforms them into active pipelines, autonomously applying to suitable positions on behalf of the user — 24 hours a day, 7 days a week.

The platform ingests a user's career assets (resumes, cover letters, portfolios), securely links to their existing job-board accounts across both Indian domestic and international aggregators, and deploys a continuously running, multimodal AI agent. This agent scans new listings, intelligently matches them against the user's profile, fills out complex application forms (including custom questions, dynamic fields, and even CAPTCHA challenges), submits applications, and closes the feedback loop by analyzing labor-market signals to provide actionable skill-gap insights and resume improvement recommendations.

The value proposition is threefold:

| Stakeholder | Value |
|---|---|
| **Job Seekers** | 10× application throughput with higher quality, tailored applications — reclaiming hundreds of hours annually. |
| **AutoApply AI (Business)** | Subscription SaaS revenue with strong network effects as more aggregator integrations attract more users. |
| **Employers (Indirect)** | Higher-quality, better-matched applicant pools reducing noise in their ATS pipelines. |

---

## 2. Product Vision & Strategic Context

### 2.1 Vision Statement

> *"To make the act of applying for a job as effortless as subscribing to a feed — where the right opportunities find you, apply for you, and coach you on how to become even more competitive."*

### 2.2 Strategic Positioning

AutoApply AI occupies a new category at the intersection of three existing markets:

```
┌──────────────────────────────────────────────────────────┐
│                  AutoApply AI Category                    │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │  Job Board   │  │  AI Resume   │  │    RPA /      │  │
│   │  Aggregation │  │  Builders &  │  │  Workflow     │  │
│   │  (Indeed,    │  │  Optimizers  │  │  Automation   │  │
│   │   Naukri)    │  │  (Teal, etc) │  │  (UiPath)    │  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│          │                 │                 │           │
│          └────────────┬────┴────┬────────────┘           │
│                       │        │                         │
│              Unified Autonomous Agent                    │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Market Opportunity

| Metric | Data Point |
|---|---|
| Global online recruitment market (2026) | ~$43B (Grand View Research) |
| Indian online recruitment market (2026) | ~$3.5B |
| Average applications per job seeker (2025) | 100–200 across platforms |
| Average time per manual application | 15–25 minutes |
| Time savings per user (at 150 apps) | **37–62 hours** reclaimed |

### 2.4 Competitive Landscape

| Competitor | Limitation AutoApply AI Solves |
|---|---|
| LazyApply | Limited to LinkedIn; no AI-driven form understanding; no skill-gap feedback. |
| Sonara AI | US-centric; no Indian aggregator support; no credential vaulting architecture. |
| Simplify | Browser extension model — no server-side autonomy; requires user's browser open. |
| JobCopilot | Basic auto-fill; no multimodal AI for complex/dynamic forms. |

---

## 3. Objectives & Success Metrics (KPIs)

### 3.1 North Star Metric

> **Successful Applications Submitted per User per Month (SASPM)**  
> Target: ≥ 120 quality applications/month for an active user within 90 days of launch.

### 3.2 KPI Framework

| Category | KPI | Target (Month 6) | Target (Month 12) | Measurement Method |
|---|---|---|---|---|
| **Growth** | Monthly Active Users (MAU) | 10,000 | 75,000 | Analytics (Mixpanel) |
| **Growth** | Paid Conversion Rate (Free → Paid) | 8% | 14% | Stripe + Internal |
| **Engagement** | Applications Submitted / User / Week | 30 | 40 | Internal Telemetry |
| **Quality** | Application Success Rate (callback/interview) | 4% | 7% | User-reported + Parsing |
| **Quality** | AI Form-Fill Accuracy Rate | 92% | 97% | QA Sampling + User Reports |
| **Quality** | Skill-Gap Feedback Accuracy (user rating) | 3.8/5 | 4.3/5 | In-app NPS |
| **Retention** | D30 Retention Rate | 45% | 60% | Cohort Analysis |
| **Retention** | Monthly Churn Rate (Paid) | <8% | <5% | Stripe |
| **Reliability** | System Uptime (AI Engine) | 99.5% | 99.9% | Datadog/PagerDuty |
| **Reliability** | Aggregator Link Success Rate | 90% | 95% | Integration Monitoring |
| **Compliance** | Data Breach Incidents | 0 | 0 | SOC Audit + SIEM |
| **Efficiency** | Avg. Time from Job Detection → Submission | <5 min | <3 min | Pipeline Telemetry |

### 3.3 OKR Alignment (Q3 2026)

**Objective 1: Establish Product-Market Fit in the Indian Market**
- KR1: Achieve 5,000 MAU with ≥ 3 Indian aggregators live.
- KR2: Attain a D7 retention rate of ≥ 55%.
- KR3: Achieve an NPS of ≥ 40 among paid users.

**Objective 2: Prove AI Engine Reliability at Scale**
- KR1: Process ≥ 500,000 job applications with ≥ 91% form-fill accuracy.
- KR2: Maintain < 2% critical failure rate (application started but not submitted).
- KR3: Reduce average application lifecycle (detection → submission) to under 4 minutes.

**Objective 3: Build a Defensible Data & Intelligence Moat**
- KR1: Accumulate ≥ 1M parsed job descriptions for market-trend modeling.
- KR2: Deliver skill-gap feedback with ≥ 80% user-reported relevance.
- KR3: Train proprietary fine-tuned models on ≥ 100K application-form interaction traces.

---

## 4. Target Market & User Personas

### 4.1 Persona A: Domestic Job Seeker — "Priya"

| Attribute | Detail |
|---|---|
| **Name** | Priya Sharma |
| **Age** | 24 |
| **Location** | Pune, India |
| **Education** | B.Tech Computer Science, Tier-2 College |
| **Experience** | 1.5 years as a Junior Backend Developer |
| **Current Salary** | ₹5.5 LPA |
| **Target** | SDE-1 / Backend Developer roles, ₹8–12 LPA |
| **Platforms Used** | Naukri, LinkedIn India, Internshala, Foundit (Monster India) |
| **Pain Points** | Spends 2+ hours daily manually applying on Naukri; forgets which jobs she applied to; cover letters are generic copies; frustrated that her resume doesn't pass ATS filters; has no idea which skills to learn next for career growth. |
| **Tech Savviness** | Moderate — comfortable with web apps, not a power user. |
| **Goal** | "I want to apply to 50+ relevant jobs a day without it being my full-time job." |

**Priya's Emotional Journey:**
```
Hopeful → Overwhelmed → Fatigued → Disillusioned → [AutoApply AI] → Empowered → Confident
```

### 4.2 Persona B: International Job Seeker — "Marcus"

| Attribute | Detail |
|---|---|
| **Name** | Marcus Okonkwo |
| **Age** | 29 |
| **Location** | Lagos, Nigeria (targeting US, UK, Canada, Germany remote roles) |
| **Education** | MSc Data Science, University of Lagos |
| **Experience** | 4 years — Data Analyst → Senior Data Scientist |
| **Current Salary** | $24,000/year (local) |
| **Target** | Remote Senior Data Scientist roles, $90K–$140K USD |
| **Platforms Used** | Indeed, Glassdoor, ZipRecruiter, LinkedIn (Global), We Work Remotely, AngelList |
| **Pain Points** | Different application formats per platform; time zone challenges mean listings fill before he applies; sponsorship/visa filter confusion; cannot tailor cover letters for each country's market expectations; skill-gap anxiety about MLOps tools he hasn't used. |
| **Tech Savviness** | High — comfortable with technical tools. |
| **Goal** | "I need an agent that applies while I sleep, in the right time zones, with cover letters that sound local." |

### 4.3 Persona C: Career Switcher — "Anika"

| Attribute | Detail |
|---|---|
| **Name** | Anika Patel |
| **Age** | 32 |
| **Location** | Bangalore, India |
| **Education** | MBA Finance, IIM Indore |
| **Experience** | 7 years in Investment Banking → wants to transition to Product Management |
| **Current Salary** | ₹28 LPA |
| **Target** | PM roles at tech companies, ₹25–35 LPA |
| **Platforms Used** | Naukri, LinkedIn India, Instahyre, Cutshort, Indeed India |
| **Pain Points** | Her resume screams "finance" — she needs AI to reframe her experience for PM roles; doesn't know which PM-specific skills to emphasize; wastes time on listings that require 5+ years of pure PM experience; needs intelligent filtering. |
| **Tech Savviness** | Moderate-High |
| **Goal** | "Help me reposition my career narrative and only apply to roles where my transferable skills are valued." |

---

## 5. User Journeys

### 5.1 Domestic Job Seeker Journey (Priya)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRIYA'S END-TO-END JOURNEY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: ONBOARDING (Day 1, ~8 minutes)                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Signs up via Google OAuth (one-click)                         │   │
│  │ 2. Guided onboarding wizard:                                     │   │
│  │    a. Uploads resume (PDF/DOCX) — AI parses instantly            │   │
│  │    b. Reviews AI-extracted profile (skills, experience, edu)     │   │
│  │    c. Sets job preferences:                                      │   │
│  │       - Roles: Backend Developer, SDE-1                          │   │
│  │       - Locations: Pune, Bangalore, Hyderabad, Remote            │   │
│  │       - Salary: ₹8–12 LPA                                       │   │
│  │       - Experience Level: 1–3 years                              │   │
│  │    d. Uploads or generates cover letter template                 │   │
│  │ 3. Completes onboarding → Lands on Dashboard                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 2: AGGREGATOR LINKING (Day 1, ~5 minutes)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Navigates to Aggregator Matrix View                           │   │
│  │ 2. Sees Indian column: Naukri, LinkedIn India, Internshala,      │   │
│  │    Foundit, Instahyre, Shine, TimesJobs                          │   │
│  │ 3. Clicks "Connect" on Naukri:                                   │   │
│  │    a. Enters Naukri credentials in secure modal                  │   │
│  │    b. System validates login (headless browser test)             │   │
│  │    c. Status changes: 🔴 → 🟡 Verifying → 🟢 Connected         │   │
│  │ 4. Repeats for LinkedIn India and Foundit                        │   │
│  │ 5. Skips Internshala (not relevant for her level)                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 3: AI ENGINE ACTIVATION (Day 1, ~2 minutes)                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Reviews AI-recommended job search queries                     │   │
│  │ 2. Sets daily application limits:                                │   │
│  │    - Naukri: 25/day                                              │   │
│  │    - LinkedIn India: 15/day                                      │   │
│  │    - Foundit: 10/day                                             │   │
│  │ 3. Configures auto-apply rules:                                  │   │
│  │    - Minimum match score: 70%                                    │   │
│  │    - Exclude: Companies she's already worked at                  │   │
│  │    - Exclude: Listings requiring 5+ years experience             │   │
│  │ 4. Toggles "Start Applying" → AI Engine goes live               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 4: AUTONOMOUS OPERATION (Day 2+, ongoing)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. AI Engine runs continuously in background:                    │   │
│  │    a. Scans Naukri every 30 min for new Backend Dev listings     │   │
│  │    b. Scores each listing against Priya's profile (0–100)       │   │
│  │    c. For listings scoring ≥ 70:                                 │   │
│  │       - Generates tailored cover letter variant                  │   │
│  │       - Navigates to application page                            │   │
│  │       - Fills all fields (education, experience, salary, etc.)   │   │
│  │       - Handles custom questions via LLM inference               │   │
│  │       - Submits application                                      │   │
│  │       - Logs result in Activity Feed                             │   │
│  │ 2. Priya receives daily summary email at 8 PM IST:              │   │
│  │    "🎯 Applied to 38 roles today. 3 require your review."       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 5: FEEDBACK & GROWTH (Weekly)                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. AI Feedback Center populates weekly insights:                 │   │
│  │    - "72% of Backend Dev roles you match require Docker — you    │   │
│  │      list no Docker experience. Recommendation: Complete the     │   │
│  │      Docker Fundamentals course (link)."                         │   │
│  │    - "Your resume's 'Projects' section has a 23% lower keyword  │   │
│  │      match than successful applicants. Suggested rewrite: ..."   │   │
│  │ 2. Priya acts on feedback, updates resume in-app                 │   │
│  │ 3. AI Engine automatically uses updated resume for future apps   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 International Job Seeker Journey (Marcus)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   MARCUS'S END-TO-END JOURNEY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: ONBOARDING (Day 1, ~12 minutes)                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Signs up via Email + Password (Google OAuth less common       │   │
│  │    in his region)                                                │   │
│  │ 2. Uploads resume → AI parses and flags:                         │   │
│  │    ⚠ "Your resume uses Nigerian date format (DD/MM/YYYY).       │   │
│  │    US/UK employers expect MM/DD/YYYY or Month YYYY. Auto-fix?"  │   │
│  │ 3. Sets multi-region job preferences:                            │   │
│  │    - Roles: Senior Data Scientist, ML Engineer                   │   │
│  │    - Regions: US (Remote), UK (Remote), Canada, Germany          │   │
│  │    - Salary: $90K–$140K USD equivalent                           │   │
│  │    - Visa/Sponsorship: Required                                  │   │
│  │    - Work Authorization: Requires sponsorship (flagged)          │   │
│  │ 4. AI generates 3 cover letter variants:                         │   │
│  │    - US-market tone (results-driven, quantified impact)          │   │
│  │    - UK-market tone (collaborative, understated)                 │   │
│  │    - Germany-market tone (structured, qualification-heavy)       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 2: AGGREGATOR LINKING (Day 1, ~8 minutes)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Navigates to Aggregator Matrix View                           │   │
│  │ 2. Sees International column:                                    │   │
│  │    Indeed, Glassdoor, ZipRecruiter, LinkedIn (Global),           │   │
│  │    Monster, We Work Remotely, AngelList/Wellfound, Dice,         │   │
│  │    SimplyHired, CareerBuilder                                    │   │
│  │ 3. Connects: Indeed, Glassdoor, LinkedIn, ZipRecruiter           │   │
│  │ 4. Each connection validates with status indicators               │   │
│  │ 5. Notes: Indeed and Glassdoor share Recruit Holdings APIs —     │   │
│  │    system detects and optimizes shared session                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 3: AI ENGINE ACTIVATION (Day 1, ~3 minutes)                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Configures timezone-aware scanning:                           │   │
│  │    - US listings: Scan peak 8 AM – 10 AM EST                     │   │
│  │    - UK listings: Scan peak 9 AM – 11 AM GMT                     │   │
│  │ 2. Sets application limits:                                      │   │
│  │    - Indeed: 20/day                                              │   │
│  │    - LinkedIn: 10/day (Easy Apply prioritized)                   │   │
│  │    - ZipRecruiter: 15/day                                        │   │
│  │    - Glassdoor: 10/day                                           │   │
│  │ 3. Special rules:                                                │   │
│  │    - Only apply if "visa sponsorship" is not explicitly excluded │   │
│  │    - Auto-select "Willing to relocate" where applicable          │   │
│  │    - Match cover letter variant to posting's country             │   │
│  │ 4. Toggles "Start Applying"                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 4: AUTONOMOUS OPERATION (Day 2+, ongoing)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. AI applies while Marcus sleeps (WAT timezone advantage):      │   │
│  │    - 3 AM WAT: Scans US morning listings on Indeed               │   │
│  │    - Applies to 18 roles before Marcus wakes up                  │   │
│  │ 2. Handles complex international application nuances:            │   │
│  │    - US Indeed: Custom questions ("Years of Python?", "Willing   │   │
│  │      to undergo background check?") → LLM infers from resume    │   │
│  │    - UK Glassdoor: Right-to-work dropdown → selects "Requires   │   │
│  │      sponsorship"                                                │   │
│  │    - DE: Detects German-language fields → translates and fills   │   │
│  │ 3. Morning notification:                                         │   │
│  │    "🌍 Applied to 34 roles overnight (18 US, 9 UK, 7 CA).       │   │
│  │     2 flagged for manual review — require portfolio links."      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  PHASE 5: FEEDBACK & GROWTH (Weekly)                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. Market-specific insights:                                     │   │
│  │    - "US Data Scientist roles increasingly require MLOps.        │   │
│  │      85% of postings mention Kubeflow or MLflow — you list       │   │
│  │      neither. Recommendation: Add MLflow certification."         │   │
│  │    - "UK market values GDPR data governance skills.              │   │
│  │      Consider highlighting your privacy-aware pipeline work."    │   │
│  │ 2. Cross-market comparison dashboard:                            │   │
│  │    - "Your profile is 82% competitive for US roles, but only     │   │
│  │      67% for German roles (lacking German language skills)."     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Functional Requirements

### 6.1 FR-1: Asset Management (Resume & Cover Letter)

#### 6.1.1 Resume Ingestion & Parsing

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-1.1 | Multi-format upload | P0 | Accept PDF, DOCX, RTF, and TXT. Max file size: 10 MB. |
| FR-1.2 | Drag-and-drop upload | P0 | Browser-native drag-and-drop zone with visual feedback (progress bar, file type icon). |
| FR-1.3 | AI-powered resume parsing | P0 | Extract structured data: Name, Contact, Summary, Work Experience (company, title, dates, bullets), Education (institution, degree, dates, GPA), Skills (technical, soft), Certifications, Projects, Publications, Languages. Use a fine-tuned NER model (spaCy + custom transformer) backed by GPT-4o for ambiguous fields. |
| FR-1.4 | Parsed data review & edit | P0 | Interactive form showing all extracted fields. User can correct/amend before saving. Corrections feed back into model fine-tuning pipeline (with consent). |
| FR-1.5 | Multi-resume support | P1 | Users can store up to 5 resume variants (e.g., "Backend Focus", "Full-Stack Focus"). AI selects the best variant per application based on JD match scoring. |
| FR-1.6 | Resume version history | P1 | Git-style versioning — users can view diffs between resume versions and roll back. |
| FR-1.7 | ATS compatibility scoring | P0 | Score each resume variant against common ATS parsing engines (Taleo, Greenhouse, Lever, Workday) and flag formatting issues (e.g., tables, headers, graphics that ATS can't read). |

#### 6.1.2 Cover Letter Management

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-1.8 | Cover letter template upload | P0 | Accept same formats as resume. User provides a "base" cover letter. |
| FR-1.9 | AI cover letter generation | P0 | Given a JD and user profile, generate a tailored cover letter. Use GPT-4o with structured prompt: role summary, company context (scraped), user's top 3 matching experiences, and call to action. |
| FR-1.10 | Tone & market adaptation | P1 | Adapt cover letter tone based on target market (US: assertive/quantified; UK: collaborative; India: formal/respectful; Germany: structured/qualification-centric). |
| FR-1.11 | Cover letter approval modes | P0 | Three modes: (a) **Full Auto** — AI generates and submits without review; (b) **Review Queue** — AI generates, user approves before submission; (c) **Template Only** — use user's static template for all applications. |

#### 6.1.3 Asset Storage & Retrieval

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-1.12 | Secure document storage | P0 | Store original files in S3 (encrypted at rest, AES-256). Parsed structured data in PostgreSQL. |
| FR-1.13 | Instant retrieval | P0 | < 200ms latency for retrieving parsed profile data; < 2s for original document download. |
| FR-1.14 | Document deletion | P0 | GDPR-compliant hard delete with 30-day soft-delete window. Cascading delete of all derived data (parsed fields, embeddings, generated cover letters). |

---

### 6.2 FR-2: Aggregator Integration Matrix (Indian vs. International)

#### 6.2.1 Aggregator Taxonomy

The platform organizes job aggregators into two explicit columns, each with distinct integration characteristics:

**Indian Aggregators:**

| Aggregator | Integration Method | API Availability | Priority | Notes |
|---|---|---|---|---|
| **Naukri.com** | Browser Automation (Playwright) | No public API | P0 | Largest Indian job board. Complex multi-step forms. |
| **LinkedIn India** | API + Browser Hybrid | LinkedIn API (limited) | P0 | Easy Apply via API where possible; full applications via browser. |
| **Foundit (Monster India)** | Browser Automation | No public API | P1 | Standard form-based applications. |
| **Internshala** | Browser Automation | No public API | P1 | Internship/fresher focus. Simpler forms. |
| **Instahyre** | API | Recruiter API available | P1 | Invite-based platform; integration via profile push. |
| **Shine.com** | Browser Automation | No public API | P2 | HT Media property. Lower traffic but relevant for Tier-2 cities. |
| **TimesJobs** | Browser Automation | No public API | P2 | Times Group property. Legacy UI, requires careful DOM handling. |
| **Cutshort** | API | REST API available | P2 | Tech-focused. Skill-match model integration possible. |

**International Aggregators:**

| Aggregator | Integration Method | API Availability | Priority | Notes |
|---|---|---|---|---|
| **Indeed** | API + Browser Hybrid | Indeed Apply API | P0 | Largest global board. API for Easy Apply; browser for custom. |
| **LinkedIn (Global)** | API + Browser Hybrid | LinkedIn API (limited) | P0 | Shared infrastructure with Indian LinkedIn. |
| **ZipRecruiter** | API | Partner API available | P0 | Strong in US mid-market. One-click apply API. |
| **Glassdoor** | Browser Automation | No public API (Recruit Holdings) | P1 | Often redirects to company ATS — requires adaptive navigation. |
| **Monster (Global)** | Browser Automation | Legacy API (deprecated) | P1 | Legacy platform but still significant volume. |
| **We Work Remotely** | Browser Automation | No API | P1 | Remote-only listings. Simple forms. |
| **Wellfound (AngelList)** | API | REST API | P2 | Startup-focused. Profile-based matching. |
| **Dice** | Browser Automation | No public API | P2 | Tech/IT specialized. US-centric. |
| **SimplyHired** | Browser Automation | No API (Indeed-owned) | P2 | Aggregates from other sources. |
| **CareerBuilder** | API | Partner API | P2 | Legacy but relevant in certain US markets. |

#### 6.2.2 Aggregator Connection Flow

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-2.1 | Twin-column Matrix View | P0 | UI displays Indian and International aggregators in two distinct columns with visual separation. Each card shows: aggregator logo, name, connection status (🔴 Disconnected / 🟡 Verifying / 🟢 Connected / 🟠 Error), last sync timestamp, and application count. |
| FR-2.2 | Secure credential entry | P0 | Modal dialog for entering aggregator credentials. No credentials stored in browser (client-side). Encrypted transmission via TLS 1.3 → server-side encryption at rest via HashiCorp Vault. |
| FR-2.3 | Connection validation | P0 | Upon credential entry, system performs a headless login test. Success = 🟢; Failure = 🟠 with error message ("Invalid password", "CAPTCHA required — manual login needed", "Account locked"). |
| FR-2.4 | OAuth-based connection | P1 | For aggregators supporting OAuth (LinkedIn, some APIs), use OAuth flow instead of credential storage. Preferred over credential vaulting where available. |
| FR-2.5 | Connection health monitoring | P0 | Periodic (every 6 hours) background validation of all connected aggregators. Alert user if session expires or credentials become invalid. |
| FR-2.6 | Aggregator-specific configuration | P1 | Per-aggregator settings: daily application limit, job search queries, location filters, salary filters, exclusion lists (companies, keywords). |
| FR-2.7 | Bulk connect/disconnect | P2 | Select multiple aggregators and connect/disconnect in batch. |

#### 6.2.3 Aggregator Adapter Architecture

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-2.8 | Pluggable adapter pattern | P0 | Each aggregator is integrated via a standardized adapter interface (`IAggregatorAdapter`) with methods: `login()`, `searchJobs(query)`, `getJobDetails(jobId)`, `fillApplication(jobId, profile)`, `submitApplication(jobId)`, `getApplicationStatus(jobId)`. New aggregators can be added by implementing this interface. |
| FR-2.9 | Adapter registry & discovery | P1 | Central registry of available adapters with feature flags for enabling/disabling individual aggregators without deployment. |
| FR-2.10 | Rate limiting & throttling | P0 | Per-aggregator rate limits to avoid IP bans and ToS violations. Configurable delays between actions (e.g., 5–15s between page navigations on Naukri). |
| FR-2.11 | Proxy rotation | P0 | Residential proxy pool for browser automation to prevent IP-based blocking. Geo-matched proxies (Indian IPs for Indian aggregators, US IPs for US aggregators). |

---

### 6.3 FR-3: Autonomous Multimodal AI Applier Engine

This is the core differentiator. The AI Engine operates as a continuous autonomous agent that:

1. **Discovers** new job listings across all connected aggregators.
2. **Evaluates** each listing against the user's profile for fit.
3. **Prepares** application materials (tailored resume selection, cover letter generation).
4. **Navigates** to the application form (API or browser).
5. **Fills** all form fields intelligently.
6. **Submits** the completed application.
7. **Records** the outcome and updates the user's activity feed.

#### 6.3.1 Job Discovery & Scoring

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-3.1 | Continuous job scanning | P0 | Polling-based scan of each connected aggregator at configurable intervals (default: 30 min). Event-driven where APIs support webhooks. |
| FR-3.2 | Deduplication engine | P0 | Cross-aggregator deduplication using fuzzy matching on: job title + company name + location + posting date. Prevents applying to the same role on Indeed AND Glassdoor. Cosine similarity threshold: 0.92 on TF-IDF vectors of JD text. |
| FR-3.3 | Profile-Job matching score | P0 | Hybrid scoring model: (a) **Keyword match** — TF-IDF between resume and JD; (b) **Semantic match** — Cosine similarity of embedding vectors (OpenAI `text-embedding-3-large` or fine-tuned `bge-large-en-v1.5`); (c) **Structural match** — years of experience, education level, location, salary range. Weighted composite score 0–100. |
| FR-3.4 | Configurable match threshold | P0 | User sets minimum score for auto-apply (default: 70). Jobs scoring 50–69 go to "Review Queue". Jobs < 50 are silently discarded. |
| FR-3.5 | Exclusion rules engine | P1 | User-defined rules: exclude specific companies, keywords in title (e.g., "intern", "unpaid"), locations, and salary ranges below minimum. |
| FR-3.6 | Priority queue management | P1 | Higher-scoring jobs and newly posted jobs (< 2 hours old) are prioritized in the application queue. "Freshness boost" scoring factor. |

#### 6.3.2 Intelligent Form-Filling

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-3.7 | Form field detection | P0 | For browser-automated applications: DOM analysis to identify all form fields (input, select, textarea, radio, checkbox, file upload). Uses a combination of: (a) HTML label/name/id attribute matching; (b) ARIA label extraction; (c) Visual LLM (GPT-4o Vision) for ambiguous or image-based labels. |
| FR-3.8 | Field-to-profile mapping | P0 | Intelligent mapping of detected fields to user profile data. Example: "Years of relevant experience" → calculate from parsed work history. "Expected CTC" → user preference + aggregator-specific formatting (LPA for India, USD/year for US). |
| FR-3.9 | Custom question handling | P0 | For free-text questions (e.g., "Why do you want to work at [Company]?", "Describe a challenging project"), invoke LLM with context: user profile + JD + company info (scraped from About page). Generate contextually appropriate 100–200 word responses. |
| FR-3.10 | Dynamic field handling | P0 | Handle JavaScript-rendered forms, conditional fields (fields that appear based on previous selections), multi-step/paginated application flows, and AJAX-loaded content. Playwright's `waitForSelector` and `networkidle` strategies. |
| FR-3.11 | File upload handling | P0 | Automatically upload the selected resume variant and cover letter to file input fields. Handle drag-and-drop upload zones via Playwright's `setInputFiles()`. |
| FR-3.12 | CAPTCHA handling strategy | P0 | Tiered approach: (1) **reCAPTCHA v3** — attempt to maintain high trust score via realistic browsing patterns; (2) **reCAPTCHA v2 / hCaptcha** — integrate with a CAPTCHA-solving service (2Captcha, Anti-Captcha) as fallback; (3) **Unsolvable CAPTCHAs** — queue for user manual intervention with screenshot and deep link. |
| FR-3.13 | Application preview (optional) | P1 | Before submission, optionally capture a screenshot of the filled form and store for user review. Configurable per user (default: off for Full Auto mode, on for Review Queue mode). |

#### 6.3.3 Submission & Recording

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-3.14 | Submission confirmation detection | P0 | After clicking submit, detect success via: (a) URL change to confirmation page; (b) Success message in DOM ("Application submitted", "Thank you"); (c) Email confirmation detection (future). Retry logic: up to 2 retries on ambiguous outcomes. |
| FR-3.15 | Application record creation | P0 | For each application, record: job title, company, aggregator, timestamp, match score, resume variant used, cover letter (generated or template), form screenshot (if enabled), status (Submitted / Failed / Pending Review), failure reason (if applicable). |
| FR-3.16 | Failure handling & retry | P0 | Categorize failures: (a) **Retryable** — network timeout, session expired → auto-retry with backoff; (b) **Non-retryable** — application closed, duplicate detection by aggregator → log and skip; (c) **Manual intervention** — CAPTCHA, phone verification required → alert user. |
| FR-3.17 | Daily application summary | P0 | Aggregated daily report: total applied, per-aggregator breakdown, match score distribution, failures requiring attention. Delivered via email and in-app notification at user-configured time. |

---

### 6.4 FR-4: Market Analysis & Skill-Gap Feedback Loop

#### 6.4.1 Market Data Collection

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-4.1 | JD corpus ingestion | P0 | All scanned job descriptions (even those not applied to) are parsed and stored in a searchable corpus (Elasticsearch). Fields: title, company, location, skills required, experience range, salary range (if available), posting date, aggregator source. |
| FR-4.2 | Skill taxonomy extraction | P0 | NLP pipeline to extract and normalize skills from JDs into a canonical taxonomy (e.g., "React.js" / "ReactJS" / "React" → `react`). Use a pre-built taxonomy (ESCO, O*NET) augmented with custom tech skills. |
| FR-4.3 | Trend detection | P1 | Time-series analysis of skill demand: which skills are trending up/down in the user's target roles and regions over 30/60/90-day windows. |

#### 6.4.2 Personalized Feedback Engine

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-4.4 | Skill-gap analysis | P0 | Compare user's extracted skills against the top 20 most demanded skills in their target roles. Generate a gap matrix: "You have / You're missing / Frequency in JDs (%)". |
| FR-4.5 | Resume improvement suggestions | P0 | AI-generated, actionable suggestions: (a) Missing keywords to add; (b) Bullet points to rewrite for impact; (c) Sections to add/remove; (d) Formatting fixes for ATS compatibility. Each suggestion is linked to specific JD patterns. |
| FR-4.6 | Competitive positioning score | P1 | "You are more competitive than X% of applicants for [Role] in [Region]" — based on anonymized aggregate data from the platform's user base (requires sufficient scale). |
| FR-4.7 | Learning path recommendations | P1 | For each identified skill gap, recommend specific courses/certifications with links (Coursera, Udemy, official certifications). Prioritized by: gap severity × market demand × estimated completion time. |
| FR-4.8 | Interactive skill-gap charts | P0 | Radar chart showing user's skill coverage vs. market demand. Bar charts for trending skills. Drill-down to see which specific JDs drove each recommendation. |
| FR-4.9 | Weekly insight digest | P0 | Automated weekly email + in-app report: new trends, updated skill gaps, resume score changes, application success rate analysis. |

---

### 6.5 FR-5: Notification & Communication Engine

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-5.1 | In-app notification center | P0 | Bell icon with badge count. Notification types: application submitted, application failed, aggregator disconnected, new insights available, system announcements. |
| FR-5.2 | Email notifications | P0 | Transactional emails via SendGrid/SES: daily summaries, weekly insights, connection alerts, security alerts (new login, credential change). User-configurable frequency and opt-out. |
| FR-5.3 | Push notifications (mobile) | P2 | Future: mobile app push notifications for critical alerts (aggregator disconnected, interview callback detected). |
| FR-5.4 | WhatsApp/Telegram integration | P2 | Future: daily summary delivery via WhatsApp Business API or Telegram Bot (highly relevant for Indian market). |

---

### 6.6 FR-6: User Account & Subscription Management

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-6.1 | User registration & login | P0 | Email + password, Google OAuth, LinkedIn OAuth. |
| FR-6.2 | User profile management | P0 | Edit name, email, password, notification preferences, timezone, language preference. |
| FR-6.3 | Subscription tiers | P0 | **Free Tier:** 5 applications/day, 2 aggregators, basic skill-gap feedback. **Pro Tier ($29/mo):** Unlimited applications, all aggregators, full AI feedback, priority support. **Enterprise Tier (Custom):** Team dashboards, bulk user management, API access, dedicated support. |
| FR-6.4 | Payment integration | P0 | Stripe for international payments. Razorpay for Indian payments (UPI, Net Banking, Indian cards). |
| FR-6.5 | Usage dashboard | P1 | Real-time usage meters: applications used/remaining today, aggregators connected/available, storage used. |
| FR-6.6 | Account deletion | P0 | GDPR/DPDP-compliant account deletion with cascading purge of all personal data within 30 days. Confirmation email + 7-day grace period. |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Requirement | Rationale |
|---|---|---|
| **Dashboard load time** | < 1.5s (LCP) on 4G connection | Core Web Vitals compliance; user trust. |
| **Resume parsing latency** | < 8 seconds for a 3-page PDF | User expects near-instant feedback post-upload. |
| **Job scan cycle time** | < 2 minutes per aggregator per scan | 30-minute scan interval means < 2 min processing time. |
| **Application submission time** | < 90 seconds per application (browser automation) | Rate limiting compliance + throughput targets. |
| **API response time (95th %ile)** | < 300ms for read operations, < 500ms for writes | Standard SaaS performance expectations. |
| **Search latency (Elasticsearch)** | < 200ms for skill/JD queries | Interactive feedback center requires low latency. |
| **Concurrent users** | Support 10,000 concurrent active sessions at launch | Growth trajectory planning. |
| **AI Engine throughput** | Process 50 applications/min across all users (launch), scaling to 500/min (Month 12) | Directly tied to SASPM KPI. |

### 7.2 Scalability

| Dimension | Strategy |
|---|---|
| **Horizontal compute scaling** | Kubernetes (EKS) with Horizontal Pod Autoscaler (HPA) based on CPU/memory and custom metrics (queue depth). |
| **Database scaling** | PostgreSQL with read replicas (RDS) for read-heavy dashboards. Partitioning by `user_id` for application records. Future: Citus for horizontal sharding. |
| **Browser automation scaling** | Containerized Playwright instances (one per active application). Scale via Kubernetes Jobs with node pool auto-scaling. Max 200 concurrent browser instances at launch. |
| **Message queue scaling** | Apache Kafka with partition-based parallelism. Partition by `user_id` for ordered per-user processing. |
| **AI/LLM scaling** | Rate-limited LLM API calls (OpenAI, Anthropic) with request queuing and batching. Self-hosted models (vLLM on GPU instances) for high-volume tasks (skill extraction, JD parsing). |
| **Storage scaling** | S3 with lifecycle policies (move old application screenshots to Glacier after 90 days). Elasticsearch index lifecycle management (ILM). |

### 7.3 Availability & Disaster Recovery

| Metric | Target |
|---|---|
| **Overall SLA** | 99.9% uptime (< 8.76 hours downtime/year) |
| **AI Engine SLA** | 99.5% (allows for LLM provider outages with graceful degradation) |
| **RTO (Recovery Time Objective)** | < 1 hour |
| **RPO (Recovery Point Objective)** | < 5 minutes (continuous replication) |
| **Multi-AZ deployment** | All stateful services deployed across 3 AZs (AWS ap-south-1 for India, us-east-1 for international) |
| **Backup strategy** | Daily automated RDS snapshots (retained 30 days), hourly WAL archiving to S3, Vault data backed up to separate encrypted S3 bucket |
| **Failover** | Automated failover for RDS Multi-AZ, Kafka MirrorMaker for cross-region topic replication, DNS failover via Route 53 health checks |
| **Graceful degradation** | If AI Engine is down: queue applications, serve cached insights, show "AI temporarily unavailable" banner. If an aggregator is down: skip and retry; do not block other aggregators. |

### 7.4 Localization & Internationalization

| Requirement | Details |
|---|---|
| **Language support (Phase 1)** | English (US), English (India), Hindi |
| **Language support (Phase 2)** | German, French, Spanish, Portuguese, Arabic |
| **Currency localization** | Display pricing in user's local currency (INR, USD, EUR, GBP). Use Stripe/Razorpay's multi-currency support. |
| **Date/time formatting** | Respect user's locale settings. Store all timestamps in UTC; display in user's timezone. |
| **Resume/CL locale adaptation** | AI adapts generated content (date formats, spelling conventions, tone) to target market locale. |
| **i18n framework** | `react-i18next` with namespace-based translation files. ICU message format for pluralization and gender. |
| **RTL support** | Phase 2: Arabic/Hebrew RTL layout support via CSS logical properties. |

### 7.5 Accessibility

| Standard | Target |
|---|---|
| **WCAG compliance** | 2.1 Level AA |
| **Screen reader support** | Full ARIA labels on all interactive elements. Tested with NVDA and VoiceOver. |
| **Keyboard navigation** | All core workflows completable via keyboard alone. Focus management for modals and dynamic content. |
| **Color contrast** | Minimum 4.5:1 contrast ratio for body text, 3:1 for large text. |
| **Motion sensitivity** | Respect `prefers-reduced-motion` media query. Disable non-essential animations. |

---

## 8. Assumptions, Constraints & Dependencies

### 8.1 Assumptions

1. Job aggregators will not fundamentally change their application flows more frequently than once per quarter. The adapter maintenance team can update DOM selectors within 48 hours of detected breakage.
2. LLM API providers (OpenAI, Anthropic) will maintain current API availability and pricing within ±20% through the initial launch period.
3. Users are willing to entrust their aggregator credentials to a third-party platform, given sufficient security assurances and transparency.
4. Job aggregators' Terms of Service enforcement regarding automation varies; the platform will implement conservative rate limiting and human-like browsing patterns to minimize detection risk.

### 8.2 Constraints

1. **Legal/ToS Risk:** Automated application submission may violate certain aggregators' Terms of Service. Legal review required before launch. Mitigation: Present as "user-authorized agent" acting on their explicit behalf.
2. **LLM Cost:** At scale (500K applications/month), LLM API costs could reach $15K–$40K/month depending on token usage. Mitigation: Aggressive caching, prompt optimization, and migration to self-hosted models for repeatable tasks.
3. **Browser Automation Fragility:** DOM changes on aggregator websites can break automation. Mitigation: Visual regression testing, DOM fingerprinting, self-healing selectors, and dedicated adapter maintenance rotation.
4. **CAPTCHA Escalation:** Aggregators may increase CAPTCHA difficulty in response to automation. Mitigation: Multi-provider CAPTCHA solving, residential proxies, and user-fallback escalation.

### 8.3 Dependencies

| Dependency | Type | Risk Level | Mitigation |
|---|---|---|---|
| OpenAI API (GPT-4o) | External Service | Medium | Multi-provider LLM strategy (Anthropic Claude as fallback). Self-hosted vLLM for non-critical tasks. |
| AWS Infrastructure | External Service | Low | Multi-AZ deployment. DR plan for region failure. |
| Aggregator website stability | External | High | Adapter health monitoring, self-healing selectors, 48-hour SLA for adapter fixes. |
| Stripe / Razorpay | External Service | Low | Dual payment provider. Webhook-based reconciliation. |
| Residential proxy providers | External Service | Medium | Multi-provider (Bright Data, Oxylabs) with automatic failover. |
| CAPTCHA solving services | External Service | Medium | Multi-provider (2Captcha, Anti-Captcha). Budget-capped per-user. |

---

## 9. Release Strategy & Phasing

### Phase 0: Foundation (Weeks 1–6)

| Deliverable | Description |
|---|---|
| Infrastructure setup | AWS account, VPC, EKS cluster, RDS, S3, Vault, CI/CD pipeline. |
| Auth & user management | Registration, login, OAuth, profile management. |
| Core UI shell | Next.js app with navigation, design system, and empty views. |
| Resume upload & parsing | Upload flow + AI parsing pipeline (MVP accuracy). |

### Phase 1: Domestic MVP (Weeks 7–14)

| Deliverable | Description |
|---|---|
| Naukri adapter | Full login → search → apply → confirm cycle. |
| LinkedIn India adapter | Easy Apply via API + full application via browser. |
| AI Applier Engine (MVP) | Job scanning, scoring, form-filling, submission for 2 aggregators. |
| Activity Feed (basic) | Table view of submitted applications with status. |
| Skill-gap feedback (basic) | Top 10 missing skills based on scanned JDs. |

### Phase 2: International Expansion (Weeks 15–22)

| Deliverable | Description |
|---|---|
| Indeed adapter | Indeed Apply API + custom application browser flow. |
| ZipRecruiter adapter | API-based one-click apply. |
| Glassdoor adapter | Browser automation with ATS redirect handling. |
| Cover letter generation | AI-generated, market-adapted cover letters. |
| Aggregator Matrix View | Full twin-column UI with all connection management. |

### Phase 3: Intelligence Layer (Weeks 23–30)

| Deliverable | Description |
|---|---|
| Market trend analysis | Skill demand time-series, trending skills dashboard. |
| Resume improvement engine | AI-driven rewrite suggestions, ATS scoring. |
| Competitive positioning | Anonymized benchmarking against platform users. |
| Interactive feedback charts | Radar charts, bar charts, drill-down views. |
| Additional aggregators | Foundit, Internshala, Monster, Wellfound (4 new adapters). |

### Phase 4: Scale & Polish (Weeks 31–40)

| Deliverable | Description |
|---|---|
| Subscription & billing | Stripe + Razorpay integration, tier enforcement. |
| Email notification engine | Daily summaries, weekly insights, connection alerts. |
| Performance optimization | Caching, query optimization, browser pool tuning. |
| Remaining aggregators | Shine, TimesJobs, Dice, SimplyHired, CareerBuilder. |
| Mobile-responsive polish | Full responsive design validation across devices. |
| Security audit | Third-party pen test, SOC 2 Type I preparation. |

---

## 10. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **Aggregator** | A third-party job listing platform (e.g., Indeed, Naukri) where users create accounts and apply to jobs. |
| **Adapter** | A software module implementing the `IAggregatorAdapter` interface to integrate with a specific aggregator. |
| **AI Engine** | The autonomous agent system that scans, evaluates, fills, and submits job applications. |
| **JD** | Job Description — the text content of a job listing. |
| **Match Score** | A 0–100 composite score indicating how well a job listing matches a user's profile. |
| **ATS** | Applicant Tracking System — software used by employers to manage applications (e.g., Greenhouse, Lever, Workday). |
| **SASPM** | Successful Applications Submitted Per Month — the platform's North Star metric. |
| **DPDP Act** | Digital Personal Data Protection Act, 2023 — India's primary data protection legislation. |
| **RPA** | Robotic Process Automation — programmatic control of software via UI interaction (browser automation). |

### Appendix B: Referenced Standards & Regulations

- GDPR (EU) — General Data Protection Regulation (2016/679)
- DPDP Act (India) — Digital Personal Data Protection Act, 2023
- WCAG 2.1 — Web Content Accessibility Guidelines
- SOC 2 Type II — Service Organization Control (AICPA)
- ISO 27001 — Information Security Management
- OWASP Top 10 (2024) — Web Application Security Risks

### Appendix C: Competitive Feature Matrix

| Feature | AutoApply AI | LazyApply | Sonara | Simplify | JobCopilot |
|---|---|---|---|---|---|
| Multi-aggregator support | ✅ 16+ | ❌ LinkedIn only | ⚠️ 5 US boards | ⚠️ Browser ext. | ⚠️ Limited |
| Indian aggregator support | ✅ 8 boards | ❌ | ❌ | ❌ | ❌ |
| Server-side autonomous operation | ✅ | ❌ | ✅ | ❌ | ❌ |
| AI-generated cover letters | ✅ Market-adapted | ⚠️ Generic | ⚠️ Basic | ❌ | ⚠️ Basic |
| Multimodal form understanding | ✅ Vision LLM | ❌ | ❌ | ❌ | ❌ |
| Custom question handling (LLM) | ✅ | ❌ | ⚠️ Template | ❌ | ⚠️ Template |
| Skill-gap feedback | ✅ Interactive | ❌ | ❌ | ⚠️ Basic | ❌ |
| Market trend analysis | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cross-aggregator deduplication | ✅ | N/A | ⚠️ | ❌ | ❌ |
| Enterprise credential vaulting | ✅ HSM-backed | ❌ | ❌ | ❌ | ❌ |

---

> **📋 END OF DOCUMENT 1 — PRODUCT REQUIREMENT DOCUMENT**
>
> Type **"CONTINUE"** to generate **DOCUMENT 2: Technical Architecture Document (TAD)**.
