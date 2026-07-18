# DOCUMENT 4 — Frontend Specification Document (FSD)

> **Product:** AutoApply AI  
> **Version:** 1.0.0-DRAFT  
> **Last Updated:** 2026-07-18  
> **Owner:** Frontend Architecture & Design Systems Team  
> **Status:** Draft — Pending Design Review  

---

## 1. Design Philosophy & System

### 1.1 Design Principles

| # | Principle | Application |
|---|---|---|
| 1 | **Trust Through Transparency** | Users are entrusting us with sensitive credentials and career data. The UI must constantly communicate *what the AI is doing* — live status, clear logs, zero hidden actions. Every automated application should feel like the user is "watching over the AI's shoulder." |
| 2 | **Complexity Absorption** | The platform orchestrates 16+ aggregators, LLM pipelines, browser automation, and market analysis — but the user should experience a calm, organized dashboard. Complexity lives in the backend; the frontend presents simplicity. |
| 3 | **Progressive Disclosure** | Don't overwhelm on Day 1. Onboarding surfaces essentials (upload resume → connect 1 aggregator → start). Advanced features (custom rules, market trends, competitive positioning) reveal progressively as users engage. |
| 4 | **Data-Dense but Scannable** | Power users (Marcus, Anika) want rich data — application counts, match scores, skill gaps. Present data-dense views with strong visual hierarchy: numbers first, details on drill-down. |
| 5 | **Accessible by Default** | WCAG 2.1 AA compliance is not a retrofit — it's built into every component from Day 1. |

### 1.2 Design System: "Nexus UI"

The design system is named **Nexus UI** and follows atomic design methodology (Atoms → Molecules → Organisms → Templates → Pages).

#### Color System

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS UI — COLOR PALETTE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY (Brand):                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ P-50     │ │ P-100    │ │ P-500    │ │ P-900    │          │
│  │ #EEF2FF  │ │ #D9E2FC  │ │ #4F6BF6  │ │ #1E2A78  │          │
│  │ BG tint  │ │ Hover    │ │ Primary  │ │ Dark     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ACCENT (Energy — used for CTAs, active states):                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ A-400    │ │ A-500    │ │ A-600    │                       │
│  │ #36D399  │ │ #22C55E  │ │ #16A34A  │                       │
│  │ Light    │ │ Success  │ │ Dark     │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                 │
│  SEMANTIC:                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Success  │ │ Warning  │ │ Error    │ │ Info     │          │
│  │ #22C55E  │ │ #F59E0B  │ │ #EF4444  │ │ #3B82F6  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  STATUS INDICATORS (Aggregator Connection):                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🔴 Disc. │ │ 🟡 Verify│ │ 🟢 Conn. │ │ 🟠 Error │          │
│  │ #6B7280  │ │ #F59E0B  │ │ #22C55E  │ │ #EF4444  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  NEUTRAL (Dark Theme):                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ N-950    │ │ N-900    │ │ N-800    │ │ N-100    │          │
│  │ #0A0A0F  │ │ #111118  │ │ #1C1C27  │ │ #E5E5ED  │          │
│  │ Page BG  │ │ Card BG  │ │ Elevated │ │ Text     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  THEME:                                                         │
│  • Default: Dark mode (professional, reduces eye strain for     │
│    power users monitoring dashboards)                           │
│  • Light mode: Available via toggle (respects OS preference)    │
│  • Implementation: CSS custom properties with                   │
│    data-theme="dark|light" on <html>                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Typography

| Level | Font | Weight | Size | Line Height | Use |
|---|---|---|---|---|---|
| **Display** | Inter | 700 (Bold) | 36px / 2.25rem | 1.2 | Page titles, hero sections |
| **H1** | Inter | 700 | 30px / 1.875rem | 1.3 | Section headers |
| **H2** | Inter | 600 (Semibold) | 24px / 1.5rem | 1.35 | Subsection headers |
| **H3** | Inter | 600 | 20px / 1.25rem | 1.4 | Card titles |
| **Body** | Inter | 400 (Regular) | 16px / 1rem | 1.6 | Paragraph text |
| **Body Small** | Inter | 400 | 14px / 0.875rem | 1.5 | Secondary text, captions |
| **Caption** | Inter | 500 (Medium) | 12px / 0.75rem | 1.4 | Labels, timestamps, badges |
| **Mono** | JetBrains Mono | 400 | 14px / 0.875rem | 1.5 | Match scores, technical data, IDs |

#### Spacing & Layout Grid

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Inline spacing, icon gaps |
| `--space-2` | 8px | Tight component padding |
| `--space-3` | 12px | Default component padding |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-6` | 24px | Card internal spacing |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Page section separators |
| **Grid** | 12-column, 1280px max | Responsive breakpoints: 640 / 768 / 1024 / 1280 / 1536px |
| **Sidebar** | 260px collapsed: 72px | Persistent left sidebar navigation |
| **Content area** | Fluid, max 1200px | Centered with auto margins |

#### Elevation & Surfaces

| Level | Shadow | Background | Use |
|---|---|---|---|
| **Surface 0** | None | `var(--n-950)` | Page background |
| **Surface 1** | `0 1px 3px rgba(0,0,0,0.3)` | `var(--n-900)` | Cards, panels |
| **Surface 2** | `0 4px 12px rgba(0,0,0,0.4)` | `var(--n-800)` | Dropdowns, popovers |
| **Surface 3** | `0 8px 24px rgba(0,0,0,0.5)` | `var(--n-800)` | Modals, dialogs |
| **Glass** | `0 4px 16px rgba(0,0,0,0.2)` | `rgba(17,17,24,0.7) + backdrop-filter: blur(16px)` | Floating elements, overlay panels |

#### Motion & Animation

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-fast` | 100ms | `ease-out` | Hover states, toggles |
| `--motion-normal` | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Component transitions |
| `--motion-slow` | 350ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions, modals |
| `--motion-spring` | 500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebratory animations (application submitted) |
| `prefers-reduced-motion` | — | — | All non-essential animations disabled |

#### Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Buttons, inputs, badges |
| `--radius-md` | 10px | Cards, panels |
| `--radius-lg` | 16px | Modals, large containers |
| `--radius-full` | 9999px | Avatars, pills, status dots |

---

## 2. Technology Stack & Rationale

### 2.1 Core Frontend Stack

| Technology | Version | Rationale |
|---|---|---|
| **Next.js** | 14.x (App Router) | Server-side rendering for SEO (marketing pages), React Server Components for reduced JS bundle, file-based routing, API routes for BFF pattern, excellent Vercel/self-hosted deployment options. |
| **React** | 18.x | Component-based UI, concurrent features (Suspense, Transitions), vast ecosystem. |
| **TypeScript** | 5.x | Type safety across the entire frontend — props, API responses, state. Catches integration errors at compile time. |
| **Tailwind CSS** | 3.x | Utility-first CSS aligned with Nexus UI design tokens via `tailwind.config.ts`. Rapid iteration, consistent spacing, responsive utilities. JIT compiler for zero unused CSS. |
| **Zustand** | 4.x | Lightweight global state management (3KB). Simple API, no boilerplate, supports middleware (persist, devtools). Used for: user session, UI preferences, sidebar state. |
| **TanStack Query (React Query)** | 5.x | Server-state management — caching, background refetching, optimistic updates, pagination. Eliminates manual loading/error state handling. Used for: all API data (applications, profiles, aggregators, feedback). |
| **Socket.IO Client** | 4.x | Real-time WebSocket connection for Activity Feed live updates and notification delivery. Auto-reconnect, fallback to polling. |
| **Recharts** | 2.x | Composable React charting library for Skill-Gap radar charts, trend bar charts, application analytics. Accessible, responsive, customizable. |
| **React Hook Form** | 7.x | Performant form handling with Zod schema validation. Used for: onboarding wizard, profile editing, aggregator credential entry, preference forms. |
| **Zod** | 3.x | Runtime schema validation (shared with backend). Type inference for TypeScript. |
| **Framer Motion** | 11.x | Declarative animations and transitions. Page transitions, micro-interactions, skeleton loading, celebration animations. Respects `prefers-reduced-motion`. |
| **next-intl** | 3.x | Internationalization — ICU message format, namespace-based translations, locale detection. |
| **Radix UI** | Latest | Unstyled, accessible component primitives (Dialog, Dropdown, Tooltip, Tabs, Accordion). WAI-ARIA compliant. Styled with Tailwind. |

### 2.2 Build & Tooling

| Tool | Purpose |
|---|---|
| **pnpm** | Package manager — fast, disk-efficient, strict dependency resolution. |
| **Turbopack** (Next.js built-in) | Dev server with near-instant HMR. |
| **ESLint + Prettier** | Code quality + formatting. Custom rules for accessibility (eslint-plugin-jsx-a11y). |
| **Storybook** | Component development and visual testing in isolation. |
| **Playwright** (E2E Tests) | Cross-browser end-to-end testing. |
| **Vitest** | Unit/integration tests for components and hooks. |
| **Chromatic** | Visual regression testing (integrated with Storybook). |
| **Bundle Analyzer** | `@next/bundle-analyzer` for monitoring JS bundle size. Target: < 200KB initial load (gzipped). |

---

## 3. Core Layout & Navigation Architecture

### 3.1 Application Shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION SHELL LAYOUT                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────┐┌──────────────────────────────────────────────────────────┐   │
│  │      ││  TOP BAR (64px height)                                   │   │
│  │      ││  ┌──────────────────────────────────────────────────────┐│   │
│  │      ││  │ 🔍 Search     [Cmd+K]          🔔 3  👤 Priya  ▾  ││   │
│  │      ││  └──────────────────────────────────────────────────────┘│   │
│  │      │├──────────────────────────────────────────────────────────┤   │
│  │  S   ││                                                          │   │
│  │  I   ││  MAIN CONTENT AREA                                       │   │
│  │  D   ││                                                          │   │
│  │  E   ││  (Page content renders here)                             │   │
│  │  B   ││                                                          │   │
│  │  A   ││  ┌───────────────────────────────────────────────────┐  │   │
│  │  R   ││  │                                                   │  │   │
│  │      ││  │     Active page component                        │  │   │
│  │  260 ││  │                                                   │  │   │
│  │  px  ││  │     (scrollable)                                  │  │   │
│  │      ││  │                                                   │  │   │
│  │      ││  │                                                   │  │   │
│  │      ││  └───────────────────────────────────────────────────┘  │   │
│  │      ││                                                          │   │
│  └──────┘└──────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Sidebar Navigation

