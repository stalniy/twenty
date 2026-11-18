# Job Collector

A Twenty app that collects fully remote jobs matching the assigned master CV’s Target role and configured keywords, creates missing Job Positions, and keeps each source posting separately.

This package belongs to the independent Yarn workspace in `apps/`. Its dependency lockfile and releases are separate from the CRM monorepo.

## Sources

- **Ashby:** public company boards; requires `workplaceType: Remote` and listed postings. Hybrid jobs are excluded.
- **Lever:** public company boards, including EU boards, with pagination and explicit remote workplace type.
- **Work at a Startup / YC:** public company job lists and public YC job descriptions, read without login or API keys. Configure a company board rather than the homepage, which only contains featured jobs.
- **Elastic:** the public Greenhouse feed behind `jobs.elastic.co`, including full descriptions and explicit remote-country metadata. Pay ranges retain their advertised currency; only an explicit annual period qualifies for the annual USD fields.
- **FYUL:** the public Teamtailor RSS feed behind `careers.fyul.com/jobs`, including descriptions, locations, and explicit remote status. See [feed mapping details](docs/fyul.md).
- **The AA:** the public SmartRecruiters feed linked from `theaacareers.co.uk`, with full descriptions and explicit remote eligibility. Hybrid and field-worker roles are excluded.
- **LinkedIn and Glassdoor:** not implemented. Add a connector after choosing an available API, partner feed, or export. No scraping or credentials for these services are included.

Add Job board records with a company, source, board slug, region (Lever only), and Enabled checked. Installation seeds boards from existing companies' `ashbyhqSlug` field. Each collection also discovers newly added company slugs. Both paths preserve manually disabled boards.

### Work at a Startup / YC setup

Add a Job board with Source **Work at a Startup / YC**, link the existing CRM company, and enter its exact company slug (for example `revenuecat`). Public company URLs such as `https://www.workatastartup.com/companies/revenuecat` and `https://www.ycombinator.com/companies/revenuecat/jobs` also work. Region is only used for Lever. No YC account, browser cookies, or API key is required for collection; applying may still require signing in through the original site.

### The AA setup

Create a Job board with Source **The AA**, link the AA company, and set Board slug to `the-aa` or `https://www.theaacareers.co.uk/` (the `/apply/` URL also works). Enable the board. No account or API key is required. The connector paginates the public `TheAA1` SmartRecruiters postings feed and fetches full details with at most two concurrent requests. Only explicit remote roles without a hybrid flag and with the custom Location `HOME WORKER` qualify. AA also marks mobile roadside roles as remote, including entries without a `FIELD WORKER` label, so the remote flag alone is insufficient. Existing title and keyword filters still apply.

Source and application links retain the original SmartRecruiters posting URLs. Posting IDs distinguish separate location adverts even when they share a requisition reference. The custom Salary field and original compensation lines are retained without inferring currency conversions, base salary, or annual units; salary ranges remain unset. Missing descriptions, invalid identities, and incomplete pagination fail the board visibly.

### Elastic and Fyul setup

Create a company board with Source **Elastic**, linked to the Elastic company, and slug `elastic` or URL `https://jobs.elastic.co/`. For Source **Fyul**, link the Fyul company and use `fyul` or `https://careers.fyul.com/jobs`. Neither source requires an account or API key. Both apply the configured title and keyword filters and preserve the original job location on Source postings. Elastic uses Greenhouse's [public Job Board API](https://docs.greenhouse.io/job-board.html); its pay ranges do not always state a pay period, so those remain in Other currency / pay period rather than being assumed annual.

This connector reads embedded public Inertia page JSON. It is not a documented third-party API. It discovers job IDs on the Work at a Startup company page, maps them to public YC job URLs, then reads full descriptions with at most two concurrent requests. A valid company with no remote jobs returns an empty result. Hybrid, partly remote, and unknown workplace locations are excluded. Existing title, keyword, and location filters still apply.

A missing, blocked, redirected, or malformed required page fails that board visibly; the connector does not bypass authentication or silently import listings without descriptions. A company page and YC page must agree on company slug and job ID. Other boards continue through the existing collection pipeline. Homepage-wide/all-YC company discovery is not implemented: configure company boards explicitly.

Source links point to public YC job pages. YC sign-in/application URLs fall back to that unique public job URL for deduplication, rather than treating a shared login page as a job identity. Direct external employer application URLs are retained when provided. Existing ATS jobs are merged only when they share the same canonical application/posting URL; title similarity does not merge jobs.

