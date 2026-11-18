# Additional ten CASL leads

Completed 2026-11-15. See [report.md](report.md) for outcomes and [research.json](research.json) for the full research export. The preceding import directory is unchanged.

The importer uses supported Twenty REST APIs and existing authentication. It validates the live Lead Type field and option, deduplicates canonical domains/names/aliases, preserves alternate classifications, and stops if existing research content differs. Stable identifiers make partial retries safe. It creates no People, Opportunities, or tasks.

Run with TWENTY_TOKEN_FILE pointing to an existing authorized bearer-token file:

```sh
python3 apps/casl-import/additional-10/import.py
python3 apps/casl-import/additional-10/import.py --execute
```

The first command is a read-only dry run. Execution verifies note relationships, classifications, and repeat-run behavior. Preservation verification additionally uses the restricted local baseline `/private/tmp/casl-additional-10-baseline.json` created before this import. Credentials are never stored in this folder. Research notes are immutable to this importer: differing CRM content stops the run for safe manual resolution.
