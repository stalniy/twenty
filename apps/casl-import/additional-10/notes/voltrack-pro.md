# CASL Adoption Research — Voltrack Pro

## Overview
- Company: Voltrack Pro
- Product: Voltrack auto-dispatch and real-time fleet control platform
- Industry: Logistics / Fleet Management SaaS
- Country: Egypt
- Company website: [https://voltrack.pro/](https://voltrack.pro/)
- Research priority: HIGH
- Identity verification: Engineer identifies Voltrack Pro as employer; public organization page identifies VolTrack Pro logistics software operation (type Self-Employed). Product site matches logistics model and brand. Legal incorporation/name not established.

## CASL Adoption Evidence
- Source URLs:
  - [https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef](https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef)
  - [https://www.linkedin.com/company/voltrack-pro](https://www.linkedin.com/company/voltrack-pro)
  - [https://voltrack.pro/](https://voltrack.pro/)
  - [https://voltrack.pro/pricing](https://voltrack.pro/pricing)
- Source type: Engineer-reported commercial SaaS implementation
- Evidence date: October 2025–Present
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Strong explicit public CASL evidence; current production status Unknown
- Exact evidence excerpt: “Designed and maintained a casl-based multi-tenant rbac system supporting scoped role bindings (master, client, vendor, branch, zone)” — Magdy Mohammed Elshrief, Wuzzuf Voltrack Pro work experience
- Verification limitations:
  - Operating brand verified; legal registered owner and incorporation status Unknown.
  - No reciprocal link from retrieved organization profile to product domain; matching brand/product context supports association but legal ownership is not proven.
  - Current deployed implementation remains self-reported.

## Technical Implementation
- CASL packages: CASL; exact packages Unknown
- Application architecture: Multi-tenant logistics and delivery platform
- Frontend: Unknown
- Backend: NestJS
- Database: PostgreSQL, Drizzle ORM, MongoDB, Redis
- Authorization model: CASL multi-tenant RBAC; scopes master/client/vendor/branch/zone
- Multi-tenancy: Explicit engineer report
- Notable technical details: Engineer reports dispatch, shift scheduling, subscription billing and audit logging.

## Business Context
- Product description: Commercial logistics platform automating dispatch and fleet tracking.
- Commercial model: Official per-driver subscription pricing, minimum five drivers; regional USD/EGP billing.
- Enterprise customers / adoption signals: Product site claims 2m+ deliveries; marketing claim not audited. Avoid unrelated similarly named brands.
- Known company scale: LinkedIn organization page advertises 11–50 employees, not independently audited
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Hierarchical RBAC/ABAC.
- Database authorization.
- Tenant isolation.
- Fine-grained record access.
- CASL/Drizzle integration.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Full name: Magdy Mohammed Elshrief
- Role: Software Engineer (Wuzzuf current page)
- Association: Voltrack Pro, October 2025–Present; Egypt per experience
- Public professional profile: [https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef](https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef)

## Research Assessment
- Priority: HIGH
- Evidence strength: Engineer-reported commercial SaaS implementation
- Current usage verified: Unknown
- Suggested next research step: Confirm current deployment and permission pain points with public technical contact or owner.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Voltrack Pro

**Priority:** HIGH  
**Industry:** Logistics / Fleet Management SaaS  
**Country:** Egypt

**Website:**
https://voltrack.pro/

**Evidence:**
https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef

**Technical contact:** Magdy Elshrief

**CASL usage:**

- CASL-based multi-tenant RBAC.
- Hierarchical permissions involving master, client, vendor, branch, and zone.
- Reported stack: NestJS, Drizzle, PostgreSQL, MongoDB, Redis.
- Used in logistics, dispatch, and fleet management workflows.
- Commercial subscription model with driver-based pricing.

**Potential consulting opportunities:**

- Hierarchical RBAC/ABAC.
- Database authorization.
- Tenant isolation.
- Fine-grained record access.
- CASL/Drizzle integration.

**Evidence classification:** Engineer-reported commercial SaaS implementation.

Verify whether Voltrack Pro is a standalone company or product brand and identify the correct CRM entity.
