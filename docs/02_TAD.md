# DOCUMENT 2 — Technical Architecture Document (TAD)

> **Product:** AutoApply AI  
> **Version:** 1.0.0-DRAFT  
> **Last Updated:** 2026-07-17  
> **Owner:** Architecture Office  
> **Status:** Draft — Pending Engineering Review  

---

## 1. Architecture Philosophy & Guiding Principles

### 1.1 Core Tenets

The AutoApply AI architecture is governed by the following non-negotiable principles:

| # | Principle | Rationale |
|---|---|---|
| 1 | **Event-Driven First** | Job applications are inherently asynchronous, long-running workflows. Every state transition (job discovered → scored → queued → applied → confirmed) must be an event, enabling decoupled scaling, auditability, and replay. |
| 2 | **Adapter Isolation** | Each job aggregator is a volatile external dependency with unique DOM structures, APIs, and rate limits. Aggregator-specific logic must be completely isolated behind a stable adapter interface. A Naukri outage must never impact Indeed operations. |
| 3 | **Zero Trust for Credentials** | User aggregator credentials are the most sensitive data in the system. They must never exist in plaintext outside a Hardware Security Module (HSM)-backed vault. Even application services access credentials via short-lived, scoped tokens. |
| 4 | **Graceful Degradation** | The system must remain partially functional when any single dependency fails — LLM provider down, aggregator blocked, database read-replica lag. Users should always be able to view their dashboard and historical data. |
| 5 | **Observability as a Feature** | Every browser automation session, LLM call, and application submission must be traced end-to-end. Debugging a failed Naukri application at 3 AM IST must be possible from a single trace ID. |
| 6 | **Cost-Aware Scaling** | Browser instances and LLM tokens are expensive. The architecture must support intelligent batching, caching, and tiered compute (cheap for scanning, expensive for form-filling). |

### 1.2 Architecture Style

**Hybrid Microservices + Event-Driven Architecture (EDA)**

The system uses domain-driven microservices for business logic boundaries, connected by an event backbone (Apache Kafka) for asynchronous workflows. Synchronous communication (REST/gRPC) is used only for latency-sensitive, request-response interactions (e.g., dashboard API calls).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE PATTERN                            │
│                                                                         │
│   ┌──────────┐    Sync (gRPC/REST)    ┌──────────┐                     │
│   │ Frontend  │◄─────────────────────►│  API     │                     │
│   │ (Next.js) │                        │ Gateway  │                     │
│   └──────────┘                        └────┬─────┘                     │
│                                            │                            │
│                            ┌───────────────┼───────────────┐           │
│                            │               │               │           │
│                       ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐   │
│                       │  User   │    │  Asset    │   │ Aggregator │   │
│                       │ Service │    │  Service  │   │  Service   │   │
│                       └────┬────┘    └─────┬─────┘   └─────┬─────┘   │
│                            │               │               │           │
│                            ▼               ▼               ▼           │
│                  ┌─────────────────────────────────────────────┐       │
│                  │          Apache Kafka (Event Bus)           │       │
│                  │  Topics: jobs.discovered | jobs.scored |    │       │
│                  │  apps.queued | apps.submitted | ...         │       │
│                  └──────────────────┬──────────────────────────┘       │
│                                     │                                   │
│               ┌─────────────────────┼─────────────────────┐           │
│               │                     │                     │           │
│         ┌─────▼─────┐        ┌──────▼──────┐       ┌─────▼─────┐     │
│         │ AI Engine │        │  Feedback   │       │  Notif.   │     │
│         │ (Applier) │        │   Engine    │       │  Engine   │     │
│         └───────────┘        └─────────────┘       └───────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Topology

### 2.1 High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              AUTOAPPLY AI — SYSTEM TOPOLOGY                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────── CLIENT TIER ──────────────────────────────┐        │
│  │                                                                      │        │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐      │        │
│  │   │  Web App     │    │  Mobile Web  │    │  Email Client    │      │        │
│  │   │  (Next.js)   │    │  (Responsive)│    │  (Transactional) │      │        │
│  │   └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘      │        │
│  │          │                    │                      │                │        │
│  └──────────┼────────────────────┼──────────────────────┼────────────────┘        │
│             │                    │                      │                         │
│             ▼                    ▼                      │                         │
│  ┌──────────────────── EDGE / GATEWAY TIER ────────────────────────────┐         │
│  │                                                                      │         │
│  │   ┌──────────────────────────────────────────────────────────┐      │         │
│  │   │              CloudFront CDN + WAF                        │      │         │
│  │   │  (Static assets, DDoS protection, geo-routing)          │      │         │
│  │   └──────────────────────┬───────────────────────────────────┘      │         │
│  │                          │                                          │         │
│  │   ┌──────────────────────▼───────────────────────────────────┐      │         │
│  │   │           API Gateway (Kong / AWS API Gateway)           │      │         │
│  │   │  Rate limiting, JWT validation, request routing          │      │         │
│  │   └──────────────────────┬───────────────────────────────────┘      │         │
│  │                          │                                          │         │
│  └──────────────────────────┼──────────────────────────────────────────┘         │
│                             │                                                    │
│  ┌──────────────────── APPLICATION TIER (EKS) ─────────────────────────┐        │
│  │                          │                                          │         │
│  │  ┌──────────┐  ┌────────▼──────┐  ┌──────────┐  ┌──────────────┐  │         │
│  │  │  User    │  │  Asset       │  │Aggregator│  │  AI Engine   │  │         │
│  │  │  Service │  │  Service     │  │  Service │  │  Orchestrator│  │         │
│  │  │          │  │              │  │          │  │              │  │         │
│  │  │ • Auth   │  │ • Upload     │  │ • Config │  │ • Scanner    │  │         │
│  │  │ • Profile│  │ • Parse      │  │ • Health │  │ • Scorer     │  │         │
│  │  │ • Prefs  │  │ • Version    │  │ • Registry│ │ • Filler     │  │         │
│  │  │ • Billing│  │ • ATS Score  │  │          │  │ • Submitter  │  │         │
│  │  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬───────┘  │         │
│  │       │               │               │               │           │         │
│  │  ┌────▼───────────────▼───────────────▼───────────────▼────────┐  │         │
│  │  │               Apache Kafka (Event Backbone)                 │  │         │
│  │  │  Cluster: 6 brokers, 3 AZs | Retention: 7 days             │  │         │
│  │  └────┬───────────────┬───────────────┬───────────────┬────────┘  │         │
│  │       │               │               │               │           │         │
│  │  ┌────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐  ┌────▼────────┐ │         │
│  │  │ Feedback │  │ Notification│  │  Analytics │  │  Scheduler  │ │         │
│  │  │ Engine   │  │   Engine    │  │  Pipeline  │  │  (Temporal) │ │         │
│  │  └──────────┘  └─────────────┘  └────────────┘  └─────────────┘ │         │
│  │                                                                   │         │
│  └───────────────────────────────────────────────────────────────────┘         │
│                             │                                                    │
│  ┌──────────────────── AUTOMATION TIER ─────────────────────────────────┐       │
│  │                                                                      │       │
│  │  ┌──────────────────────────────────────────────────────────────┐   │       │
│  │  │           Browser Automation Pool (Playwright)               │   │       │
│  │  │  K8s Jobs | Containerized | Auto-scaling | Proxy-routed     │   │       │
│  │  │                                                              │   │       │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │       │
│  │  │  │Naukri   │ │LinkedIn │ │Indeed   │ │Glassdoor│  ...      │   │       │
│  │  │  │Adapter  │ │Adapter  │ │Adapter  │ │Adapter  │          │   │       │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │   │       │
│  │  └──────────────────────────────────────────────────────────────┘   │       │
│  │                                                                      │       │
│  │  ┌──────────────────────────────────────────────────────────────┐   │       │
│  │  │              Residential Proxy Layer                         │   │       │
│  │  │  Bright Data + Oxylabs | Geo-matched | Auto-rotation        │   │       │
│  │  └──────────────────────────────────────────────────────────────┘   │       │
│  │                                                                      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                             │                                                    │
│  ┌──────────────────── DATA TIER ───────────────────────────────────────┐       │
│  │                                                                      │       │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │       │
│  │  │ PostgreSQL │  │   Redis    │  │  S3      │  │ Elasticsearch  │  │       │
│  │  │  (RDS)     │  │ (ElastiC.) │  │          │  │  (OpenSearch)  │  │       │
│  │  │            │  │            │  │          │  │                │  │       │
│  │  │ • Users    │  │ • Sessions │  │ • Resumes│  │ • JD Corpus    │  │       │
│  │  │ • Profiles │  │ • Cache    │  │ • Cover  │  │ • Skill Index  │  │       │
│  │  │ • Apps     │  │ • Rate     │  │   Letters│  │ • Trend Data   │  │       │
│  │  │ • Billing  │  │   Limits   │  │ • Screen │  │                │  │       │
│  │  │            │  │ • Queues   │  │   shots  │  │                │  │       │
│  │  └────────────┘  └────────────┘  └──────────┘  └────────────────┘  │       │
│  │                                                                      │       │
│  │  ┌──────────────────────────────────────────────────────────────┐   │       │
│  │  │           HashiCorp Vault (Credential Vault)                 │   │       │
│  │  │  HSM-backed | Auto-rotation | Audit-logged                  │   │       │
│  │  └──────────────────────────────────────────────────────────────┘   │       │
│  │                                                                      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                             │                                                    │
│  ┌──────────────────── OBSERVABILITY TIER ──────────────────────────────┐       │
│  │                                                                      │       │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │       │
│  │  │ Datadog    │  │ OpenTele-  │  │ PagerDuty│  │    Grafana     │  │       │
│  │  │ (APM+Logs) │  │ metry      │  │ (Alerts) │  │ (Dashboards)   │  │       │
│  │  └────────────┘  └────────────┘  └──────────┘  └────────────────┘  │       │
│  │                                                                      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Deployment Regions

