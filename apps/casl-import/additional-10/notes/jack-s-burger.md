# CASL Adoption Research — Jack's Burger

## Overview
- Company: Jack's Burger
- Product: Jack's Burger multi-branch restaurant back office, POS API and storefront
- Industry: Restaurants / Food Service
- Country: United Kingdom
- Company website: [https://www.jacksburgeruk.com/](https://www.jacksburgeruk.com/)
- Research priority: MEDIUM
- Identity verification: Developer case study directly links to restaurant's canonical site, which identifies North Wales operation; do not treat developer as business owner.

## CASL Adoption Evidence
- Source URLs:
  - [https://aqibrime.cloud/works/jacks-burger](https://aqibrime.cloud/works/jacks-burger)
  - [https://www.jacksburgeruk.com/](https://www.jacksburgeruk.com/)
- Source type: Developer-reported commercial implementation
- Evidence date: Project labelled 2025
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Strong explicit public CASL evidence; current production status Unknown
- Exact evidence excerpt: “Every request builds a CASL ability from database roles” — Aqib Rime, Jack's Burger Platform case study
- Verification limitations:
  - Legal registered restaurant entity Unknown; verified operating restaurant brand retained.
  - Developer describes implementation; current live server authorization not independently inspected.

## Technical Implementation
- CASL packages: CASL; exact packages Unknown
- Application architecture: Bun/Turborepo monorepo; shared API for back office, POS and customer apps
- Frontend: TanStack Start admin, Next.js 16 storefront; Flutter POS/customer apps
- Backend: Typed ORPC API; TanStack server functions
- Database: Postgres, PostGIS, Drizzle
- Authorization model: 33 resources; branch, warehouse, ownership, amount and open-shift conditions
- Multi-tenancy: Multi-branch scoping; organization-level multi-tenancy Unknown
- Notable technical details: Per-record checks and list filters share CASL ability; roles stored in database.

## Business Context
- Product description: Multi-location burger restaurant business, not established as SaaS vendor.
- Commercial model: Restaurant food sales, takeaway and delivery.
- Enterprise customers / adoption signals: Developer reports operational admin/POS/customer API usage; live customer storefront corroborated.
- Known company scale: Multiple branches per developer; exact count Unknown
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Complex conditional permissions.
- Multi-location authorization.
- Authorization testing.
- Reducing policy duplication.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Full name: Aqib Rime
- Role: Lead engineer (case study)
- Association: Implemented restaurant platform; no ownership claim
- Public professional profile: [https://aqibrime.cloud/works/jacks-burger](https://aqibrime.cloud/works/jacks-burger)

## Research Assessment
- Priority: MEDIUM
- Evidence strength: Developer-reported commercial implementation
- Current usage verified: Unknown
- Suggested next research step: Confirm current deployment and permission pain points with public technical contact or owner.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Jack's Burger

**Priority:** MEDIUM  
**Industry:** Restaurants / Food Service  
**Country:** United Kingdom (verify)

**Evidence:**
https://aqibrime.cloud/works/jacks-burger

**Technical contact:** Aqib Rime

**CASL usage:**

- Developer describes authorization involving 33 resources.
- Permissions based on branch, warehouse, record ownership, and transaction amount.
- Commercial multi-location restaurant operational system.
- CASL supports operational and administrative permission workflows.

**Potential consulting opportunities:**

- Complex conditional permissions.
- Multi-location authorization.
- Authorization testing.
- Reducing policy duplication.

**Evidence classification:** Developer-reported commercial implementation.

**Important:** This is not necessarily a SaaS company.

Verify the actual customer/organization identity. Do not assume the developer or agency is the product owner.
