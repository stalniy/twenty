import argparse
import json
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))
from crm_api import BASE_URL, company_matches, records, request

NAMESPACE = uuid.UUID('e06eb055-a336-49a4-b4bf-9676a667997f')


def identifier(value):
    return str(uuid.uuid5(NAMESPACE, value))


def save(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def inventory():
    return {resource: records(resource) for resource in ['companies', 'notes', 'noteTargets']}


def lead_field():
    schema = request('/rest/metadata/objects')
    if schema['pageInfo']['hasNextPage']:
        raise RuntimeError('Metadata pagination requires inspection')
    company = next(item for item in schema['data'] if item['nameSingular'] == 'company')
    fields = [field for field in company['fields'] if field['label'] == 'Lead Type']
    if len(fields) != 1:
        raise RuntimeError('Expected one existing Lead Type field')
    field = fields[0]
    if field['type'] not in ['SELECT', 'MULTI_SELECT']:
        raise RuntimeError('Unsupported Lead Type field type')
    options = [option for option in field['options'] if option['label'] == 'CASL user']
    if len(options) != 1:
        raise RuntimeError('Expected existing CASL user option')
    return field, options[0]['value']


def prepare(candidates, current, field, option):
    plan = []
    for candidate in candidates:
        if not candidate['importable']:
            plan.append({'name': candidate['name'], 'action': 'skip', 'reason': candidate['skipReason']})
            continue
        matches = company_matches(candidate, current['companies'])
        company = matches[0] if matches else {'id': identifier(candidate['sourceId'] + ':company'), 'name': candidate['name']}
        value = company.get(field['name'])
        patch = {}
        if field['type'] == 'MULTI_SELECT':
            if option not in (value or []):
                patch[field['name']] = [*(value or []), option]
        elif value != option:
            if value not in [None, '']:
                raise RuntimeError('Cannot preserve existing single-select Lead Type: ' + candidate['name'])
            patch[field['name']] = option
        title = 'CASL Adoption Research — ' + candidate['name']
        note_id = identifier(candidate['sourceId'] + ':note')
        linked_ids = {target['noteId'] for target in current['noteTargets'] if target.get('targetCompanyId') == company['id']}
        notes = [note for note in current['notes'] if note['id'] == note_id or
                 (note['id'] in linked_ids and 'casl' in note.get('title', '').casefold() and 'research' in note.get('title', '').casefold())]
        if len(notes) > 1:
            raise RuntimeError('Multiple CASL research notes require resolution: ' + candidate['name'])
        body = (ROOT / 'notes' / (candidate['sourceId'] + '.md')).read_text()
        if notes and ((notes[0].get('bodyV2') or {}).get('markdown') != body or notes[0]['title'] != title):
            raise RuntimeError('Existing research differs; preserving user-maintained content: ' + candidate['name'])
        note_id = notes[0]['id'] if notes else note_id
        target = {'id': identifier(note_id + ':company:' + company['id']), 'noteId': note_id, 'targetCompanyId': company['id']}
        has_target = any(item['noteId'] == note_id and item.get('targetCompanyId') == company['id'] for item in current['noteTargets'])
        plan.append({'name': candidate['name'], 'id': company['id'], 'action': ('update' if patch else 'reuse') if matches else 'create',
                     'patch': patch, 'noteAction': 'reuse' if notes else 'create', 'noteId': note_id,
                     'targetAction': 'reuse' if has_target else 'create', 'target': target, 'title': title,
                     'url': BASE_URL + '/object/company/' + company['id']})
    return plan


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true')
    arguments = parser.parse_args()
    candidates = json.loads((ROOT / 'research.json').read_text())['candidates']
    field, option = lead_field()
    current = inventory()
    plan = prepare(candidates, current, field, option)
    save('repeat-dry-run.json' if (ROOT / 'execution-report.json').exists() else 'dry-run.json', plan)
    print(json.dumps([{key: item.get(key) for key in ['name', 'action', 'noteAction', 'reason']} for item in plan], indent=2))
    if not arguments.execute:
        return
    report_path = ROOT / 'execution-report.json'
    report = json.loads(report_path.read_text()) if report_path.exists() else {'operations': [], 'companies': [], 'skipped': []}

    def write(resource, body, record_id=None):
        response = request('/rest/' + resource + ('/' + record_id if record_id else ''), body, 'PATCH' if record_id else 'POST')
        report['operations'].append({'resource': resource, 'method': 'PATCH' if record_id else 'POST', 'id': record_id or body['id']})
        save('execution-report.json', report)
        return response

    for candidate, item in zip(candidates, plan):
        if item['action'] == 'skip':
            if not any(entry['name'] == item['name'] for entry in report['skipped']):
                report['skipped'].append(item)
            save('execution-report.json', report)
            continue
        if item['action'] == 'create':
            write('companies', {'id': item['id'], 'name': item['name'], **item['patch'],
                                'domainName': {'primaryLinkUrl': candidate['website'], 'primaryLinkLabel': candidate['domain']}})
        elif item['patch']:
            write('companies', item['patch'], item['id'])
        if item['noteAction'] == 'create':
            write('notes', {'id': item['noteId'], 'title': item['title'],
                            'bodyV2': {'markdown': (ROOT / 'notes' / (candidate['sourceId'] + '.md')).read_text()}})
        if item['targetAction'] == 'create':
            write('noteTargets', item['target'])
        if not any(entry['id'] == item['id'] for entry in report['companies']):
            report['companies'].append(item)
        save('execution-report.json', report)
    after = inventory()
    repeated = prepare(candidates, after, field, option)
    save('repeat-dry-run.json', repeated)
    if any(item['action'] not in ['reuse', 'skip'] or item.get('noteAction', 'reuse') != 'reuse' or item.get('targetAction', 'reuse') != 'reuse' for item in repeated):
        raise RuntimeError('Repeat import still requires writes')
    for item in repeated:
        if item['action'] == 'skip':
            continue
        company = next(company for company in after['companies'] if company['id'] == item['id'])
        value = company[field['name']]
        if not (option in value if isinstance(value, list) else value == option):
            raise RuntimeError('CASL Lead Type verification failed')
    baseline = json.loads(Path('/private/tmp/casl-additional-10-baseline.json').read_text())
    preserved = {}
    for resource, original in baseline.items():
        live = {record['id']: record for record in (after[resource] if resource in after else records(resource))}
        preserved[resource] = all(live.get(record['id']) == record for record in original)
    save('verification.json', {'leadTypeFieldType': field['type'], 'option': option, 'idempotent': True,
                               'preexistingRecordsPreserved': preserved, 'companiesVerified': len(report['companies'])})
    if not all(preserved.values()):
        raise RuntimeError('Pre-existing records changed; inspect verification')
    print('Verified linked notes, Lead Type values, preservation, and repeat-run idempotency.')


if __name__ == '__main__':
    main()