| Region | AWS Region | Purpose | Services Deployed |
|---|---|---|---|
| **India Primary** | `ap-south-1` (Mumbai) | Indian users, Indian aggregator automation | All services, Indian adapter pool, primary Vault |
| **US Primary** | `us-east-1` (N. Virginia) | International users, US/EU aggregator automation | All services, international adapter pool, Vault replica |
| **EU (Future)** | `eu-west-1` (Ireland) | GDPR data residency for EU users | User Service, Asset Service, Vault (EU shard) |

---

## 3. Service Catalog & Domain Decomposition

### 3.1 Domain Map

```
┌────────────────────────────────────────────────────────────────┐
│                    DOMAIN DECOMPOSITION                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │   IDENTITY &     │  │   CAREER ASSET  │  │  AGGREGATOR   │ │
│  │   ACCESS          │  │   MANAGEMENT    │  │  INTEGRATION  │ │
│  │                   │  │                 │  │               │ │
│  │  • User Service   │  │  • Asset Service│  │  • Aggregator │ │
│  │  • Auth Service   │  │  • Parser       │  │    Service    │ │
│  │  • Billing Service│  │    Pipeline     │  │  • Adapter    │ │
│  │                   │  │                 │  │    Registry   │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │  APPLICATION     │  │   INTELLIGENCE  │  │   PLATFORM    │ │
│  │  ENGINE          │  │   & FEEDBACK    │  │   SERVICES    │ │
│  │                  │  │                 │  │               │ │
│  │  • Scanner       │  │  • Feedback     │  │  • Notif.     │ │
│  │  • Scorer        │  │    Engine       │  │    Engine     │ │
│  │  • Form Filler   │  │  • Trend        │  │  • Scheduler  │ │
│  │  • Submitter     │  │    Analyzer     │  │  • Analytics  │ │
│  │  • Queue Manager │  │  • Skill        │  │  • File Store │ │
│  │                  │  │    Extractor    │  │               │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Service Catalog

| Service | Responsibility | Tech Stack | Communication | Data Store |
|---|---|---|---|---|
| **API Gateway** | Request routing, rate limiting, JWT validation, CORS | Kong on EKS (or AWS API Gateway) | Ingress → Services (REST/gRPC) | — |
| **User Service** | Registration, authentication, profile management, subscription/billing | Node.js (NestJS) + TypeScript | REST (sync) + Kafka (events) | PostgreSQL (users, profiles, subscriptions) |
| **Auth Service** | OAuth 2.0 / OIDC provider, MFA, session management, JWT issuance | Node.js (NestJS) + Passport.js | REST (sync) | PostgreSQL (auth) + Redis (sessions) |
| **Billing Service** | Stripe/Razorpay integration, plan enforcement, usage metering | Node.js (NestJS) + TypeScript | REST (sync) + Kafka (billing.events) | PostgreSQL (billing) |
| **Asset Service** | Resume/cover letter upload, storage, retrieval, version management | Node.js (NestJS) + TypeScript | REST (sync) + Kafka (asset.events) | PostgreSQL (metadata) + S3 (files) |
| **Parser Pipeline** | AI-powered resume parsing, NER extraction, structured data output | Python (FastAPI) + spaCy + GPT-4o | Kafka consumer (asset.uploaded → profile.parsed) | PostgreSQL (parsed profiles) |
| **Aggregator Service** | Aggregator configuration, connection management, health monitoring | Node.js (NestJS) + TypeScript | REST (sync) + Kafka (aggregator.events) | PostgreSQL (connections) + Vault (credentials) |
| **Adapter Registry** | Adapter discovery, feature flags, version management | Node.js (NestJS) + TypeScript | REST (sync) | PostgreSQL (registry) + Redis (feature flags) |
| **Scanner** | Job discovery — polls/scrapes aggregators for new listings | Python (FastAPI) + Playwright | Kafka producer (jobs.discovered) | Redis (scan state, dedup cache) |
| **Scorer** | Profile-job matching — computes match scores for discovered jobs | Python (FastAPI) + ML models | Kafka consumer/producer (jobs.discovered → jobs.scored) | Redis (embedding cache) + PostgreSQL (scores) |
| **Form Filler** | Intelligent form-filling — navigates and fills application forms | Python + Playwright + GPT-4o Vision | Kafka consumer (apps.queued → apps.filling) | Redis (session state) |
| **Submitter** | Application submission and confirmation detection | Python + Playwright | Kafka consumer/producer (apps.filling → apps.submitted) | PostgreSQL (application records) |
| **Queue Manager** | Priority queue for pending applications, throttling, daily limits | Node.js (NestJS) + BullMQ | Kafka consumer/producer + Redis (queues) | Redis (queues) + PostgreSQL (limits) |
| **Feedback Engine** | Skill-gap analysis, resume improvement suggestions, competitive scoring | Python (FastAPI) + GPT-4o | Kafka consumer (jobs.scored) + REST (sync reads) | Elasticsearch (JD corpus) + PostgreSQL (insights) |
| **Trend Analyzer** | Time-series skill demand analysis, market trend detection | Python (FastAPI) + Pandas/Polars | Kafka consumer (scheduled batch) | Elasticsearch + TimescaleDB (time-series) |
| **Skill Extractor** | NLP pipeline for extracting/normalizing skills from JDs | Python (FastAPI) + spaCy + custom NER | Kafka consumer (jobs.discovered → skills.extracted) | Elasticsearch (skill index) |
| **Notification Engine** | In-app, email, push notification dispatch | Node.js (NestJS) + TypeScript | Kafka consumer (notification.events) | PostgreSQL (notification log) + Redis (delivery state) |
| **Scheduler** | Cron-like job scheduling, workflow orchestration | Temporal.io (self-hosted on EKS) | Temporal workflows + Kafka triggers | Temporal persistence (PostgreSQL) |
| **Analytics Pipeline** | Event aggregation, KPI computation, dashboard data | Apache Flink (on EKS) | Kafka consumer → computed views | ClickHouse (OLAP) |
| **File Store Service** | Presigned URL generation, lifecycle management for S3 | Node.js (NestJS) | REST (sync) | S3 |

---

## 4. Data Flow & Pipeline — Application Lifecycle

### 4.1 End-to-End Application Lifecycle

The lifecycle of a single job application from detection to submission follows a precisely defined event-driven pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│              APPLICATION LIFECYCLE — EVENT-DRIVEN PIPELINE                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  STAGE 1: DISCOVERY                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Scheduler (Temporal)                                                    │  │
│  │      │                                                                   │  │
│  │      │ Triggers every 30 min per user per aggregator                     │  │
│  │      ▼                                                                   │  │
│  │  Scanner Service                                                         │  │
│  │      │                                                                   │  │
│  │      ├─── [API Path] ──► Calls Indeed/ZipRecruiter API                   │  │
│  │      │                   with user's search queries                      │  │
│  │      │                                                                   │  │
│  │      ├─── [Browser Path] ──► Launches Playwright container               │  │
│  │      │                       Logs into Naukri via Vault creds            │  │
│  │      │                       Executes search, scrapes results            │  │
│  │      │                                                                   │  │
│  │      ▼                                                                   │  │
│  │  Deduplication Check (Redis bloom filter + Elasticsearch fuzzy)          │  │
│  │      │                                                                   │  │
│  │      ▼                                                                   │  │
│  │  EMIT EVENT ──► Kafka: `jobs.discovered`                                 │  │
│  │  Payload: { jobId, aggregator, title, company, location,                │  │
│  │             jdText, jdUrl, postedAt, userId }                           │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 2: SKILL EXTRACTION                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Skill Extractor (Kafka Consumer: `jobs.discovered`)                     │  │
│  │      │                                                                   │  │
│  │      ├─── spaCy NER pipeline → extract raw skill mentions               │  │
│  │      ├─── Taxonomy mapper → normalize to canonical skills               │  │
│  │      ├─── Index into Elasticsearch (JD corpus)                          │  │
│  │      │                                                                   │  │
│  │      ▼                                                                   │  │
│  │  EMIT EVENT ──► Kafka: `jobs.enriched`                                   │  │
│  │  Payload: { ...jobData, skills: ["python", "docker", "k8s"],            │  │
│  │             experienceRange: {min: 2, max: 5}, salaryRange: {...} }     │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 3: SCORING                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Scorer Service (Kafka Consumer: `jobs.enriched`)                        │  │
│  │      │                                                                   │  │
│  │      ├─── Load user profile embedding (cached in Redis)                 │  │
│  │      ├─── Compute keyword match score (TF-IDF)            → weight: 0.3 │  │
│  │      ├─── Compute semantic match score (cosine similarity)→ weight: 0.4 │  │
│  │      ├─── Compute structural match score                  → weight: 0.3 │  │
│  │      │    (experience years, education level, location,                  │  │
│  │      │     salary alignment, exclusion rule check)                       │  │
│  │      ├─── Composite Score = Σ(weight × score) → 0–100                   │  │
│  │      │                                                                   │  │
│  │      ├─── IF score ≥ user.autoApplyThreshold (default 70):              │  │
│  │      │        EMIT ──► Kafka: `apps.queued`                              │  │
│  │      │                                                                   │  │
│  │      ├─── IF score ∈ [50, threshold):                                   │  │
│  │      │        EMIT ──► Kafka: `apps.review_needed`                       │  │
│  │      │        (appears in user's Review Queue UI)                        │  │
│  │      │                                                                   │  │
│  │      └─── IF score < 50:                                                │  │
│  │              Silently discard (log for analytics)                        │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 4: QUEUING & THROTTLING                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Queue Manager (Kafka Consumer: `apps.queued`)                           │  │
│  │      │                                                                   │  │
│  │      ├─── Check daily limit (per-user, per-aggregator)                  │  │
│  │      │    Redis: INCR `limits:{userId}:{aggregator}:{date}`             │  │
│  │      │                                                                   │  │
│  │      ├─── IF within limit:                                              │  │
│  │      │    ├── Priority scoring: (matchScore × 0.7) + (freshnessBoost   │  │
│  │      │    │   × 0.3)                                                    │  │
│  │      │    ├── Insert into BullMQ priority queue                         │  │
│  │      │    │   Queue: `apply:{aggregator}`                               │  │
│  │      │    └── Respect per-aggregator rate: min 30s between jobs         │  │
│  │      │                                                                   │  │
│  │      └─── IF limit exceeded:                                            │  │
│  │              Defer to next day (re-enqueue with tomorrow's timestamp)    │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 5: MATERIAL PREPARATION                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Form Filler — Preparation Phase (BullMQ Worker)                         │  │
│  │      │                                                                   │  │
│  │      ├─── Select best resume variant:                                   │  │
│  │      │    Compare each variant's embedding against JD embedding         │  │
│  │      │    Pick highest cosine similarity                                │  │
│  │      │                                                                   │  │
│  │      ├─── Generate cover letter (if mode ≠ Template Only):              │  │
│  │      │    ┌──────────────────────────────────────────────┐              │  │
│  │      │    │ LLM Prompt (GPT-4o):                        │              │  │
│  │      │    │  System: "You are a career coach writing a  │              │  │
│  │      │    │   cover letter for {user.name}..."          │              │  │
│  │      │    │  Context: {JD summary, company info,        │              │  │
│  │      │    │   user's top 3 matching experiences,         │              │  │
│  │      │    │   target market tone (US/UK/India/DE)}      │              │  │
│  │      │    │  Output: 200-300 word cover letter          │              │  │
│  │      │    └──────────────────────────────────────────────┘              │  │
│  │      │                                                                   │  │
│  │      ├─── IF cover letter mode == "Review Queue":                       │  │
│  │      │    EMIT ──► Kafka: `apps.pending_review`                         │  │
│  │      │    WAIT for user approval event                                  │  │
│  │      │                                                                   │  │
│  │      └─── ELSE: proceed to Stage 6                                      │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 6: FORM FILLING                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Form Filler — Execution Phase                                           │  │
│  │      │                                                                   │  │
│  │      ├─── Acquire Playwright container from K8s pool                    │  │
│  │      ├─── Configure proxy (geo-matched residential IP)                  │  │
│  │      ├─── Retrieve aggregator credentials from Vault                    │  │
│  │      │    (short-lived token, audit-logged)                              │  │
│  │      ├─── Login to aggregator (or reuse cached session cookie)          │  │
│  │      ├─── Navigate to job application URL                               │  │
│  │      │                                                                   │  │
│  │      ├─── Form Analysis Loop:                                           │  │
│  │      │    ┌─────────────────────────────────────────────┐               │  │
│  │      │    │ FOR each page/step of the application:      │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  1. Extract DOM snapshot (HTML + attributes) │               │  │
│  │      │    │  2. Identify form fields via:                │               │  │
│  │      │    │     a. Label/name/id heuristics             │               │  │
│  │      │    │     b. ARIA attribute extraction             │               │  │
│  │      │    │     c. GPT-4o Vision (screenshot → fields)  │               │  │
│  │      │    │        [fallback for ambiguous forms]       │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  3. Map fields to profile data:              │               │  │
│  │      │    │     field:"Years of experience" → calc(     │               │  │
│  │      │    │       today - earliest_work_date)            │               │  │
│  │      │    │     field:"Expected salary" → user.pref     │               │  │
│  │      │    │       + locale formatting (LPA/USD)         │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  4. Handle custom questions:                 │               │  │
│  │      │    │     Invoke GPT-4o with context:              │               │  │
│  │      │    │     {question, JD, profile, company_info}   │               │  │
│  │      │    │     Generate 100-200 word response           │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  5. Fill fields via Playwright:              │               │  │
│  │      │    │     page.fill(), page.selectOption(),        │               │  │
│  │      │    │     page.check(), page.setInputFiles()       │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  6. Handle dynamic fields:                   │               │  │
│  │      │    │     waitForSelector() after each fill        │               │  │
│  │      │    │     for conditional field appearance         │               │  │
│  │      │    │                                             │               │  │
│  │      │    │  7. Navigate to next page (if multi-step)    │               │  │
│  │      │    └─────────────────────────────────────────────┘               │  │
│  │      │                                                                   │  │
│  │      ├─── Handle CAPTCHA (if detected):                                 │  │
│  │      │    ├── reCAPTCHA v3: trust score check (usually passes)          │  │
│  │      │    ├── reCAPTCHA v2: send to 2Captcha API → inject token         │  │
│  │      │    └── Unsolvable: EMIT `apps.needs_manual` + screenshot         │  │
│  │      │                                                                   │  │
│  │      ├─── IF screenshot mode enabled: capture pre-submit screenshot     │  │
│  │      │                                                                   │  │
│  │      ▼                                                                   │  │
│  │  EMIT EVENT ──► Kafka: `apps.filled`                                     │  │
│  │  Payload: { appId, filledFields: [...], screenshotUrl, duration }       │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 7: SUBMISSION & CONFIRMATION                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Submitter Service (continues in same Playwright session)                │  │
│  │      │                                                                   │  │
│  │      ├─── Click submit button                                           │  │
│  │      │    (identified via: text content, button type, ARIA role)         │  │
│  │      │                                                                   │  │
│  │      ├─── Confirmation Detection:                                       │  │
│  │      │    ├── Check URL change (contains "success", "confirm", "thank") │  │
│  │      │    ├── DOM scan for success message patterns                      │  │
│  │      │    ├── Check for error message patterns                          │  │
│  │      │    └── Timeout after 15s → ambiguous                             │  │
│  │      │                                                                   │  │
│  │      ├─── IF confirmed:                                                 │  │
│  │      │    EMIT ──► Kafka: `apps.submitted`                               │  │
│  │      │    {appId, status: "SUBMITTED", confirmedAt, evidence: {url,     │  │
│  │      │     screenshotUrl, confirmationText}}                             │  │
│  │      │                                                                   │  │
│  │      ├─── IF failed:                                                    │  │
│  │      │    ├── Retryable error: re-enqueue with backoff (max 2 retries)  │  │
│  │      │    └── Non-retryable: EMIT `apps.failed`                         │  │
│  │      │                                                                   │  │
│  │      └─── Release Playwright container back to pool                     │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                              │                                                 │
│                              ▼                                                 │
│  STAGE 8: RECORDING & NOTIFICATION                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Application Record Writer (Kafka Consumer: `apps.submitted`)            │  │
│  │      │                                                                   │  │
│  │      ├─── Write to PostgreSQL: application_records table                │  │
│  │      │    {id, userId, jobId, aggregator, matchScore,                    │  │
│  │      │     resumeVariantId, coverLetterText, status,                     │  │
│  │      │     submittedAt, screenshotUrl, failureReason}                    │  │
│  │      │                                                                   │  │
│  │      ├─── Update Activity Feed (WebSocket push to connected clients)     │  │
│  │      │                                                                   │  │
│  │      └─── Emit to Notification Engine:                                  │  │
│  │           ├── In-app notification (real-time via WebSocket)              │  │
│  │           ├── Aggregate for daily email summary                         │  │
│  │           └── Increment analytics counters (ClickHouse)                 │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Event Schema Registry

All events are serialized using **Apache Avro** with a centralized schema registry (Confluent Schema Registry) for backward-compatible evolution.

| Topic | Key | Partition Strategy | Retention | Consumers |
|---|---|---|---|---|
| `jobs.discovered` | `{userId}:{aggregator}` | By userId | 48 hours | Skill Extractor, Analytics |
| `jobs.enriched` | `{userId}:{jobId}` | By userId | 48 hours | Scorer |
| `jobs.scored` | `{userId}:{jobId}` | By userId | 7 days | Queue Manager, Feedback Engine, Analytics |
| `apps.queued` | `{userId}:{appId}` | By aggregator | 7 days | Queue Manager |
| `apps.review_needed` | `{userId}:{appId}` | By userId | 7 days | Notification Engine, User Service |
| `apps.filling` | `{appId}` | By aggregator | 24 hours | Form Filler (internal state) |
| `apps.filled` | `{appId}` | By aggregator | 24 hours | Submitter |
| `apps.submitted` | `{userId}:{appId}` | By userId | 30 days | Record Writer, Notification Engine, Analytics |
| `apps.failed` | `{userId}:{appId}` | By userId | 30 days | Record Writer, Notification Engine, Retry Handler |
| `apps.needs_manual` | `{userId}:{appId}` | By userId | 7 days | Notification Engine |
| `notification.events` | `{userId}` | By userId | 7 days | Notification Engine |
| `aggregator.health` | `{aggregator}` | By aggregator | 7 days | Aggregator Service, Alerting |
| `billing.events` | `{userId}` | By userId | 90 days | Billing Service, Analytics |

### 4.3 Data Flow Summary Diagram

```
                    ┌─────────┐
                    │  User   │
                    │ Browser │
                    └────┬────┘
                         │ HTTPS
                         ▼
                    ┌─────────┐     ┌──────────┐
                    │   CDN   │────►│   WAF    │
                    └────┬────┘     └──────────┘
                         │
                         ▼
                    ┌──────────┐
                    │   API    │ ◄──── JWT Auth
                    │ Gateway  │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
       ┌────────┐  ┌──────────┐  ┌──────────┐
       │  User  │  │  Asset   │  │Aggregator│
       │  Svc   │  │   Svc    │  │   Svc    │
       └───┬────┘  └────┬─────┘  └────┬─────┘
           │            │             │
           ▼            ▼             ▼
     ┌──────────────────────────────────────┐
     │           Kafka Event Bus            │
     └──────┬────────┬────────┬────────┬────┘
            │        │        │        │
            ▼        ▼        ▼        ▼
       ┌────────┐┌───────┐┌───────┐┌────────┐
       │Scanner ││Scorer ││Filler ││Feedback│
       └───┬────┘└───┬───┘└───┬───┘└───┬────┘
           │         │        │        │
           ▼         ▼        ▼        ▼
     ┌──────────────────────────────────────┐
     │         Data Tier                     │
     │  PostgreSQL | Redis | S3 | ES | Vault│
     └──────────────────────────────────────┘