Original salary text is retained. Only explicit structured salary metadata with currency and pay period is normalized; a textual dollar range alone is not assumed to mean annual USD, so it remains in the other-compensation group. Publication time is left unset when the available company metadata only has a relative age.

## Existing CRM data

The app reuses the workspace's existing `jobposition` / `jobpositions` object. It expects `companyId`, `joburl`, `location`, `salary`, `salaryMinimumUsd`, `salaryMaximumUsd`, `salaryPriority`, `mentionsTypeScript`, and `matchReason` fields, matching the local CRM import. New Job Positions explicitly start with status **New** (`NEW`). Position creation does not upsert, so concurrent collection cannot reset an existing application status. It never creates a second Job Position object and never changes existing application statuses, notes, follow-up dates, or salary fields.

Set `JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER` in a local `.env` file before building. This is the object's **universal identifier**, not its record ID. Find it through Twenty's metadata API. The binding grants the app access to that specific object and supplies the source-posting relation. `.env` files and credentials are ignored by Git.

The app owns Job boards and Source postings, with table views and company relations. Source postings link back to the original Job Position and refresh their description, salary, and last-seen date on collection. Job Positions store a normalized location: common US, UK, and UAE aliases use consistent country names, remote labels are removed, and worldwide aliases become Worldwide. City, region, and eligibility details are retained; ambiguous abbreviations such as CA are left as supplied. Missing locations and placeholders such as "not set" stay empty on new positions and leave existing locations intact. Existing matching positions refresh their location on collection. Source postings retain the original location for reference. Historical positions that do not match the current filters are not backfilled.

Deduplication uses provider IDs and canonical application/posting URLs scoped to a company. Tracking parameters and `/apply` are removed; identity-bearing query parameters are retained. Two sites can link to one Job Position when they share an application URL. Similar titles alone do not cause a merge. Stable IDs make retries converge on the same records.

## Salary

Priority uses the minimum explicitly advertised annual USD base salary: over $150k, over $100k, salary not listed, other currency/pay period, and $100k or below. It does not convert currencies, annualize hourly rates, or count equity and bonuses as base salary. When a posting has several salary tiers, the lowest advertised minimum wins. Original salary text is retained.

## Build and install

From `apps/`:

```bash
yarn install
yarn workspace @local/job-collector typecheck
yarn workspace @local/job-collector test
yarn workspace @local/job-collector build
```

The authored entities use named exports. The build adapter stages default-export entity definitions in ignored `.app/`, as required by the Twenty CLI. Edit source files, not `.app/`.

Authenticate the pinned CLI to your workspace through its normal login flow, then apply:

```bash
yarn workspace @local/job-collector exec twenty auth login --url http://localhost:3000 --name local
yarn workspace @local/job-collector apply --create --remote local
```

Applying installs two collection workflows: **Job Collector · Daily collection**, scheduled at 07:00 UTC (08:00 Warsaw in winter, 09:00 in summer), and **Job Collector · Collect now**. Both only collect jobs; CV scoring is available through the separate manual record actions described below. Keep the local Twenty server and worker running. Building alone does not install the app or schedule anything. Confirm that both collection workflows are present and active after applying.

The server and worker must have logic-function execution enabled. For the local Docker setup, `LOGIC_FUNCTION_TYPE=LOCAL` enables it. Set the app's **COLLECTOR_API_URL** variable to `http://server:3000` so both containers can reach the API. The pinned 2.57 runtime does not inject `SERVER_INTERNAL_URL` into functions. On newer runtimes, the collector also honors `TWENTY_INTERNAL_API_URL`; when neither override is set, it uses the SDK's default API address. The public `SERVER_URL` stays unchanged.

Installation seeds boards but does not immediately collect jobs. Use Collect now for the first run. Development sync may skip the post-install hook; in that case execute `seed-job-boards` with the CLI's `app exec` command against `.app/` first.

Each collection run uses the assigned Person’s master CV Target role across all boards. The owner supplies the default assignment. Pass a Person record ID as `personId` when invoking collection for someone else. Collection stops before fetching boards if it cannot resolve the Person, master CV, or Target role. `JOB_KEYWORD` accepts comma-, semicolon-, or newline-separated terms. At least one term must appear as a whole word in the title or description, and the posting must be fully remote. `ASHBY_COMPANY_SLUG_FIELD` controls the legacy company field used for seeding.