```
┌──────────────────────────────────────────────────────────────┐
│                    SIDEBAR (260px / 72px collapsed)          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✦  AutoApply AI                          ◀ Collapse │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  MAIN                                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📊  Dashboard                              (active) │   │
│  │  📄  My Assets                                       │   │
│  │  🔗  Aggregators                              3/16   │   │
│  │  ⚡  Activity Feed                      ● 12 new     │   │
│  │  🧠  AI Insights                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  MANAGE                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ⚙️  Preferences                                     │   │
│  │  💳  Subscription                          Pro ✨     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ❓  Help & Docs                                     │   │
│  │  🌙  Dark / ☀️ Light                       Toggle    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ┌────┐                                              │   │
│  │  │ PS │  Priya Sharma                                │   │
│  │  └────┘  priya@email.com                             │   │
│  │          Free Plan • Upgrade ✨                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Route Map

| Route | Page | Auth Required | Description |
|---|---|---|---|
| `/` | Marketing Landing | No | Public landing page with features, pricing, social proof |
| `/login` | Login | No | Email/password + OAuth login |
| `/register` | Registration | No | Sign-up + consent collection |
| `/onboarding` | Onboarding Wizard | Yes | Multi-step wizard: upload resume → set preferences → connect aggregator |
| `/dashboard` | Dashboard (Home) | Yes | Overview stats, quick actions, recent activity |
| `/assets` | Asset Management | Yes | Resume/cover letter management with upload |
| `/assets/[id]` | Asset Detail | Yes | Single resume variant view/edit with ATS score |
| `/aggregators` | Aggregator Matrix | Yes | Twin-column aggregator connection management |
| `/activity` | Activity Feed | Yes | Real-time application tracking with filters |
| `/activity/[id]` | Application Detail | Yes | Single application detail with form screenshot, match score |
| `/insights` | AI Feedback Center | Yes | Skill-gap charts, market trends, resume suggestions |
| `/insights/skills` | Skill Analysis | Yes | Detailed skill-gap breakdown with learning paths |
| `/insights/market` | Market Trends | Yes | Trending skills, salary data, demand curves |
| `/preferences` | User Preferences | Yes | Job preferences, notification settings, auto-apply rules |
| `/subscription` | Subscription | Yes | Current plan, usage, upgrade/downgrade, billing history |
| `/settings` | Account Settings | Yes | Profile, security (MFA), data export, account deletion |

---

## 4. Core UI Components

### 4.1 Asset Dashboard (Drag-and-Drop Upload)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MY ASSETS                                         │
│  Manage your resumes and cover letters                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────── UPLOAD ZONE ─────────────────────┐│
│  │                                                                      ││
│  │              ┌──────────────────────────────────┐                    ││
│  │              │                                  │                    ││
│  │              │        📄                        │                    ││
│  │              │                                  │                    ││
│  │              │   Drag & drop your resume here   │                    ││
│  │              │   or click to browse              │                    ││
│  │              │                                  │                    ││
│  │              │   PDF, DOCX, RTF, TXT • Max 10MB │                    ││
│  │              │                                  │                    ││
│  │              └──────────────────────────────────┘                    ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  RESUMES (3 of 5)                                      [+ New Variant]  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────┐    ││
│  │  │  📄  Backend Developer Resume              ⭐ Primary       │    ││
│  │  │                                                             │    ││
│  │  │  ATS Score: ████████████░░░░  78/100                        │    ││
│  │  │                                                             │    ││
│  │  │  Skills: Python • Django • PostgreSQL • Docker • REST APIs  │    ││
│  │  │                                                             │    ││
│  │  │  Last updated: 2 days ago  •  Version 3                     │    ││
│  │  │                                                             │    ││
│  │  │  Used in: 142 applications          [Edit] [Preview] [···] │    ││
│  │  └─────────────────────────────────────────────────────────────┘    ││
│  │                                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────┐    ││
│  │  │  📄  Full-Stack Developer Resume                            │    ││
│  │  │                                                             │    ││
│  │  │  ATS Score: ██████████░░░░░░  65/100  ⚠️ Needs improvement  │    ││
│  │  │                                                             │    ││
│  │  │  Skills: React • Node.js • Python • AWS • MongoDB           │    ││
│  │  │                                                             │    ││
│  │  │  Last updated: 2 weeks ago  •  Version 1                    │    ││
│  │  │                                                             │    ││
│  │  │  Used in: 34 applications           [Edit] [Preview] [···] │    ││
│  │  └─────────────────────────────────────────────────────────────┘    ││
│  │                                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────┐    ││
│  │  │  📄  Data Engineering Resume                                │    ││
│  │  │                                                             │    ││
│  │  │  ATS Score: ██████████████░░  87/100  ✅ Excellent           │    ││
│  │  │                                                             │    ││
│  │  │  Skills: Spark • Kafka • Airflow • Python • SQL             │    ││
│  │  │                                                             │    ││
│  │  │  Last updated: 5 days ago  •  Version 2                     │    ││
│  │  │                                                             │    ││
│  │  │  Used in: 67 applications           [Edit] [Preview] [···] │    ││
│  │  └─────────────────────────────────────────────────────────────┘    ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  COVER LETTERS                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Generation Mode:  ○ Full Auto  ● Review Queue  ○ Template Only    ││
│  │                                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────┐    ││
│  │  │  📝  Base Cover Letter Template                             │    ││
│  │  │  Uploaded: Jul 10, 2026  •  Used as template for 243 apps   │    ││
│  │  │                                      [Edit] [Preview] [···] │    ││
│  │  └─────────────────────────────────────────────────────────────┘    ││
│  │                                                                      ││
│  │  AI-Generated cover letters (last 5):                                ││
│  │  ┌────────────────────────────────────────────────────────────┐     ││
│  │  │ "Dear Hiring Manager at Razorpay..."    Naukri • Jul 17   │     ││
│  │  │ "Dear Hiring Manager at Flipkart..."    Naukri • Jul 17   │     ││
│  │  │ "Dear Talent Team at Atlassian..."      Indeed • Jul 16   │     ││
│  │  │ "Dear Hiring Manager at Freshworks..."  LinkeIn• Jul 16   │     ││
│  │  │ "Dear Recruitment Team at Zoho..."      Naukri • Jul 16   │     ││
│  │  └────────────────────────────────────────────────────────────┘     ││
│  │                                                        [View All]   ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

| Component | ID | Behavior |
|---|---|---|
| `UploadZone` | `#asset-upload-zone` | Uses `react-dropzone`. States: idle (dashed border, muted icon), drag-over (solid border, glow effect, scale-up icon), uploading (progress bar with percentage, file name, cancel button), success (checkmark animation, auto-dismiss after 3s), error (red border, error message, retry button). Accepts: `.pdf`, `.docx`, `.rtf`, `.txt`. Max: 10MB. |
| `ResumeCard` | `#resume-card-{id}` | Displays: name, ATS score (progress bar with color coding: red < 50, yellow 50-75, green > 75), extracted skills (tag pills, max 5 visible + "+N more"), last updated relative time, version count, application count. Actions: Edit, Preview (modal), Set Primary, Download, Delete (confirmation dialog). |
| `ATSScoreBar` | `#ats-score-{id}` | Animated progress bar. Color gradient: red (0-49) → yellow (50-74) → green (75-100). Tooltip on hover: "This score estimates how well your resume will be parsed by common Applicant Tracking Systems." |
| `CoverLetterModeSelector` | `#cl-mode-selector` | Radio group with 3 options. Each option has title + description. "Full Auto" shows a ⚡ icon. "Review Queue" shows 👁️ icon. "Template Only" shows 📋 icon. Persists to user preferences via API. |

