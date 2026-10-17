"""Export the four preset products and their rules from the existing Python PoC.

Run with the backend virtualenv Python. No alternate medical data or model.
"""
import itertools
import json
from pathlib import Path
import shutil
import sys

frontend = Path(__file__).resolve().parents[1]
backend = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else frontend.parent / 'hacking-health-2026-backend'
sys.path.insert(0, str(backend))
from fastapi.testclient import TestClient
from app.demo import create_app, DATA, WORKBOOK
from app.demo_engine import profile_matches

with TestClient(create_app()) as client:
    scenarios = client.get('/api/scenarios').json()
    products = list({p['id']: p for s in scenarios for p in s['products']}.values())
    options = client.get('/api/profile-options').json()
    source = client.get('/api/source').json()
    dataset = json.loads(DATA.read_text(encoding='utf-8'))
    templates = []
    for a, b in itertools.combinations(products, 2):
        response = client.post('/api/assess', json={'drug_ids': [a['id'], b['id']]})
        response.raise_for_status()
        templates.append(response.json()['pairs'][0])
    export = {
        'scope': 'The four products of the two presentation presets only.',
        'source': {**dataset['source'], 'mode': 'demo', 'workbook_url': '/api/source/workbook'},
        'algorithm': source['algorithm'], 'notice': source['notice'],
        'products': products, 'conditions': options['conditions'], 'pairs': templates,
        'profile_alerts': {p['id']: profile_matches([p], {'conditions': options['conditions']}, dataset) for p in products},
    }
    (frontend / 'src/data/static-demo.json').write_text(json.dumps(export, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (frontend / 'src/data/presets.json').write_text(json.dumps(scenarios, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(WORKBOOK, frontend / 'public/demo-source.xlsx')
    # Expected outputs are produced by the Python engine, not by a JS test double.
    cases = []
    for scenario in scenarios:
        ids = [p['id'] for p in scenario['products']]
        for profile in (scenario['profile'], {'age': 72, 'weight_kg': 50, 'conditions': []}, {'age': None, 'weight_kg': None, 'conditions': ['Grossesse']}):
            for units in (1, 2, 5):
                intakes = [{'product_id': p['id'], 'units_per_day': units, 'components': [{'component_id': c['id'], 'amount_mg': c['amount_mg']} for c in p['components']]} for p in scenario['products']]
                body = {'drug_ids': ids, 'profile': profile, 'intakes': intakes}
                response = client.post('/api/assess', json=body)
                response.raise_for_status()
                cases.append({'input': body, 'expected': response.json()})
    for ids in ([p['id'] for p in products], ['SUP-006', 'SUP-029'], ['SUP-029', 'MED-041']):
        body = {'drug_ids': ids, 'profile': {'age': 65, 'weight_kg': 54, 'conditions': options['conditions']}}
        response = client.post('/api/assess', json=body)
        response.raise_for_status()
        cases.append({'input': body, 'expected': response.json()})
    # Missing quantities must remain unknown, not inferred from the source amount.
    body = {'drug_ids': ['MED-041', 'SUP-029'], 'profile': {'age': 35, 'weight_kg': 70, 'conditions': []}, 'intakes': [{'product_id': 'MED-041', 'units_per_day': 1, 'components': [{'component_id': 'MED-041:1', 'amount_mg': None}]}]}
    response = client.post('/api/assess', json=body)
    response.raise_for_status()
    cases.append({'input': body, 'expected': response.json()})
    body = {'drug_ids': ['MED-041', 'SUP-029'], 'profile': {'age': 63, 'weight_kg': 55, 'conditions': []}, 'intakes': [{'product_id': 'MED-041', 'units_per_day': 1, 'components': [{'component_id': 'MED-041:1', 'amount_mg': 0.5}]}, {'product_id': 'SUP-029', 'units_per_day': 1, 'components': [{'component_id': 'SUP-029:1', 'amount_mg': 2}, {'component_id': 'SUP-029:2', 'amount_mg': 400}]}]}
    response = client.post('/api/assess', json=body)
    response.raise_for_status()
    cases.append({'input': body, 'expected': response.json()})
    fixture = frontend / 'scripts/fixtures/static-demo-parity.json'
    fixture.parent.mkdir(exist_ok=True)
    fixture.write_text(json.dumps(cases, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'Exported {len(products)} products, {len(templates)} pair templates, {len(cases)} parity cases.')