```

---

## 5. AI Engine Architecture

The AI Engine is the most complex and differentiating component of AutoApply AI. It comprises four sub-systems that work in concert.

### 5.1 Multimodal Form Processor

The Form Processor must handle the full spectrum of web application forms encountered across 16+ aggregators:

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTIMODAL FORM PROCESSOR ARCHITECTURE             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: Application page URL + User profile + Selected resume   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                LAYER 1: DOM ANALYZER                       │  │
│  │                                                           │  │
│  │  Playwright page.content() → full DOM tree                │  │
│  │                                                           │  │
│  │  Field Detection Strategies (in priority order):          │  │
│  │                                                           │  │
│  │  1. Explicit Labels:                                      │  │
│  │     <label for="exp">Years of Experience</label>          │  │
│  │     <input id="exp" type="number"/>                       │  │
│  │     → Mapping: {field: "exp", label: "Years of Exp...",   │  │
│  │                  type: "number", required: true}           │  │
│  │                                                           │  │
│  │  2. ARIA Attributes:                                      │  │
│  │     <input aria-label="Expected Salary" type="text"/>     │  │
│  │     → Mapping: {field: auto, label: "Expected Salary",   │  │
│  │                  type: "text"}                             │  │
│  │                                                           │  │
│  │  3. Placeholder/Name Heuristics:                          │  │
│  │     <input name="current_ctc" placeholder="CTC in LPA"/> │  │
│  │     → Mapping: {field: "current_ctc", label: "CTC",      │  │
│  │                  type: "text", hint: "LPA format"}        │  │
│  │                                                           │  │
│  │  4. Structural Analysis:                                  │  │
│  │     <div class="field-group">                             │  │
│  │       <span>Notice Period</span>                          │  │
│  │       <select>...</select>                                │  │
│  │     </div>                                                │  │
│  │     → Parent text + child input correlation               │  │
│  │                                                           │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│            ┌─────────────┴─────────────┐                       │
│            │ Confidence < 80%?         │                       │
│            │ Ambiguous fields exist?   │                       │
│            └─────────┬─────────────────┘                       │
│                      │ YES                                     │
│                      ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LAYER 2: VISION LLM FALLBACK                 │  │
│  │                                                           │  │
│  │  1. Capture screenshot of form section                    │  │
│  │  2. Send to GPT-4o Vision API:                            │  │
│  │     Prompt: "Identify all form fields in this image.      │  │
│  │     For each field, provide: label, type (text/select/    │  │
│  │     radio/checkbox/file), options (if select/radio),      │  │
│  │     and whether it's required."                           │  │
│  │  3. Merge Vision results with DOM analysis                │  │
│  │  4. Resolve conflicts (DOM takes priority for             │  │
│  │     interaction, Vision for labeling)                     │  │
│  │                                                           │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LAYER 3: INTELLIGENT MAPPER                   │  │
│  │                                                           │  │
│  │  Field-to-Profile Mapping Engine:                         │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ RULE-BASED MAPPINGS (fast, deterministic):          │  │  │
│  │  │                                                     │  │  │
│  │  │  "first name"        → profile.firstName            │  │  │
│  │  │  "email"             → profile.email                │  │  │
│  │  │  "phone"             → profile.phone                │  │  │
│  │  │  "years of exp"      → calc(today - firstJobDate)   │  │  │
│  │  │  "current salary"    → profile.currentSalary        │  │  │
│  │  │  "expected salary"   → profile.targetSalary         │  │  │
│  │  │  "notice period"     → profile.noticePeriod         │  │  │
│  │  │  "location"          → profile.preferredLocations   │  │  │
│  │  │  "linkedin url"      → profile.linkedinUrl          │  │  │
│  │  │  "resume"            → selectedResumeFile           │  │  │
│  │  │  "cover letter"      → generatedCoverLetterFile     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ LLM-BASED MAPPINGS (for ambiguous/custom fields):   │  │  │
│  │  │                                                     │  │  │
│  │  │  "Why are you interested in this role?"             │  │  │
│  │  │    → GPT-4o(profile + JD + company_info)            │  │  │
│  │  │                                                     │  │  │
│  │  │  "Describe a time you led a cross-functional team"  │  │  │
│  │  │    → GPT-4o(profile.experiences + JD requirements)  │  │  │
│  │  │                                                     │  │  │
│  │  │  "Are you authorized to work in [Country]?"         │  │  │
│  │  │    → profile.workAuthorization[country]             │  │  │
│  │  │                                                     │  │  │
│  │  │  "What is your expected start date?"                │  │  │
│  │  │    → calc(today + profile.noticePeriod + 7 days)    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LAYER 4: FORM EXECUTOR                        │  │
│  │                                                           │  │
│  │  Sequential field filling with human-like behavior:       │  │
│  │                                                           │  │
│  │  • Typing: Char-by-char with random 50-150ms delays      │  │
│  │  • Clicks: Random offset within element bounds            │  │
│  │  • Tab navigation: Mix of click and tab-key transitions   │  │
│  │  • Scroll: Natural scroll before interacting with         │  │
│  │    off-screen elements                                    │  │
│  │  • Pauses: 1-3s "thinking" delays between sections        │  │
│  │  • Mouse movement: Bezier curve paths (not linear)        │  │
│  │                                                           │  │
│  │  After each field: waitForSelector(2s) for dynamic        │  │
│  │  field appearance / conditional logic triggers             │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  OUTPUT: Fully filled form ready for submission                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 LLM Orchestration & Token Management

Managing LLM costs and latency is critical at scale. The architecture uses a tiered LLM strategy:

```
┌─────────────────────────────────────────────────────────────────┐
│                LLM ORCHESTRATION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  LLM ROUTER SERVICE                        │  │
│  │                                                           │  │
│  │  Receives LLM request with:                               │  │
│  │  • Task type (cover_letter | custom_question | form_      │  │
│  │    analysis | skill_extraction | resume_improvement)      │  │
│  │  • Priority (real-time | batch)                           │  │
│  │  • Estimated token count                                  │  │
│  │  • User tier (free | pro | enterprise)                    │  │
│  │                                                           │  │
│  │  Routing Decision Matrix:                                 │  │
│  │  ┌─────────────────┬──────────────┬──────────────────┐   │  │
│  │  │ Task Type       │ Model        │ Fallback          │   │  │
│  │  ├─────────────────┼──────────────┼──────────────────┤   │  │
│  │  │ Cover letter    │ GPT-4o       │ Claude 3.5 Sonnet│   │  │
│  │  │ Custom question │ GPT-4o       │ Claude 3.5 Sonnet│   │  │
│  │  │ Form analysis   │ GPT-4o Vision│ Gemini 1.5 Pro   │   │  │
│  │  │ Skill extract.  │ Self-hosted  │ GPT-4o-mini      │   │  │
│  │  │                 │ (vLLM/Llama) │                   │   │  │
│  │  │ Resume parsing  │ Self-hosted  │ GPT-4o-mini      │   │  │
│  │  │                 │ (vLLM/Llama) │                   │   │  │
│  │  │ Resume improve  │ GPT-4o       │ Claude 3.5 Sonnet│   │  │
│  │  │ JD summarize    │ GPT-4o-mini  │ Self-hosted      │   │  │
│  │  └─────────────────┴──────────────┴──────────────────┘   │  │
│  │                                                           │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              TOKEN BUDGET MANAGER                          │  │
│  │                                                           │  │
│  │  Per-User Token Budgets:                                  │  │
│  │  • Free tier:       50,000 tokens/day                     │  │
│  │  • Pro tier:        500,000 tokens/day                    │  │
│  │  • Enterprise tier: 2,000,000 tokens/day                  │  │
│  │                                                           │  │
│  │  Budget Tracking: Redis sorted sets                       │  │
│  │  Key: `tokens:{userId}:{date}`                            │  │
│  │  Enforcement: Pre-check before LLM call; reject with      │  │
│  │  "Daily AI limit reached" if exceeded                     │  │
│  │                                                           │  │
│  │  Cost Optimization Strategies:                            │  │
│  │  • Prompt caching: Hash(systemPrompt) → skip repeated    │  │
│  │    system prompts via OpenAI cached-prompt feature         │  │
│  │  • Response caching: Hash(JD + question) → Redis          │  │
│  │    (TTL: 24h) for identical custom questions across users │  │
│  │  • Prompt compression: Strip HTML, truncate JDs to 2000   │  │
│  │    tokens, summarize before sending to LLM                │  │
│  │  • Batch processing: Aggregate skill extraction requests  │  │
│  │    and process in batches of 10 JDs per LLM call          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              SELF-HOSTED MODEL CLUSTER                     │  │
│  │                                                           │  │
│  │  Infrastructure: AWS g5.2xlarge instances (NVIDIA A10G)   │  │
│  │  Serving: vLLM (continuous batching, PagedAttention)      │  │
│  │  Model: Llama 3.1 8B (fine-tuned on skill extraction      │  │
│  │         and resume parsing tasks)                         │  │
│  │                                                           │  │
│  │  Capacity:                                                │  │
│  │  • 2 GPU instances (ap-south-1) for Indian workload       │  │
│  │  • 2 GPU instances (us-east-1) for international workload │  │
│  │  • Auto-scaling: 1–4 instances based on queue depth       │  │
│  │                                                           │  │
│  │  Use Cases (high-volume, lower-complexity):               │  │
│  │  • Skill extraction from JDs (~80% of LLM calls)         │  │
│  │  • Resume section parsing                                 │  │
│  │  • JD summarization                                       │  │
│  │  • Deduplication similarity scoring                       │  │
│  │                                                           │  │
│  │  Cost Savings vs. API:                                    │  │
│  │  • API cost at 1M calls/day: ~$8,000/day                 │  │
│  │  • Self-hosted cost at 1M calls/day: ~$800/day            │  │
│  │  • 10× cost reduction for eligible workloads              │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 CAPTCHA Resolution Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                 CAPTCHA RESOLUTION PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAPTCHA Detected During Form Filling                           │
│      │                                                          │
│      ▼                                                          │
│  ┌───────────────────────────────────────┐                     │
│  │ CLASSIFIER: Identify CAPTCHA type     │                     │
│  │                                       │                     │
│  │ • reCAPTCHA v3 (invisible)            │                     │
│  │ • reCAPTCHA v2 (checkbox / image)     │                     │
│  │ • hCaptcha                            │                     │
│  │ • FunCaptcha (Arkose Labs)            │                     │
│  │ • Text/Math CAPTCHA                   │                     │
│  │ • Custom/Unknown                      │                     │
│  └───────────┬───────────────────────────┘                     │
│              │                                                  │
│     ┌────────┴────────────────┬───────────────────┐            │
│     ▼                        ▼                    ▼            │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ reCAPTCHA   │  │ reCAPTCHA v2 /   │  │ Unknown /       │  │
│  │ v3          │  │ hCaptcha /       │  │ Unsolvable      │  │
│  │             │  │ FunCaptcha       │  │                 │  │
│  │ Strategy:   │  │                  │  │ Strategy:       │  │
│  │ • Human-like│  │ Strategy:        │  │ • Screenshot    │  │
│  │   browsing  │  │ • Primary:       │  │ • Alert user    │  │
│  │   patterns  │  │   2Captcha API   │  │ • Provide deep  │  │
│  │ • Maintain  │  │ • Fallback:      │  │   link to       │  │
│  │   high trust│  │   Anti-Captcha   │  │   application   │  │
│  │   score     │  │ • Timeout: 60s   │  │ • Mark as       │  │
│  │ • Usually   │  │ • Cost: $2-3/    │  │   NEEDS_MANUAL  │  │
│  │   passes    │  │   1000 solves    │  │                 │  │
│  │   silently  │  │ • Inject token   │  │                 │  │
│  │             │  │   via JS eval    │  │                 │  │
│  └─────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                 │
│  Budget Controls:                                               │
│  • Max CAPTCHA spend per user per day: $2.00                   │
│  • Max CAPTCHA attempts per application: 3                      │
│  • If budget exceeded: queue for manual intervention            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Dynamic Field & Custom Question Handling

