# CASL Adoption Research

- Product: Infisical security and secrets management platform
- Evidence URL: https://github.com/Infisical/infisical/blob/main/backend/src/ee/services/permission/permission-service.ts
- Evidence type: Official repository source and documentation
- Evidence date: Unknown
- CASL usage: Backend permission service imports CASL and constructs organization, project and resource abilities with createMongoAbility; role rules and delegated OAuth scopes determine permissions.
- Technical stack: TypeScript; Fastify; @casl/ability
- Adoption status: Documentation-reported
- Potential consulting opportunity: Not assessed. No expressed commercial interest or active engagement verified.
- Research confidence: High for documented/source-level CASL adoption; deployed instances not inspected.
- Last verified: 2026-11-13
- Research priority: Not assigned
- Evidence availability: Primary source retrieved
- Supporting context: backend/src/ee/services/permission/permission-service.ts → CASL imports, getOrgPermission, getProjectPermission and getResourcePermission.
- Missing information: Exact source publication date unknown; mutable repository branch observed on verification date.; Commercial priority not assigned.; Production deployment not independently inspected.

Source identifier: casl:infisical

Additional evidence:
- https://github.com/Infisical/infisical/blob/main/backend/CODE_QUALITY.md
