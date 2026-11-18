---
review-mode: interactive
review-status: complete
---

# Job skill matching review

## S1

status: accepted
depends-on: []
affects: [S2, S3, S4]

### Issue

Source and candidate identity.

### Decision

Extract requirements for each Source posting, relate them to its Job Position and shared Skills, and match the assigned Person’s master CV. Keep must-have and nice-to-have severity.

### Why load-bearing

This defines ownership and reuse across people and job boards.

### Evidence

User’s extraction request and the master CV ADR on Skill and assessment ownership.

### Assumptions

None.

## S2

status: accepted
depends-on: [S1]
affects: [S3, S4, S5]

### Issue

Authority and order of assessment.

### Decision

Complete extraction first. Compute the final fitScore using both deterministic Skill matches and AI assessments. Match every requirement against CV records and link satisfied requirements to their supporting entities.

### Why load-bearing

This changes the meaning of persisted scores, ranking and recommendations.

### Evidence

The user superseded the earlier skill-only fitScore and explicitly named Skill, experience, achievement, project and credential as evidence sources.

### Assumptions

None.

## S3

status: accepted
depends-on: [S1, S2]
affects: [S5]

### Issue

Unit of skill coverage.

### Decision

Count each distinct requested skill once within its priority tier. Treat explicit interchangeable alternatives as one opportunity to match. Count each independently required skill separately. Retain the source requirement links.

### Why load-bearing

The extraction representation and score denominators depend on this unit. Changing it requires re-extraction or recalculation across saved jobs.

### Evidence

The user explicitly accepted S3 for the deterministic skill comparison. Wording about years and repeated mentions can generate multiple requirement rows for one skill.

### Assumptions

S6 defines tier weights for the headline score.

## S4

status: accepted
depends-on: [S1, S2]
affects: []

### Issue

Authority over CV changes suggested by AI.

### Decision

Save proposals with the Person and Source posting assessment and display them in the Recommendations section of its Job Position match report. Track each recommendation as proposed, applied, or dismissed. An existing achievement can support a proposed Skill link. A recommendation affects the CV only after acceptance and application. Wording suggestions can improve presentation independently. Flag unsupported qualifications as questions.

### Why load-bearing

Automatic writes would let one posting change the shared master CV and scores for other jobs.

### Evidence

Master CV ADR makes editable CRM records authoritative. Existing assessment schema stores suggested edits and questions. The user accepted S4 and subsequently requested the assessment attachment, report section, and review states.

### Assumptions

None.

## S5

status: accepted
depends-on: [S2, S3]
affects: [S6]

### Issue

How does a requirement with both a skill and an experience qualifier contribute to the final score?

### Decision

Count each distinct employer requirement once for final requirement coverage. A requirement is satisfied when the linked evidence covers every mandatory part or one permitted alternative. Preserve the separate skill result when an experience qualifier is unclear or missing.

### Why load-bearing

The unit determines the denominator, interpretation of saved scores, and whether splitting a requirement during extraction can inflate coverage.

### Evidence

The user defined fitScore as satisfied requirements divided by total requirements. The existing summary counts requirement rows. The local prototype routes a row through one method and stores AI sources as free text.

### Assumptions

S6 defines severity weighting.

### Alternatives

1. Give partial numerical credit for each satisfied part of a mixed requirement.

## S6

status: accepted
depends-on: [S5]
affects: [S7]

### Issue

How much should each must-have contribute relative to each nice-to-have?

### Decision

Use weighted requirement coverage. Assign two points to each must-have and one to each nice-to-have. Divide earned points by all available points. With zero requirements, return N/A.

### Why load-bearing

The weights define the meaning of stored scores and job rankings. Changing them requires recalculating scores for comparable rankings.

### Evidence

The user proposed higher weight for must-haves and including both categories. The user explicitly accepted S6, including the 2:1 ratio and empty-denominator behavior.

### Assumptions

A missing must-have is visible in the assessment and contributes zero earned points. It does not veto the whole score.

## S7

status: accepted
depends-on: [S6]
affects: []

### Issue

Should descriptions of future work and the employer’s stack count as candidate requirements?

### Decision

Score only criteria the posting asks the candidate to meet. Use the wording and surrounding section to establish the criterion and its priority. Preserve the source excerpt. Keep descriptions of future work and team technology available as assessment and recommendation context. Include them in the denominator only when the employer also states a candidate qualification.

### Why load-bearing

The extraction boundary changes the denominator across jobs and therefore changes rankings even with identical CV evidence. Changing it requires re-extraction and recalculation.

### Evidence

The local prototype extracts responsibilities as separate rows and can include them in coverage. The accepted score counts employer requirements. The user explicitly accepted S7.

### Assumptions

A posting can legitimately contain zero scoreable candidate requirements.

## S8

status: accepted
depends-on: []
affects: [S9]

### Issue

Which data supplies the title filter during collection?

### Decision

Use the master CV Target role in place of JOB_TITLE. Match role keywords and equivalents. A Staff Fullstack Software Engineer target admits Senior Fullstack Engineer and Senior Fullstack Developer.

### Why load-bearing

This determines which postings enter the CRM and who owns the search criteria.

### Evidence

The user explicitly requested the source change and both passing examples. Collection currently reads JOB_TITLE and applies a case-insensitive substring test in matchesJob.

### Assumptions

The user changed the title filter. JOB_KEYWORD and workplace filtering retain their separate roles.

## S9

status: accepted
depends-on: [S8]
affects: []

### Issue

Which Person supplies the Target role for a scheduled collection?

### Decision

Use one Person assignment for a collection run. Use an explicit assignment when present and default to the workspace owner’s Person otherwise. Resolve the assignment and require a populated Target role before fetching boards. Report a configuration error if the Person or target cannot be resolved.

### Why load-bearing

The choice determines the population of jobs collected by a shared workspace, including jobs never imported.

### Evidence

The user accepted S9. The collect-jobs handler currently takes no Person input. Assessment already supports an assigned Person and an owner default.

### Assumptions

Collection remains one search per run.