```
┌─────────────────────────────────────────────────────────────────┐
│          DYNAMIC FIELD & CUSTOM QUESTION ARCHITECTURE           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DYNAMIC FIELDS (JavaScript-rendered, conditional):             │
│                                                                 │
│  Detection Strategy:                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  1. PRE-FILL SCAN: Snapshot DOM field count (N₁)          │  │
│  │  2. FILL EACH FIELD: After filling, wait 2s               │  │
│  │  3. POST-FILL SCAN: Snapshot DOM field count (N₂)         │  │
│  │  4. IF N₂ > N₁: New conditional fields appeared           │  │
│  │     → Re-run field detection on new elements only         │  │
│  │     → Map and fill new fields                             │  │
│  │  5. REPEAT until N₂ == N₁ (no new fields)                │  │
│  │                                                           │  │
│  │  Multi-Step Form Handling:                                │  │
│  │  • Detect "Next" / "Continue" buttons                     │  │
│  │  • Click and wait for new page/section                    │  │
│  │  • Re-run full field detection pipeline on new section    │  │
│  │  • Track step count to detect infinite loops (max: 10)    │  │
│  │                                                           │  │
│  │  AJAX Content:                                            │  │
│  │  • Intercept network requests via page.route()            │  │
│  │  • Wait for relevant XHR/fetch to complete                │  │
│  │  • Parse response for new field data                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  CUSTOM QUESTION HANDLING:                                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Question Classification:                                 │  │
│  │                                                           │  │
│  │  TYPE A — Factual/Profile-Based (No LLM needed):          │  │
│  │  • "Are you authorized to work in the US?" → Yes/No      │  │
│  │  • "Years of Python experience?" → calc from profile      │  │
│  │  • "Are you willing to relocate?" → user preference       │  │
│  │  • "Do you have a valid driver's license?" → profile      │  │
│  │  Approach: Rule engine with regex pattern matching         │  │
│  │            on question text → profile field lookup         │  │
│  │                                                           │  │
│  │  TYPE B — Behavioral/Narrative (LLM Required):            │  │
│  │  • "Why do you want to work at [Company]?"                │  │
│  │  • "Describe a project where you used [Skill]"            │  │
│  │  • "What's your biggest professional achievement?"        │  │
│  │  Approach: GPT-4o with structured context window:         │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ SYSTEM: You are writing answers for a job       │     │  │
│  │  │ application on behalf of {name}. Be concise     │     │  │
│  │  │ (100-200 words), specific, and professional.    │     │  │
│  │  │                                                 │     │  │
│  │  │ USER PROFILE: {parsed resume summary, key       │     │  │
│  │  │ experiences, skills, achievements}              │     │  │
│  │  │                                                 │     │  │
│  │  │ JOB DESCRIPTION: {title, company, key           │     │  │
│  │  │ requirements, responsibilities}                 │     │  │
│  │  │                                                 │     │  │
│  │  │ COMPANY CONTEXT: {about page summary,           │     │  │
│  │  │ mission, recent news — scraped}                 │     │  │
│  │  │                                                 │     │  │
│  │  │ QUESTION: {actual question text}                │     │  │
│  │  │                                                 │     │  │
│  │  │ Answer in first person as {name}.               │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  │  TYPE C — Salary/Negotiation Questions:                   │  │
│  │  • "Expected salary range?"                               │  │
│  │  • "Minimum acceptable compensation?"                     │  │
│  │  Approach: Use user's configured salary preferences       │  │
│  │            with locale formatting (₹ LPA / $K/year)       │  │
│  │            Apply configurable negotiation buffer (+10%)    │  │
│  │                                                           │  │
│  │  Caching: Hash(question_normalized + job_category)        │  │
│  │           → Redis cache (TTL: 7 days)                     │  │
│  │           Reuse answers for semantically identical         │  │
│  │           questions across different aggregators           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Strategy

### 6.1 API-First Integrations

For aggregators with official APIs, the integration is straightforward:

| Aggregator | API Type | Auth Method | Key Endpoints | Rate Limits |
|---|---|---|---|---|
| **Indeed** | REST (Indeed Apply) | OAuth 2.0 (Partner) | `POST /applications`, `GET /jobs/search` | 50 req/min |
| **LinkedIn** | REST (LinkedIn API v2) | OAuth 2.0 (3-legged) | `POST /easy-apply`, `GET /jobs/search` | Varies by token |
| **ZipRecruiter** | REST (Partner API) | API Key + OAuth | `POST /apply`, `GET /jobs` | 100 req/min |
| **Instahyre** | REST | API Key | `POST /profile`, `GET /invitations` | 30 req/min |
| **Cutshort** | REST | API Key | `POST /apply`, `GET /jobs/match` | 60 req/min |
| **Wellfound** | REST | OAuth 2.0 | `POST /applications`, `GET /startups/jobs` | 40 req/min |
| **CareerBuilder** | REST (Partner) | OAuth 2.0 | `POST /applications`, `GET /jobs` | 50 req/min |

**API Integration Pattern:**

```typescript
// Standardized API Adapter Interface
interface IApiAggregatorAdapter {
  // Authentication
  authenticate(credentials: VaultCredentials): Promise<AuthSession>;
  refreshToken(session: AuthSession): Promise<AuthSession>;
  