### 4.2 Aggregator Matrix View (Twin-Column Layout)

This is the signature UI element — explicitly separating Indian and International aggregators.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     AGGREGATORS                                          │
│  Connect your job board accounts to enable AI-powered auto-apply        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Connected: 3 of 16  │  Daily applications: 38/50 used                  │
│                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐     │
│  │    🇮🇳  INDIAN PLATFORMS      │  │    🌍  INTERNATIONAL          │     │
│  │         8 available           │  │         8 available           │     │
│  ├──────────────────────────────┤  ├──────────────────────────────┤     │
│  │                              │  │                              │     │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │     │
│  │  │  ██ Naukri.com         │  │  │  │  ██ Indeed             │  │     │
│  │  │  🟢 Connected          │  │  │  │  🟢 Connected          │  │     │
│  │  │  Last sync: 12 min ago │  │  │  │  Last sync: 8 min ago  │  │     │
│  │  │  📊 142 apps • 25/day  │  │  │  │  📊 89 apps • 20/day   │  │     │
│  │  │                        │  │  │  │                        │  │     │
│  │  │  [⚙ Configure]  [⏏ DC]│  │  │  │  [⚙ Configure]  [⏏ DC]│  │     │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │     │
│  │                              │  │                              │     │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │     │
│  │  │  ██ LinkedIn India     │  │  │  │  ██ LinkedIn (Global)  │  │     │
│  │  │  🟢 Connected          │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  Last sync: 3 min ago  │  │  │  │                        │  │     │
│  │  │  📊 87 apps • 15/day   │  │  │  │  [🔗 Connect]          │  │     │
│  │  │                        │  │  │  │                        │  │     │
│  │  │  [⚙ Configure]  [⏏ DC]│  │  │  └────────────────────────┘  │     │
│  │  └────────────────────────┘  │  │                              │     │
│  │                              │  │  ┌────────────────────────┐  │     │
│  │  ┌────────────────────────┐  │  │  │  ██ ZipRecruiter       │  │     │
│  │  │  ██ Foundit (Monster)  │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔴 Not Connected      │  │  │  │                        │  │     │
│  │  │                        │  │  │  │  [🔗 Connect]          │  │     │
│  │  │  [🔗 Connect]          │  │  │  │                        │  │     │
│  │  │                        │  │  │  └────────────────────────┘  │     │
│  │  └────────────────────────┘  │  │                              │     │
│  │                              │  │  ┌────────────────────────┐  │     │
│  │  ┌────────────────────────┐  │  │  │  ██ Glassdoor          │  │     │
│  │  │  ██ Internshala        │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔴 Not Connected      │  │  │  │                        │  │     │
│  │  │                        │  │  │  │  [🔗 Connect]          │  │     │
│  │  │  [🔗 Connect]          │  │  │  │                        │  │     │
│  │  │                        │  │  │  └────────────────────────┘  │     │
│  │  └────────────────────────┘  │  │                              │     │
│  │                              │  │  ┌────────────────────────┐  │     │
│  │  ┌────────────────────────┐  │  │  │  ██ Monster (Global)   │  │     │
│  │  │  ██ Instahyre          │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔴 Not Connected      │  │  │  │                        │  │     │
│  │  │                        │  │  │  │  [🔗 Connect]          │  │     │
│  │  │  [🔗 Connect]          │  │  │  │                        │  │     │
│  │  │                        │  │  │  └────────────────────────┘  │     │
│  │  └────────────────────────┘  │  │                              │     │
│  │                              │  │  ┌────────────────────────┐  │     │
│  │  ┌────────────────────────┐  │  │  │  ██ We Work Remotely   │  │     │
│  │  │  ██ Shine.com          │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔴 Not Connected      │  │  │  │                        │  │     │
│  │  │  🔒 Pro Plan Required  │  │  │  │  [🔗 Connect]          │  │     │
│  │  │                        │  │  │  │                        │  │     │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │     │
│  │                              │  │                              │     │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │     │
│  │  │  ██ TimesJobs          │  │  │  │  ██ Wellfound          │  │     │
│  │  │  🔴 Not Connected      │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔒 Pro Plan Required  │  │  │  │  🔒 Pro Plan Required  │  │     │
│  │  │                        │  │  │  │                        │  │     │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │     │
│  │                              │  │                              │     │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │     │
│  │  │  ██ Cutshort           │  │  │  │  ██ Dice               │  │     │
│  │  │  🔴 Not Connected      │  │  │  │  🔴 Not Connected      │  │     │
│  │  │  🔒 Pro Plan Required  │  │  │  │  🔒 Pro Plan Required  │  │     │
│  │  │                        │  │  │  │                        │  │     │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │     │
│  │                              │  │                              │     │
│  └──────────────────────────────┘  └──────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Credential Entry Modal (Secure):**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│            🔒 Connect to Naukri.com                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚠️  Your credentials are encrypted with AES-256      │  │
│  │  and stored in a hardware-secured vault. AutoApply     │  │
│  │  AI never stores your password in plaintext.           │  │
│  │  Learn more about our security →                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Email / Username                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  priya.sharma@email.com                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Password                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ••••••••••••••                              👁        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ☑  I authorize AutoApply AI to access my Naukri.com        │
│     account to search and apply for jobs on my behalf.       │
│     I can revoke this access at any time.                    │
│                                                              │
│          ┌──────────────────┐  ┌──────────────────┐         │
│          │     Cancel       │  │  🔗 Connect       │         │
│          └──────────────────┘  └──────────────────┘         │
│                                                              │
│  ── OR ──                                                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔑  Connect with LinkedIn OAuth (recommended)         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

