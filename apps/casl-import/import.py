import argparse
import json
import uuid
from urllib.parse import urlparse

from crm_api import BASE_URL, ROOT, company_matches, note_body, person_matches, records, request

NAMESPACE = uuid.UUID('3703e470-37d0-4aba-8bad-b7f384dfe1a4')
REPORT_PATH = ROOT / 'execution-report.json'


def identifier(source):
    return str(uuid.uuid5(NAMESPACE, source))


def load_inventory():
    return {resource: records(resource) for resource in ['companies', 'people', 'notes', 'noteTargets']}


def live_field():
    schema = request('/rest/metadata/objects')
    if schema['pageInfo']['hasNextPage']:
        raise RuntimeError('Metadata pagination requires inspection')
    company = next(item for item in schema['data'] if item['nameSingular'] == 'company')
    field = next(item for item in company['fields'] if item['name'] == 'leadType')
    if field['type'] not in ['SELECT', 'MULTI_SELECT']:
        raise RuntimeError('Unexpected Lead Type field type')
    if not any(option['value'] == 'CASL_USER' and option['label'] == 'CASL user' for option in field['options']):
        raise RuntimeError('Required CASL user option is missing')
    return field


def lead_patch(company, field):
    value = company.get('leadType')
    if field['type'] == 'MULTI_SELECT':
        return None if 'CASL_USER' in (value or []) else {'leadType': [*(value or []), 'CASL_USER']}
    if value == 'CASL_USER':
        return None
    if value not in [None, '']:
        raise RuntimeError('Preserving existing single-select value requires resolution: ' + company['name'])
    return {'leadType': 'CASL_USER'}


def matching_note(research, company, inventory):
    linked = {target['noteId'] for target in inventory['noteTargets'] if target.get('targetCompanyId') == company['id']}
    matches = [note for note in inventory['notes'] if note['id'] == identifier(research['sourceId'] + ':note') or
        (note['id'] in linked and (note.get('title', '').casefold() == 'casl adoption research' or
        'Source identifier: ' + research['sourceId'] in ((note.get('bodyV2') or {}).get('markdown') or '')))]
    if len(matches) > 1:
        raise RuntimeError('Multiple research notes require resolution: ' + research['name'])
    return matches[0] if matches else None


def profile_body(research):
    body = note_body(research)
    for contact in research.get('contacts', []):
        body += '\n\n## Contact: ' + contact['firstName'] + ' ' + contact['lastName']
        body += '\n- Verified professional profile: ' + contact['profileUrl']
        body += '\n- Association: ' + contact['association']
        body += '\n- Association source: ' + contact['associationSource']
    if research.get('additionalSources'):
        body += '\n\nAdditional evidence:\n' + '\n'.join('- ' + value for value in research['additionalSources'])
    return body


def prepare(research, inventory, field):
    plan = []
    for company_research in research:
        if company_research.get('skipReason'):
            plan.append({'name': company_research['name'], 'action': 'skip', 'reason': company_research['skipReason']})
            continue
        matches = company_matches(company_research, inventory['companies'])
        company = matches[0] if matches else {'id': identifier(company_research['sourceId'] + ':company'), 'name': company_research['name']}
        patch = lead_patch(company, field)
        note = matching_note(company_research, company, inventory)
        contacts = []
        for contact in company_research['contacts']:
            people = person_matches(contact, inventory['people'])
            if people and people[0].get('companyId') not in [None, company['id']]:
                raise RuntimeError('Existing person has another company: ' + contact['firstName'] + ' ' + contact['lastName'])
            contacts.append({'name': contact['firstName'] + ' ' + contact['lastName'], 'action': 'reuse' if people else 'create'})
        plan.append({'name': company_research['name'], 'id': company['id'], 'action': 'update' if matches and patch else ('reuse' if matches else 'create'),
            'leadTypePatch': patch, 'noteAction': 'preserve' if note else 'create', 'contacts': contacts})
    return plan


