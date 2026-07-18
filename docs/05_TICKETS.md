# DOCUMENT 5 — Feature Ticket List (Jira Style)

> **Product:** AutoApply AI  
> **Version:** 1.0.0-DRAFT  
> **Last Updated:** 2026-07-18  
> **Owner:** Engineering Program Management  
> **Status:** Draft — Pending Sprint Planning  
> **Total Tickets:** 78  
> **Epics:** 9  

---

## Epic Overview & Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      EPIC DEPENDENCY GRAPH                              │
│                                                                         │
│  Epic 9: Infrastructure ──────────────────────────────┐                │
│       │                                                │                │
│       ▼                                                ▼                │
│  Epic 1: Onboarding ──► Epic 2: Assets ──► Epic 3: Aggregators        │
│       │                      │                   │                      │
│       │                      ▼                   ▼                      │
│       │              Epic 4: AI Engine ◄─────────┘                     │
│       │                      │                                          │
│       │                      ▼                                          │
│       │              Epic 5: Feedback                                   │
│       │                      │                                          │
│       ▼                      ▼                                          │
│  Epic 7: Security    Epic 6: Activity & Notifications                  │
│       │                                                                 │
│       └──────────────► Epic 8: Frontend                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Epic | Ticket Count | Phase | Priority |
|---|---|---|---|
| Epic 1: User Onboarding & Account Management | 9 | Phase 0 | P0 |
| Epic 2: Asset Management (Resume & Cover Letter) | 10 | Phase 0–1 | P0 |
| Epic 3: Aggregator Integration Framework | 11 | Phase 1–2 | P0 |
| Epic 4: Autonomous AI Applier Engine | 12 | Phase 1–2 | P0 |
| Epic 5: Market Analysis & Skill-Gap Feedback | 8 | Phase 3 | P1 |
| Epic 6: Live Activity Feed & Notifications | 7 | Phase 1–2 | P0 |
| Epic 7: Security, Compliance & Credential Vaulting | 8 | Phase 0–1 | P0 |
| Epic 8: Frontend Shell, Design System & Core Views | 8 | Phase 0–1 | P0 |
| Epic 9: Infrastructure, CI/CD & Observability | 5 | Phase 0 | P0 |

---

## Epic 1: User Onboarding & Account Management

---

### AA-001
**Title:** Implement User Registration with Email/Password and OAuth Providers

**Description:** As a new user, I want to register for an AutoApply AI account using my email and password, or via Google/LinkedIn OAuth, so that I can quickly create an account and begin using the platform.

**Acceptance Criteria:**
- Registration form accepts email (validated, unique), password (12+ chars, 1 uppercase, 1 number, 1 special char), and full name.
- Password is checked against HaveIBeenPwned API on submission; blocked if breached with user-facing message.
- Password hashed with Argon2id (memory: 64MB, iterations: 3, parallelism: 4) before storage.
- Google OAuth 2.0 flow (Authorization Code + PKCE) is fully functional: redirects to Google, handles callback, creates/links account.
- LinkedIn OAuth 2.0 flow is fully functional with identical PKCE pattern.
- Duplicate email registration returns clear error ("An account with this email already exists. Try logging in or resetting your password.").
- On successful registration, user receives verification email (SendGrid/SES) with 24-hour expiry link.
- Consent checkboxes collected: (a) Terms of Service, (b) Privacy Policy, (c) AI Data Processing. All required. Consent records stored with timestamps.
- Registration event emitted to Kafka (`user.registered`).
- API response time < 500ms (excluding OAuth redirect).

---

### AA-002
**Title:** Implement User Login with Session Management and JWT Issuance

**Description:** As a registered user, I want to log in to my account securely so that I can access my dashboard and manage my career automation.

**Acceptance Criteria:**
- Login accepts email + password or OAuth (Google, LinkedIn).
- On successful authentication, issue: (a) Access Token (JWT, RS256, 1-hour TTL) set as HttpOnly/Secure/SameSite=Strict cookie, (b) Refresh Token (opaque, 30-day TTL) set as HttpOnly/Secure cookie with restricted path (`/api/auth/refresh`).
- JWT payload includes: `sub` (userId), `email`, `role`, `tier`, `iat`, `exp`, `jti`, `iss`.
- Rate limiting: 5 failed login attempts per email within 15 minutes triggers 15-minute account lockout with user notification email.
- Refresh token is single-use (rotated on each use; old token immediately invalidated in Redis).
- Refresh token bound to User-Agent hash + IP subnet (/24). Mismatch triggers re-authentication.
- Maximum 5 concurrent sessions per user. 6th login terminates oldest session.
- Login event emitted to Kafka (`auth.login.success` / `auth.login.failure`).
- Suspicious login detection: new device or new geographic region triggers email notification.

---

### AA-003
**Title:** Build Multi-Step Onboarding Wizard

**Description:** As a new user who has just registered, I want to be guided through a step-by-step onboarding wizard so that I can upload my resume, set my job preferences, and connect my first aggregator efficiently.

**Acceptance Criteria:**
- Wizard has 4 steps with progress indicator: (1) Upload Resume, (2) Review Parsed Profile, (3) Set Job Preferences, (4) Connect First Aggregator.
- Step 1: Drag-and-drop upload zone accepting PDF, DOCX, RTF, TXT (max 10MB). Shows upload progress bar. On success, triggers parsing pipeline.
- Step 2: Displays AI-parsed profile data (name, contact, summary, work experience, education, skills). All fields editable. "Looks Good" button to confirm.
- Step 3: Form fields for: target roles (tag input, max 10), target locations (multi-select with search), salary range (range slider with locale-appropriate currency), experience level (dropdown), work authorization (dropdown).
- Step 4: Shows top 3 recommended aggregators based on user's region. "Connect" opens credential modal. "Skip for now" option available.
- User can navigate back to previous steps without losing data.
- Onboarding state persisted server-side (resume on page reload).
- On completion, `user.onboarding_complete` flag set to true. User redirected to Dashboard.
- Entire wizard completable in < 10 minutes (per UX benchmark).
- Fully keyboard-navigable. Screen reader announces step transitions.

---

### AA-004
**Title:** Implement User Profile Management

**Description:** As a user, I want to view and edit my profile settings so that I can keep my personal information, notification preferences, and job search criteria up to date.

**Acceptance Criteria:**
- Profile page displays: name, email, timezone, locale/language, notification preferences (email frequency, in-app toggles), job preferences (roles, locations, salary, experience level).
- All fields editable with inline save (PATCH API). Optimistic UI updates with rollback on failure.
- Email change requires MFA step-up authentication + confirmation email to new address.
- Timezone selector with searchable dropdown (all IANA timezones). Defaults to browser-detected timezone.
- Notification preferences: toggle each notification type (daily summary, weekly insights, connection alerts, security alerts). Frequency: real-time / daily digest / weekly digest.
- Changes emit `user.profile.updated` Kafka event.

---

### AA-005
**Title:** Implement Subscription Tier Management and Payment Integration

**Description:** As a user, I want to view my current subscription plan, upgrade to Pro or Enterprise, and manage my billing so that I can access premium features.

