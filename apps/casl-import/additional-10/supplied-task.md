# Task: Import 10 Additional CASL Users into Twenty CRM

## Objective

Import 10 newly researched organizations/products into my locally running Twenty CRM.

These are additional CASL.js adoption leads discovered through developer CVs, public engineering profiles, product websites, and case studies.

**These are new leads. Do not re-import the previously researched batch of 15 companies.**

The goal is to identify commercial organizations using CASL.js that may eventually become customers for authorization consulting, enterprise support, security audits, sponsorships, or partnerships.

## 1. Twenty CRM configuration

Inspect the existing local Twenty setup and API configuration.

Use supported Twenty APIs/SDKs and existing authentication.

For every verified company:

- Find an existing Company or create one.
- Set **Lead Type = CASL user**.
- Preserve any other existing Lead Type selections.
- Populate the standard Company fields with verified basic information.
- Store **all CASL research details in a Note associated with the Company**.

Do not add new Company fields for adoption evidence, consulting opportunities, confidence, or priority.

Do not create Opportunities, deals, tasks, or pipeline entries.

### Important: Lead Type

An existing Company field named `Lead Type` should already exist.

It is a multi-select field containing the option `CASL user`.

Use the existing field and option. Inspect the actual schema before writing. If missing, report the problem rather than creating a conflicting field.

`Lead Type` means **why the company was added to the CRM**, not what commercial opportunity currently exists.

## 2. Research data to import

The information below comes from prior research. Treat it as source material that should be independently verified where possible.

Do not invent facts if sources cannot be accessed.

### 1. Fluents.ai

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

### 2. Tija360

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

### 3. Sagacify

**Priority:** MEDIUM-HIGH  
**Industry:** AI Engineering / Software Consultancy  
**Country:** Belgium

**Evidence:**
https://www.killiangemoets.com/about

**Technical contact:** Killian Gemoets

**CASL usage:**

- Engineer reports implementing RBAC and ABAC using CASL across multiple client projects.
- Shared frontend/backend authorization enforcement.
- Company develops custom software and AI applications.

**Potential consulting opportunities:**

- Integration partnership.
- Authorization expertise for client engagements.
- CASL architecture reviews.
- Cross-project policy standardization.
- Enterprise support for client deployments.

**Important:** Sagacify is a software consultancy rather than necessarily a SaaS vendor. It may be a valuable implementation or distribution partner.

**Evidence classification:** Engineer-reported client-project adoption.

Verify the person's relationship with Sagacify.

### 4. Korial (formerly Energy Robotics)

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

### 5. Voltrack Pro

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

### 6. Jack's Burger

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

### 7. Logispark Technologies

**Priority:** MEDIUM  
**Industry:** Software Development / IT Services  
**Country:** Nepal

**Evidence:**
https://himalayas.app/@yunishtuladhar

**Technical contact:** Yunish Tuladhar

**CASL usage:**

- Engineer reports RBAC using CASL in client or internal projects.
- Evidence suggests experience implementing CASL in commercial software.
- Individual client organizations are not identified.

**Potential consulting opportunities:**

- Technical partnership.
- Enterprise implementation support.
- Authorization architecture reviews.
- CASL expertise for future customer projects.

**Evidence classification:** Engineer-reported implementation.

Do not assume every Logispark client uses CASL.

### 8. Tashkela

**Priority:** LOW  
**Industry:** Sports Booking / Consumer Platform

**Evidence:**
https://github.com/AlaaALMidani

**Technical contact:** Alaa Al-Midani

**CASL usage:**

- Developer reports using CASL RBAC for a sports facility booking platform.
- Application has reportedly been published in the App Store.

**Potential consulting opportunities:**

- Role-based facility management.
- Multi-organization authorization.
- Booking administration.

**Evidence classification:** Developer-reported product implementation.

**Identity verification required:** Determine the legal company or organization operating Tashkela.

If Tashkela is only a product with no identifiable organization, do not invent a legal company. See section 5.

### 9. Coreola

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

### 10. SmartBroker

**Priority:** RESEARCH  
**Industry:** Agricultural Trading / B2B SaaS

**Evidence:**
https://md-webdeveloper.vercel.app/projects/smartbroker

**Technical contact:** Marcio David

**CASL usage:**

- Developer describes a multi-tenant SaaS application for grain brokers.
- CASL-based RBAC.
- Commercial workflow involving agricultural brokerage.

**Potential consulting opportunities:**

- Multi-tenant permissions.
- Fine-grained access to trading data.
- Conditional authorization.
- Authorization architecture review.

**Evidence classification:** Developer-reported project.

**Identity verification required:** Determine whether SmartBroker is an actual commercial company, private client product, or portfolio project.

Do not manufacture company ownership or production status.

## 3. Verify company identities before creating records

Some entries above are commercial products, brands, or portfolio projects rather than clearly established companies.

For each entry:

1. Open the evidence URL, if accessible.
2. Confirm that CASL is explicitly mentioned in the relevant context.
3. Identify the organization responsible for the implementation.
4. Find the verified canonical website/domain.
5. Check whether the organization already exists in Twenty.
6. Preserve the connection between the company and product in the research note.