| Component | ID | Behavior |
|---|---|---|
| `AggregatorMatrixView` | `#aggregator-matrix` | Two-column grid (CSS Grid: `grid-template-columns: 1fr 1fr`). Responsive: stacks vertically on mobile (< 768px). Each column has a sticky header with region flag and count. |
| `AggregatorCard` | `#agg-card-{id}` | States: disconnected (muted, "Connect" CTA), verifying (pulsing yellow dot, "Verifying..." text), connected (green dot, shows stats), error (red dot, error message + "Reconnect" CTA), locked (dimmed, "Pro Plan Required" badge with upgrade link). Transition animations between states (Framer Motion). |
| `ConnectionStatusDot` | `#agg-status-{id}` | Animated SVG circle: disconnected (gray, static), verifying (yellow, pulsing animation `animation: pulse 1.5s infinite`), connected (green, single pulse on connect), error (red, subtle shake animation). |
| `CredentialModal` | `#credential-modal` | Radix Dialog. `autocomplete="off"` on form. Password field: `type="password"` with visibility toggle. No credential data in React state after submission (immediate cleanup). MFA step-up triggered before opening modal. CSRF token included. |
| `AggregatorConfigDrawer` | `#agg-config-{id}` | Slide-in drawer (right side). Fields: daily application limit (number input, min 1, max 50), search queries (tag input, max 10), location filters (multi-select), salary range (range slider), excluded companies (tag input). Save triggers immediate preference update via API. |

### 4.3 Live Activity Feed (Real-Time AI Tracking)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ACTIVITY FEED                                        │
│  Real-time tracking of AI application submissions                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──── FILTERS ──────────────────────────────────────────────────────┐  │
│  │ Status: [All ▾]  Aggregator: [All ▾]  Score: [All ▾]  Date: [▤]  │  │
│  │                                                                    │  │
│  │ ○ All (243)  ○ Submitted (198)  ○ Pending (12)                    │  │
│  │ ○ Failed (8)  ○ Needs Review (25)                                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌── LIVE INDICATOR ──┐                                                  │
│  │  ● AI Engine Active │  Last activity: 2 min ago                      │
│  └────────────────────┘                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  ┌─ NEW ──────────────────────────────────────────────────────┐   │  │
│  │  │  ✅ Senior Backend Developer • Razorpay                     │   │  │
│  │  │     Naukri.com • Match: 89/100 • 2 minutes ago              │   │  │
│  │  │     Resume: "Backend Developer" • Cover Letter: AI-generated│   │  │
│  │  │     ┌──────────────────────────────────────────────────┐    │   │  │
│  │  │     │ 🟢 Submitted successfully                        │    │   │  │
│  │  │     └──────────────────────────────────────────────────┘    │   │  │
│  │  │                                        [View Details →]     │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  ⏳ Full-Stack Developer • Flipkart                        │   │  │
│  │  │     LinkedIn India • Match: 76/100 • 5 minutes ago          │   │  │
│  │  │     ┌──────────────────────────────────────────────────┐    │   │  │
│  │  │     │ 🟡 Filling application... Step 3 of 4            │    │   │  │
│  │  │     │ ████████████████░░░░░░░░  75%                    │    │   │  │
│  │  │     └──────────────────────────────────────────────────┘    │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  ❌ Data Engineer • Infosys                                 │   │  │
│  │  │     Naukri.com • Match: 72/100 • 18 minutes ago             │   │  │
│  │  │     ┌──────────────────────────────────────────────────┐    │   │  │
│  │  │     │ 🔴 Failed: CAPTCHA required (unsolvable type)    │    │   │  │
│  │  │     │    [🔗 Open in browser to complete manually]     │    │   │  │
│  │  │     └──────────────────────────────────────────────────┘    │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  👁️ Python Developer • Google India                        │   │  │
│  │  │     LinkedIn India • Match: 92/100 • 25 minutes ago         │   │  │
│  │  │     ┌──────────────────────────────────────────────────┐    │   │  │
│  │  │     │ 🔵 Needs Review: AI-generated cover letter        │    │   │  │
│  │  │     │    [Preview Cover Letter]  [✓ Approve]  [✗ Skip] │    │   │  │
│  │  │     └──────────────────────────────────────────────────┘    │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  ✅ Backend Engineer • Swiggy                               │   │  │
│  │  │     Naukri.com • Match: 81/100 • 42 minutes ago             │   │  │
│  │  │     🟢 Submitted successfully                               │   │  │
│  │  │                                        [View Details →]     │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │                        [Load More (198 remaining)]                 │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

| Component | ID | Behavior |
|---|---|---|
| `ActivityFeed` | `#activity-feed` | Virtualized list (`@tanstack/react-virtual`) for performance with 1000+ items. Infinite scroll pagination (50 items per page). TanStack Query with `refetchInterval: 30000` (30s polling as fallback to WebSocket). |
| `ActivityItem` | `#activity-{id}` | Status-dependent rendering: `submitted` (green accent, checkmark icon), `filling` (yellow, animated progress bar), `failed` (red, error message + action buttons), `needs_review` (blue, approve/skip actions), `queued` (gray, position in queue). New items slide in from top with Framer Motion `animate={{ opacity: 1, y: 0 }}`. |
| `LiveIndicator` | `#ai-engine-status` | WebSocket-connected. States: Active (green pulsing dot, "Last activity: X ago"), Paused (yellow static dot, "Paused by user"), Error (red dot, "AI Engine temporarily unavailable"), Disabled (gray, "No active aggregators"). |
| `ProgressBar` | `#progress-{id}` | Shows form-filling progress for in-flight applications. Steps labeled ("Step 2 of 4: Filling work experience"). Animated width transition. Updates via WebSocket events from Form Filler service. |
| `ReviewActions` | `#review-{id}` | For `needs_review` status: "Preview Cover Letter" (opens modal with generated CL text), "Approve" (emits `apps.approved` event → queues for submission), "Skip" (marks as skipped, does not apply). |