**Acceptance Criteria:**
- Subscription page shows: current tier (Free/Pro/Enterprise), usage meters (daily applications used/remaining, aggregators connected/available), billing history.
- Upgrade flow: select plan → payment page → Stripe Checkout (international) or Razorpay Checkout (Indian users, detected by IP/locale).
- Stripe integration: Checkout Sessions, Customer Portal for billing management, Webhook handlers for `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Razorpay integration: Orders API, Checkout, Webhook handlers for `payment.captured`, `subscription.activated`, `subscription.cancelled`.
- Tier enforcement: API middleware checks user tier against endpoint requirements. Returns 403 with upgrade prompt for tier-restricted features.
- Downgrade: immediate plan change at next billing cycle. Features restricted at cycle end.
- Free tier limits enforced: 5 applications/day, 2 aggregators max, basic feedback only.
- Pro tier: $29/month (USD) or ₹999/month (INR). Displayed in user's locale currency.

---

### AA-006
**Title:** Implement Multi-Factor Authentication (MFA) with TOTP

**Description:** As a security-conscious user, I want to enable MFA on my account using an authenticator app so that my account is protected even if my password is compromised.

**Acceptance Criteria:**
- MFA setup flow: generate 160-bit TOTP secret → display QR code (compatible with Google Authenticator, Authy, 1Password) → user enters 6-digit code to verify → MFA enabled.
- 10 single-use backup codes generated on MFA setup, displayed once, Argon2id hashed before storage.
- Step-up authentication: connecting aggregators, changing password, changing email, disabling MFA, account deletion, data export, billing changes — all require MFA verification.
- Step-up flow: API returns 403 with `X-MFA-Required: true` header → frontend shows MFA modal → user enters TOTP code → Auth Service validates → issues short-lived step-up token (5-min TTL, `mfa_verified: true` claim).
- Clock drift tolerance: ±1 TOTP window (±30 seconds).
- MFA disable requires current TOTP code + email confirmation.
- SMS OTP available as fallback: 6 digits, 5-minute expiry, max 5 SMS/hour/user.

---

### AA-007
**Title:** Implement Account Deletion with GDPR/DPDP-Compliant Data Purge

**Description:** As a user, I want to permanently delete my account and all associated data so that I can exercise my right to erasure under GDPR and India's DPDP Act.

**Acceptance Criteria:**
- Account deletion requires MFA step-up authentication.
- Confirmation dialog clearly states: "This will permanently delete your account, all resumes, cover letters, application history, aggregator connections, and stored credentials. This action cannot be undone after the grace period."
- 7-day grace period: account marked as `pending_deletion`. User can cancel by logging in during this period.
- After 7 days: 30-day soft-delete (data inaccessible but retained for legal hold).
- After 30 days: hard delete cascade: user record, parsed profiles, resume variants (S3 objects), cover letters, application records, aggregator connections, Vault credentials (explicit Vault KV delete), embeddings, notification history, audit logs (retained separately per compliance).
- Deletion confirmation email sent immediately and on final purge.
- Deletion event emitted: `user.deletion.initiated`, `user.deletion.completed`.
- Data export (ZIP) offered before deletion proceeds.

---

### AA-008
**Title:** Implement Self-Service Data Export (DSAR)

**Description:** As a user, I want to download all my personal data in a machine-readable format so that I can exercise my right of access and data portability.

**Acceptance Criteria:**
- "Download My Data" button in Account Settings.
- Requires MFA step-up authentication.
- Export includes: profile data (JSON), resume files (original PDFs/DOCXs), parsed profile (JSON), cover letters (generated texts as JSON), application history (CSV with columns: date, job title, company, aggregator, match score, status), skill-gap reports (JSON), notification history (JSON).
- Export generated asynchronously (background job). User notified via email when ready (download link with 72-hour expiry, signed URL).
- Processing time SLA: < 72 hours (target < 1 hour for accounts with < 1000 applications).
- Export does not include: aggregator credentials (by design — never exportable), raw Vault audit logs, internal system metadata.

---

### AA-009
**Title:** Implement Password Reset Flow

**Description:** As a user who has forgotten my password, I want to reset it securely via email so that I can regain access to my account.

**Acceptance Criteria:**
- "Forgot Password" link on login page.
- User enters email → system sends reset email (regardless of whether email exists — timing-safe to prevent enumeration).
- Reset email contains: single-use token (cryptographically random, 256-bit), 1-hour expiry, HTTPS link to reset page.
- Reset page: new password field (same validation rules as registration), confirm password field.
- On successful reset: all existing refresh tokens revoked (force re-login on all devices), password reset event logged, confirmation email sent.
- Rate limit: max 3 reset emails per email address per hour.

---

## Epic 2: Asset Management (Resume & Cover Letter)

---

### AA-010
**Title:** Build Resume Upload Pipeline with Multi-Format Support

**Description:** As a user, I want to upload my resume in PDF, DOCX, RTF, or TXT format so that the system can parse and store my career data.

**Acceptance Criteria:**
- Upload endpoint accepts multipart/form-data with file validation: MIME type whitelist (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/rtf, text/plain), magic bytes verification (not just extension), max 10MB.
- File stored in S3 with SSE-S3 encryption. Key format: `resumes/{userId}/{variantId}/{filename}`.
- Pre-signed upload URL pattern for direct-to-S3 upload (bypasses API server for large files).
- Upload event emitted to Kafka: `asset.resume.uploaded` with `{userId, variantId, s3Key, mimeType, size}`.
- Malware scan on uploaded file (ClamAV or AWS-native scanning) before processing. Quarantine if infected.
- API returns 201 with `{variantId, status: "parsing", estimatedTime: "8s"}`.

---

### AA-011
**Title:** Implement AI-Powered Resume Parsing Pipeline

**Description:** As the system, I want to parse uploaded resumes using NLP/AI to extract structured career data so that the AI Engine can use this data for job matching and application filling.

**Acceptance Criteria:**
- Kafka consumer processes `asset.resume.uploaded` events.
- Text extraction: PDF (PyPDF2 + pdfplumber for tables), DOCX (python-docx), RTF (pyth), TXT (direct read).
- NER extraction pipeline (spaCy custom model + GPT-4o fallback for ambiguous fields) extracts: full name, email, phone, LinkedIn URL, physical address, professional summary, work experiences (company, title, start date, end date, bullet points), education (institution, degree, field, dates, GPA), skills (technical, soft), certifications (name, issuer, date), projects (name, description, technologies), publications, languages.
- Structured output stored in `parsed_profiles` table (PostgreSQL) with JSONB fields.
- Profile embedding generated via OpenAI `text-embedding-3-large` (1536 dimensions) and stored in pgvector column.
- Parsing latency: < 8 seconds for a 3-page PDF (p95).
- Parsing accuracy: > 90% field extraction accuracy (measured by QA sampling against manually labeled test set of 500 resumes).
- Emit event: `asset.resume.parsed` with structured profile data.

---

### AA-012
**Title:** Build Parsed Profile Review & Edit Interface

**Description:** As a user, I want to review the AI-parsed data from my resume and correct any errors so that my profile is accurate for job applications.

**Acceptance Criteria:**
- After parsing completes, UI displays structured profile in editable form layout.
- Each section (Contact, Summary, Experience, Education, Skills, Certifications, Projects) is collapsible with edit-in-place capability.
- Work experience entries: sortable (drag-and-drop reorder), add/remove entries, date pickers for start/end dates, rich text editor for bullet points.
- Skills section: tag input with autocomplete from canonical skill taxonomy. Grouped: "Technical" and "Soft Skills".
- Changes saved via PATCH API with field-level granularity (only changed fields sent).
- On save, profile embedding re-generated (async) to reflect edits.
- User corrections logged (with consent) for parser improvement fine-tuning pipeline.
- Visual diff indicator: highlight fields that were AI-parsed (blue dot) vs. user-edited (green dot).

---

### AA-013
**Title:** Implement Multi-Resume Variant Management

**Description:** As a user, I want to maintain up to 5 different resume variants (e.g., "Backend Focus", "Full-Stack Focus") so that the AI Engine can select the best match for each application.

**Acceptance Criteria:**
- User can upload or create up to 5 resume variants (Free tier: 2 variants; Pro tier: 5 variants).
- Each variant has: name (user-defined), uploaded file (S3), parsed profile, ATS score, embedding, `is_primary` flag.
- One variant must be marked as primary (default for applications where no variant is a strong match).
- AI Engine selection logic: for each application, compute cosine similarity between each variant's embedding and the JD embedding. Select highest-scoring variant (if > 5% improvement over primary).
- Variant list view in Asset Dashboard: cards showing name, ATS score bar, skill tags, usage count, last updated.
- Delete variant: confirmation dialog, cascading delete of S3 file + parsed profile + embedding. Cannot delete last remaining variant.

---

### AA-014
**Title:** Implement ATS Compatibility Scoring Engine

**Description:** As a user, I want to see an ATS compatibility score for each resume variant so that I know how well my resume will be parsed by employer Applicant Tracking Systems.

**Acceptance Criteria:**
- ATS scoring runs automatically on resume upload and on profile edit.
- Scoring checks: (a) File format (PDF preferred, DOCX acceptable; RTF/TXT penalized); (b) No tables, text boxes, headers/footers, images, or columns (ATS can't parse); (c) Standard section headings ("Experience", "Education", "Skills" — not creative alternatives); (d) No special characters/symbols in critical fields; (e) Date format consistency; (f) Contact information present and parseable.
- Score: 0–100 with color coding (red < 50, yellow 50–74, green ≥ 75).
- Detailed breakdown: list of issues found with severity (Critical / Warning / Info) and actionable fix suggestions.
- Score displayed on ResumeCard component and in Asset Detail view.
- Score stored in `resume_variants.ats_score` column, recalculated on edit.

---

### AA-015
**Title:** Build Cover Letter Template Upload and Management

**Description:** As a user, I want to upload a base cover letter template that the AI can use as a starting point for generating tailored cover letters.

**Acceptance Criteria:**
- Upload accepts same formats as resume (PDF, DOCX, RTF, TXT). Max 10MB.
- AI parses cover letter to identify: greeting structure, body structure, closing structure, tone.
- User can have 1 base template (Free) or 3 base templates (Pro) for different markets/roles.
- Template preview: rendered view of the uploaded cover letter with AI-identified sections highlighted.
- Template stored in S3 (encrypted), metadata in PostgreSQL.

---

### AA-016
**Title:** Implement AI Cover Letter Generation Engine

**Description:** As the system, I want to generate tailored cover letters for each job application using the user's profile, the job description, and company context so that each application has a personalized, high-quality cover letter.

**Acceptance Criteria:**
- Input: user parsed profile, JD text, company name, company About page content (scraped), target market/locale.
- LLM prompt (GPT-4o): structured with system prompt (career coach persona), user context (top 3 matching experiences), JD summary, company context, market tone instruction (US assertive / UK collaborative / India formal / Germany structured).
- Output: 200–300 word cover letter with greeting, 2–3 body paragraphs, closing.
- Tone adaptation verified: generate US and UK variants for same JD; validate tone difference via manual QA sample.
- Cover letter caching: hash(JD_id + profile_version + market) → Redis cache (TTL: 7 days). Reuse if identical.
- Generation latency: < 5 seconds (p95).
- Three approval modes supported: (a) Full Auto — generate and attach without user review; (b) Review Queue — generate and hold for user approval; (c) Template Only — attach user's static template. Mode configured per-user in preferences.

---

### AA-017
**Title:** Implement Resume Version History with Diff View

**Description:** As a user, I want to see the version history of each resume variant and compare changes between versions so that I can track how my resume has evolved.

**Acceptance Criteria:**
- Each save of a parsed profile creates a new version (stored in `parsed_profiles` with `version` column).
- Version history list: shows version number, date, change summary (auto-generated: "Updated Skills section, added Docker").
- Diff view: side-by-side comparison of any two versions. Added text highlighted green, removed text highlighted red (GitHub-style diff).
- Rollback: "Restore this version" button creates a new version with the old data (non-destructive).
- Max 20 versions stored per variant (oldest auto-pruned beyond limit).

---

### AA-018
**Title:** Implement Secure Document Deletion with Cascading Purge

**Description:** As a user, I want to delete a resume or cover letter and have all derived data (parsed profiles, embeddings, generated cover letters) also deleted so that my data is not retained unnecessarily.

**Acceptance Criteria:**
- Delete action requires confirmation dialog: "This will permanently delete this resume and all associated data including parsed profile, ATS score, embeddings, and any cover letters generated from it."
- 30-day soft-delete window: data marked as deleted but retained. User can restore within 30 days from a "Recently Deleted" view.
- After 30 days: hard delete cascade: S3 object (resume file), PostgreSQL records (parsed_profile, resume_variant), pgvector embedding, Redis cache entries, any generated cover letters referencing this variant.
- Cannot delete the last remaining resume variant (API returns 400: "You must have at least one resume variant").
- Delete event emitted: `asset.resume.deleted`.

---

### AA-019
**Title:** Build Drag-and-Drop Upload Zone UI Component

**Description:** As a user, I want to drag and drop my resume file onto the upload zone in my browser so that uploading is fast and intuitive.

**Acceptance Criteria:**
- React component using `react-dropzone` library.
- Visual states: (a) Idle — dashed border, muted upload icon, "Drag & drop or click to browse" text; (b) Drag-over — solid primary border, blue glow effect (`box-shadow`), icon scales up, "Drop your file here" text; (c) Uploading — progress bar (percentage + file name), cancel button; (d) Success — checkmark animation (Framer Motion spring), auto-dismiss after 3 seconds; (e) Error — red border, error message ("File too large", "Unsupported format"), retry button.
- File type validation on drop (before upload): reject with inline error for invalid types.
- Accessible: keyboard-operable (Enter/Space to open file picker), `aria-label` on dropzone, `role="button"`, screen reader announces state changes via `aria-live`.
- Mobile: "Upload" button opens native file picker (drag-drop hidden on touch devices).

---

## Epic 3: Aggregator Integration Framework

---

### AA-020
**Title:** Design and Implement IAggregatorAdapter Interface and Adapter Registry

**Description:** As a system architect, I want to define a standard adapter interface for all job aggregators so that new aggregators can be integrated consistently by implementing a well-defined contract.

**Acceptance Criteria:**
- TypeScript interface `IAggregatorAdapter` defined with methods: `login(credentials)`, `searchJobs(query)`, `getJobDetails(jobId)`, `startApplication(jobId)`, `fillApplication(context, profile)`, `submitApplication(context)`, `getApplicationStatus(appId)`, `healthCheck()`, `getMetadata()`.
- Abstract base classes: `ApiAggregatorBase` (for API-based adapters — HTTP client, rate limiter, OAuth handler) and `BrowserAggregatorBase` (for browser-based adapters — Playwright context, proxy manager, cookie jar, anti-detection).
- Adapter Registry service: YAML-based configuration (`adapter-registry.yaml`) with fields per adapter: id, name, type (api/browser/hybrid), region (india/international), enabled (boolean/feature flag), rate limits, proxy config, health check interval, version, maintainer.
- Feature flag integration: adapters can be enabled/disabled without deployment via LaunchDarkly or internal feature flag service.
- Registry API: `GET /v1/adapters` returns list of available adapters with metadata and enabled status.

---

### AA-021
**Title:** Build Aggregator Connection Management Service

**Description:** As a user, I want to connect my job board accounts through a secure credential entry flow so that the AI Engine can access my accounts to apply on my behalf.

**Acceptance Criteria:**
- Connection flow: user clicks "Connect" → MFA step-up → credential modal → credentials encrypted client→server (TLS 1.3) → stored in HashiCorp Vault (see AA-056) → headless login validation → status update.
- Credential modal: username/email input + password input (autocomplete="off"), visibility toggle, authorization consent checkbox, "Connect" button.
- For OAuth-supported aggregators (LinkedIn): OAuth flow instead of credential entry (preferred).
- Validation: on credential submission, system launches headless Playwright browser, attempts login. Success → status: Connected (🟢). Failure → status: Error (🟠) with specific message ("Invalid password", "CAPTCHA required", "Account locked", "Two-factor required").
- Connection record stored in PostgreSQL: `aggregator_connections` table with `vault_secret_path` reference (never stores credentials in DB).
- Event emitted: `aggregator.connected` / `aggregator.connection_failed`.

---

### AA-022
**Title:** Implement Aggregator Connection Health Monitoring

**Description:** As the system, I want to periodically validate all aggregator connections so that users are alerted when credentials expire or sessions become invalid.

**Acceptance Criteria:**
- Scheduled job (Temporal workflow) runs every 6 hours for each active aggregator connection.
- Health check: retrieves credentials from Vault → attempts headless login or session validation → updates connection status.
- Status transitions: Connected → Error (if login fails), Error → Connected (if re-validation succeeds after user updates credentials).
- On status change to Error: emit `aggregator.health.failed` event → Notification Engine sends in-app + email alert: "Your Naukri connection has expired. Please update your credentials."
- Health check results logged in `aggregator_connections.last_validated_at`.
- Dashboard shows last health check time and status for each aggregator.
- Health check respects rate limits — does not count toward user's daily application quota.

---

### AA-023
**Title:** Build Naukri.com Browser Automation Adapter (Indian — P0)

**Description:** As the system, I want to automate the full application lifecycle on Naukri.com so that users' applications are submitted autonomously on India's largest job board.

**Acceptance Criteria:**
- Adapter implements `BrowserAggregatorBase` with Playwright.
- `login()`: navigate to naukri.com/nlogin, fill email/password, handle CAPTCHA if present, verify dashboard loads.
- `searchJobs(query)`: navigate to job search with filters (keywords, location, experience, salary), paginate results, extract: job ID, title, company, location, salary range, JD URL, posted date.
- `getJobDetails(jobId)`: navigate to JD page, extract full JD text, required skills, experience range.
- `fillApplication(context, profile)`: navigate to apply page, detect and fill all form fields (personal info, education, work experience, current CTC, expected CTC, notice period, custom questions). Handle multi-step forms.
- `submitApplication(context)`: click submit, detect confirmation (URL change or success message).
- Rate limiting: max 4 requests/minute, 5–15 second random delay between page navigations.
- Proxy: Indian residential IP (Bright Data).
- Anti-detection: playwright-stealth plugin, randomized viewport/user-agent, human-like mouse/typing behavior.
- Session persistence: cookie jar stored in encrypted Redis (TTL: 24h) to reduce login frequency.
- Error handling: screenshot on failure, categorize as retryable/non-retryable/manual.

---

### AA-024
**Title:** Build LinkedIn API + Browser Hybrid Adapter (Indian + International — P0)

**Description:** As the system, I want to integrate with LinkedIn for both Easy Apply (API) and full application (browser) flows so that users can auto-apply to LinkedIn jobs across Indian and global markets.

**Acceptance Criteria:**
- Hybrid adapter: uses LinkedIn API v2 for Easy Apply jobs, falls back to Playwright browser automation for full application (redirect to company ATS).
- OAuth integration: LinkedIn OAuth 2.0 (3-legged) for API access. Scopes: `r_liteprofile`, `r_emailaddress`, `w_member_social`.
- `searchJobs(query)`: LinkedIn Jobs Search API with filters (keywords, location, remote, experience level).
- Easy Apply: `POST /easy-apply` with profile data, resume file attachment.
- Full Application (browser fallback): detect "Apply on company website" → navigate to external ATS → hand off to Form Filler.
- Rate limiting: respect LinkedIn API rate limits (varies by token). Browser: conservative 2 actions/minute.
- Shared adapter logic for LinkedIn India and LinkedIn Global (same platform, different search parameters).

---

### AA-025
**Title:** Build Indeed API + Browser Hybrid Adapter (International — P0)

**Description:** As the system, I want to integrate with Indeed for both Indeed Apply (API) and custom applications (browser) so that users can auto-apply to jobs on the world's largest job board.

**Acceptance Criteria:**
- API integration: Indeed Apply Partner API. OAuth 2.0 partner authentication.
- `searchJobs(query)`: Indeed Jobs Search API with filters (keywords, location, salary, job type, date posted).
- Indeed Apply: `POST /applications` with resume, contact info, custom question answers.
- Custom applications (browser): for jobs that redirect to employer ATS, launch Playwright and hand off to Form Filler.
- Rate limiting: 50 req/min API limit.
- Proxy: US residential IP for US searches; geo-matched for other regions.
- Handle Indeed's anti-bot measures for browser flow.

---

### AA-026
**Title:** Build ZipRecruiter API Adapter (International — P0)

**Description:** As the system, I want to integrate with ZipRecruiter's Partner API so that users can auto-apply to US mid-market jobs.

**Acceptance Criteria:**
- API-only adapter implementing `ApiAggregatorBase`.
- Authentication: API Key + OAuth 2.0 partner flow.
- `searchJobs(query)`: `GET /jobs` with keyword, location, salary, job type filters.
- `submitApplication(application)`: `POST /apply` with resume file, contact information, answers to pre-screening questions.
- One-click apply support for eligible listings.
- Rate limiting: 100 req/min.
- Error handling for: application limit reached, job no longer available, duplicate application.

---

### AA-027
**Title:** Build Glassdoor Browser Automation Adapter (International — P1)

**Description:** As the system, I want to automate applications on Glassdoor so that users can apply to jobs that are often only listed on Glassdoor or redirect to company ATS pages.

**Acceptance Criteria:**
- Browser-only adapter implementing `BrowserAggregatorBase`.
- Handles Glassdoor's unique pattern: many listings redirect to external company ATS pages. Adapter must detect redirect and adaptively navigate the target ATS.
- `searchJobs(query)`: navigate to Glassdoor job search, apply filters, extract results.
- `fillApplication(context, profile)`: detect if application is on Glassdoor or redirected to ATS (Greenhouse, Lever, Workday, Taleo). For redirected applications: use generic Form Filler logic.
- Common ATS detection: URL pattern matching for greenhouse.io, lever.co, myworkdayjobs.com, taleo.net.
- Proxy: US residential IP. Anti-detection measures enabled.
- Rate limiting: 3 requests/minute.

---

### AA-028
**Title:** Build Foundit (Monster India) Browser Adapter (Indian — P1)

**Description:** As the system, I want to automate applications on Foundit (formerly Monster India) so that users can apply to jobs on India's second-largest job board.

**Acceptance Criteria:**
- Browser-only adapter implementing `BrowserAggregatorBase`.
- `login()`, `searchJobs()`, `fillApplication()`, `submitApplication()` — standard browser automation flow.
- Handle Foundit's form structure: standard multi-field application with resume upload, personal details, work experience, education.
- Indian residential proxy. Anti-detection enabled.
- Rate limiting: 4 requests/minute.
- Session persistence via encrypted cookie jar.

---

### AA-029
**Title:** Build Internshala Browser Adapter (Indian — P1)

**Description:** As the system, I want to automate applications on Internshala so that users targeting internships and fresher-level positions can auto-apply.

**Acceptance Criteria:**
- Browser-only adapter implementing `BrowserAggregatorBase`.
- Handle Internshala's unique features: cover letter required for most applications, "Why should you be hired?" custom question, assessment questions.
- Application flow: navigate to listing → click Apply → fill cover letter (AI-generated) → answer assessment questions (LLM) → submit.
- Target persona: freshers and early-career users (Priya persona).
- Indian residential proxy. Rate limiting: 3 requests/minute.

---

### AA-030
**Title:** Implement Per-Aggregator Rate Limiting and Proxy Rotation

**Description:** As the system, I want to enforce per-aggregator rate limits and rotate residential proxies so that automation activities are not detected or blocked by job boards.

**Acceptance Criteria:**
- Rate limiter (Redis-based) with configurable limits per aggregator: max requests/minute, minimum delay between actions (ms), max concurrent sessions.
- Default limits defined in `adapter-registry.yaml`. Overridable via admin panel without deployment.
- Proxy rotation: integrate with Bright Data (primary) and Oxylabs (fallback) APIs.
- Geo-matching: Indian aggregators → Indian IPs. US aggregators → US IPs. UK aggregators → UK IPs.
- Sticky sessions: same IP used for entire application flow (login → search → apply → confirm). Rotated between flows.
- Cooldown: minimum 30-minute gap between sessions from same IP to same aggregator.
- Proxy health checking: test proxy connectivity before use. Remove failed proxies from pool. Auto-failover to secondary provider.
- Monitoring dashboard: proxy usage, success rate, blocked IPs, cost per aggregator.

---

## Epic 4: Autonomous AI Applier Engine

---

### AA-031
**Title:** Implement Job Discovery Scanner Service

**Description:** As the system, I want to continuously scan all connected aggregators for new job listings matching each user's search criteria so that new opportunities are discovered promptly.

**Acceptance Criteria:**
- Temporal workflow schedules scan per user per connected aggregator at configurable interval (default: 30 minutes).
- Scanner invokes adapter's `searchJobs(query)` with user's configured search queries (roles, locations, experience, salary).
- Results deduplication: compute `dedup_hash` = SHA-256(normalize(title + company + location)). Check against Redis bloom filter (per user) and Elasticsearch fuzzy match (cosine similarity > 0.92 on TF-IDF vectors). Skip already-seen jobs.
- New jobs stored in `job_listings_cache` table with full JD text.
- Event emitted per new job: `jobs.discovered` → Kafka.
- Scanner handles aggregator-specific pagination (load more, next page, infinite scroll).
- Scan latency target: < 2 minutes per aggregator per scan cycle.
- Monitoring: scan success rate, new jobs found per cycle, scan duration per adapter.

---

### AA-032
**Title:** Implement Skill Extraction NLP Pipeline

**Description:** As the system, I want to extract and normalize skills from every discovered job description so that skill-gap analysis and job matching are data-driven.

**Acceptance Criteria:**
- Kafka consumer: processes `jobs.discovered` events.
- NLP pipeline: spaCy custom NER model trained on job description corpus to extract skill mentions.
- Skill normalization: canonical taxonomy (ESCO + O*NET + custom tech skills). Maps variants: "React.js" / "ReactJS" / "React" → `react`. "K8s" / "Kubernetes" → `kubernetes`.
- Additional extraction: experience range (min/max years), education requirements, salary range (if mentioned), location, remote/hybrid/onsite.
- Enriched data indexed into Elasticsearch (JD corpus index) for full-text search and aggregation.
- Event emitted: `jobs.enriched` with extracted skills and metadata.
- Self-hosted Llama 3.1 8B (vLLM) for extraction at scale (cost optimization). GPT-4o-mini as fallback.
- Throughput: process 100 JDs/minute (p95).

---

### AA-033
**Title:** Implement Profile-Job Matching Scorer Service

**Description:** As the system, I want to compute a match score (0–100) between each user's profile and each discovered job so that only relevant jobs are queued for auto-apply.

**Acceptance Criteria:**
- Kafka consumer: processes `jobs.enriched` events.
- Hybrid scoring model with three components:
  - (a) **Keyword match** (weight: 0.3): TF-IDF similarity between resume text and JD text.
  - (b) **Semantic match** (weight: 0.4): cosine similarity between profile embedding (pgvector) and JD embedding (OpenAI `text-embedding-3-large`). JD embedding cached in Redis (TTL: 7 days).
  - (c) **Structural match** (weight: 0.3): binary/scaled checks on experience years (±2 year tolerance), education level, location match, salary alignment, exclusion rule violations.
- Composite score: weighted sum → normalize to 0–100.
- Routing: score ≥ user.autoApplyThreshold (default 70) → emit `apps.queued`. Score ∈ [50, threshold) → emit `apps.review_needed`. Score < 50 → discard (log for analytics).
- Exclusion rules applied before scoring: skip if company in user's exclusion list, title matches excluded keywords, salary below minimum.
- Scoring latency: < 500ms per job (p95).
- Score stored in `application_records.match_score` for analytics.

---

### AA-034
**Title:** Build Application Queue Manager with Priority Scheduling

**Description:** As the system, I want to manage a priority queue of pending applications per aggregator so that higher-value applications are submitted first while respecting rate limits and daily caps.

**Acceptance Criteria:**
- Kafka consumer: processes `apps.queued` events.
- Daily limit check: Redis counter `limits:{userId}:{aggregator}:{date}`. If within limit, proceed. If exceeded, defer to next day.
- Priority scoring: `(matchScore × 0.7) + (freshnessBoost × 0.3)` where freshnessBoost = 100 if posted < 2 hours ago, decaying linearly to 0 at 48 hours.
- BullMQ priority queue per aggregator: `apply:{aggregator}`. Higher priority number = processed first.
- Rate limiting: minimum 30 seconds between dequeues per aggregator (configurable via adapter registry).
- Queue visibility: API endpoint `GET /v1/queue/status` returns per-aggregator queue depth and estimated wait time.
- Dead letter queue: applications that fail 3 times moved to DLQ for investigation.
- Queue dashboard in admin panel: depth, throughput, error rate per aggregator.

---

### AA-035
**Title:** Implement Intelligent Form-Filling Engine (DOM Analysis + Field Mapping)

**Description:** As the system, I want to intelligently detect, analyze, and fill all form fields on job application pages so that applications are completed accurately without human intervention.

**Acceptance Criteria:**
- BullMQ worker dequeues from `apply:{aggregator}` and acquires Playwright container from K8s pool.
- Form field detection (4 strategies in priority order): (1) HTML label/for attribute matching; (2) ARIA attribute extraction (aria-label, aria-describedby); (3) Placeholder/name/id heuristic matching; (4) Parent-child structural analysis (nearby text + input correlation).
- Field-to-profile mapping rules engine: deterministic rules for common fields (name, email, phone, experience years, salary, notice period, location, LinkedIn URL). Calculated fields: "years of experience" = today − earliest work start date.
- File upload: `page.setInputFiles()` for resume and cover letter fields. Handles both standard file inputs and drag-and-drop upload zones.
- Locale-aware formatting: salary in LPA (India) or USD/year (US). Date format per locale.
- Dynamic field handling: after each field fill, `waitForSelector(2000)` to detect conditional fields. Re-scan DOM if new fields appear. Max 10 iterations (prevent infinite loops).
- Multi-step form handling: detect and click "Next"/"Continue" buttons. Track step count. Re-run field detection on each new step.
- Human-like behavior: char-by-char typing (50–150ms delay), Bezier curve mouse movements, random pauses (1–3s) between sections.
- Screenshot capture (if user has enabled preview mode) before submission.

---

### AA-036
**Title:** Implement Visual LLM Fallback for Ambiguous Form Fields

**Description:** As the system, I want to use GPT-4o Vision as a fallback to identify form fields that cannot be reliably detected through DOM analysis alone so that complex or non-standard application forms are still filled correctly.

**Acceptance Criteria:**
- Triggered when DOM-based field detection confidence is < 80% or when unmatched fields remain after rule-based mapping.
- Capture screenshot of the form section (viewport-sized, PNG).
- Send to GPT-4o Vision API with prompt: "Identify all form fields in this image. For each, provide: label, type (text/select/radio/checkbox/file), options (if applicable), required status, and bounding box coordinates."
- Merge Vision results with DOM analysis: DOM takes priority for element interaction (selectors), Vision takes priority for labeling.
- Cost control: Vision fallback limited to max 3 calls per application (budget cap).
- Logging: record when Vision fallback was used, confidence delta, and accuracy (manual QA sampling).

---

### AA-037
**Title:** Implement Custom Question Answering via LLM

**Description:** As the system, I want to intelligently answer custom/free-text questions on job applications using LLM inference so that applications are complete even with non-standard questions.

**Acceptance Criteria:**
- Question classification: (a) **Factual/Profile-Based** — regex matching on question text → profile field lookup (no LLM needed). Examples: "Years of Python?", "Are you authorized to work in US?", "Willing to relocate?". (b) **Behavioral/Narrative** — requires LLM. Examples: "Why do you want to work here?", "Describe a challenging project." (c) **Salary/Negotiation** — user preference with configurable buffer (+10%).
- LLM prompt for behavioral questions: system prompt (career coach writing answers on behalf of user), user profile context (parsed resume summary, key experiences), JD context (title, company, requirements), company context (scraped About page summary), question text. Output: 100–200 word first-person response.
- Answer caching: `hash(question_normalized + job_category)` → Redis (TTL: 7 days). Reuse for semantically identical questions.
- Answer quality validation: minimum 50 words for free-text, no placeholder text, no self-referential AI language ("As an AI...").
- Token budget: max 2000 input tokens + 500 output tokens per custom question.

---

### AA-038
**Title:** Implement CAPTCHA Detection and Resolution Pipeline

**Description:** As the system, I want to detect and resolve CAPTCHAs encountered during application submission so that applications are not blocked by anti-automation measures.

**Acceptance Criteria:**
- CAPTCHA classifier: detect CAPTCHA type from DOM/page analysis: reCAPTCHA v3 (invisible), reCAPTCHA v2 (checkbox/image), hCaptcha, FunCaptcha (Arkose Labs), text/math CAPTCHA, unknown.
- reCAPTCHA v3: maintain high trust score via human-like browsing patterns. Usually passes silently.
- reCAPTCHA v2 / hCaptcha: send challenge to 2Captcha API (primary) or Anti-Captcha API (fallback). Inject solution token via JavaScript. Timeout: 60 seconds. Cost: ~$2–3 per 1000 solves.
- Text/Math CAPTCHA: attempt OCR via self-hosted model. Fallback to solving service.
- Unsolvable CAPTCHAs (FunCaptcha, unknown types): capture screenshot, emit `apps.needs_manual` event with screenshot URL and deep link to application page. Notify user: "This application requires manual CAPTCHA completion."
- Budget controls: max $2.00 CAPTCHA spend per user per day. Max 3 CAPTCHA attempts per application. If budget exceeded, queue for manual intervention.
- Monitoring: CAPTCHA encounter rate per aggregator, solve rate, cost per aggregator.

---

### AA-039
**Title:** Implement Application Submission and Confirmation Detection

**Description:** As the system, I want to detect whether an application was successfully submitted after clicking the submit button so that application records accurately reflect outcomes.

**Acceptance Criteria:**
- After clicking submit button (identified via text content "Submit", "Apply", "Send Application" + button/input[type=submit] selectors):
  - (a) Detect URL change to confirmation page (URL contains "success", "confirm", "thank", "applied").
  - (b) DOM scan for success message patterns ("Application submitted", "Thank you for applying", "Your application has been received").
  - (c) Detect error messages (validation errors, "already applied", "position filled").
  - (d) Timeout after 15 seconds → ambiguous outcome.
- On confirmed success: emit `apps.submitted` with evidence (URL, screenshot, confirmation text).
- On confirmed failure: categorize — (a) Retryable (network timeout, session expired) → re-enqueue with exponential backoff (max 2 retries); (b) Non-retryable (already applied, position closed) → emit `apps.failed` with reason.
- On ambiguous: emit `apps.ambiguous` → log for manual review, count as "Submitted (unconfirmed)".
- Release Playwright container back to pool immediately after submission (or failure).

---

### AA-040
**Title:** Build Application Record Writer and Activity Feed Data Layer

**Description:** As the system, I want to persistently record every application attempt with full metadata so that users can track their application history and the system can compute analytics.

**Acceptance Criteria:**
- Kafka consumer: processes `apps.submitted`, `apps.failed`, `apps.needs_manual`, `apps.ambiguous` events.
- Record written to `application_records` table: id, userId, jobListingId, aggregatorId, matchScore, resumeVariantId, coverLetterText, coverLetterMode, status, failureReason, screenshotS3Key, submittedAt, createdAt.
- Table partitioned by `submitted_at` (monthly) for query performance.
- Indexes: `(user_id, submitted_at DESC)`, `(user_id, aggregator_id, status)`.
- On write: broadcast to WebSocket room `user:{userId}:activity` for real-time Activity Feed update.
- Daily aggregation job: compute per-user daily summary (total applied, per-aggregator breakdown, match score distribution, failure count) → stored in analytics table + emitted for daily email.

---

### AA-041
**Title:** Implement Containerized Browser Pool Manager on Kubernetes

**Description:** As the system, I want to manage a pool of ephemeral Playwright browser containers on Kubernetes so that browser automation scales dynamically with application load.

**Acceptance Criteria:**
- Playwright containers: Docker image based on `mcr.microsoft.com/playwright:v1.42`. Resource limits: 1 CPU, 2GB RAM per container.
- K8s Jobs: each application spawns a Job with `ttlSecondsAfterFinished: 600` (10-min cleanup).
- Pool sizing: min 5, max 200 containers (launch). Scaling metric: `apply:{aggregator}` queue depth / average processing time.
- Node group: `browser-pool` (c6i.xlarge instances). Auto-scaling: 5–50 nodes based on pending Jobs.
- Container configuration: geo-matched proxy (injected via environment variable), randomized viewport size, randomized User-Agent, timezone matching aggregator region.
- Anti-detection: `playwright-extra` + `playwright-stealth` plugin installed in container image.
- Container lifecycle: acquire → configure proxy → execute adapter flow → release. Max TTL: 10 minutes.
- Monitoring: pool utilization, container startup latency, execution duration, failure rate.

---

### AA-042
**Title:** Build Resume Variant Auto-Selection Logic

**Description:** As the system, I want to automatically select the best resume variant for each job application so that the most relevant resume is used without manual user intervention.

**Acceptance Criteria:**
- For each queued application: compute cosine similarity between each resume variant's embedding and the JD embedding.
- Selection rule: use the variant with the highest similarity if it scores > 5% higher than the primary variant. Otherwise, use the primary variant.
- Selection logged in `application_records.resume_variant_id` for analytics.
- If user has only 1 variant: always use that variant (no comparison needed).
- Selection latency: < 200ms (embeddings pre-computed and cached).

---

## Epic 5: Market Analysis & Skill-Gap Feedback

---

### AA-043
**Title:** Build JD Corpus Ingestion and Elasticsearch Indexing Pipeline

**Description:** As the system, I want to ingest and index all discovered job descriptions into a searchable corpus so that market trend analysis and skill-gap feedback are data-driven.

**Acceptance Criteria:**
- All JDs from `jobs.discovered` events indexed into Elasticsearch index `jd-corpus-{yyyy-mm}` (monthly indices).
- Index mapping: title (text + keyword), company (keyword), location (keyword), skills (keyword array), experience_range (integer_range), salary_range (object), posting_date (date), aggregator (keyword), jd_text (text — full-text searchable).
- Index lifecycle management (ILM): hot (30 days, SSD) → warm (90 days, HDD) → delete (365 days).
- Deduplication at index time: skip if `dedup_hash` already exists in index.
- Target corpus size: 1M+ JDs within 6 months.
- Query performance: < 200ms for aggregation queries (skill frequency, trend time-series).

---

### AA-044
**Title:** Implement Personalized Skill-Gap Analysis Engine

**Description:** As a user, I want to see which in-demand skills I'm missing from my profile so that I know exactly what to learn to become more competitive.

**Acceptance Criteria:**
- For each user: query Elasticsearch for JDs matching user's target roles and locations (last 90 days).
- Extract top 20 most demanded skills from matching JDs (by frequency percentage).
- Compare against user's extracted skills from parsed profile.
- Generate gap matrix: `{ skill, demandPercentage, userHasSkill, gapSeverity }`.
- Gap severity: Critical (demand > 70% + user missing), High (demand > 50% + user missing), Medium (demand > 30% + user missing), Low (demand < 30% or user has skill).
- Cache result per user (Redis, TTL: 24 hours). Invalidate on profile update or preference change.
- API endpoint: `GET /v1/insights/skill-gap` returns gap matrix sorted by severity.
- Recalculated daily via scheduled Temporal workflow.

---

### AA-045
**Title:** Implement Skill Demand Trend Analysis

**Description:** As a user, I want to see how demand for specific skills is trending over time so that I can prioritize learning skills that are growing in relevance.

**Acceptance Criteria:**
- Time-series analysis: for each skill in user's target roles, compute weekly demand percentage over 30/60/90-day windows.
- Trend classification: "Rising" (> 10% increase over 90 days), "Stable" (±10%), "Declining" (> 10% decrease).
- Data stored in TimescaleDB (time-series optimized) with hypertables partitioned by week.
- API endpoint: `GET /v1/insights/trends?skills=docker,kubernetes&window=90d` returns time-series data for charting.
- Frontend: bar chart (Recharts) showing trending skills with up/down/stable indicators.
- Updated weekly via batch Temporal workflow.

---

### AA-046
**Title:** Build AI-Powered Resume Improvement Suggestion Engine

**Description:** As a user, I want AI-generated, actionable suggestions for improving my resume so that my applications are more effective.

**Acceptance Criteria:**
- Input: user's parsed profile + skill-gap analysis + top 50 JDs matched.
- GPT-4o prompt: "Analyze this resume against the top skills demanded in [target roles]. Generate specific, actionable improvement suggestions."
- Suggestion categories: (a) Missing keywords to add (with specific section placement); (b) Bullet points to rewrite for quantified impact (show current → suggested); (c) Sections to add/remove; (d) ATS formatting fixes.
- Each suggestion linked to data: "82% of Backend Developer JDs you match require Docker experience" — with drill-down to specific JDs.
- Suggestions prioritized by estimated impact: High / Medium / Low.
- "Apply to Resume" button: pre-populates resume editor with suggested change.
- Cached per user (Redis, TTL: 7 days). Regenerated on resume edit or weekly.
- Max 10 suggestions per analysis run.

---

### AA-047
**Title:** Implement Competitive Positioning Score

**Description:** As a user, I want to know how my profile compares to other applicants for my target roles so that I understand my competitive standing.

**Acceptance Criteria:**
- Requires minimum platform user base (> 1000 users with similar target roles) to generate meaningful comparisons.
- Compute percentile ranking: "You are more competitive than X% of applicants for [Role] in [Region]."
- Methodology: compare user's profile embedding against anonymized aggregate of all platform users targeting same role + region. Percentile based on match score distribution.
- Privacy: no individual user data exposed. Only aggregated percentile. Minimum anonymity set: 20 users.
- API endpoint: `GET /v1/insights/competitiveness` returns `{ role, region, percentile, sampleSize }`.
- Frontend: gauge/meter visualization. "Your Backend Developer competitiveness in India: Top 34%."
- Updated weekly. Flagged as "Beta" until sufficient user base.

---

### AA-048
**Title:** Build Learning Path Recommendation Engine

**Description:** As a user, I want recommended courses and certifications for each skill gap so that I have a clear path to closing those gaps.

**Acceptance Criteria:**
- For each identified skill gap: recommend 1–3 learning resources.
- Resource database: curated list of courses from Coursera, Udemy, official certifications (AWS, Google Cloud, etc.), YouTube channels, documentation links. Stored in PostgreSQL with fields: skill (FK to taxonomy), title, provider, URL, estimated hours, cost (free/paid), rating.
- Recommendation prioritization: `gapSeverity × marketDemand × (1 / estimatedHours)` — prioritize high-impact, low-effort learning.
- API endpoint: `GET /v1/insights/learning-paths` returns learning recommendations grouped by skill gap.
- Frontend: integrated into Skill-Gap list view. Each gap shows "📚 Recommended: [Course Name] ([Provider], [Hours]h)".
- Resource database updated monthly (manual curation + automated scraping).

---

### AA-049
**Title:** Build Interactive Skill-Gap Radar Chart Component

**Description:** As a user, I want to see an interactive radar chart visualizing my skill coverage vs. market demand so that I can quickly identify areas for improvement.

**Acceptance Criteria:**
- Recharts `RadarChart` component with two data series: (1) User's skills (solid fill, primary color, 30% opacity), (2) Market demand (dashed line, accent color).
- Axes: top 8–12 skills from skill-gap analysis. Each axis labeled with skill name.
- Interactive: hover on data point shows tooltip: "Docker — Market demand: 82% | Your coverage: 0%".
- Click on data point: drills down to skill detail (which JDs mention it, learning recommendations).
- Responsive: full radar on desktop. Horizontal bar chart on mobile (radar too small).
- Data from `GET /v1/insights/skill-gap` API. Refreshed via TanStack Query (stale time: 10 min).
- Accessible: data also available as table below chart for screen readers. `aria-label` on chart SVG.

---

### AA-050
**Title:** Implement Weekly Insight Digest Email and In-App Report

**Description:** As a user, I want to receive a weekly summary of market insights, skill-gap changes, and application performance so that I stay informed without actively checking the dashboard.

**Acceptance Criteria:**
- Scheduled Temporal workflow: runs every Monday at 9 AM in user's configured timezone.
- Digest content: (a) Applications submitted this week (total, per-aggregator breakdown, vs. previous week); (b) Average match score (trend); (c) New skill-gap changes ("Docker demand increased 8%"); (d) Resume score changes; (e) Top suggestion of the week.
- Email: HTML template (MJML) rendered with user-specific data, sent via SendGrid/SES. Unsubscribe link in footer.
- In-app: WeeklyDigestCard component on AI Insights page. Archive of past digests accessible via week selector.
- User can configure: opt-in/opt-out, delivery day, delivery time.

---

## Epic 6: Live Activity Feed & Notifications

---

### AA-051
**Title:** Build Real-Time Activity Feed with WebSocket Updates

**Description:** As a user, I want to see a live, real-time feed of all AI application activities so that I can monitor what the AI Engine is doing on my behalf.

**Acceptance Criteria:**
- Activity Feed page (`/activity`) displays chronological list of all application attempts.
- Data source: TanStack Query fetching from `GET /v1/applications?page=1&limit=50` with filters.
- Real-time updates: Socket.IO WebSocket connection. On `application:submitted` / `application:failed` / `application:progress` / `application:review` events → TanStack Query cache invalidation → UI updates.
- New items animate in from top (Framer Motion `slideIn`).
- For in-flight applications (`filling` status): real-time progress bar showing "Step 2 of 4: Filling work experience..." updated via WebSocket `application:progress` events.
- Virtualized list (@tanstack/react-virtual) for performance with 1000+ items.
- Infinite scroll pagination: load 50 more items on scroll to bottom.
- Empty state: "No applications yet. Connect an aggregator and start applying!" with CTA button.

---

### AA-052
**Title:** Implement Activity Feed Filters and Search

**Description:** As a user, I want to filter and search my application history by status, aggregator, date range, and match score so that I can find specific applications quickly.

**Acceptance Criteria:**
- Filter bar at top of Activity Feed with: Status dropdown (All, Submitted, Pending, Failed, Needs Review), Aggregator dropdown (All, Naukri, LinkedIn, Indeed, etc.), Date range picker, Match score range slider (0–100).
- Filters applied as query parameters to API: `GET /v1/applications?status=submitted&aggregator=naukri&from=2026-07-01&to=2026-07-18&minScore=70`.
- Filters persisted in URL (shareable, bookmarkable) and in Zustand `useFilterStore`.
- Result count shown: "Showing 142 of 243 applications".
- Quick filter pills: "Submitted (198)", "Pending (12)", "Failed (8)", "Needs Review (25)" — clickable to toggle.
- Search: text search across job title and company name (Elasticsearch query on backend).

---

### AA-053
**Title:** Build Application Detail View with Form Screenshot and Metadata

**Description:** As a user, I want to view the full details of any application including the match score breakdown, resume used, cover letter generated, and form screenshot so that I have complete transparency into what the AI submitted.

**Acceptance Criteria:**
- Application Detail page (`/activity/{id}`) displays: job title, company name, aggregator, job URL (external link), posting date, applied date, match score (with breakdown: keyword %, semantic %, structural %), resume variant used, cover letter text (if AI-generated), status with timeline, failure reason (if failed), form screenshot (if captured, displayed as zoomable image).
- Match score breakdown: three progress bars showing individual component scores.
- Cover letter: displayed in formatted text block with "Copy" button.
- Screenshot: lazy-loaded from S3 presigned URL. Click to open full-size in modal. Only shown if user had screenshot mode enabled.
- "Reapply" button for failed applications: re-queues with current profile (if job still active).
- Back navigation: returns to Activity Feed with preserved filter state.

---

### AA-054
**Title:** Implement In-App Notification Center

**Description:** As a user, I want to see a notification bell with unread count and a dropdown of recent notifications so that I'm aware of important events without checking each page.

**Acceptance Criteria:**
- Bell icon in top bar with unread count badge (red dot with number).
- Click opens dropdown panel (Radix Popover): list of recent notifications (latest 20).
- Notification types: application submitted (green), application failed (red), aggregator disconnected (orange), new insights available (blue), system announcement (gray).
- Each notification: icon, title, description, relative timestamp ("2 min ago"), read/unread indicator (bold vs. normal).
- Click notification: marks as read + navigates to relevant page (application detail, aggregator page, insights page).
- "Mark all as read" button in panel header.
- Real-time: WebSocket `notification:new` event → increment badge count + prepend to notification list.
- API: `GET /v1/notifications?unread=true` and `PATCH /v1/notifications/{id}/read`.
- Accessible: `aria-label="Notifications, 3 unread"` on bell button. Notification panel has `role="dialog"`.

---

### AA-055
**Title:** Implement Email Notification Engine (Daily Summary, Weekly Insights, Alerts)

**Description:** As the system, I want to send transactional emails to users for daily application summaries, weekly insight digests, and critical alerts so that users stay informed.

**Acceptance Criteria:**
- Email provider: SendGrid (primary) for high deliverability. AWS SES (fallback).
- Email types: (a) Daily summary (configurable time, default 8 PM user timezone): total applied, per-aggregator breakdown, failures requiring attention. (b) Weekly insight digest (see AA-050). (c) Connection alert: "Your Naukri connection has expired." (d) Security alert: "New login from [device] in [location]." (e) Account alerts: password changed, MFA enabled/disabled, deletion initiated.
- HTML templates: MJML → HTML rendering. Responsive design. Brand-consistent (Nexus UI colors).
- User preferences: per-type opt-in/opt-out. Frequency: real-time / daily / weekly. "Unsubscribe" link in every email (one-click, CAN-SPAM compliant).
- Delivery tracking: SendGrid webhook handlers for `delivered`, `bounced`, `opened`, `clicked`. Stored in notification log.
- Rate limiting: max 10 emails per user per day (across all types).

---

### AA-056
**Title:** Build WebSocket Gateway for Real-Time Event Broadcasting

**Description:** As the system, I want a WebSocket gateway that broadcasts backend events to connected browser clients in real-time so that the Activity Feed, notifications, and aggregator status update live.

**Acceptance Criteria:**
- NestJS `@WebSocketGateway` with Socket.IO adapter.
- Redis adapter for multi-instance pub/sub (all gateway pods share events via Redis Pub/Sub).
- User authentication: JWT validated on WebSocket handshake. Reject unauthenticated connections.
- Room-based isolation: each user auto-joined to `user:{userId}` room. Events broadcast only to the user's room (never cross-user).
- Kafka consumer: listens to Kafka topics (`apps.submitted`, `apps.failed`, `apps.progress`, `aggregator.health`, `notification.events`) → transforms events → broadcasts to appropriate user rooms.
- Event types emitted to client: `application:progress`, `application:submitted`, `application:failed`, `application:review`, `aggregator:status`, `notification:new`, `engine:status`, `insight:updated`.
- Connection management: heartbeat 25s interval, 5s timeout. Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s). On reconnect: full state resync (fetch missed events since last received event ID).
- Rate limiting: max 100 events/min per user (server-side throttle).
- Monitoring: connected users count, events/sec, connection errors.

---

### AA-057
**Title:** Implement Daily Application Summary Aggregation Job

**Description:** As the system, I want to compute a daily application summary for each user at their configured time so that the daily summary email and in-app digest contain accurate, aggregated data.

**Acceptance Criteria:**
- Temporal scheduled workflow: triggered at user's configured summary time (default 8 PM user timezone).
- Aggregation query: from `application_records` where `user_id = X` and `submitted_at` between start-of-day and now.
- Summary fields: total submitted, per-aggregator counts, average match score, score distribution (buckets: 50-59, 60-69, 70-79, 80-89, 90-100), failure count by reason, top 3 highest-scoring applications.
- Summary stored in `daily_summaries` table for historical reference.
- Emitted to Notification Engine for email delivery.
- Available via API: `GET /v1/summaries/daily?date=2026-07-18`.

---

## Epic 7: Security, Compliance & Credential Vaulting

---

### AA-058
**Title:** Deploy and Configure HashiCorp Vault with HSM-Backed Seal

**Description:** As a security engineer, I want to deploy a production-grade HashiCorp Vault cluster with HSM-backed auto-unseal so that user aggregator credentials are encrypted with the highest available security.

**Acceptance Criteria:**
- Vault cluster: 3 nodes across 3 AZs in ap-south-1 (Mumbai). HA mode with Consul storage backend.
- Seal provider: AWS CloudHSM (FIPS 140-2 Level 3). Auto-unseal configured.
- Shamir's Secret Sharing: 5 key shares, 3 required for manual unseal (break-glass only).
- Secrets engines enabled: KV v2 (for credential storage), Transit (for envelope encryption).
- Transit key created: `user-credentials`, type: `aes256-gcm96`, auto-rotation: 90 days.
- Audit backends: file (local) + syslog (→ Datadog Logs). All operations logged.
- Vault policies created: `aggregator-service`, `form-filler`, `scanner`, `admin-readonly`, `key-rotation` (as specified in SAD Section 2.2).
- AppRole auth method configured for each service with unique role_id and auto-rotating secret_id (TTL: 24h).
- DR replication to us-east-1 (3-node secondary cluster, read-only).
- Terraform module for repeatable deployment.

---

### AA-059
**Title:** Implement Credential Encryption/Decryption Service Using Vault Transit

**Description:** As the system, I want to encrypt user aggregator credentials using Vault's Transit secrets engine with envelope encryption so that credentials are never stored in plaintext.

**Acceptance Criteria:**
- Encryption flow (write path): Aggregator Service requests DEK from Vault Transit (`POST /v1/transit/datakey/plaintext/user-credentials`). Encrypt credential with DEK (AES-256-GCM, random 96-bit IV). Store encrypted credential + encrypted DEK + IV + auth tag in Vault KV at path `secret/data/users/{userId}/aggregators/{aggId}`. Zero plaintext from memory immediately.
- Decryption flow (read path): Form Filler/Scanner reads encrypted payload from Vault KV. Decrypts DEK via Vault Transit (`POST /v1/transit/decrypt/user-credentials`). Decrypts credential with DEK. Uses credential for login. Zeros from memory immediately after use.
- Credential lifecycle: stored on connect, read on each application/health check, updated on credential change, deleted on disconnect/account deletion.
- Audit: every read/write to Vault KV logged with actor, resource, purpose, trace_id.
- Integration tests: verify encryption round-trip, key rotation compatibility, concurrent access safety.

---

### AA-060
**Title:** Implement API Gateway Security Layer (JWT Validation, Rate Limiting, WAF)

**Description:** As the system, I want the API Gateway to enforce authentication, rate limiting, and request sanitization so that the application tier is protected from unauthorized and malicious requests.

**Acceptance Criteria:**
- API Gateway (Kong on EKS or AWS API Gateway) deployed as ingress to all backend services.
- JWT validation: verify RS256 signature, issuer (`autoapply.ai`), audience, expiry. Reject expired/invalid tokens with 401.
- Rate limiting (Redis-backed): per-user (100/300/1000 req/min by tier), per-IP (500 req/min). 429 response with `Retry-After` header.
- Request sanitization: max body size (10MB), max header size (16KB), max URL length (8KB).
- CORS: allowed origins whitelist (`https://app.autoapply.ai`, `https://staging.autoapply.ai`). No wildcards.
- Security headers applied to all responses: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy.
- AWS WAF rules: OWASP Core Rule Set, rate-based rules (DDoS mitigation), known-bad-input rules, bot control.
- Access logging: all requests logged with userId, path, method, status, latency, IP.