If a product has no identifiable organization, do not create a misleading Company record.

Instead, retain it in the local research export with a status of `Needs company identification`.

If an existing Twenty Company already represents the verified product owner, attach the note to that Company.

If an evidence source is inaccessible, distinguish the supplied research notes from independently verified claims.

Do not replace a valid lead with an unrelated similarly named company.

## 4. Company records

Use the existing Twenty Company fields:

- Name
- Domain / Website (verified canonical domain only)
- Lead Type: CASL user
- Other standard business fields only if independently verified and supported by the existing schema

**Do not create custom fields for:**

- CASL usage
- Research priority
- Evidence confidence
- Consulting opportunities
- Technical stack
- Adoption status
- Contact names

Those belong in Notes.

Keep Company records clean and reusable across future business initiatives.

## 5. Create CASL research notes

For every successfully imported company, create or update a Note linked to the Company.

Title:

`CASL Adoption Research — <Company Name>`

Use this structure:

### Overview
- Company:
- Product:
- Industry:
- Country:
- Company website:
- Research priority:

### CASL Adoption Evidence
- Source URL(s):
- Source type:
- Evidence date (if known):
- Last verified:
- Adoption status:
- Confidence:
- Exact evidence excerpt (short, attributed):
- Verification limitations:

### Technical Implementation
- CASL packages:
- Application architecture:
- Frontend:
- Backend:
- Database:
- Authorization model:
- Multi-tenancy:
- Notable technical details:

Only populate details supported by evidence.

### Business Context
- Product description:
- Commercial model:
- Enterprise customers / adoption signals:
- Known company scale:
- Relevant technical challenges:

Separate organization-wide metrics from product-specific metrics.

### Potential CASL Opportunities
Explain why this organization may be relevant for:
- Authorization consulting
- Enterprise support
- Security audits
- CASL/UCAST integration
- Sponsorship
- Technology partnership

These are hypotheses, not confirmed customer needs.

### Public Technical Contacts
For each verified contact:
- Full name
- Role
- Association with organization
- Public professional profile URL

No invented emails, phone numbers, or titles.

### Research Assessment
- Priority: HIGH / MEDIUM-HIGH / MEDIUM / LOW / RESEARCH
- Evidence strength:
- Current usage verified: Yes / No / Unknown
- Suggested next research step:
- Outreach angle:
- Research date:

Store evidence URLs as explicit links in the note.

Create a note even if some fields are unknown. Use `Unknown` or `Not verified` rather than guessing.

## 6. Preserve existing CRM data

The import must be idempotent.

Before creating anything:

- Search Companies by canonical domain, name, and verified aliases.
- Check existing CASL research notes.
- Avoid duplicate records and duplicate research notes.
- Preserve existing Lead Type selections.
- Never overwrite unrelated notes.
- Never overwrite verified information with guesses.
- Never create duplicate contacts.

If an existing research note is found, update or merge its research content without destroying user-entered information. If safe merging isn't possible, report the conflict instead of overwriting.

## 7. Contacts

The technical contacts in the research data are valuable, but this task primarily imports Companies.

Put verified contact information in Company Notes.

Do not create Person records unless there is already an established workflow for creating and deduplicating researched contacts in this Twenty instance.

Do not send messages or initiate outreach.

## 8. Execute the import

1. Inspect Twenty configuration and schema.
2. Verify API access.
3. Find the existing `Lead Type` field and `CASL user` option.
4. Verify company identities and available evidence.
5. Check existing Companies for duplicates.
6. Prepare a dry-run summary listing:
   - Companies to create
   - Existing Companies to update
   - Product-only leads requiring identity resolution
   - Notes to create/update
   - Unverified claims
7. Execute safe, non-destructive imports.
8. Attach CASL Adoption Research notes.
9. Verify Company relationships and Lead Type values.
10. Export the full research dataset as JSON for future discovery runs.

Proceed with safe operations without requiring additional confirmation.

Stop and report if an operation would require deleting records, overwriting user-maintained research, exposing credentials, or bypassing supported APIs.

## 9. Final report

Provide:

- Number of Companies created
- Number of existing Companies updated
- Number of CASL research Notes created/updated
- Number of candidates skipped or awaiting identification
- Which companies have the strongest evidence
- Which sources could not be independently verified
- Any API or data-model limitations
- Twenty record links, where available

Also provide a concise table:

Company | CASL Evidence | Priority | Import Status | Twenty Link

## Success criteria

- All verified organizations are represented in Twenty without duplicates.
- Every imported Company has `Lead Type` containing `CASL user`.
- Research details are stored in linked Notes, not extra Company fields.
- Product/company identities are correctly distinguished.
- Evidence links and confidence limitations are preserved.
- No Opportunities or deals are created.
- No outreach is performed.
- The import can be safely rerun.

The resulting CRM records should help me identify, research, and eventually approach commercial organizations using CASL.js.