## Operations

### Master CV and legacy job backfill

After applying the update, run the initialization function against the installed workspace.

```bash
cd apps/job-collector
node scripts/app.mjs exec --remote local --name import-master-cv-and-backfill-jobs
```

The function uses the installed `CANDIDATE_RESUME` to initialize editable Master CV, experience, project, credential, achievement, and skill records. Open the owner's Person and follow **Master Cvs** to edit the CV and its related records. Use the same workspace Skill records across CVs and achievements. Each achievement records its Person, master CV, and one experience or project.

Twenty's workspace membership does not designate a separate owner. The app uses the sole member in a one-member workspace. In a workspace with multiple members, set the app's `JOB_COLLECTOR_OWNER_EMAIL` to the owner's workspace-member email. A unique Person email match takes precedence over an exact name match for a Person with no email. If the app cannot resolve one Person, confirm the owner's Person and rerun with `--payload '{"personId":"<owner Person record ID>"}'`.

Initialization preserves completed CV imports and existing assessments on retries. It checks all Source postings and Job Positions independently, including records in Trash, and returns totals, linked counts, and unresolved record IDs. Both missing-link lists must be empty. Existing position-only summaries are retained for the owner, and legacy reports and assessment times carry over with their original values.

### AI profile matching

On a Job Position or a selection of Job Positions, open **Match to a CV**. On the **Job search** dashboard, open **Profile matching**, load jobs, and select rows. Both entry points suggest the workspace owner's Person when the mapping is unique, and let you assign a different Person for the run. A Person needs a master CV before scoring. Use **Match this job** to force reassessment or **Match selected jobs** to process new and changed Source postings. All jobs in a run share one Person. The preparation result lists selected jobs without descriptions.

The dashboard's **TypeScript · Remote · Over $100k** filter uses `mentionsTypeScript = true AND (location is empty OR location contains Remote) AND salaryMinimumUsd > 100000`. The filter checks the stored location and advertised annual USD minimum. Both matching surfaces show the chosen Person’s best linked Source posting assessment for each job. Expand the score to see the posting excerpt, each check, and links to its CV evidence. The assessment report is also available on Job Positions through **Match to a CV**. Historical reports can be opened from the results. **Best profile matches** ranks assessments made under the weighted qualification rule.

The shared workflow extracts candidate qualifications from each Source posting and retains the excerpt, section heading, and severity. It reuses the extraction across people until the posting or extraction rules change. Edits to CV evidence or Skill links make the affected assessment eligible for matching again.

The report shows deterministic Skill checks and AI judgments with links to supporting CV records. A must-have earns two points and a nice-to-have earns one when a complete alternative is satisfied. The score is the rounded percentage of points earned across both tiers. Completed assessments with zero qualifications show **N/A**. Incomplete runs and per-posting errors are available in the workflow run.

Open **Recommendations** in the assessment to review suggested wording and Skill links. **Apply** saves the edit to the master CV. **Dismiss** saves the decision. Subsequent matching recalculates the score from the updated CV.

Each Person and Source posting has one current assessment. Bulk reuse requires the same Person, posting, and matching inputs. A change to the rendered CV, posting evidence, or adapter version queues the posting again. Use the single-job action after changes to the host skill itself. `MATCH_BATCH_SIZE` defaults to 25 and supports up to 100 postings at a time. Repeat bulk matching with the same selection to process any remaining postings.

Board records show last collection time, result, match count, and error. A failed board does not stop other boards; a run where every board fails throws. Workflow results include partial failures. Individual network calls have timeouts; transient provider errors and Twenty rate limits have bounded retries.

The collector runs boards sequentially within a 15-minute function limit. For substantially larger workloads, move board processing into queued jobs before increasing the source count. Missing postings remain available with their last-seen date; the app does not mark applications closed or delete historical records.

## Adding a source

Implement a connector returning `NormalizedJob[]`, register it in the collection function, and add its provider value to the board/posting definitions and `JobBoard`/`NormalizedJob` types. Cover the provider's pagination, remote classification, description, salary units, and missing data in connector tests. Use the upstream posting identifier as `externalId` and retain an original application URL for cross-source matching.

Uninstalling removes app-owned boards, source postings, and relations. Existing Job Positions remain, but source history is lost. Export that history before uninstalling.