---

### AA-061
**Title:** Implement Service-to-Service mTLS via Istio Service Mesh

**Description:** As a security architect, I want all inter-service communication to be encrypted and mutually authenticated via mTLS so that no service can be impersonated within the cluster.

**Acceptance Criteria:**
- Istio service mesh deployed on EKS cluster with sidecar injection enabled for all application namespaces.
- `PeerAuthentication` policy: STRICT mode (mTLS required for all inter-service communication).
- `AuthorizationPolicy`: per-service allow-lists defining which services can communicate. Example: only `form-filler` and `scanner` can access `aggregator-service`'s credential endpoints.
- Certificate management: Istio's built-in CA with auto-rotation (24-hour certificate TTL).
- Monitoring: mTLS connection success/failure metrics in Istio dashboard (Kiali).
- Exception: API Gateway → services use mTLS. External traffic (CDN → API Gateway) uses standard TLS 1.3.

---

### AA-062
**Title:** Implement PostgreSQL Row-Level Security (RLS) for Data Isolation

**Description:** As a security engineer, I want to enforce row-level security in PostgreSQL so that even if a service has a database connection, it can only access data belonging to the authenticated user.

**Acceptance Criteria:**
- RLS enabled on tables: `users`, `parsed_profiles`, `resume_variants`, `aggregator_connections`, `application_records`.
- Policy: `USING (user_id = current_setting('app.current_user_id')::uuid)` on all user-scoped tables.
- Application sets session variable before each query: `SET app.current_user_id = '{userId}'`.
- Admin/system queries use a separate database role with `BYPASSRLS` for batch operations (audit-logged).
- RLS policies tested with integration tests: verify user A cannot read user B's data even with direct SQL.
- Performance impact assessed: index on `user_id` ensures RLS filter is index-backed.