  // Job Discovery
  searchJobs(query: JobSearchQuery): Promise<JobListing[]>;
  getJobDetails(jobId: string): Promise<JobDetails>;
  
  // Application
  submitApplication(application: ApplicationPayload): Promise<SubmissionResult>;
  getApplicationStatus(appId: string): Promise<ApplicationStatus>;
  
  // Health
  healthCheck(): Promise<HealthStatus>;
}

// Example: Indeed API Adapter
class IndeedApiAdapter implements IApiAggregatorAdapter {
  private baseUrl = 'https://apis.indeed.com/v2';
  private rateLimiter = new RateLimiter({ maxRequests: 50, perMs: 60000 });
  
  async searchJobs(query: JobSearchQuery): Promise<JobListing[]> {
    await this.rateLimiter.acquire();
    const response = await this.httpClient.get(`${this.baseUrl}/jobs/search`, {
      params: {
        q: query.keywords,
        l: query.location,
        salary: query.salaryRange,
        fromage: query.maxDaysOld || 7,
        limit: 25,
      },
      headers: { Authorization: `Bearer ${this.session.accessToken}` },
    });
    return response.data.results.map(this.mapToJobListing);
  }
}
```

### 6.2 Secure Browser Automation / RPA Layer

For aggregators without APIs (Naukri, Glassdoor, Monster, etc.), the system uses containerized Playwright browser automation:

```
┌─────────────────────────────────────────────────────────────────┐
│            BROWSER AUTOMATION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              BROWSER POOL MANAGER (K8s)                    │  │
│  │                                                           │  │
│  │  Pool Configuration:                                      │  │
│  │  • Container image: mcr.microsoft.com/playwright:v1.42    │  │
│  │  • Resource limits: 1 CPU, 2GB RAM per container          │  │
│  │  • Idle timeout: 5 min (recycle unused containers)        │  │
│  │  • Max pool size: 200 containers (launch),                │  │
│  │                    1000 containers (scale)                 │  │
│  │  • Scaling metric: queue depth / avg processing time      │  │
│  │                                                           │  │
│  │  Lifecycle:                                               │  │
│  │  1. Queue Manager requests browser for aggregator X       │  │
│  │  2. Pool Manager allocates container                      │  │
│  │  3. Container configured with:                            │  │
│  │     • Geo-matched residential proxy                       │  │
│  │     • Randomized viewport (1366x768 → 1920x1080)         │  │
│  │     • Randomized User-Agent (realistic desktop)           │  │
│  │     • Timezone matching aggregator's region               │  │
│  │     • WebGL/Canvas fingerprint randomization              │  │
│  │  4. Adapter executes automation flow                      │  │
│  │  5. Container released back to pool (or terminated)       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              ANTI-DETECTION MEASURES                       │  │
│  │                                                           │  │
│  │  1. BROWSER FINGERPRINTING:                               │  │
│  │     • playwright-extra + stealth plugin                   │  │
│  │     • Override navigator.webdriver to false                │  │
│  │     • Randomize canvas/WebGL fingerprints                 │  │
│  │     • Realistic navigator.plugins and mimeTypes           │  │
│  │                                                           │  │
│  │  2. BEHAVIORAL MIMICRY:                                   │  │
│  │     • Human-like mouse movements (Bezier curves)          │  │
│  │     • Random typing speed (40–80 WPM)                     │  │
│  │     • Realistic scroll patterns                           │  │
│  │     • Random delays between actions (0.5–3s)              │  │
│  │     • Occasional "mistakes" (typo + backspace)            │  │
│  │                                                           │  │
│  │  3. SESSION MANAGEMENT:                                   │  │
│  │     • Persistent cookie jars per user per aggregator      │  │
│  │     • Session reuse to reduce login frequency             │  │
│  │     • Cookie storage: encrypted in Redis (TTL: 24h)       │  │
│  │                                                           │  │
│  │  4. PROXY ROTATION:                                       │  │
│  │     • Provider: Bright Data (primary), Oxylabs (fallback) │  │
│  │     • Pool: 10,000+ residential IPs                       │  │
│  │     • Rotation: Per-session sticky (same IP for full      │  │
│  │       application flow)                                   │  │
│  │     • Geo-matching: Indian IPs → Indian aggregators       │  │
│  │                     US IPs → US aggregators               │  │
│  │     • Cooldown: 30-min minimum between sessions from      │  │
│  │       same IP to same aggregator                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              SELF-HEALING SELECTORS                        │  │
│  │                                                           │  │
│  │  Problem: DOM selectors break when aggregators update UI  │  │
│  │                                                           │  │
│  │  Solution: Multi-strategy selector resolution             │  │
│  │                                                           │  │
│  │  Priority Chain:                                          │  │
│  │  1. data-testid / data-automation-id (most stable)        │  │
│  │  2. ARIA role + label combination                         │  │
│  │  3. CSS selector (class + structure)                      │  │
│  │  4. XPath with text content matching                      │  │
│  │  5. Visual element detection (GPT-4o Vision fallback)     │  │
│  │                                                           │  │
│  │  Monitoring:                                              │  │
│  │  • Nightly smoke tests against each aggregator            │  │
│  │  • Selector failure rate tracking per adapter             │  │
│  │  • Auto-alert to adapter maintenance team on > 5%         │  │
│  │    failure rate                                            │  │
│  │  • Auto-disable adapter if > 20% failure rate             │  │
│  │    (prevent user impact; enable maintenance mode)          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Aggregator Adapter Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED ADAPTER ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                IAggregatorAdapter                          │  │
│  │                  (Interface)                               │  │
│  │                                                           │  │
│  │  + login(credentials): Promise<Session>                   │  │
│  │  + searchJobs(query): Promise<JobListing[]>               │  │
│  │  + getJobDetails(jobId): Promise<JobDetails>              │  │
│  │  + startApplication(jobId): Promise<ApplicationContext>   │  │
│  │  + fillApplication(ctx, profile): Promise<FilledForm>     │  │
│  │  + submitApplication(ctx): Promise<SubmissionResult>      │  │
│  │  + getApplicationStatus(appId): Promise<Status>           │  │
│  │  + healthCheck(): Promise<HealthStatus>                   │  │
│  │  + getMetadata(): AdapterMetadata                         │  │
│  │                                                           │  │
│  └──────────────────┬───────────┬────────────────────────────┘  │
│                     │           │                                │
│          ┌──────────┘           └──────────┐                    │
│          ▼                                 ▼                    │
│  ┌───────────────────┐          ┌───────────────────┐          │
│  │ ApiAggregatorBase │          │BrowserAggregatorBase│         │
│  │ (Abstract Class)  │          │  (Abstract Class)  │          │
│  │                   │          │                    │          │
│  │ • HTTP client     │          │ • Playwright ctx   │          │
│  │ • Rate limiter    │          │ • Proxy manager    │          │
│  │ • OAuth handler   │          │ • Cookie jar       │          │
│  │ • Response parser │          │ • Anti-detection   │          │
│  │                   │          │ • Screenshot       │          │
│  └───┬───────┬───────┘          └──┬──────┬─────────┘          │
│      │       │                     │      │                     │
│      ▼       ▼                     ▼      ▼                     │
│  ┌───────┐┌────────┐          ┌───────┐┌────────┐              │
│  │Indeed ││LinkedIn│          │Naukri ││Glass-  │  ...         │
│  │Adapter││Adapter │          │Adapter││door    │              │
│  │       ││(Hybrid)│          │       ││Adapter │              │
│  └───────┘└────────┘          └───────┘└────────┘              │
│                                                                 │
│  Adapter Registration (adapter-registry.yaml):                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ adapters:                                                 │  │
│  │   - id: naukri                                            │  │
│  │     name: "Naukri.com"                                    │  │
│  │     type: browser                                         │  │
│  │     region: india                                         │  │
│  │     enabled: true                                         │  │
│  │     rateLimit:                                            │  │
│  │       maxRequestsPerMinute: 4                             │  │
│  │       minDelayBetweenActions: 5000                        │  │
│  │     proxy:                                                │  │
│  │       region: IN                                          │  │
│  │       provider: brightdata                                │  │
│  │     healthCheck:                                          │  │
│  │       interval: 6h                                        │  │
│  │       timeout: 30s                                        │  │
│  │     version: "1.4.2"                                      │  │
│  │     maintainer: "adapter-team-india"                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Architecture & Storage

