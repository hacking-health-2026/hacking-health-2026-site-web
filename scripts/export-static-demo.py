"""Export the workbook product catalogue and its rules from the existing Python PoC.

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
from app.demo_engine import profile_matches, match_pair, calculate
from app.composition import enrich_product, resolve_intakes, ingredient_relations

with TestClient(create_app()) as client:
    scenarios = client.get('/api/scenarios').json()
    options = client.get('/api/profile-options').json()
    source = client.get('/api/source').json()
    dataset = json.loads(DATA.read_text(encoding='utf-8'))
    products = [enrich_product(p) for p in dataset['medicines'] + dataset['supplements']]
    resolved = resolve_intakes(products, [])
    neutral = {'age': None, 'weight_kg': None, 'conditions': []}
    templates = []
    matrix_cases = []
    for a, b in itertools.combinations(resolved, 2):
        rules = match_pair(a, b, dataset)
        edges = ingredient_relations(a, b, rules, neutral)
        calculation = calculate(rules, neutral, max((edge['quantity_points'] for edge in edges), default=0))
        matrix_cases.append({'ids': [a['id'], b['id']], 'status': calculation['status'], 'score': calculation['score'], 'rules': [r['id'] for r in rules], 'relations': len(edges)})
        if rules:
            templates.append({'product_a_id': a['id'], 'product_b_id': b['id'], 'rules': rules, 'ingredient_relations': edges})
    export = {
        'scope': 'All medicine and supplement product rows from the supplied workbook. Missing pair rules remain unknown.',
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
    for ids in ([p['id'] for p in products[:5]], ['MED-005', 'SUP-006', 'MED-041', 'SUP-029'], ['SUP-006', 'SUP-029'], ['SUP-029', 'MED-041']):
        body = {'drug_ids': ids, 'profile': {'age': 65, 'weight_kg': 54, 'conditions': options['conditions']}}
        response = client.post('/api/assess', json=body)
        response.raise_for_status()
        cases.append({'input': body, 'expected': response.json()})
    # Missing quantities must remain unknown, not inferred from the source amount.
    body = {'drug_ids': ['MED-041', 'SUP-029'], 'profile': {'age': 35, 'weight_kg': 70, 'conditions': []}, 'intakes': [{'product_id': 'MED-041', 'units_per_day': 1, 'components': [{'component_id': 'MED-041:1', 'amount_mg': None}]}]}
    response = client.post('/api/assess', json=body)
    response.raise_for_status()
    cases.append({'input': body, 'expected': response.json()})
    # Cover every known product with its profile rules and at least one other product.
    for product in products:
        other = next(p for p in products if p['id'] != product['id'] and p['kind'] != product['kind'])
        body = {'drug_ids': [product['id'], other['id']], 'profile': {'age': 72, 'weight_kg': 50, 'conditions': options['conditions']}}
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
    (fixture.parent / 'static-demo-matrix.json').write_text(json.dumps(matrix_cases, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'Exported {len(products)} products, {len(templates)} pair templates, {len(cases)} parity cases.')
