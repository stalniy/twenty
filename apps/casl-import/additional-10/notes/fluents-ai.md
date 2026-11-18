# CASL Adoption Research — Fluents.ai

## Overview
- Company: Fluents.ai
- Product: AI voice-agent platform; engineer names Dialer Pro, Front Desk, Sales Assistant
- Industry: AI Voice Agents / B2B SaaS
- Country: United States
- Company website: [https://www.fluents.ai/](https://www.fluents.ai/)
- Research priority: HIGH
- Identity verification: Commercial organization verified by official site and US postal address in terms.

## CASL Adoption Evidence
- Source URLs:
  - [https://mathz.dev/](https://mathz.dev/)
  - [https://www.fluents.ai/](https://www.fluents.ai/)
  - [https://www.fluents.ai/terms](https://www.fluents.ai/terms)
- Source type: Engineer-reported commercial implementation
- Evidence date: Employment period 2024–2026; page build 2026-08-19
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Strong explicit public CASL evidence; current production status Unknown
- Exact evidence excerpt: “hardened multi-tenant isolation via CASL RBAC and dual-database split” — Matheus Lúcio, Fluents.ai experience (2024–2026), mathz.dev
- Verification limitations:
  - Engineer evidence establishes reported implementation during 2024–2026; no production access or owner confirmation of current deployed CASL.
  - Engineer workload metrics are self-reported; current product names may differ from 2024–2026 names.

## Technical Implementation
- CASL packages: CASL; exact packages Unknown
- Application architecture: Engineer reports multi-tenant control plane and dual-database isolation
- Frontend: React
- Backend: NestJS, GraphQL
- Database: PostgreSQL, TypeORM
- Authorization model: CASL RBAC
- Multi-tenancy: Customer organization isolation
- Notable technical details: Engineer reports per-organization column redaction and industry compliance controls.

## Business Context
- Product description: Official site markets inbound and outbound AI voice operations.
- Commercial model: Commercial platform; official site offers trial and pricing.
- Enterprise customers / adoption signals: Engineer reports customer organizations handling tens of thousands of calls daily across healthcare, finance and insurance; product deployment claim, not independently audited or organization-wide revenue.
- Known company scale: Unknown
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Tenant isolation security review.
- Authorization boundaries for AI agents.
- Consistent policies across API services.
- Advanced RBAC/ABAC and policy validation.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Full name: Matheus Lúcio
- Role: Senior Software Engineer (2024–2026, self-reported)
- Association: Worked on Fluents.ai control plane
- Public professional profile: [https://mathz.dev/](https://mathz.dev/)

## Research Assessment
- Priority: HIGH
- Evidence strength: Engineer-reported commercial implementation
- Current usage verified: Unknown
- Suggested next research step: Confirm current deployment and permission pain points with public technical contact or owner.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Fluents.ai

**Priority:** HIGH  
**Industry:** AI Voice Agents / B2B SaaS  
**Country:** United States (verify)

**Evidence:**
https://mathz.dev/

**Technical contact:** Matheus Lúcio

**CASL usage:**

- Engineer-reported use of CASL RBAC.
- Multi-tenant authorization for customer organization isolation.
- Used in the control plane for products such as Dialer Pro, Front Desk, and Sales Assistant.
- Reported technology stack: NestJS, TypeORM, PostgreSQL, GraphQL.
- Engineer describes work on the platform during 2024–2026.
- His CV reports that customers execute tens of thousands of calls daily.

**Potential consulting opportunities:**

- Tenant isolation security review.
- Authorization boundaries for AI agents.
- Consistent policies across API services.
- Advanced RBAC/ABAC and policy validation.

**Evidence classification:** Engineer-reported commercial implementation.

Verify the product identity, engineering role, and current usage.