### 7.1 Database Schema Overview (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                   CORE DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  users                         subscriptions                    │
│  ┌─────────────────────┐      ┌────────────────────────┐       │
│  │ id (UUID, PK)       │      │ id (UUID, PK)          │       │
│  │ email (UNIQUE)      │      │ user_id (FK → users)   │       │
│  │ password_hash       │      │ tier (free/pro/ent)    │       │
│  │ name                │──┐   │ stripe_sub_id          │       │
│  │ timezone             │  │   │ razorpay_sub_id        │       │
│  │ locale               │  │   │ status (active/cancel) │       │
│  │ onboarding_complete  │  │   │ current_period_end     │       │
│  │ created_at           │  │   │ created_at             │       │
│  │ updated_at           │  │   └────────────────────────┘       │
│  └─────────────────────┘  │                                     │
│                            │   parsed_profiles                  │
│                            │   ┌────────────────────────┐       │
│                            ├──►│ id (UUID, PK)          │       │
│                            │   │ user_id (FK → users)   │       │
│                            │   │ full_name              │       │
│                            │   │ contact_info (JSONB)   │       │
│                            │   │ summary (TEXT)         │       │
│                            │   │ experiences (JSONB[])  │       │
│                            │   │ education (JSONB[])    │       │
│                            │   │ skills (TEXT[])        │       │
│                            │   │ certifications (JSONB[])│      │
│                            │   │ embedding (vector(1536))│      │
│                            │   │ version (INT)          │       │
│                            │   │ created_at             │       │
│                            │   └────────────────────────┘       │
│                            │                                     │
│  resume_variants           │   aggregator_connections            │
│  ┌─────────────────────┐  │   ┌────────────────────────┐       │
│  │ id (UUID, PK)       │  │   │ id (UUID, PK)          │       │
│  │ user_id (FK)        │  ├──►│ user_id (FK → users)   │       │
│  │ name ("Backend")    │  │   │ aggregator_id (FK)     │       │
│  │ s3_key              │  │   │ vault_secret_path      │       │
│  │ parsed_profile_id   │  │   │ status (connected/     │       │
│  │ ats_score (0-100)   │  │   │   disconnected/error)  │       │
│  │ embedding (vector)  │  │   │ last_validated_at      │       │
│  │ is_primary (BOOL)   │  │   │ session_cookie_ref     │       │
│  │ created_at          │  │   │ daily_limit (INT)      │       │
│  └─────────────────────┘  │   │ config (JSONB)         │       │
│                            │   │ created_at             │       │
│                            │   └────────────────────────┘       │
│                            │                                     │
│  application_records       │   job_listings_cache                │
│  ┌─────────────────────┐  │   ┌────────────────────────┐       │
│  │ id (UUID, PK)       │  │   │ id (UUID, PK)          │       │
│  │ user_id (FK)        │◄─┘   │ aggregator_id (FK)     │       │
│  │ job_listing_id (FK) │      │ external_job_id        │       │
│  │ aggregator_id       │      │ title                  │       │
│  │ match_score (0-100) │      │ company                │       │
│  │ resume_variant_id   │      │ location               │       │
│  │ cover_letter_text   │      │ jd_text (TEXT)         │       │
│  │ cover_letter_mode   │      │ jd_url                 │       │
│  │ status (submitted/  │      │ salary_range (JSONB)   │       │
│  │   failed/pending/   │      │ skills (TEXT[])        │       │
│  │   needs_manual)     │      │ experience_range       │       │
│  │ failure_reason      │      │ embedding (vector)     │       │
│  │ screenshot_s3_key   │      │ posted_at              │       │
│  │ submitted_at        │      │ scraped_at             │       │
│  │ created_at          │      │ dedup_hash             │       │
│  └─────────────────────┘      └────────────────────────┘       │
│                                                                 │
│  PARTITIONING:                                                  │
│  • application_records: RANGE partitioned by submitted_at       │
│    (monthly partitions) + LIST sub-partitioned by user_id hash  │
│  • job_listings_cache: RANGE partitioned by scraped_at          │
│    (weekly partitions, auto-drop after 90 days)                 │
│                                                                 │
│  INDEXES:                                                       │
│  • application_records: (user_id, submitted_at DESC)            │
│  • application_records: (user_id, aggregator_id, status)        │
│  • job_listings_cache: (dedup_hash) for deduplication           │
│  • parsed_profiles: HNSW index on embedding column (pgvector)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Storage Distribution

