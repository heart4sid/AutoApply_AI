# AutoApply AI — Foundational Documentation Suite

> **Version:** 1.0.0-DRAFT  
> **Date:** 2026-07-17  
> **Classification:** Confidential — Internal  
> **Authors:** Product & Architecture Office  

---

## Master Table of Contents

### DOCUMENT 1 — Product Requirement Document (PRD)
**File:** [`01_PRD.md`](file:///e:/AutoApply_AI/docs/01_PRD.md)

1. Executive Summary
2. Product Vision & Strategic Context
3. Objectives & Success Metrics (KPIs)
4. Target Market & User Personas
   - 4.1 Persona A: Domestic Job Seeker (India)
   - 4.2 Persona B: International Job Seeker
   - 4.3 Persona C: Career Switcher
5. User Journeys
   - 5.1 Domestic Job Seeker Journey
   - 5.2 International Job Seeker Journey
6. Functional Requirements
   - 6.1 FR-1: Asset Management (Resume & Cover Letter)
   - 6.2 FR-2: Aggregator Integration Matrix (Indian vs. International)
   - 6.3 FR-3: Autonomous Multimodal AI Applier Engine
   - 6.4 FR-4: Market Analysis & Skill-Gap Feedback Loop
   - 6.5 FR-5: Notification & Communication Engine
   - 6.6 FR-6: User Account & Subscription Management
7. Non-Functional Requirements
   - 7.1 Performance
   - 7.2 Scalability
   - 7.3 Availability & Disaster Recovery
   - 7.4 Localization & Internationalization
   - 7.5 Accessibility
8. Assumptions, Constraints & Dependencies
9. Release Strategy & Phasing
10. Appendices

---

### DOCUMENT 2 — Technical Architecture Document (TAD)
**File:** [`02_TAD.md`](file:///e:/AutoApply_AI/docs/02_TAD.md)

1. Architecture Philosophy & Guiding Principles
2. System Topology (Microservices + Event-Driven Hybrid)
3. Service Catalog & Domain Decomposition
4. Data Flow & Pipeline — Application Lifecycle
5. AI Engine Architecture
   - 5.1 Multimodal Form Processor
   - 5.2 LLM Orchestration & Token Management
   - 5.3 Captcha Resolution Strategy
   - 5.4 Dynamic Field & Custom Question Handling
6. Integration Strategy
   - 6.1 API-First Integrations
   - 6.2 Secure Browser Automation / RPA Layer
   - 6.3 Aggregator Adapter Pattern
7. Data Architecture & Storage
8. Infrastructure & Deployment Topology
9. Observability, Monitoring & Alerting
10. Technology Radar & Stack Summary

---

### DOCUMENT 3 — Security & Access Document (SAD)
**File:** [`03_SAD.md`](file:///e:/AutoApply_AI/docs/03_SAD.md)

1. Security Architecture Overview
2. Credential Vaulting Architecture
   - 2.1 Encryption-at-Rest (AES-256-GCM)
   - 2.2 Secrets Management (HashiCorp Vault / AWS Secrets Manager)
   - 2.3 Key Rotation & HSM Integration
3. Authentication & Authorization
   - 3.1 OAuth 2.0 + OpenID Connect
   - 3.2 Multi-Factor Authentication (MFA)
   - 3.3 Session Management & Token Lifecycle
   - 3.4 Role-Based Access Control (RBAC)
4. Data Protection & Privacy Compliance
   - 4.1 GDPR Compliance
   - 4.2 India DPDP Act 2023 Compliance
   - 4.3 Data Residency & Cross-Border Transfer
5. Application Security
6. Incident Response & Audit Logging
7. Threat Model Summary

---

### DOCUMENT 4 — Frontend Specification Document (FSD)
**File:** [`04_FSD.md`](file:///e:/AutoApply_AI/docs/04_FSD.md)

1. Design Philosophy & System
2. Technology Stack & Rationale
3. Core Layout & Navigation Architecture
4. Core UI Components
   - 4.1 Asset Dashboard (Drag-and-Drop Upload)
   - 4.2 Aggregator Matrix View (Indian vs. International Twin-Column)
   - 4.3 Live Activity Feed (Real-Time AI Tracking)
   - 4.4 AI Feedback Center (Skill-Gap Charts & Recommendations)
5. State Management Strategy (Async AI Workflows)
6. Real-Time Communication Layer
7. Responsive & Adaptive Design
8. Accessibility (WCAG 2.1 AA)
9. Component Library & Design Tokens

---

### DOCUMENT 5 — Feature Ticket List (Jira Style)
**File:** [`05_TICKETS.md`](file:///e:/AutoApply_AI/docs/05_TICKETS.md)

1. Epic 1: User Onboarding & Account Management
2. Epic 2: Asset Management (Resume & Cover Letter)
3. Epic 3: Aggregator Integration Framework
4. Epic 4: Autonomous AI Applier Engine
5. Epic 5: Market Analysis & Skill-Gap Feedback
6. Epic 6: Live Activity Feed & Notifications
7. Epic 7: Security, Compliance & Credential Vaulting
8. Epic 8: Frontend Shell, Design System & Core Views
9. Epic 9: Infrastructure, CI/CD & Observability

---

> **Reading Order:** Documents are designed to be read sequentially. The PRD establishes *what* we build and *why*; the TAD explains *how*; the SAD ensures *security*; the FSD specifies the *user-facing layer*; and the Ticket List converts everything into *actionable execution units*.
