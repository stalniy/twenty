import json

from crm_api import ROOT, company_matches, person_matches
from importlib import import_module

importer = import_module('import')
inventory = importer.load_inventory()
research = json.loads((ROOT / 'research.json').read_text())['companies']
field = importer.live_field()
verification = []
for company_research in research:
    if company_research.get('skipReason'):
        continue
    matches = company_matches(company_research, inventory['companies'])
    assert len(matches) == 1, company_research['name'] + ': company count'
    company = matches[0]
    assert importer.lead_patch(company, field) is None, company['name'] + ': missing CASL_USER'
    note = importer.matching_note(company_research, company, inventory)
    assert note, company['name'] + ': missing research note'
    body = (note.get('bodyV2') or {}).get('markdown') or ''
    assert company_research['sourceId'] in body, company['name'] + ': missing source identifier'
    assert company_research['evidenceUrl'] in body, company['name'] + ': missing evidence'
    assert any(target['noteId'] == note['id'] and target.get('targetCompanyId') == company['id'] for target in inventory['noteTargets'])
    for contact in company_research['contacts']:
        people = person_matches(contact, inventory['people'])
        assert len(people) == 1, contact['firstName'] + ': person count'
        assert people[0]['companyId'] == company['id'], contact['firstName'] + ': wrong company'
        assert contact['profileUrl'] in body, contact['firstName'] + ': missing verified profile'
        assert any(target['noteId'] == note['id'] and target.get('targetPersonId') == people[0]['id'] for target in inventory['noteTargets'])
    verification.append({'name': company['name'], 'id': company['id'], 'leadType': company['leadType'],
        'noteId': note['id'], 'url': importer.BASE_URL + '/object/company/' + company['id']})
plan = importer.prepare(research, inventory, field)
assert all(row['action'] in ['reuse', 'skip'] and not row.get('leadTypePatch') and row.get('noteAction', 'preserve') == 'preserve' and
    all(person['action'] == 'reuse' for person in row.get('contacts', [])) for row in plan), 'Repeat dry run would modify records'
from pathlib import Path
before = json.loads(Path('/private/tmp/casl-import-inventory.json').read_text())
for resource, old_records in before.items():
    current = {record['id']: record for record in inventory[resource]}
    for old_record in old_records:
        assert current.get(old_record['id']) == old_record, 'Pre-existing record changed: ' + resource + '/' + old_record['id']
result = {'verifiedCompanies': verification, 'count': len(verification), 'preexistingRecordsUnchanged': True,
    'repeatDryRunRequiresNoWrites': True, 'leadTypeFieldType': field['type'], 'errors': []}
(ROOT / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
(ROOT / 'repeat-dry-run.json').write_text(json.dumps(plan, indent=2) + '\n')
print(json.dumps({'verifiedCompanies': len(verification), 'preexistingRecordsUnchanged': True, 'repeatDryRunRequiresNoWrites': True}))
