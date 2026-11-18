# CASL Adoption Research — Coreola

## Overview
- Company: Coreola
- Product: Commercial React admin foundation
- Industry: Developer Tools / Commercial Software
- Country: Unknown
- Company website: [https://coreola.com/](https://coreola.com/)
- Research priority: MEDIUM
- Identity verification: Commercial product verified; site says Coreola team but does not identify legal company/operator. Terms and privacy pages inaccessible; merchant-of-record Creem is not product owner.

## CASL Adoption Evidence
- Source URLs:
  - [https://coreola.com/](https://coreola.com/)
  - [https://docs.coreola.com/customization/permissions](https://docs.coreola.com/customization/permissions)
  - [https://docs.coreola.com/overview/what-is-coreola](https://docs.coreola.com/overview/what-is-coreola)
- Source type: Product documentation / commercial offering
- Evidence date: Unknown
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Strong explicit public CASL evidence; current production status Unknown
- Exact evidence excerpt: “Both are implemented with CASL for the ability layer and a simple map for feature flags.” — Coreola Permissions documentation
- Verification limitations:
  - Legal company/operator unresolved; retain product in export.
  - Terms/privacy and Creem purchase URL returned cache miss.
  - Docs prove advertised implementation, not adoption by customer companies.

## Technical Implementation
- CASL packages: @casl/ability 6.x per docs
- Application architecture: Frontend admin foundation with replaceable backend and development mock
- Frontend: React 19, TypeScript, Vite, Redux Toolkit/RTK Query, MUI 9
- Backend: Production backend supplied by adopter; json-server mock only
- Database: Unknown
- Authorization model: Ability matrix for navigation/routes/components/mutations
- Multi-tenancy: Unknown
- Notable technical details: Documentation shows CASL ability construction from user matrix; ABAC extensions described, not proof of shipped conditional rules.

## Business Context
- Product description: Commercial developer foundation, not established as SaaS service.
- Commercial model: Homepage advertises $199 Personal / $599 Team founder offers; one-time licensing, 12 months updates.
- Enterprise customers / adoption signals: Commercial offer exists; paying customer count Unknown.
- Known company scale: Unknown
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Partnership or integration.
- Recommended CASL architecture.
- CASL documentation or example integrations.
- Technical collaboration.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Unknown: no verified named technical contact found.

## Research Assessment
- Priority: MEDIUM
- Evidence strength: Product documentation / commercial offering
- Current usage verified: Unknown
- Suggested next research step: Identify responsible operating organization before CRM creation.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Coreola

**Priority:** MEDIUM  
**Industry:** Developer Tools / Commercial Software

**Website:**
https://coreola.com/

**Evidence:**
https://coreola.com/

**CASL usage:**

- Commercial React administration foundation/template.
- CASL abilities reportedly govern navigation, routes, and components.
- Product has been advertised with approximately $199 pricing; verify current details.

**Potential consulting opportunities:**

- Partnership or integration.
- Recommended CASL architecture.
- CASL documentation or example integrations.
- Technical collaboration.

**Evidence classification:** Product documentation / commercial offering.

This is a commercial developer tool, not necessarily a SaaS.

Determine its actual company/operator before creating a Company record.
