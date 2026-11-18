# Job posting skills, fit score, and CV recommendations

Extract the advertised role and candidate requirements from each Source posting. Link the role to the Job Position and link the Job Position to shared Skills through its requirements. Preserve the employer’s original job title. Preserve must-have and nice-to-have severity. Use the assigned Person’s master CV for matching. Each Person and Source posting has its own assessment.

Use the Person selection shared by the record actions and dashboard. Suggest the workspace owner when the mapping is unique. An explicit Person assignment takes precedence and applies to all selected jobs for the run. The master CV specification covers owner mapping, CV storage, and the backfill of existing jobs. [Master CV specification](master-cv.md)

## Title filter during job collection

At the start of each manual or scheduled collection run, use the explicitly assigned Person, or the workspace owner’s Person if the run has no assignment. Resolve that Person’s master CV and read its Target role once for all boards in the run. If the Person cannot be resolved uniquely, the master CV is missing, or its Target role is blank, report the specific configuration error and stop before fetching any board.

Use the resolved Target role as the title filter. It replaces the JOB_TITLE application variable and its hard-coded defaults. All board connectors use the same title filter. Apply it to the advertised title before collecting the posting. Keep the separate JOB_KEYWORD filter on posting content and the existing workplace filters. Only candidate requirements contribute points to fitScore.

Compare role keywords across case, word order, and common spelling variants such as “fullstack”, “full-stack”, and “full stack”. For a full-stack software role, recognize “engineer” and “developer” as equivalent. The word “software” is optional in this context. A Staff target includes Senior full-stack roles. A seniority word alone cannot establish a role match.

For a Target role of **Staff Fullstack Software Engineer**, the title filter must accept **Senior Fullstack Engineer**, **Senior Fullstack Developer**, and **Full-Stack Developer (Senior)**. It must reject **Senior Account Executive**.

## Requirement assessment

Score only candidate qualifications. Interpret each item with its section heading and retain the posting excerpt that supports it. Treat descriptions of the team’s stack and future duties as context for assessment and CV recommendations. When the employer also asks for corresponding experience, extract that qualification once.

Complete extraction before matching. Determine skill coverage by comparing shared Skill IDs. Count Skills listed on the assigned Person’s master CV or already linked to an achievement on that CV. Count each distinct requested skill once within its priority tier. Count interchangeable alternatives once and independently required skills separately. Preserve the links to the original requirements.

Assess the remaining criteria against the assigned Person’s master CV with AI. Calculate the final fitScore from both deterministic skill matches and AI-assessed requirement matches. Skill presence is independent of years of experience. Count each distinct employer requirement once. A satisfied requirement earns its full weight. A partially supported, unclear, or missing requirement stays in the denominator and earns zero. For a compound requirement, show the result for each check and evaluate its original combination of mandatory checks and permitted alternatives. For example, “five years of PostgreSQL in production” earns zero requirement points when the PostgreSQL Skill matches but the CV establishes only two years. Show the successful Skill match alongside the duration gap. A must-have is worth two points and a nice-to-have is worth one. Compute fitScore as 100 times earned points divided by available points across both tiers. Return N/A when extraction finds zero requirements.

Account for every extracted requirement. Each satisfied requirement must link to one or more supporting records on the assigned Person’s master CV: a Skill linked to the CV, an experience entry, achievement, project, or credential. Keep requirements visible as gaps or uncertainties when the available records do not establish them.

Use the same extraction, evidence validation, and scoring rules for both single-job and bulk matching. Reuse a posting’s extraction across people while its relevant source text and extraction rules are unchanged. A saved change to CV evidence or Skill links makes the affected Person’s result eligible for reassessment on the next matching run.

Distinguish completed assessments with zero qualifications (N/A), completed assessments with zero earned points (0%), and incomplete runs (pending or failed). Retain earned and available points and show counts by severity. Use the existing nearest-whole-percent display.

Identify the scoring method on saved assessments. Historical reports remain readable until reassessment. Only results computed under the new rule participate in the new ranking. The existing manual matching actions refresh selected jobs. Where a Person has several scored Source postings for a Job Position, use the existing best-posting selection among comparable results.

## CV recommendations

After scoring, save each recommendation with the assessment for the assigned Person and Source posting. On the Job Position, show a **Recommendations** section in that assessment’s match report. Link each proposed edit to the affected requirement and target record on the Person’s master CV. Cite the supporting evidence and show the original and proposed wording for text edits. If an existing achievement demonstrates a missing Skill, propose linking the shared Skill to that achievement. When evidence is missing, ask a factual question before proposing a claim.

Each recommendation starts as **proposed**. Offer **Apply** and **Dismiss** for reviewable edits. Apply saves the approved change to the master CV and marks the recommendation **applied** when the save succeeds. Dismiss marks it **dismissed** and leaves the CV as it was. Persist the decision so reopening the report shows its saved state.

Show a potential score gain only when satisfying the requirement would add previously unearned points. A wording improvement to an already satisfied requirement can improve clarity and earn zero additional points. Only reassessment updates the earned score.

## Out of scope

When the Person decides to apply, the application workflow prepares a tailored CV and attaches the generated PDF to the Job Position. That workflow is a separate delivery.

## Cleanup summary

- Defined how extraction, candidate evidence, and scoring changes affect reuse in both matching actions.
- Distinguished N/A, zero, and incomplete assessments, and retained the existing percentage display.
- Applied the existing manual reassessment workflow to legacy reports and restricted ranking to comparable scores.
- Distinguished projected gains from earned points in CV recommendations.
