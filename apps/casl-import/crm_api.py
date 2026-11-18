import json
import os
import re
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
BASE_URL = 'http://localhost:3000'


def request(path, body=None, method=None):
    token = Path(os.environ['TWENTY_TOKEN_FILE']).read_text().strip()
    response = urlopen(Request(BASE_URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
        method=method), timeout=90)
    return json.load(response)


def records(resource):
    result, cursor = [], None
    while True:
        query = {'limit': 200}
        if cursor:
            query['starting_after'] = cursor
        response = request('/rest/' + resource + '?' + urlencode(query))
        data = response['data']
        result.extend(data[resource])
        if not response['pageInfo']['hasNextPage']:
            return result
        next_cursor = response['pageInfo']['endCursor']
        if next_cursor == cursor:
            raise RuntimeError('Pagination did not advance')
        cursor = next_cursor


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', value.casefold())


def domain(value):
    return urlparse(value if '://' in value else 'https://' + value).hostname.removeprefix('www.') if value else ''


def company_matches(research, companies):
    names = {normalized(name) for name in [research['name'], *research.get('aliases', [])]}
    domains = {value for value in [research.get('domain'), *research.get('domainAliases', [])] if value}
    matches = [company for company in companies if normalized(company['name']) in names or
        domain((company.get('domainName') or {}).get('primaryLinkUrl', '')) in domains]
    if len(matches) > 1:
        raise RuntimeError('Ambiguous company: ' + research['name'])
    return matches


def note_body(research):
    fields = [('Product', 'product'), ('Evidence URL', 'evidenceUrl'), ('Evidence type', 'evidenceType'),
        ('Evidence date', 'evidenceDate'), ('CASL usage', 'caslUsage'), ('Technical stack', 'technicalStack'),
        ('Adoption status', 'adoptionStatus'), ('Potential consulting opportunity', 'potentialConsultingOpportunity'),
        ('Research confidence', 'researchConfidence'), ('Last verified', 'lastVerified'),
        ('Research priority', 'priority'), ('Evidence availability', 'evidenceAvailability'),
        ('Supporting context', 'evidenceContext'), ('Missing information', 'missingInformation')]
    lines = ['# CASL Adoption Research', '']
    for label, key in fields:
        value = research.get(key)
        if isinstance(value, list):
            value = '; '.join(value)
        lines.append('- ' + label + ': ' + str(value or 'Unknown'))
    lines.extend(['', 'Source identifier: ' + research['sourceId']])
    return '\n'.join(lines)


def person_matches(contact, people):
    full_name = normalized(contact['firstName'] + contact['lastName'])
    matches = [person for person in people if normalized((person.get('name') or {}).get('firstName', '') +
        (person.get('name') or {}).get('lastName', '')) == full_name or
        (contact.get('profileUrl') and (person.get('linkedinLink') or {}).get('primaryLinkUrl') == contact['profileUrl'])]
    if len(matches) > 1:
        raise RuntimeError('Ambiguous person: ' + full_name)
    return matches


def inspect():
    objects = request('/rest/metadata/objects')
    (ROOT / 'schema.json').write_text(json.dumps(objects, indent=2))
    inventory = {resource: records(resource) for resource in ['companies', 'people', 'notes', 'noteTargets']}
    snapshot = Path('/private/tmp/casl-import-inventory.json')
    descriptor = os.open(snapshot, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        json.dump(inventory, output)
    print('Read inventory:', {key: len(value) for key, value in inventory.items()})
    return inventory


def main():
    research = json.loads((ROOT / 'research.json').read_text())['companies']
    inventory = inspect()
    plan = []
    for company in research:
        matches = company_matches(company, inventory['companies'])
        contacts = []
        for contact in company.get('contacts', []):
            people = person_matches(contact, inventory['people'])
            contacts.append({'name': contact['firstName'] + ' ' + contact['lastName'],
                'action': 'reuse' if people else 'create', 'id': people[0]['id'] if people else None})
        plan.append({'name': company['name'], 'action': 'skip' if company.get('skipReason') else ('update' if matches else 'create'),
            'id': matches[0]['id'] if matches else None, 'reason': company.get('skipReason'), 'contacts': contacts})
    (ROOT / 'dry-run.json').write_text(json.dumps(plan, indent=2))
    print(json.dumps(plan, indent=2))


if __name__ == '__main__':
    main()
