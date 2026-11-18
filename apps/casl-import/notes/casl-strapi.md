# CASL Adoption Research

- Product: Strapi headless CMS
- Evidence URL: https://github.com/strapi/strapi/blob/develop/docs/docs/docs/01-core/admin/02-permissions/01-how-they-work.mdx
- Evidence type: Official repository source and documentation
- Evidence date: Unknown
- CASL usage: Official documentation identifies CASL as the admin RBAC engine. The permissions package declares @casl/ability, and admin permission code generates abilities from user roles and permissions.
- Technical stack: TypeScript; Node.js; @strapi/permissions; @casl/ability
- Adoption status: Documentation-reported
- Potential consulting opportunity: Not assessed. No expressed commercial interest or active engagement verified.
- Research confidence: High for documented/source-level CASL adoption; deployed instances not inspected.
- Last verified: 2026-11-13
- Research priority: Not assigned
- Evidence availability: Primary source retrieved
- Supporting context: How Permissions Work → Overview; packages/core/permissions/package.json → dependencies; admin/server/src/services/permission/engine.ts → generateUserAbility.
- Missing information: Exact source publication date unknown; mutable repository branch observed on verification date.; Commercial priority not assigned.; Production deployment not independently inspected.

Source identifier: casl:strapi

Additional evidence:
- https://github.com/strapi/strapi/blob/develop/packages/core/permissions/package.json
- https://github.com/strapi/strapi/blob/develop/packages/core/admin/server/src/services/permission/engine.ts
