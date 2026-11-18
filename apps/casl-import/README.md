# CASL research import

Completed on 2026-11-13 against http://localhost:3000. Created 18 companies, seven people, and 18 linked research notes. MedWorkForce.ai remains held for legal-owner verification. All imported companies have the existing CASL_USER Lead Type. Pre-existing records are unchanged.

- `report.md` and `import-report.json`: final results, limitations, missing information, and CRM links.
- `research.json` and `research.md`: 19 researched organizations, seven verified contacts, and primary citations.
- `notes/`: exported structured research notes, including verified professional profiles and association context.
- `dry-run.json`: pre-execution live plan; `repeat-dry-run.json`: verified repeat-run plan.
- `execution-report.json`: completed API write ledger.
- `verification.json`: verified records, classification, preservation, and idempotency results.
- `schema.json`: inspected metadata.

The existing leadType is SELECT, with CASL_USER already present. It remains unchanged; the supported API cannot change its type in place. The user's follow-up requested CASL user classification using the existing field. Research priority does not imply evidence strength or commercial interest.

Authentication reuse was explicitly authorized. Set TWENTY_TOKEN_FILE to the authorized bearer-token file, then run:

```sh
python3 apps/casl-import/import.py            # Read-only dry run
python3 apps/casl-import/import.py --execute  # Import, preserving existing data
python3 apps/casl-import/verify.py            # Verify records and repeat-run plan
```

No credential is stored here. `crm_api.py` provides read-only schema/inventory inspection and shared API helpers. Existing CRM snapshots used for preservation verification are held in restricted temporary storage. Keep the original snapshot for `verify.py`; rerunning the inventory inspector replaces that baseline. Import execution preserves existing research notes and stops before overwriting a different single-select Lead Type or changing a person's existing company.

No opportunities, outreach, or pipeline changes were created. EZclass association is explicitly historical. Non-LinkedIn professional profile URLs are stored in research notes linked to the people.
