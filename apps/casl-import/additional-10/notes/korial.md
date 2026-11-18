# CASL Adoption Research — Korial

## Overview
- Company: Korial
- Product: Enterprise AI / autonomous industrial operations platform
- Industry: Industrial AI / Robotics SaaS
- Country: Germany
- Company website: [https://www.korial.com/](https://www.korial.com/)
- Research priority: HIGH
- Identity verification: Official site explicitly verifies Energy Robotics rebranding to Korial. Imprint says Korial is a brand of Energy Robotics GmbH, Darmstadt, Germany (HRB 98890).

## CASL Adoption Evidence
- Source URLs:
  - [https://mathiasmonstrey.be/en/](https://mathiasmonstrey.be/en/)
  - [https://www.korial.com/](https://www.korial.com/)
  - [https://www.korial.com/legal/imprint](https://www.korial.com/legal/imprint)
- Source type: Engineer-reported enterprise implementation; official identity/rebrand corroboration
- Evidence date: December 2022–Present
- Last verified: 2026-11-15
- Adoption status: Publicly reported implementation; live production not independently verified
- Confidence: Strong explicit public CASL evidence; current production status Unknown
- Exact evidence excerpt: “RBAC/CASL permission resolution at the GraphQL API gateway” — Mathias Monstrey, Monstrey Technologies → Energy Robotics engagement
- Verification limitations:
  - Legal entity remains Energy Robotics GmbH despite brand name change.
  - Current usage self-reported in ongoing engagement, not production-audited.
  - Shell partner signal verified; Merck customer claim remains supplied/unverified.

## Technical Implementation
- CASL packages: CASL; exact packages Unknown
- Application architecture: Distributed robotics cloud, central GraphQL gateway, devices/frontends/AI services
- Frontend: Customer frontends; framework Unknown
- Backend: NestJS, TypeScript, GraphQL; gRPC, RabbitMQ and Python across platform
- Database: MongoDB, Redis; PostgreSQL listed generally in profile but not verified for this engagement
- Authorization model: CASL RBAC at gateway
- Multi-tenancy: Not explicitly established in retrieved engagement evidence
- Notable technical details: Engineer reports service authentication moving from one-time passwords to token exchange.

## Business Context
- Product description: Industrial AI platform coordinating robots, drones, sensors and data.
- Commercial model: Enterprise product; demo/sales offering.
- Enterprise customers / adoption signals: Official platform claims 1m+ inspections and 100+ global deployments. Homepage shows Shell as enterprise partner; customer status is not established by logo alone. Merck relationship not independently verified.
- Known company scale: Unknown; engineer says backend team of four, which is team-specific
- Relevant technical challenges: Authorization boundaries described above motivate review hypotheses; no customer need has been confirmed.

## Potential CASL Opportunities
All items below are hypotheses from the supplied research, not confirmed needs.
- Authorization across distributed services.
- Policy consistency.
- GraphQL authorization and security review.
- Fine-grained permissions for robotics and AI workflows.
- Policy conformance testing.

- Enterprise support: Validate maintainers’ support needs for documented permission workflows.
- Security audits: Assess policy boundaries and isolation if an engagement is requested.
- CASL/UCAST integration: Unknown fit; investigate actual query/filter stack before proposing.
- Sponsorship: Potential ecosystem relationship only; budget and interest Unknown.
- Technology partnership: Explore implementation knowledge sharing if relevant to the business.

## Public Technical Contacts
- Full name: Mathias Monstrey
- Role: Senior Backend Developer & Distributed Systems Engineer (self-reported)
- Association: Freelance through Monstrey Technologies to Energy Robotics from 2022-12
- Public professional profile: [https://mathiasmonstrey.be/en/](https://mathiasmonstrey.be/en/)

## Research Assessment
- Priority: HIGH
- Evidence strength: Engineer-reported enterprise implementation; official identity/rebrand corroboration
- Current usage verified: Unknown
- Suggested next research step: Confirm current deployment and permission pain points with public technical contact or owner.
- Outreach angle: Discuss documented authorization architecture; validate interest before proposing engagement. No outreach performed.
- Research date: 2026-11-15

## Supplied Research and Verification Status
The supplied source material is retained below. Corroborated facts are described and attributed above; any additional assertions, proposed opportunities, figures, and ownership implications below remain supplied research, not independently verified. Claims of current use do not establish direct production verification.

### Korial (formerly Energy Robotics)

**Priority:** HIGH  
**Industry:** Industrial AI / Robotics SaaS  
**Country:** Germany

**Website:**
https://www.korial.com/

**Evidence:**
https://mathiasmonstrey.be/en/

**Technical contact:** Mathias Monstrey

**Related organization:** Monstrey Technologies

**CASL usage:**

- Engineer reports CASL RBAC in a central GraphQL API Gateway.
- Gateway supports robotics, AI services, and customer-facing applications.
- Previously known as Energy Robotics; verify rebranding and the correct current company identity.
- Company reports over one million robotic inspections and more than 100 deployments.
- Shell and Merck have been referenced as customers; verify before adding to the note.

**Potential consulting opportunities:**

- Authorization across distributed services.
- Policy consistency.
- GraphQL authorization and security review.
- Fine-grained permissions for robotics and AI workflows.
- Policy conformance testing.

**Evidence classification:** Engineer-reported enterprise implementation.

This is one of the highest-priority leads.

Use Korial as the Company name if the rebranding is verified. Preserve Energy Robotics as a historical alias in the research note.
