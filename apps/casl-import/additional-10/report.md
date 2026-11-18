# Additional CASL import results

Completed 2026-11-15 against http://localhost:3000.

Created seven Companies and seven linked CASL research Notes. Updated zero existing Companies or Notes. Three candidates remain held for company identification. No People, Opportunities, tasks, or outreach created.

All seven Companies have the existing CASL_USER option. The live field is SELECT, not MULTI_SELECT. All pre-existing records are unchanged, including the earlier CASL batch. A second live dry run requires zero writes.

| Company | CASL Evidence | Priority | Import Status | Twenty Link |
|---|---|---|---|---|
| Fluents.ai | [Source](https://mathz.dev/) — Engineer-reported commercial implementation | HIGH | Imported | [Open](http://localhost:3000/object/company/6ccd32b2-fdec-59d6-b395-007102382a4f) |
| Tija360 | [Source](https://tija360.com/about) — Engineer-reported SaaS implementation; LinkedIn indexed profile text | MEDIUM | Imported | [Open](http://localhost:3000/object/company/1c9bc00e-e7cc-523a-99eb-33c39092a114) |
| Sagacify | [Source](https://www.killiangemoets.com/about) — Engineer-reported client-project adoption, employer association corroborated by official team page | MEDIUM-HIGH | Imported | [Open](http://localhost:3000/object/company/36019184-5ecc-52cf-b971-2cb2363854ac) |
| Korial | [Source](https://mathiasmonstrey.be/en/) — Engineer-reported enterprise implementation; official identity/rebrand corroboration | HIGH | Imported | [Open](http://localhost:3000/object/company/6ec4a716-0d7d-5546-a8eb-afda1d3a7478) |
| Voltrack Pro | [Source](https://wuzzuf.net/me/Magdy-Elshrief-8d8a43c5ef) — Engineer-reported commercial SaaS implementation | HIGH | Imported | [Open](http://localhost:3000/object/company/01900939-3840-5653-be21-23241ebc3b61) |
| Jack's Burger | [Source](https://aqibrime.cloud/works/jacks-burger) — Developer-reported commercial implementation | MEDIUM | Imported | [Open](http://localhost:3000/object/company/ede9300f-788d-5b91-937b-8c8ca6b874e8) |
| Logispark Technologies | [Source](https://himalayas.app/@yunishtuladhar) — Engineer-reported implementation | MEDIUM | Imported | [Open](http://localhost:3000/object/company/f38b5d2a-50bb-5db9-a076-a726ac20d9ed) |
| Tashkela | [Source](https://github.com/AlaaALMidani) — Developer-reported product implementation | LOW | Needs company identification | — |
| Coreola | [Source](https://coreola.com/) — Product documentation / commercial offering | MEDIUM | Needs company identification | — |
| SmartBroker | [Source](https://md-webdeveloper.vercel.app/) — Developer-reported project; indexed professional profile corroboration | RESEARCH | Needs company identification | — |

Strongest corroborated identity and explicit technical evidence: Korial, Sagacify, and Jack's Burger. Fluents.ai and Voltrack Pro also have detailed engineer reports. Current production CASL use is Unknown for all candidates.

## Limitations

- Existing Lead Type is SELECT, not MULTI_SELECT; existing classifications preserved, field schema unchanged.
- All CASL evidence is public reporting or documentation; current production usage remains Unknown.
- Tija360 LinkedIn direct access blocked (999), explicit CASL evidence available via indexed first-party profile.
- SmartBroker detail page inaccessible; project existence and CASL corroborated by portfolio/indexed profile but owner and production status unknown.
- Coreola terms/privacy/payment pages inaccessible; operator unresolved.
- Tashkela policy inaccessible; store seller is an individual, no verified company.

## Files

- `research.json`: full ten-candidate export, supplied research, verification, source links, status, and Twenty record links.
- `research.md`: cited research findings.
- `notes/`: complete local notes for all ten candidates; seven imported, three local only.
- `dry-run-summary.md` and `dry-run.json`: pre-import plan and limitations.
- `execution-report.json`: API write ledger.
- `verification.json` and `repeat-dry-run.json`: preservation and idempotency verification.
- `company-schema.json`: inspected live Company schema.