---

### AA-063
**Title:** Implement Vault Audit Anomaly Detection and Auto-Response

**Description:** As a security engineer, I want automated anomaly detection on Vault audit logs so that suspicious credential access patterns trigger immediate protective responses.

**Acceptance Criteria:**
- Anomaly detection rules (processed via Flink or Datadog Security Monitoring):
  - (a) Excessive reads: > 100 credential reads/min from single service → auto-revoke token + P1 alert.
  - (b) Unauthorized IP: credential access from IP outside K8s pod CIDR → auto-deny + P1 alert.
  - (c) Bulk enumeration: reading credentials for > 50 different users in 5 min → auto-seal Vault + P0 incident.
  - (d) Off-hours access: credential reads between 2–6 AM local time with no active applications → flag for review.
  - (e) Failed auth spike: > 20 failed Vault auth attempts/min → block source + P1 alert.
- Auto-response actions implemented as Datadog monitors triggering PagerDuty incidents + webhook-based remediation (token revocation, Vault seal).
- Weekly audit review: security team reviews flagged events. False positive tuning.
- Monthly report: credential access patterns, anomaly count, response times.

---

### AA-064
**Title:** Implement GDPR Data Processing Records and Consent Management

**Description:** As a compliance officer, I want to maintain records of all data processing activities and user consent so that the platform is auditable and compliant with GDPR and DPDP Act.