| Data Type | Store | Rationale |
|---|---|---|
| User accounts, profiles, billing | **PostgreSQL (RDS)** | Relational integrity, ACID transactions, complex queries. |
| Parsed profile embeddings | **PostgreSQL + pgvector** | Co-located with profile data; HNSW index for nearest-neighbor search. |
| Session data, rate limit counters | **Redis (ElastiCache)** | Sub-millisecond access, TTL-based expiry, atomic increments. |
| Application queue, priority scheduling | **Redis (BullMQ)** | Priority queue with delayed jobs, rate limiting, retry logic. |
| Resume/cover letter files, screenshots | **S3** | Unlimited object storage, lifecycle policies, presigned URLs. |
| JD corpus, skill index | **Elasticsearch (OpenSearch)** | Full-text search, aggregations, fuzzy matching for dedup. |
| Aggregator credentials | **HashiCorp Vault** | HSM-backed encryption, audit logging, dynamic secrets. |
| Event stream | **Apache Kafka (MSK)** | High-throughput event backbone, exactly-once semantics, multi-consumer. |
| Analytics / OLAP queries | **ClickHouse** | Columnar storage for fast analytical queries on billions of events. |
| Time-series skill trends | **TimescaleDB (on RDS)** | Time-series optimized PostgreSQL extension; co-located for simplicity. |
| Workflow state (Temporal) | **PostgreSQL** | Temporal's persistence layer; separate database from application data. |

---

## 8. Infrastructure & Deployment Topology

### 8.1 Kubernetes Cluster Design

