#!/usr/bin/env python3
"""
Add per-case RAG citations to public/data/cases.json so CaseManagementView
can render the shared CitationList component for each audit case.

Each case gets 3-5 synthetic citations derived from its regulator + title.
1-2 citations are marked as plugin-sourced (isPlugin=true, pluginSlug set)
to demonstrate the violet plugin-provenance badge.

Idempotent: if a case already has a `citations` array, it's regenerated.
"""
import json
import os
import random
from pathlib import Path

random.seed(20260815)

CASES_PATH = Path('/home/z/my-project/public/data/cases.json')

# Regulator → list of plausible plugin slugs + jurisdiction + category
REGULATOR_PLUGINS = {
    'SEC': [
        ('sec-form-adv', 'US', 'form'),
        ('finra-rule-4530', 'US', 'rule'),
        ('sec-form-nport', 'US', 'form'),
        ('sec-rule-17a-4', 'US', 'feature'),
    ],
    'FCA': [
        ('fca-consumer-duty', 'UK', 'feature'),
        ('fca-handbook-prin', 'UK', 'rule'),
        ('fca-synergies-rop', 'UK', 'document'),
    ],
    'OFAC': [
        ('ofac-sdn-list', 'US', 'feature'),
        ('fatf-recommendation-16', 'GLOBAL', 'rule'),
        ('ofac-sanctions-screening', 'US', 'label'),
    ],
    'EBA': [
        ('eba-stress-test-2026', 'EU', 'form'),
        ('crr-article-107', 'EU', 'rule'),
        ('eba-gl-internal-governance', 'EU', 'document'),
    ],
    'MAS': [
        ('mas-notice-626', 'SG', 'rule'),
        ('mas-form-1r', 'SG', 'form'),
        ('mas-technology-risk-mgmt', 'SG', 'feature'),
    ],
    'HHS-OCR': [
        ('hipaa-security-rule', 'US', 'rule'),
        ('hipaa-breach-notification', 'US', 'feature'),
        ('hhs-ocr-ropa-template', 'US', 'document'),
    ],
}

# Baseline (non-plugin) corpus sources — keyed by topic
BASELINE_SOURCES = {
    'examination': [
        ('Internal audit programme 2026', 'Internal', 'document',
         'Q1-Q3 audit cycles covering trade surveillance, AML, and consumer duty.'),
        ('Prior exam response pack — Q3 2025', 'Internal', 'document',
         'Reference pack used for the prior SEC cycle examination, including attestations.'),
        ('Risk taxonomy v3.2', 'Internal', 'document',
         'Current risk taxonomy mapped to regulatory expectations and control owners.'),
    ],
    'investigation': [
        ('Sanctions screening runbook', 'Internal', 'document',
         'Step-by-step runbook for SDN list reconciliation and true-hit escalation.'),
        ('Whistleblower intake log 2025', 'Internal', 'document',
         'Anonymised intake log used by MLRO and GC to triage whistleblower reports.'),
        ('Trade reconstruction SOP', 'Internal', 'document',
         'Procedure for SWIFT/ETF trade reconstruction within 72 hours of regulator request.'),
    ],
    'regulatory_request': [
        ('Prior data-call response — EBA 2024', 'Internal', 'document',
         'Template response used for the prior EBA stress test data call.'),
        ('Regulator submission register', 'Internal', 'document',
         'Master register of all regulator submissions with timestamps and reviewers.'),
    ],
    'internal_review': [
        ('Compliance attestation tracker', 'Internal', 'document',
         'Tracker for senior-manager attestations across all regulated entities.'),
        ('Policy exception log', 'Internal', 'document',
         'Log of all granted policy exceptions with review dates and approvers.'),
    ],
}


def make_citations(case):
    """Build 3-5 synthetic citations for a case."""
    reg = case.get('regulator')
    ctype = case.get('caseType', 'examination')
    citations = []

    # 1-2 plugin-sourced citations (if we know this regulator)
    if reg in REGULATOR_PLUGINS:
        plugins = REGULATOR_PLUGINS[reg]
        # Pick 1-2 plugins
        picks = random.sample(plugins, k=min(2, len(plugins)))
        for slug, jur, cat in picks:
            title = slug.upper().replace('-', ' ')
            citations.append({
                'id': f'cit_{case["id"][:8]}_{slug[:12]}',
                'sourceType': 'plugin',
                'sourceId': slug,
                'title': f'{reg} plugin source: {title}',
                'jurisdiction': jur,
                'category': cat,
                'score': round(random.uniform(0.82, 0.97), 3),
                'snippet': f'Retrieved from enabled plugin "{slug}". Latest template hash indexed within the last 24 hours.',
                'isPlugin': True,
                'pluginSlug': slug,
            })

    # 2-3 baseline (non-plugin) citations
    baseline = BASELINE_SOURCES.get(ctype, BASELINE_SOURCES['examination'])
    for bt, bj, bc, bsnip in random.sample(baseline, k=min(3, len(baseline))):
        citations.append({
            'id': f'cit_{case["id"][:8]}_{bt[:12].lower().replace(" ", "_")}',
            'sourceType': bc,
            'sourceId': None,
            'title': bt,
            'jurisdiction': bj,
            'category': bc,
            'score': round(random.uniform(0.65, 0.88), 3),
            'snippet': bsnip,
            'isPlugin': False,
            'pluginSlug': None,
        })

    # Sort by score desc so the strongest match shows on top
    citations.sort(key=lambda c: -c['score'])
    return citations


def make_rag_filter(case):
    """Build a RagFilter matching the case's regulator scope."""
    reg = case.get('regulator')
    jur_map = {
        'SEC': 'US', 'OFAC': 'US', 'HHS-OCR': 'US',
        'FCA': 'UK', 'EBA': 'EU', 'MAS': 'SG',
    }
    jurisdictions = []
    if reg in jur_map:
        jurisdictions.append(jur_map[reg])
    if not jurisdictions:
        jurisdictions.append('GLOBAL')
    return {
        'sourceTypes': ['plugin', 'document', 'feature', 'rule'],
        'jurisdictions': jurisdictions,
        'categories': ['form', 'rule', 'feature', 'document'],
    }


def main():
    with CASES_PATH.open() as f:
        data = json.load(f)

    cases = data.get('cases', [])
    for c in cases:
        c['citations'] = make_citations(c)
        c['ragFilter'] = make_rag_filter(c)

    out = json.dumps(data, indent=2, ensure_ascii=False)
    with CASES_PATH.open('w') as f:
        f.write(out + '\n')

    print(f'Updated {len(cases)} cases with citations + ragFilter in {CASES_PATH}')
    for c in cases:
        pc = sum(1 for x in c['citations'] if x['isPlugin'])
        print(f'  {c["id"][:20]}  {c["regulator"] or "—":<8} '
              f'{len(c["citations"])} citations ({pc} plugin)')


if __name__ == '__main__':
    main()