**Acceptance Criteria:**
- Consent records table: `user_consents` with columns: userId, consentType (tos, privacy_policy, ai_processing, aggregator_{id}_credential, marketing_email), granted (boolean), grantedAt (timestamp), revokedAt (timestamp), ipAddress, userAgent, version (consent text version).
- Consent collected at: registration (ToS, Privacy Policy, AI Processing), aggregator connection (per-aggregator credential consent), marketing opt-in (optional).
- Consent withdrawal: user can revoke any consent via Settings page. Revocation of "AI Processing" consent: AI Engine paused, existing applications not affected, future applications blocked.
- Data processing records (Article 30): maintained as living document, updated on processing changes. Records: purpose, categories of data, recipients, retention periods, security measures.
- Consent audit API: `GET /v1/compliance/consents?userId={id}` (admin-only) returns full consent history.
- Consent banner: cookie consent (OneTrust or equivalent CMP) for marketing/analytics cookies.

---

### AA-065
**Title:** Implement Automated Security Scanning in CI/CD Pipeline

**Description:** As a security engineer, I want automated security scans running on every PR and deployment so that vulnerabilities are caught before reaching production.

**Acceptance Criteria:**
- SAST (Static Analysis): Semgrep with custom rules for: SQL injection, XSS, hardcoded secrets, insecure crypto. Runs on every PR. Blocks merge on Critical findings.
- Dependency scanning: Snyk or Dependabot. Daily scan of all dependencies. Critical CVE SLA: patched within 48 hours. Weekly vulnerability report to security team.
- Container scanning: Trivy scans every Docker image on build. Block deployment if Critical/High CVEs in base image.
- IaC scanning: tfsec + checkov on every Terraform PR. Check for: public S3 buckets, open security groups, unencrypted storage, missing logging.
- Secrets scanning: gitleaks on every commit. Block push if secrets detected.
- DAST (Dynamic Analysis): OWASP ZAP automated scan against staging environment nightly. Results triaged weekly.
- Security gate in CI: all scans must pass (Critical = block, High = warning) before merge/deploy.

