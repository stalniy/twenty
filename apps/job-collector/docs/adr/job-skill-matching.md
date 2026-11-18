# Match extracted requirements against the assigned master CV

Extract each posting’s requirements before evaluating a candidate. Keep deterministic skill coverage and AI judgments separately traceable. Both contribute to the final fitScore. Each satisfied requirement must identify supporting CV records so the Person can inspect the basis of the assessment.

Count distinct skill requests within each priority tier and honor explicit alternatives. AI can propose changes to the master CV. The Person controls which changes are applied because the master CV supplies evidence for other jobs.

The scoring unit is one distinct employer requirement. Multiple supporting records or assessment methods can establish that requirement. They do not create additional scoring units. This keeps the denominator stable when the same requirement needs several checks.

S6 fixes relative requirement weights at 2:1. Both tiers contribute to the same denominator. Retain the counts by severity so a reader can reproduce the percentage. A posting with no requirements has no numeric fitScore.

S7 limits scoring to candidate qualifications. Posting excerpts and section headings establish why an item contributes to the denominator. Responsibilities and employer technology descriptions can still guide CV recommendations.

The master CV’s Target role supplies title keywords for collection. This lets a Person maintain their intended role in one place. Collection and requirement scoring serve separate purposes.

Each manual or scheduled collection run searches for one Person. Defaulting to the workspace owner makes unattended collection possible. Resolving the Person and Target role before fetching boards prevents a missing assignment or CV from silently broadening the search.
