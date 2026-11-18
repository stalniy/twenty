---
review-mode: interactive
review-status: complete
---

# Master CV specification review

## S1

status: accepted
depends-on: []
affects: [S2, S4, S5, S7]

### Issue

Master CV ownership.

### Decision

A Person can have one master CV. It holds a target role. Roles held belong to experience entries. Skills can cite experience as evidence.

### Why load-bearing

This defines ownership of career data and the cardinality of records.

### Evidence

User clarified one master CV, the target role, historical roles, and skill evidence.

### Assumptions

None.

## S2

status: accepted
depends-on: [S1]
affects: [S4]

### Issue

Application document destination.

### Decision

Generate a tailored PDF when the user decides to apply. Attach it to the Job Position.

### Why load-bearing

Document ownership determines where users retrieve the application they prepared.

### Evidence

User explicitly chose the Job Position as the attachment destination.

### Assumptions

None.

## S3

status: accepted
depends-on: []
affects: [S4, S5, S8]

### Issue

Matching responsibilities.

### Decision

Use deterministic skill matching. Use AI to assess requirements against experience. Keep must-have and nice-to-have severity.

### Why load-bearing

This division determines which facts must support reproducible comparisons.

### Evidence

User specified the matching responsibilities and severity values.

### Assumptions

None.

## S4

status: accepted
depends-on: [S1, S2, S3]
affects: [S6, S7]

### Issue

First delivery boundary.

### Decision

Specify structured CV storage and import in the first delivery. Keep the installed matcher usable from that CV. Defer the new posting parser, matching algorithm, and tailored PDF workflow to later specifications.

### Why load-bearing

The boundary determines the data contracts and migration that the first delivery must support.

### Evidence

User explicitly accepted S4. Job Collector already has manual matching actions and a stored résumé.

### Assumptions

None.

## S5

status: accepted
depends-on: [S1, S3]
affects: [S6]

### Issue

Whose CV the workspace matches.

### Decision

The matching workflow accepts a Person assignment and suggests the workspace owner by default. Use the assigned Person for single-job and bulk matching.

### Why load-bearing

Allowing multiple candidates per Job Position would change report identity, summary fields, bulk actions, and ownership of application documents.

### Evidence

User edited S5 to require Person assignment and the workspace owner suggestion. README describes one candidate variable and one projected report per Job Position. Matching settings in src/services/profile-matching.service.ts supply one profile to the queue.

### Assumptions

The identity link between workspace owner and CRM Person requires verification.

## S6

status: accepted
depends-on: [S4, S5]
affects: [S9]

### Issue

Successive runs can match the same job for different people.

### Decision

Keep the current assessment per Person and Source posting. Relate the results to the Job Position through its postings. Select a Person when showing the existing best-source summary. Reassessment for one Person can replace only that Person’s result.

### Why load-bearing

The assessment key controls persistence, result reuse, and the meaning of existing Job Position summaries. Changing it later requires a data migration.

### Evidence

The user explicitly accepted S6. The collection repository stores one assessment on each posting. Its backfill test selects the best source per position, with assessment time breaking ties.

### Assumptions

The first delivery needs the current assessment for each pair. Full assessment history is a separate concern.

### Alternatives

1. Keep only the last Person’s result on each posting. This loses previous candidates’ assessments.

## S7

status: accepted
depends-on: [S1, S4]
affects: [S8]

### Issue

A skill can have evidence from a project with no employer. The proposed CV structure only defines evidence from experience.

### Decision

Store each evidence item once on its master CV with its source experience entry or project. A project can stand alone or link to an experience entry. Allow several CV skills to cite the same evidence item, and each skill to cite several items from that CV.

### Why load-bearing

The evidence owner and link cardinality determine how to import achievements and how later matching can cite them. Changing these relationships after import requires reconstructing links or reconciling duplicate text.

### Evidence

The attached CV separates CASL and UCAST project achievements from employment. The user asked for skill proofs from experience. The user explicitly accepted S7.

### Assumptions

The imported master CV should preserve achievements outside employment.

## S8

status: accepted
depends-on: [S3, S7]
affects: []

### Issue

Does a skill have a workspace identity from the first import, or does each master CV own its own skill identities?

### Decision

Give each Skill a workspace identity. A master CV lists shared Skills. Link each evidence item directly to the Person, their master CV, and the Skills it supports. Preserve the source defined in S7. Future posting requirements can reference the same Skill.

### Why load-bearing

Identity determines which records are safe to share and which are candidate-specific. Deferring shared identity creates a later reconciliation and relinking migration for imported skills.

### Evidence

The user edited S8 to attach evidence to Skill, CV, and Person directly. The user wants deterministic skill comparisons and Job Position links to skills. S7 gives evidence provenance to one CV. The installed résumé stores skills as text in an application variable.

### Assumptions

Vocabulary governance and automated synonym resolution can be specified separately from the identity of stored records.

### Alternatives

1. Store independent skill records per CV and reconcile them when job parsing ships.

## S9

status: accepted
depends-on: [S6]
affects: []

### Issue

Existing job records and reports predate Person assignment.

### Decision

Link every existing Source posting and Job Position to the workspace owner’s Person. Use that identity for legacy reports and preserve the unassessed state of records without reports.

### Why load-bearing

Historical attribution determines which Person sees each job and report after migration. Incorrect attribution would require workspace-wide correction.

### Evidence

The user explicitly requested both complete record sets be attached to the workspace owner’s Person. The existing syncPositionProfileMatches routine visits assessed postings with a position link and cannot establish complete coverage.

### Assumptions

The owner-to-Person identity must be resolved in the target workspace.
