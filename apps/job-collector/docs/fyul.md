# FYUL

Use Source **FYUL**, link the existing FYUL company record, and set the board slug to `fyul` or `https://careers.fyul.com/jobs`. This connector is restricted to FYUL's own career domain and does not accept arbitrary Teamtailor hosts.

FYUL uses Teamtailor's publicly documented RSS feed at `https://careers.fyul.com/jobs.rss`. Teamtailor documents that this feed includes public job descriptions, remote status, global IDs, publication dates, and locations, with `offset` / `per_page` pagination: [RSS feed how-to guide](https://support.teamtailor.com/en/articles/11171756-rss-feed-how-to-guide).

Collection requires no account, API key, browser cookies, or login. Requests use the published feed directly. Public job-ad URLs serve as both source and application links; the collector does not submit applications.

- Only an explicit `remoteStatus` of `fully` becomes Remote. Hybrid, onsite, and unknown statuses remain distinct; descriptive mentions of remote work do not override the feed's status.
- All named source locations are retained. Missing locations stay empty rather than being treated as worldwide eligibility.
- Descriptions are parsed from the feed's HTML so the existing TypeScript and title filters can use the complete job-specific text.
- The documented RSS feed does not publish structured salary/currency/pay-period metadata. The connector leaves normalized salary fields empty instead of guessing from role titles, location, benefits, or currency symbols. Any salary information in the ad remains in its full description.
- The feed's global GUID is the source identifier. URLs and IDs remain separate for hybrid and remote versions of similarly named openings. Existing URL/provider deduplication applies.

Pages contain at most 100 jobs per request. Repeated full pages and more than 20 pages fail visibly instead of silently truncating collection. HTTP failures and invalid feeds fail that board through the existing error reporting; they are not interpreted as zero openings. A valid empty RSS channel returns an empty job list.