---

## Epic 8: Frontend Shell, Design System & Core Views

---

### AA-066
**Title:** Initialize Next.js 14 Project with App Router and Design System Foundation

**Description:** As a frontend engineer, I want to bootstrap the Next.js application with the App Router, Tailwind CSS configuration, and core design system tokens so that all subsequent frontend work builds on a consistent foundation.

**Acceptance Criteria:**
- Next.js 14 project initialized with App Router (`app/` directory), TypeScript, Tailwind CSS 3.
- `tailwind.config.ts` configured with Nexus UI design tokens: colors (primary, accent, neutral, semantic), typography (Inter, JetBrains Mono via Google Fonts), spacing, border-radius, shadows, animations.
- Global styles: CSS reset, dark/light theme support via `data-theme` attribute, CSS custom properties for runtime theme switching.
- Layout: root layout (`app/layout.tsx`) with `<html lang="en" data-theme="dark">`, font loading, metadata (title, description, viewport).
- ESLint + Prettier configured with accessibility rules (`eslint-plugin-jsx-a11y`).
- Storybook initialized for component development.
- Bundle analyzer configured. Target: < 200KB initial JS (gzipped).
- pnpm workspace configured. Turbopack dev server verified working.

---

### AA-067
**Title:** Build Application Shell with Sidebar Navigation and Top Bar