```
┌─────────────────────────────────────────────────────────────────┐
│                 EKS CLUSTER ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cluster: autoapply-prod-ap-south-1                             │
│  Kubernetes Version: 1.29                                       │
│  CNI: AWS VPC CNI                                               │
│  Service Mesh: Istio (mTLS between services)                    │
│                                                                 │
│  NODE GROUPS:                                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ system-pool (management)                                 │   │
│  │ Instance: m6i.large | Nodes: 3 (1 per AZ) | Fixed       │   │
│  │ Workloads: Istio, CoreDNS, kube-system, monitoring       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ app-pool (application services)                          │   │
│  │ Instance: m6i.xlarge | Nodes: 4–20 | HPA-driven          │   │
│  │ Workloads: User Svc, Asset Svc, Aggregator Svc,          │   │
│  │            Queue Manager, Notification Engine, API GW     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ai-pool (AI/ML workloads)                                │   │
│  │ Instance: m6i.2xlarge | Nodes: 2–10 | Queue-depth scaled │   │
│  │ Workloads: Scanner, Scorer, Feedback Engine,              │   │
│  │            Skill Extractor, Parser Pipeline                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ browser-pool (Playwright containers)                     │   │
│  │ Instance: c6i.xlarge | Nodes: 5–50 | Queue-depth scaled  │   │
│  │ Workloads: Form Filler, Submitter (K8s Jobs)              │   │
│  │ Special: Ephemeral containers, 10-min max TTL             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ gpu-pool (self-hosted LLM inference)                     │   │
│  │ Instance: g5.2xlarge (A10G) | Nodes: 2–4 | Cost-aware    │   │
│  │ Workloads: vLLM serving Llama 3.1 8B                      │   │
│  │ Special: Spot instances for non-critical inference         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source: GitHub (monorepo)                                      │
│  CI: GitHub Actions                                             │
│  CD: ArgoCD (GitOps)                                            │
│  Registry: AWS ECR                                              │
│  IaC: Terraform + Terragrunt                                    │
│                                                                 │
│  PR → CI Pipeline:                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  ┌───────┐  │
│  │ Lint & │→│ Unit   │→│ Build  │→│ Integ.   │→│ Sec.  │  │
│  │ Format │  │ Tests  │  │ Docker │  │ Tests    │  │ Scan  │  │
│  └────────┘  └────────┘  └────────┘  └──────────┘  └───────┘  │
│                                                                 │
│  Merge → CD Pipeline:                                           │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Build  │→│ Push   │→│ Update   │→│ ArgoCD   │           │
│  │ & Tag  │  │ to ECR │  │ Kustomize│  │ Sync     │           │
│  └────────┘  └────────┘  └──────────┘  └──────────┘           │
│                                                                 │
│  Deployment Strategy: Canary (10% → 50% → 100%)                │
│  Rollback: Automated on error rate > 1% (Datadog monitor)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Observability, Monitoring & Alerting

### 9.1 Observability Stack

| Layer | Tool | Purpose |
|---|---|---|
| **Distributed Tracing** | OpenTelemetry → Datadog APM | End-to-end trace from API call → Kafka → browser automation → submission. Every application gets a unique `traceId`. |
| **Metrics** | Prometheus (scraped by Datadog) | Service-level metrics: request rate, error rate, latency (RED). Business metrics: applications/min, queue depth, adapter success rate. |
| **Logging** | Fluentd → Datadog Logs | Structured JSON logs from all services. Log correlation via `traceId` and `userId`. |
| **Dashboards** | Grafana + Datadog Dashboards | Operational dashboards per service. Business dashboards for KPIs. Adapter health dashboard. |
| **Alerting** | PagerDuty (via Datadog monitors) | P1: System down, data breach indicator. P2: Adapter failure > 20%, queue backlog > 1000. P3: Elevated error rates, slow LLM responses. |
| **Audit Logging** | CloudTrail + Vault Audit | All credential access, admin actions, and data access logged immutably. |

### 9.2 Key Monitors

| Monitor | Condition | Severity | Action |
|---|---|---|---|
| Application success rate | < 85% over 15 min | P2 | Page on-call + auto-disable lowest-performing adapter |
| Kafka consumer lag | > 5000 messages for > 10 min | P2 | Page on-call + auto-scale consumer pods |
| Browser pool utilization | > 90% for > 5 min | P3 | Auto-scale browser node group |
| Vault credential access anomaly | > 100 reads/min from single service | P1 | Auto-revoke token + page security on-call |
| LLM API error rate | > 5% for > 5 min | P2 | Switch to fallback provider |
| Database connection pool | > 80% utilization | P3 | Alert DBA + review connection limits |
| Daily application count | < 50% of previous day's count | P3 | Alert product team (possible aggregator issue) |

---

## 10. Technology Radar & Stack Summary

### 10.1 Complete Technology Stack

| Category | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend** | Next.js | 14.x | SSR, file-based routing, React Server Components, excellent DX. |
| **Frontend State** | Zustand + TanStack Query | Latest | Lightweight global state + server-state caching with optimistic updates. |
| **Frontend Realtime** | Socket.IO | 4.x | WebSocket abstraction with automatic fallback to polling. |
| **Backend Framework** | NestJS (Node.js) | 10.x | TypeScript-native, modular architecture, built-in DI, guards, interceptors. |
| **AI/ML Services** | FastAPI (Python) | 0.110+ | Async-native, Pydantic validation, excellent for ML serving. |
| **Database (OLTP)** | PostgreSQL | 16.x | JSONB, pgvector, partitioning, mature ecosystem. |
| **Database (OLAP)** | ClickHouse | Latest | Columnar store for analytics queries on billions of events. |
| **Cache / Queues** | Redis | 7.x | Sub-ms latency, BullMQ for job queues, rate limiting. |
| **Search Engine** | OpenSearch (Elasticsearch) | 2.x | Full-text search, skill taxonomy, JD corpus, fuzzy dedup. |
| **Event Streaming** | Apache Kafka (AWS MSK) | 3.x | Event backbone, exactly-once semantics, schema registry. |
| **Workflow Orchestration** | Temporal.io | Latest | Durable workflow execution, retries, timeouts, visibility. |
| **Browser Automation** | Playwright | 1.42+ | Cross-browser, stealth plugins, headless Chrome/Chromium. |
| **LLM (Primary)** | OpenAI GPT-4o | Latest | Best-in-class for cover letters, custom questions, form analysis. |
| **LLM (Fallback)** | Anthropic Claude 3.5 Sonnet | Latest | Strong alternative for text generation. |
| **LLM (Self-hosted)** | Llama 3.1 8B via vLLM | Latest | Cost-efficient for high-volume skill extraction and parsing. |
| **Embeddings** | OpenAI text-embedding-3-large | Latest | 1536-dim embeddings for profile-JD matching. |
| **Secrets Management** | HashiCorp Vault | 1.16+ | HSM-backed, dynamic secrets, audit logging. |
| **Object Storage** | AWS S3 | — | Resumes, cover letters, screenshots, backups. |
| **CDN** | AWS CloudFront | — | Static asset delivery, geo-routing, DDoS protection. |
| **Container Orchestration** | AWS EKS (Kubernetes) | 1.29 | Managed K8s, auto-scaling, multi-AZ. |
| **IaC** | Terraform + Terragrunt | 1.7+ | Declarative infrastructure, state management, module reuse. |
| **CI/CD** | GitHub Actions + ArgoCD | — | CI in GitHub, GitOps CD via ArgoCD. |
| **Monitoring** | Datadog + Grafana | — | APM, logs, metrics, dashboards. |
| **Alerting** | PagerDuty | — | Incident management, on-call rotation. |
| **Email** | AWS SES + SendGrid | — | Transactional emails, deliverability. |
| **Payments** | Stripe + Razorpay | — | International + Indian payment processing. |
| **Proxy** | Bright Data + Oxylabs | — | Residential proxy pools for browser automation. |
| **CAPTCHA** | 2Captcha + Anti-Captcha | — | Automated CAPTCHA solving services. |

### 10.2 Technology Radar

```
┌─────────────────────────────────────────────────────────────────┐
│                   TECHNOLOGY RADAR                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ADOPT (Use in Production):                                     │
│  ● PostgreSQL 16    ● Kafka/MSK        ● Next.js 14            │
│  ● Redis 7          ● Playwright       ● NestJS                 │
│  ● Docker/K8s       ● OpenTelemetry    ● GPT-4o                │
│  ● Terraform        ● ArgoCD           ● HashiCorp Vault        │
│                                                                 │
│  TRIAL (Evaluate for Production):                               │
│  ○ Temporal.io      ○ ClickHouse       ○ vLLM                  │
│  ○ pgvector         ○ Zustand          ○ Claude 3.5 Sonnet     │
│                                                                 │
│  ASSESS (Research & Prototype):                                 │
│  ◌ Gemini 1.5 Pro   ◌ Citus (PG shard) ◌ Apache Flink         │
│  ◌ WebAssembly      ◌ Deno (Edge)      ◌ Grafana Tempo         │
│                                                                 │
│  HOLD (Do Not Adopt):                                           │
│  ✕ MongoDB (ACID needed)    ✕ Selenium (Playwright superior)   │
│  ✕ REST-only (need events)  ✕ Monolith (scale concerns)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

> **📋 END OF DOCUMENT 2 — TECHNICAL ARCHITECTURE DOCUMENT**
>
> Type **"CONTINUE"** to generate **DOCUMENT 3: Security & Access Document (SAD)**.
