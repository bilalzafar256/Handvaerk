# Håndværk Pro — Project Context
> Reference file for Claude Code. Read when you need project structure, docs map, or phase overview.

---

## DOCS MAP

| File | Contents |
|---|---|
| `BUSINESS_PLAN.md` | Product vision, business model, full tech stack, project structure, all phases in detail |
| `FEATURES.md` | All features with `[ ]` tracking status |
| `GDPR.md` | Privacy compliance requirements |
| `REPORTING.md` | Analytics and reporting specs |
| `AI_FEATURES.md` | AI feature specs (Phase 10+): OCR, smart suggestions, risk scoring, voice-to-quote |
| `MOBILE_DESIGN.md` | Mobile UX constraints and patterns |
| `CLAUDE_CODE_SKILLS.md` | How to use Claude Code effectively on this project |

## SKILLS MAP

| File | When to load |
|---|---|
| `skills/DESIGN_SKILL.md` | Product-specific design system. All UI decisions are made here |
| `skills/NEXTJS_SKILL.md` | Any App Router, routing, Server Action, or RSC task |
| `skills/DRIZZLE_SKILL.md` | Any DB schema, query, or migration task |
| `skills/CLERK_SKILL.md` | Any auth, session, or user-sync task |
| `skills/UPSTASH_SKILL.md` | Any rate limiting or caching task |
| `skills/INNGEST_SKILL.md` | Any background job or event-driven task |
| `skills/SHADCN_SKILL.md` | Any UI component, Aceternity, or mobile layout task |
| `skills/RESEND_SKILL.md` | Any email sending, template, or notification task |
| `skills/INTL_SKILL.md` | Any i18n, translation key, locale, or date formatting task |
| `skills/MOTION_SKILL.md` | Any animation, transition, gesture, or micro-interaction task |
| `skills/POSTHOG_SKILL.md` | Any analytics event, feature flag, or user tracking task |
| `skills/ZUSTAND_SKILL.md` | Any client UI state, multi-step form, or draft state task |
| `skills/BLOB_SKILL.md` | Any file upload, PDF storage, or logo/asset management task |
| `skills/PDF_SKILL.md` | Any PDF generation, invoice template, or quote template task |

---

## TECH STACK (quick ref)

| Layer | Tool |
|---|---|
| Framework | Next.js 15 App Router |
| Hosting | Vercel |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Clerk (phone OTP + email OTP only) |
| Cache / Rate limit | Upstash Redis |
| Background jobs | Inngest |
| Email | Resend |
| SMS | GatewayAPI (stub in MVP) |
| Animation | Motion (Framer Motion v11) |
| UI components | shadcn/ui + Aceternity UI |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| i18n | next-intl (English active, Danish stubbed) |
| Monitoring | Sentry |
| Analytics | Vercel Analytics + PostHog |

Full rationale for each choice in `BUSINESS_PLAN.md` § 4.

---

## PHASE CHECKLIST

```
[~] Phase 0 — Foundation & Infrastructure      (F-001, F-014 pending external setup)
[~] Phase 1 — Authentication & User Profile    (F-100–F-103 pending Clerk dashboard config)
[x] Phase 2 — Customer Management
[x] Phase 3 — Job Management
[x] Phase 4 — Quote Builder
[x] Phase 5 — Invoice Engine
[~] Phase 6 — Dashboard & Free Tier Launch     (BE queries done; dashboard FE uses stub data)
[ ] Phase 7 — Compliance Pre-GoLive
```

Update `CLAUDE.md` current phase when a phase completes. Full phase specs in `BUSINESS_PLAN.md` § 6.

---

## PROJECT STRUCTURE (top-level)

```
haandvaerk-pro/
├── app/
│   ├── (auth)/          — sign-in, sign-up
│   ├── (dashboard)/     — all protected routes
│   └── api/             — webhooks + inngest only
├── components/
│   ├── ui/              — shadcn base
│   ├── aceternity/      — premium components
│   ├── forms/           — per-feature forms
│   ├── dashboard/       — dashboard widgets
│   ├── pdf/             — invoice + quote PDF templates
│   └── shared/          — page-header, empty-state, tier-gate
├── lib/
│   ├── db/              — schema/, queries/, client
│   ├── auth/            — Clerk helpers
│   ├── email/           — Resend templates + client
│   ├── inngest/         — background job functions
│   ├── upstash/         — rate limit + cache client
│   └── utils/           — currency, dates, vat, tier
├── hooks/
├── stores/              — Zustand stores
├── messages/            — en.json (active), da.json (stubbed)
├── middleware.ts
├── drizzle/migrations/
└── docs/                — all spec + skill files
```

Full file-level structure in `BUSINESS_PLAN.md` § 5.