### 4.4 AI Feedback Center (Skill-Gap Charts & Recommendations)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     AI INSIGHTS                                          │
│  Personalized market intelligence and career guidance                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─── TABS ─────────────────────────────────────────────────────────┐   │
│  │  [Skill Gap]  [Market Trends]  [Resume Score]  [Competitiveness] │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ════════════ SKILL GAP TAB (Active) ═══════════════════════════════    │
│                                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │   SKILL RADAR CHART  │  │  TOP SKILL GAPS                         │  │
│  │                      │  │                                         │  │
│  │        Docker         │  │  Demanded by JDs you match:            │  │
│  │       ╱    ╲          │  │                                         │  │
│  │    K8s      AWS      │  │  1. Docker        ████████████░░  82%  │  │
│  │    │  ╲   ╱  │       │  │     ⚠ Not on your resume               │  │
│  │    │   ╲╱╱   │       │  │     📚 Docker Fundamentals (Udemy, 6h) │  │
│  │    │   ╱╲    │       │  │                                         │  │
│  │    GraphQL  CI/CD    │  │  2. Kubernetes    ███████████░░░  74%  │  │
│  │       ╲    ╱         │  │     ⚠ Not on your resume               │  │
│  │        REST           │  │     📚 CKA Certification (40h)        │  │
│  │                      │  │                                         │  │
│  │  ── Your Skills      │  │  3. AWS           ██████████░░░░  68%  │  │
│  │  -- Market Demand    │  │     ⚠ Not on your resume               │  │
│  │                      │  │     📚 AWS SA Associate (80h)          │  │
│  │                      │  │                                         │  │
│  │  Coverage: 62%       │  │  4. GraphQL       ████████░░░░░░  55%  │  │
│  │                      │  │     ⚠ Not on your resume               │  │
│  │                      │  │                                         │  │
│  └──────────────────────┘  │  5. CI/CD         ███████░░░░░░░  48%  │  │
│                             │     ✅ On your resume (Jenkins)        │  │
│                             │     💡 Consider adding GitHub Actions  │  │
│                             │                                         │  │
│                             └─────────────────────────────────────────┘  │
│                                                                          │
│  ┌── RESUME IMPROVEMENT SUGGESTIONS ────────────────────────────────┐   │
│  │                                                                    │   │
│  │  📝 Based on analysis of 847 job descriptions you matched:        │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │  🔴 HIGH IMPACT                                            │   │   │
│  │  │                                                            │   │   │
│  │  │  1. Add "Docker" to your Skills section                    │   │   │
│  │  │     → 82% of matching JDs require Docker experience        │   │   │
│  │  │     → Suggested addition: "Docker, Docker Compose,         │   │   │
│  │  │       containerized microservice deployment"               │   │   │
│  │  │                                           [Apply to Resume]│   │   │
│  │  │                                                            │   │   │
│  │  │  2. Quantify your work experience bullets                  │   │   │
│  │  │     → Current: "Developed REST APIs for user management"   │   │   │
│  │  │     → Suggested: "Developed 12 REST APIs serving 50K+     │   │   │
│  │  │       daily requests with 99.9% uptime, reducing response  │   │   │
│  │  │       latency by 40%"                                      │   │   │
│  │  │                                           [Apply to Resume]│   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │  🟡 MEDIUM IMPACT                                          │   │   │
│  │  │                                                            │   │   │
│  │  │  3. Add a "Projects" section                               │   │   │
│  │  │     → 67% of successful applications include side projects │   │   │
│  │  │                                                            │   │   │
│  │  │  4. Remove "References available upon request"             │   │   │
│  │  │     → Wastes space; considered outdated by 91% of HRs     │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── WEEKLY DIGEST ─────────────────────────────────────────────────┐   │
│  │  Week of Jul 11–17, 2026                                         │   │
│  │                                                                    │   │
│  │  📊 38 applications submitted (↑12% vs last week)                 │   │
│  │  🎯 Match score avg: 79.2 (↑3.1 points)                          │   │
│  │  📈 "Docker" demand increased 8% in your target roles            │   │
│  │  📉 "jQuery" demand decreased 15% — consider removing            │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

| Component | ID | Behavior |
|---|---|---|
| `SkillRadarChart` | `#skill-radar` | Recharts `RadarChart` component. Two data series: user's skills (solid fill, primary color, 30% opacity) and market demand (dashed line, accent color). Interactive: hover on skill point shows tooltip with percentage and JD count. Responsive: shrinks on mobile, label positions adjust. |
| `SkillGapList` | `#skill-gaps` | Sorted by demand percentage (descending). Each item shows: skill name, demand bar (colored by gap severity), status badge (⚠ Missing / ✅ Present / 💡 Improvement), learning recommendation with estimated time. Click expands to show which JDs drive this demand. |
| `ResumeSuggestionCard` | `#suggestion-{id}` | Categorized by impact (High / Medium / Low). Each card shows: current text (if applicable, styled as red deletion), suggested text (styled as green addition), reasoning with data. "Apply to Resume" button: opens resume editor with suggestion pre-populated. Dismissible (stores dismissed state). |
| `InsightTabs` | `#insight-tabs` | Radix Tabs component. Tab badges show notification counts (e.g., "Skill Gap (3 new)"). Content lazy-loaded per tab. URL-synced: `/insights?tab=skills`. |
| `WeeklyDigestCard` | `#weekly-digest` | Compact summary card. Trend indicators: ↑ (green), ↓ (red), → (neutral). Week selector (dropdown) for historical digests. |