**Description:** As a user, I want a consistent application shell with sidebar navigation and top bar so that I can navigate between all sections of the platform.

**Acceptance Criteria:**
- Sidebar component (260px expanded, 72px collapsed): logo, main nav items (Dashboard, My Assets, Aggregators, Activity Feed, AI Insights), manage section (Preferences, Subscription), footer (Help, Theme Toggle, User Profile card).
- Collapse/expand toggle with smooth animation (Framer Motion, 200ms).
- Active nav item highlighted with primary color background + left border accent.
- Badge counts on nav items: Activity Feed (unread count), Aggregators (connected/total).
- Top bar (64px): global search (Cmd+K shortcut opens command palette), notification bell (AA-054), user avatar + dropdown (Settings, Logout).
- Responsive: sidebar hidden on mobile, replaced by bottom tab bar (5 icons). Hamburger menu for secondary items.
- Sidebar state (collapsed/expanded) persisted in localStorage via Zustand.
- All nav items keyboard-navigable. Screen reader announces current page.

---

### AA-068
**Title:** Build Dashboard (Home) Page with Overview Stats and Quick Actions

**Description:** As a user, I want a dashboard showing key metrics, recent activity, and quick actions so that I get an instant overview of my application automation status.

**Acceptance Criteria:**
- Stat cards row: "Applications Today" (count + daily limit bar), "This Week" (count + vs. last week trend), "Connected Aggregators" (count / total), "Average Match Score" (number + trend).
- AI Engine status banner: Active (green, "AI is applying to jobs") / Paused (yellow, "Paused") / Error (red, error message). Toggle button to pause/resume.
- Quick actions: "Upload New Resume", "Connect Aggregator", "View Insights" — card buttons.
- Recent activity mini-feed: last 5 applications with status. "View All" link to Activity Feed.
- Skills improvement nudge: top 1 skill gap with CTA: "72% of your target roles need Docker. View learning path →".
- Data fetched via TanStack Query. Polling interval: 30 seconds for stats, 60 seconds for activity.
- Skeleton loading states for all cards during initial fetch.
- Fully responsive: stat cards stack on mobile (2×2 grid on tablet, single column on phone).

---

### AA-069
**Title:** Build Aggregator Matrix View Page (Twin-Column UI)

**Description:** As a user, I want to view all available aggregators in a twin-column layout separating Indian and International platforms so that I can manage my job board connections.

**Acceptance Criteria:**
- Twin-column layout: Indian (🇮🇳) and International (🌍) columns with sticky headers showing count.
- CSS Grid: `grid-template-columns: 1fr 1fr` (desktop). Single column with tabs on mobile (< 768px).
- AggregatorCard component for each platform: logo (from static assets), name, connection status indicator (4 states per AA component specs), last sync time, application count, "Configure" and "Disconnect" buttons (connected state), "Connect" button (disconnected state), "Pro Plan Required" lock badge (tier-restricted).
- Connected cards sorted to top of each column. Disconnected cards below.
- Summary bar: "Connected: 3 of 16 | Daily applications: 38/50 used".
- "Connect" click: opens credential modal (AA-021) with MFA step-up.
- "Configure" click: opens side drawer with per-aggregator settings (daily limit, search queries, exclusion lists).
- All data from `GET /v1/aggregators` API. Real-time status updates via WebSocket `aggregator:status` events.

---

### AA-070
**Title:** Build Asset Management Page with Upload Zone and Resume/CL Cards

**Description:** As a user, I want to view and manage all my resumes and cover letters on a single page with upload capability so that my career assets are organized and accessible.

**Acceptance Criteria:**
- Page header: "My Assets" with subheading "Manage your resumes and cover letters".
- Upload zone (AA-019) at top of page.
- Resumes section: "Resumes (X of 5)" header with "[+ New Variant]" button. Grid of ResumeCard components (AA component specs) showing: name, ATS score bar, skill tags, last updated, version count, usage count, action buttons (Edit, Preview, Set Primary, Download, Delete).
- Cover Letters section: CoverLetterModeSelector (radio group: Full Auto / Review Queue / Template Only). Base template card with edit/preview. Last 5 AI-generated cover letters as compact list items (first line of text, aggregator, date).
- Data from `GET /v1/assets/resumes` and `GET /v1/assets/cover-letters`.
- Optimistic updates on delete, mode change, and primary selection.

---

### AA-071
**Title:** Build AI Insights Page with Tabbed Interface and Charts