def execute(research, inventory, field):
    report = {'instance': BASE_URL, 'leadTypeFieldType': field['type'], 'operations': [], 'companies': [], 'skipped': []}

    def save():
        REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n')

    def write(resource, body, record_id=None):
        response = request('/rest/' + resource + ('/' + record_id if record_id else ''), body, 'PATCH' if record_id else 'POST')
        report['operations'].append({'resource': resource, 'method': 'PATCH' if record_id else 'POST', 'id': record_id or body['id']})
        save()
        return response

    def ensure_target(note_id, key, target_id):
        if not any(target['noteId'] == note_id and target.get(key) == target_id for target in inventory['noteTargets']):
            target = {'id': identifier(note_id + ':' + key + ':' + target_id), 'noteId': note_id, key: target_id}
            write('noteTargets', target)
            inventory['noteTargets'].append(target)

    save()
    for company_research in research:
        if company_research.get('skipReason'):
            report['skipped'].append({'name': company_research['name'], 'reason': company_research['skipReason']})
            save()
            continue
        matches = company_matches(company_research, inventory['companies'])
        action = 'reused'
        if matches:
            company = matches[0]
            patch = lead_patch(company, field)
            if patch:
                write('companies', patch, company['id'])
                company.update(patch)
                action = 'updated'
        else:
            company = {'id': identifier(company_research['sourceId'] + ':company'), 'name': company_research['name'],
                'leadType': ['CASL_USER'] if field['type'] == 'MULTI_SELECT' else 'CASL_USER',
                'domainName': {'primaryLinkUrl': company_research['website'], 'primaryLinkLabel': company_research['domain']}}
            write('companies', company)
            inventory['companies'].append(company)
            action = 'created'
        note = matching_note(company_research, company, inventory)
        if not note:
            note = {'id': identifier(company_research['sourceId'] + ':note'), 'title': 'CASL Adoption Research',
                'bodyV2': {'markdown': profile_body(company_research)}}
            write('notes', note)
            inventory['notes'].append(note)
        ensure_target(note['id'], 'targetCompanyId', company['id'])
        people_report = []
        for contact in company_research['contacts']:
            people = person_matches(contact, inventory['people'])
            person_action = 'linked'
            if people:
                person = people[0]
                if not person.get('companyId'):
                    write('people', {'companyId': company['id']}, person['id'])
                    person['companyId'] = company['id']
            else:
                person = {'id': identifier(company_research['sourceId'] + ':person:' + contact['profileUrl']),
                    'name': {'firstName': contact['firstName'], 'lastName': contact['lastName']}, 'companyId': company['id']}
                if contact.get('jobTitle'):
                    person['jobTitle'] = contact['jobTitle']
                if 'linkedin.com' in (urlparse(contact['profileUrl']).hostname or ''):
                    person['linkedinLink'] = {'primaryLinkUrl': contact['profileUrl'], 'primaryLinkLabel': 'LinkedIn'}
                write('people', person)
                inventory['people'].append(person)
                person_action = 'created'
            ensure_target(note['id'], 'targetPersonId', person['id'])
            people_report.append({'name': contact['firstName'] + ' ' + contact['lastName'], 'id': person['id'], 'action': person_action,
                'url': BASE_URL + '/object/person/' + person['id']})
        report['companies'].append({'name': company['name'], 'id': company['id'], 'action': action, 'noteId': note['id'], 'people': people_report,
            'url': BASE_URL + '/object/company/' + company['id']})
        save()
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true')
    arguments = parser.parse_args()
    research = json.loads((ROOT / 'research.json').read_text())['companies']
    field = live_field()
    inventory = load_inventory()
    plan = prepare(research, inventory, field)
    (ROOT / 'dry-run.json').write_text(json.dumps(plan, indent=2) + '\n')
    print(json.dumps(plan, indent=2))
    if arguments.execute:
        execute(research, inventory, field)
        print('Import complete; execution-report.json records every completed write.')


if __name__ == '__main__':
    main()