---

## 5. State Management Strategy (Async AI Workflows)

### 5.1 State Architecture

The frontend manages three distinct categories of state:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  LAYER 1: SERVER STATE (TanStack Query)                             ││
│  │                                                                     ││
│  │  All data fetched from API. Cached, background-refetched,          ││
│  │  paginated, and optimistically updated.                             ││
│  │                                                                     ││
│  │  Query Keys:                                                        ││
│  │  • ['user', 'profile']           → User profile data               ││
│  │  • ['assets', 'resumes']         → Resume variants list            ││
│  │  • ['assets', 'resume', id]      → Single resume detail            ││
│  │  • ['aggregators']               → Aggregator list + status        ││
│  │  • ['aggregators', id, 'config'] → Single aggregator config        ││
│  │  • ['applications', filters]     → Paginated application list      ││
│  │  • ['applications', id]          → Single application detail       ││
│  │  • ['insights', 'skills']        → Skill gap analysis              ││
│  │  • ['insights', 'trends']        → Market trend data               ││
│  │  • ['insights', 'resume-score']  → ATS scoring data                ││
│  │  • ['notifications']             → Notification list               ││
│  │  • ['subscription']              → Current plan + usage            ││
│  │                                                                     ││
│  │  Stale Times:                                                       ││
│  │  • User profile: 5 min (rarely changes)                            ││
│  │  • Applications: 30 sec (frequently updating)                      ││
│  │  • Aggregator status: 1 min (health checks)                        ││
│  │  • Insights: 10 min (computed periodically)                        ││
│  │  • Notifications: 0 (always refetch, supplemented by WebSocket)    ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  LAYER 2: CLIENT STATE (Zustand)                                    ││
│  │                                                                     ││
│  │  UI-only state that doesn't come from the server.                   ││
│  │                                                                     ││
│  │  Stores:                                                            ││
│  │  • useUIStore:                                                      ││
│  │    - sidebarCollapsed: boolean                                      ││
│  │    - theme: 'dark' | 'light'                                       ││
│  │    - onboardingStep: number                                         ││
│  │    - activeModal: string | null                                     ││
│  │                                                                     ││
│  │  • useFilterStore:                                                  ││
│  │    - activityFilters: { status, aggregator, dateRange, scoreRange } ││
│  │    - aggregatorView: 'all' | 'indian' | 'international'            ││
│  │                                                                     ││
│  │  • useAIEngineStore:                                                ││
│  │    - engineStatus: 'active' | 'paused' | 'error'                   ││
│  │    - activeApplications: Map<appId, ProgressState>                  ││
│  │      (updated in real-time via WebSocket)                           ││
│  │                                                                     ││
│  │  Persistence: sidebarCollapsed, theme → localStorage               ││
│  │  Middleware: devtools (Redux DevTools integration)                  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  LAYER 3: REAL-TIME STATE (WebSocket via Socket.IO)                 ││
│  │                                                                     ││
│  │  Persistent WebSocket connection for live updates.                  ││
│  │                                                                     ││
│  │  Events Received:                                                   ││
│  │  • 'application:progress'  → Update activeApplications in Zustand  ││
│  │  • 'application:submitted' → Invalidate ['applications'] query     ││
│  │  • 'application:failed'    → Invalidate + show toast notification  ││
│  │  • 'application:review'    → Invalidate + badge count update       ││
│  │  • 'aggregator:status'     → Invalidate ['aggregators'] query      ││
│  │  • 'notification:new'      → Invalidate ['notifications'] + toast  ││
│  │  • 'insight:updated'       → Invalidate ['insights'] queries       ││
│  │  • 'engine:status'         → Update engineStatus in Zustand        ││
│  │                                                                     ││
│  │  Connection Management:                                             ││
│  │  • Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)  ││
│  │  • Heartbeat: 25s interval, 5s timeout                             ││
│  │  • Fallback: Long-polling if WebSocket unavailable                 ││
│  │  • Auth: JWT token sent on handshake, validated server-side        ││
│  │  • Reconnect: Full state resync on reconnect                       ││
│  │    (fetch missed events since last known event ID)                  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Optimistic Updates Pattern

For user actions that trigger long-running backend processes:

```typescript
// Example: Approving a cover letter for submission
const useApproveApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appId: string) => api.applications.approve(appId),
    
    // Optimistic update: immediately change status in UI
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey: ['applications'] });
      
      const previousData = queryClient.getQueryData(['applications']);
      
      queryClient.setQueryData(['applications'], (old: Application[]) =>
        old.map(app =>
          app.id === appId
            ? { ...app, status: 'queued', statusLabel: 'Queued for submission...' }
            : app
        )
      );
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, appId, context) => {
      queryClient.setQueryData(['applications'], context?.previousData);
      toast.error('Failed to approve application. Please try again.');
    },
    
    // Refetch on success (WebSocket will also trigger invalidation)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
```

---

## 6. Real-Time Communication Layer

