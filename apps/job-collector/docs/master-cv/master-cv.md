# Master CV and job matching

A Person can have one master CV. The CV records the target role, skills, qualifications, education items, and experience entries. A role held belongs to the relevant experience. Store each achievement once under an experience entry or a project on the master CV. A project can stand alone or link to an experience entry on that CV. The master CV lists shared workspace Skills, including skills listed without an achievement. Link each evidence item directly to its Person, their master CV, and the Skills it supports. Its source experience or project belongs to that CV. One Skill can link to many people’s evidence. When matching a Person, use only evidence for that Person and their CV.

The first delivery imports the current CV into editable CRM records. Both single-job and bulk matching read the assigned Person’s master CV. The workflow suggests the workspace owner by default and allows a different Person to be assigned. An explicit assignment takes precedence. Each run uses the same Person for all selected jobs.

Import the current structured résumé from the installed Job Collector into the identified Person’s master CV. Preserve the original achievement text, dates, summary, and language proficiency. Retrying the import must preserve subsequent edits and avoid duplicate records.

Use the existing shared matching workflow steps and assessment method from both record actions and the dashboard. If the owner cannot be mapped to one Person, prompt for a Person. If the assigned Person lacks a CV, report that before scoring.

Keep one current assessment per Person and Source posting. For a Job Position, show the best result across its Source postings for the selected Person. A new result for one Person leaves every other Person’s result intact. Bulk reuse uses the same Person and Source posting and requires unchanged matching inputs.

The intended matching workflow extracts roles, skills, and requirements from the job description and links them to the Job Position. Requirements have must-have or nice-to-have severity. The matcher compares skills deterministically and uses AI to assess experience against requirements.

When the user decides to apply, they can tailor the CV for the job and generate a PDF. Attach the PDF to the Job Position.

## Backfill existing jobs

Resolve the workspace owner to one CRM Person before writing any links. If the mapping is missing or ambiguous, request the correct Person for that owner and resume with that identity.

Enumerate Source postings and Job Positions independently across all pages. Link every existing record of both types to the owner’s Person, including unassessed records, Source postings without a linked Job Position, and Job Positions without Source postings. Preserve other Person links, existing posting-to-position relationships, and application tracking data.

Attribute existing legacy posting assessments and position summaries to that Person. Preserve the original reports and assessment times, including position-only summaries. Leave unassessed records available for a future matching run. A backfill retry must preserve newer assessments and reuse existing links.

Verify coverage for each record type by checking for missing owner links. Report totals and any unresolved records. Completion requires zero missing links in both sets.

## Out of scope

Later deliveries cover the job description parser, deterministic skill matching, AI assessment of structured requirements, tailored drafts, and PDF generation. The first delivery keeps the existing matching method.

## Cleanup summary

- Defined a single import source and retry behavior. Legacy job data follows the explicit owner attribution rule above.
- Defined selection behavior for an ambiguous owner and a missing CV. Verify the owner-to-Person mapping in the installed workspace.
- Kept one matching path across all entry points.
