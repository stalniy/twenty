# CASL Adoption Research — Tija360

## Overview
- Company: Tija360
- Product: Tija eProcurement
- Industry: Procurement SaaS
- Country: Kenya
- Company website: [https://tija360.com/](https://tija360.com/)
- Research priority: MEDIUM
- Identity verification: Official /about identifies Tija360 as a Nairobi B2B software company building Tija eProcurement. William Muli's portfolio says product built at Radi Digital; development relationship does not establish legal parent ownership.

## CASL Adoption Evidence
- Source URLs:
  - [https://tija360.com/about](https://tija360.com/about)
  - [https://tija360.com/pricing](https://tija360.com/pricing)
  - [https://ke.linkedin.com/in/muliswilliam](https://ke.linkedin.com/in/muliswilliam)
  - [https://williammuli.dev/](https://williammuli.dev/)
- Source type: Engineer-reported SaaS implementation; LinkedIn indexed profile text
- Evidence date: Project Jul 2026–Present per indexed LinkedIn
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Medium: explicit CASL in indexed first-party profile; direct retrieval limited
- Exact evidence excerpt: “a NestJS API, Prisma and PostgreSQL, Redis and Bull queues, CASL-based authorization” — William Muli, LinkedIn Projects / tija eProcurement (search-indexed first-party profile)
- Verification limitations:
  - Direct LinkedIn fetch returns HTTP 999; CASL/project text independently located in search-indexed copy of same public profile, not full live page.
  - Tija360/Radi Digital legal ownership relationship Unknown; do not merge organizations based only on development association.
  - Current deployed CASL and active customer count not independently confirmed.

## Technical Implementation
- CASL packages: CASL; exact packages Unknown
- Application architecture: TypeScript monorepo, multi-tenant procure-to-pay platform (indexed engineer profile)
- Frontend: Next.js, React (indexed engineer profile)
- Backend: NestJS
- Database: Prisma, PostgreSQL
- Authorization model: CASL authorization, RBAC reported in supplied research
- Multi-tenancy: Engineer describes multi-tenant product
- Notable technical details: Official site verifies configurable multi-level approvals, budget controls, role-scoped visibility; does not name CASL.

## Business Context
- Product description: Procure-to-pay SaaS with requests, approvals, orders, deliveries, invoice matching and payments.
- Commercial model: Official pricing: US$35/user/month; free supplier users; cloud subscription and self-hosted option.
- Enterprise customers / adoption signals: Commercial offering verified. Active customer count and adoption scale Unknown.
- Known company scale: Unknown
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Approval workflow authorization.
- Multi-organization permissions.
- Database-level filtering.
- Permission audits.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Full name: William Muli
- Role: Senior software engineer; CTO at Radi Digital (own portfolio)
- Association: Public profile says designed/built tija eProcurement; portfolio attributes development to Radi Digital
- Public professional profile: [https://williammuli.dev/](https://williammuli.dev/)

## Research Assessment
- Priority: MEDIUM
- Evidence strength: Engineer-reported SaaS implementation; LinkedIn indexed profile text
- Current usage verified: Unknown
- Suggested next research step: Confirm current deployment and permission pain points with public technical contact or owner.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Tija360

**Priority:** MEDIUM  
**Industry:** Procurement SaaS  
**Country:** Kenya

**Website:**
https://tija360.com/

**Evidence:**
https://ke.linkedin.com/in/muliswilliam

**Technical contact:** William Muli

**CASL usage:**

- Developer reports CASL-based authorization in the Tija eProcurement application.
- NestJS, Prisma, PostgreSQL.
- Multi-level approval workflows.
- Multi-user B2B procurement platform.
- Public product pricing was reported at approximately $35/user/month; verify before recording as current.

**Potential consulting opportunities:**

- Approval workflow authorization.
- Multi-organization permissions.
- Database-level filtering.
- Permission audits.

**Evidence classification:** Engineer-reported SaaS implementation.

Commercial scale and active customer count are unverified.