### 6.1 WebSocket Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 REAL-TIME COMMUNICATION ARCHITECTURE                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐         ┌────────────────────────┐         ┌────────────┐ │
│  │ Browser  │◄──WSS──►│  Socket.IO Gateway     │◄──Kafka──│ AI Engine  │ │
│  │ Client   │         │  (NestJS WebSocket GW) │         │ Services   │ │
│  └─────────┘         └────────────────────────┘         └────────────┘ │
│                                                                          │
│  Socket.IO Rooms (per-user isolation):                                   │
│  • user:{userId}           — All user-specific events                   │
│  • user:{userId}:activity  — Activity feed updates only                 │
│  • user:{userId}:notif     — Notifications only                         │
│                                                                          │
│  Server Implementation:                                                  │
│  • NestJS @WebSocketGateway with Socket.IO adapter                      │
│  • Redis adapter for multi-instance pub/sub                             │
│    (all gateway instances share events via Redis)                       │
│  • Kafka consumer: listens to apps.submitted, apps.failed,              │
│    apps.progress, notification.events → broadcasts to user rooms        │
│  • Authentication: JWT validated on connection handshake                 │
│  • Rate limiting: Max 100 events/min per user (server-side)             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Responsive & Adaptive Design

### 7.1 Breakpoint Strategy

| Breakpoint | Width | Layout Changes |
|---|---|---|
| **Mobile** | < 640px | Single column. Sidebar hidden (hamburger menu). Cards stack vertically. Aggregator Matrix: single column (tabs for Indian/International). Charts: simplified/smaller. |
| **Tablet** | 640–1023px | Sidebar collapsed (icon-only, 72px). Content area: single or 2-column. Aggregator Matrix: 2 columns (narrower cards). |
| **Desktop** | 1024–1535px | Sidebar expanded (260px). Content area: multi-column layouts. Full Aggregator Matrix. |
| **Wide** | ≥ 1536px | Content area max-width: 1400px (centered). Wider charts, more data-dense tables. |

### 7.2 Mobile-Specific Adaptations

| Component | Desktop | Mobile |
|---|---|---|
| **Sidebar** | Persistent left sidebar | Bottom tab bar (5 icons: Dashboard, Assets, Aggregators, Activity, Insights) + hamburger for secondary items |
| **Aggregator Matrix** | Twin-column side-by-side | Tabbed view: "🇮🇳 Indian" / "🌍 International" tabs. Cards full-width. |
| **Activity Feed** | Card-based with inline details | Compact list view (title + status + time). Tap to expand details. |
| **Skill Radar Chart** | Full-size radar | Horizontal bar chart (radar too small on mobile) |
| **Credential Modal** | Centered modal (480px width) | Full-screen sheet sliding up from bottom |
| **Upload Zone** | Large drag-and-drop area | "Upload" button opening native file picker (drag-drop unreliable on mobile) |

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Accessibility Implementation Checklist

| Requirement | Implementation |
|---|---|
| **Color contrast** | All text meets 4.5:1 (body) / 3:1 (large text) ratio. Verified via axe-core in CI. Status indicators (🟢🔴🟡) never rely on color alone — always paired with text label and icon shape. |
| **Keyboard navigation** | Full keyboard access to all interactive elements. Focus visible styles: `outline: 2px solid var(--p-500); outline-offset: 2px;`. Tab order follows logical DOM order. Skip-to-content link. |
| **Screen readers** | All icons have `aria-label`. Dynamic content updates via `aria-live="polite"` (activity feed new items, status changes). Form fields have associated `<label>`. Error messages linked via `aria-describedby`. |
| **Focus management** | Modal open: focus trapped inside modal. Modal close: focus returns to trigger element. Page navigation: focus moves to `<h1>`. Toast notifications: `role="alert"`. |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` disables: page transitions, card animations, progress bar animations, celebration effects. Essential state changes (status dots) remain. |
| **Touch targets** | Minimum 44x44px for all interactive elements on mobile. Aggregator card buttons have adequate spacing (≥ 8px between targets). |
| **Forms** | All inputs have visible labels (not placeholder-only). Required fields marked with `aria-required="true"` + visual asterisk. Inline validation errors below field with `role="alert"`. |
| **Tables** | Data tables use `<th scope="col/row">`. Complex tables have `aria-describedby` linking to caption. Sortable columns announce sort state. |

---

## 9. Component Library & Design Tokens

### 9.1 Component Inventory

| Category | Components | Base |
|---|---|---|
| **Atoms** | Button, Input, Select, Checkbox, Radio, Toggle, Badge, Avatar, Icon, Tooltip, Spinner, Skeleton, Divider | Radix UI primitives + Tailwind styling |
| **Molecules** | FormField (label + input + error), SearchInput, TagInput, DatePicker, RangeSlider, StatusDot, ProgressBar, Toast, FileUploadItem | Composed from atoms |
| **Organisms** | UploadZone, ResumeCard, AggregatorCard, ActivityItem, SkillRadarChart, SkillGapList, SuggestionCard, CredentialModal, NotificationPanel, WeeklyDigest | Domain-specific compositions |
| **Templates** | DashboardLayout, MatrixLayout, FeedLayout, InsightsLayout, SettingsLayout | Page-level layout structures |
| **Pages** | Dashboard, Assets, Aggregators, ActivityFeed, AIInsights, Preferences, Subscription, Settings | Full page compositions |

### 9.2 Design Token Implementation

```typescript
// tailwind.config.ts — Design tokens as Tailwind configuration
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF', 100: '#D9E2FC', 200: '#B3C5F9',
          300: '#8DA8F6', 400: '#6B8BF3', 500: '#4F6BF6',
          600: '#3A4FD4', 700: '#2A3BAF', 800: '#1E2A78',
          900: '#141C54', 950: '#0C1133',
        },
        accent: {
          400: '#36D399', 500: '#22C55E', 600: '#16A34A',
        },
        neutral: {
          50: '#F8F9FC', 100: '#E5E5ED', 200: '#C8C8D8',
          700: '#2A2A3C', 800: '#1C1C27', 900: '#111118',
          950: '#0A0A0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '16px',
      },
      transitionDuration: {
        fast: '100ms', normal: '200ms', slow: '350ms',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

---

> **📋 END OF DOCUMENT 4 — FRONTEND SPECIFICATION DOCUMENT**
>
> Type **"CONTINUE"** to generate **DOCUMENT 5: Feature Ticket List (Jira Style)**.