**Description:** As a user, I want an AI Insights page with tabs for Skill Gap, Market Trends, Resume Score, and Competitiveness so that I can access all career intelligence in one place.

**Acceptance Criteria:**
- Tabbed interface (Radix Tabs): "Skill Gap", "Market Trends", "Resume Score", "Competitiveness". URL-synced (`/insights?tab=skills`).
- Skill Gap tab: SkillRadarChart (AA-049) + SkillGapList + ResumeSuggestionCards + WeeklyDigestCard.
- Market Trends tab: trending skills bar chart (Recharts), rising/declining skill indicators, time-range selector (30d/60d/90d).
- Resume Score tab: ATS score for each variant with detailed breakdown (issues list, fix suggestions).
- Competitiveness tab: percentile gauge, comparison context, "Beta" badge if insufficient data.
- Tab badges: notification counts for new insights (e.g., "Skill Gap (3 new)").
- Content lazy-loaded per tab (code splitting with `React.lazy` + Suspense).
- Skeleton loading states for charts during data fetch.
- Charts responsive: resize on window change, simplified on mobile.

---

### AA-072
**Title:** Build Onboarding Wizard Multi-Step UI

**Description:** As a user going through first-time setup, I want a polished, multi-step wizard UI so that onboarding feels guided and frictionless.

**Acceptance Criteria:**
- Full-page wizard layout (no sidebar) with step indicator (horizontal stepper): 4 labeled steps with progress.
- Step transitions: Framer Motion slide animation (left-to-right for forward, right-to-left for back).
- Step 1 (Upload Resume): full-width upload zone with prominent visual and encouraging copy. "I'll upload later" skip link.
- Step 2 (Review Profile): parsed profile display (AA-012) in clean form layout. "Looks Good" primary CTA.
- Step 3 (Job Preferences): preference form (AA-003 Step 3 specs). "Save Preferences" CTA.
- Step 4 (Connect Aggregator): top 3 recommended aggregators based on region (detected from IP/locale). "Connect" and "Skip for now" options.
- Completion: celebration animation (confetti or checkmark with spring animation). "Go to Dashboard" CTA.
- Progress auto-saved on each step completion (server-side).
- Back button on steps 2–4 returns to previous step without data loss.
- Mobile-friendly: single column, touch-friendly inputs, large buttons.

---

### AA-073
**Title:** Implement Global Error Handling, Toast Notifications, and Loading States

**Description:** As a user, I want consistent error messages, success confirmations, and loading indicators throughout the app so that I always understand the current system state.

**Acceptance Criteria:**
- Toast notification system (Radix Toast or Sonner): success (green), error (red), warning (yellow), info (blue) variants. Auto-dismiss: 5 seconds (success/info), persist until dismissed (error/warning). Position: top-right on desktop, top-center on mobile. Max 3 visible simultaneously (queue additional).
- Global error boundary: React Error Boundary catches unhandled errors. Shows friendly error page: "Something went wrong" with "Try Again" and "Go to Dashboard" buttons. Reports error to Datadog (error tracking).
- API error handling: TanStack Query's `onError` callback shows toast with user-friendly message. Map HTTP status codes to messages: 401 → "Session expired, please log in again"; 403 → "You don't have permission"; 429 → "Too many requests, please wait"; 500 → "Something went wrong on our end".
- Loading states: Skeleton components (pulsing gray placeholders matching component shape) for initial data load. Spinner overlay for mutations (button loading state). Page-level loading bar (NProgress-style) for route transitions.
- Accessible: toasts have `role="alert"` and `aria-live="assertive"` for error, `aria-live="polite"` for success/info.

---

## Epic 9: Infrastructure, CI/CD & Observability

---

### AA-074
**Title:** Provision AWS Infrastructure with Terraform (VPC, EKS, RDS, ElastiCache, S3)

**Description:** As a DevOps engineer, I want to provision all core AWS infrastructure using Terraform so that the deployment is repeatable, version-controlled, and consistent across environments.

**Acceptance Criteria:**
- Terraform modules for: VPC (3 AZs, public/private/data subnets, NAT Gateway), EKS cluster (v1.29, 5 node groups as specified in TAD Section 8.1), RDS PostgreSQL 16 (Multi-AZ, encrypted, automated backups), ElastiCache Redis 7 (cluster mode, encrypted in transit + at rest), S3 buckets (resumes, screenshots, backups — all private, SSE-S3, versioning enabled), OpenSearch cluster (3 data nodes, encrypted), MSK Kafka cluster (6 brokers, 3 AZs, 7-day retention).
- Terragrunt for environment management: `dev`, `staging`, `prod` with shared modules.
- State management: S3 backend with DynamoDB locking.
- Security: all resources in private subnets (except ALB). Security groups following least-privilege. IAM roles per service (IRSA for EKS pods).
- Outputs: all endpoint URLs, security group IDs, IAM role ARNs exported for application configuration.
- Plan review: `terraform plan` output reviewed and approved before apply.

---

### AA-075
**Title:** Set Up CI/CD Pipeline with GitHub Actions and ArgoCD

**Description:** As a DevOps engineer, I want an automated CI/CD pipeline so that code changes are tested, built, scanned, and deployed consistently.

**Acceptance Criteria:**
- GitHub Actions CI pipeline (on PR): lint (ESLint + Prettier), unit tests (Vitest + pytest), build Docker images, integration tests (against test containers), security scans (Semgrep SAST, Snyk dependencies, Trivy containers).
- GitHub Actions CD pipeline (on merge to main): build production Docker images, push to AWS ECR (tagged with git SHA + `latest`), update Kustomize manifests with new image tags, commit to GitOps repo.
- ArgoCD deployment: syncs Kustomize manifests to EKS cluster. Deployment strategy: canary (10% → 50% → 100% with 5-minute observation windows). Auto-rollback: if error rate > 1% (Datadog monitor), ArgoCD reverts to previous version.
- Environment promotion: dev (auto-deploy on merge) → staging (manual approval) → prod (manual approval).
- Secrets: injected via Vault Agent sidecar (never in CI env vars or K8s Secrets).
- Notifications: Slack notifications on build failure, deployment success/rollback.

---

### AA-076
**Title:** Deploy Observability Stack (Datadog, OpenTelemetry, PagerDuty)

**Description:** As a DevOps/SRE, I want a comprehensive observability stack so that I can monitor, trace, and alert on all system components.

**Acceptance Criteria:**
- OpenTelemetry: instrumentation SDKs added to all services (Node.js: `@opentelemetry/sdk-node`, Python: `opentelemetry-sdk`). Auto-instrumentation for HTTP, gRPC, Kafka, PostgreSQL, Redis. Custom spans for: Vault access, LLM calls, browser automation sessions.
- Datadog APM: OpenTelemetry traces exported to Datadog. Service map, dependency graph, flame charts. End-to-end trace from API request → Kafka → browser automation → submission.
- Datadog Logs: Fluentd DaemonSet on EKS ships structured JSON logs. Log correlation via `trace_id` and `user_id`. Sensitive data redaction rules (PII, credentials).
- Datadog Metrics: Prometheus metrics scraped from services. Custom metrics: applications/min, queue depth, adapter success rate, LLM latency/cost.
- Grafana dashboards: Operational dashboard (per-service RED metrics), Business dashboard (KPIs: SASPM, MAU, conversion), Adapter health dashboard (per-aggregator success rate, latency), AI Engine dashboard (LLM usage, token costs, form-fill accuracy).
- PagerDuty integration: Datadog monitors trigger PagerDuty incidents. On-call rotation configured. Escalation policies: P0 → immediate, P1 → 15 min, P2 → 1 hour.

---

### AA-077
**Title:** Deploy Apache Kafka (MSK) with Schema Registry and Topic Configuration

**Description:** As a backend engineer, I want a production-grade Kafka cluster with schema registry so that event-driven communication between services is reliable and schema-compatible.

**Acceptance Criteria:**
- AWS MSK cluster: 6 brokers across 3 AZs. Instance type: kafka.m5.large. Storage: 500GB per broker (auto-scaling enabled).
- Topics created (as per TAD Section 4.2): `jobs.discovered`, `jobs.enriched`, `jobs.scored`, `apps.queued`, `apps.review_needed`, `apps.filling`, `apps.filled`, `apps.submitted`, `apps.failed`, `apps.needs_manual`, `notification.events`, `aggregator.health`, `billing.events`, `audit.events`.
- Topic configuration: replication factor 3, partitions by key (userId or aggregator), retention 7 days (except `apps.submitted` 30 days, `audit.events` 90 days).
- Confluent Schema Registry (self-hosted on EKS): Avro schemas for all event types. Schema compatibility mode: BACKWARD (consumers tolerate new optional fields).
- Consumer group management: one consumer group per service. Lag monitoring via Datadog (alert if lag > 5000 messages for > 10 min).
- Dead letter topics: `*.dlq` for each topic — failed messages routed here after 3 processing attempts.
- Authentication: IAM-based authentication for MSK. TLS encryption in transit.

---

### AA-078
**Title:** Deploy Temporal.io Workflow Engine for Job Scheduling and Orchestration

**Description:** As a backend engineer, I want a Temporal.io cluster so that long-running workflows (scan scheduling, daily summaries, key rotation) are durable, retryable, and observable.

**Acceptance Criteria:**
- Temporal server deployed on EKS (self-hosted): 3 history service pods, 2 matching service pods, 2 frontend service pods, 2 worker service pods.
- Persistence: PostgreSQL (dedicated RDS instance, separate from application DB).
- Visibility store: Elasticsearch (for workflow search and filtering).
- Namespaces: `production`, `staging`.
- Workflows deployed: (a) `ScanScheduler`: per-user per-aggregator job scan every 30 min. (b) `DailySummary`: per-user daily summary aggregation at configured time. (c) `WeeklyInsights`: weekly insight digest generation every Monday. (d) `HealthCheck`: per-connection aggregator health validation every 6 hours. (e) `KeyRotation`: Vault Transit key rotation every 90 days.
- Temporal Web UI: deployed for workflow visibility and debugging.
- Retry policies: configurable per workflow/activity. Default: 3 retries with exponential backoff.
- Monitoring: workflow execution count, failure rate, latency — exported to Datadog.

---

> **📋 END OF DOCUMENT 5 — FEATURE TICKET LIST**
>
> **📋 END OF AUTOAPPLY AI FOUNDATIONAL DOCUMENTATION SUITE**
>
> All 5 documents are now complete:
> - Document 1: Product Requirement Document (PRD)
> - Document 2: Technical Architecture Document (TAD)
> - Document 3: Security & Access Document (SAD)
> - Document 4: Frontend Specification Document (FSD)
> - Document 5: Feature Ticket List (Jira Style)
