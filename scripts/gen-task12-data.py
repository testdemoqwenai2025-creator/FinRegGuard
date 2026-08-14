#!/usr/bin/env python3
"""
Generate synthetic JSON data for the 7 new views added in Task 12.

Produces:
  public/data/ccm.json             - Continuous Control Monitoring (controls + test runs)
  public/data/regtech-feeds.json   - RegTech API supervision feeds (FCA / MAS / ESMA)
  public/data/adaptive-thresholds.json - ML anomaly detection + adaptive thresholds
  public/data/localization.json    - Cross-border data localization matrix
  public/data/tia.json             - Transfer Impact Assessments post-Schrems II
  public/data/fairness.json        - Algorithmic discrimination testing
  public/data/consumer-duty.json   - Consumer Duty + ADM rights + layered disclosure

All data is synthetic. Ids are deterministic cuid-shaped strings. Timestamps
are ISO-8601 UTC dated Aug 2026 to match the rest of the project.
"""
import json
import os
import random
from pathlib import Path
from datetime import datetime, timedelta, timezone

random.seed(20260815)

OUT_DIR = Path('/home/z/my-project/public/data')
OUT_DIR.mkdir(parents=True, exist_ok=True)

NOW = datetime(2026, 8, 15, 9, 30, 0, tzinfo=timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat().replace('+00:00', 'Z')


def cuid(prefix: str, n: int) -> str:
    """Deterministic cuid-shaped id."""
    return f'{prefix}{n:012x}'


def write_json(name: str, data: dict) -> None:
    path = OUT_DIR / name
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'  wrote {path} ({path.stat().st_size} bytes)')


def ai_rec(action: str, confidence: int, reasoning: str, reviewer_action: str) -> dict:
    return {
        'action': action,
        'confidence': confidence,
        'reasoning': reasoning,
        'reviewerAction': reviewer_action,
    }


# ──────────────────────────────────────────────────────────────────────
# 1. CCM — Continuous Control Monitoring
# ──────────────────────────────────────────────────────────────────────
def gen_ccm() -> dict:
    controls = [
        # (id, name, framework, frequency, owner, status, last_run_min_ago, evidence_count, pass_rate)
        ('CTRL-AML-001', 'Sanctions Screening Daily Reconciliation', 'FATF Rec.10', 'event-driven', 'AML Ops', 'passing', 12, 47, 100),
        ('CTRL-AML-014', 'Structuring Detection Rule Refresh', 'Wolfsberg', 'batch-hourly', 'Surveillance Eng', 'degraded', 38, 12, 87),
        ('CTRL-AML-022', 'PEP List Update Verification', 'FATF Rec.12', 'daily', 'AML Ops', 'passing', 180, 31, 100),
        ('CTRL-KYC-003', 'Customer Risk Score Recalculation', 'Basel CDD', 'daily', 'KYC Team', 'passing', 95, 142, 99),
        ('CTRL-KYC-018', 'Beneficial Ownership Drill-Down', '5AMLD', 'event-driven', 'KYC Team', 'failing', 5, 8, 62),
        ('CTRL-TRD-007', 'Best Execution Multi-Venue Check', 'MiFID II Art.27', 'batch-minute', 'Compliance Trade', 'passing', 2, 312, 98),
        ('CTRL-TRD-019', 'Market Abuse Surveillance Scan', 'MAR Art.16', 'real-time', 'Surveillance Eng', 'passing', 1, 1847, 99),
        ('CTRL-REP-002', 'EMIR Trade Repository Reconciliation', 'EMIR RTS', 'daily', 'Derivatives Ops', 'degraded', 240, 28, 91),
        ('CTRL-REP-011', 'SFTR STR Quality Assurance', 'SFTR RTS', 'weekly', 'Securities Lending', 'passing', 2880, 19, 100),
        ('CTRL-PRIV-005', 'GDPR SAR 30-Day Response Clock', 'GDPR Art.12', 'event-driven', 'Privacy Office', 'passing', 47, 11, 100),
        ('CTRL-PRIV-021', 'Cross-Border Transfer Logging', 'GDPR Ch.V', 'real-time', 'Privacy Office', 'passing', 1, 8942, 100),
        ('CTRL-OPS-008', 'Critical System Availability SLO', 'DORA Art.11', 'real-time', 'Site Reliability', 'passing', 1, 86400, 99),
        ('CTRL-OPS-014', 'Third-Party Provider Health Check', 'DORA Art.28', 'batch-minute', 'Vendor Risk', 'failing', 9, 24, 73),
        ('CTRL-OPS-029', 'Incident Response Time SLA', 'DORA Art.17', 'event-driven', 'Cyber Ops', 'passing', 18, 7, 100),
        ('CTRL-FIN-004', 'FX Trade Capture Timeliness', 'FX Global Code', 'batch-15min', 'Treasury Ops', 'passing', 14, 192, 99),
        ('CTRL-FCC-012', 'Anti-Bribery Gift Register Scan', 'UKBA / FCPA', 'daily', 'Financial Crime', 'passing', 220, 14, 100),
    ]
    items = []
    for i, (cid, name, fw, freq, owner, status, last_run_min, evid, pass_rate) in enumerate(controls):
        last_run = NOW - timedelta(minutes=last_run_min)
        next_run = last_run + (
            timedelta(minutes=1) if freq == 'real-time'
            else timedelta(minutes=15) if freq == 'batch-minute'
            else timedelta(hours=1) if freq in ('batch-hourly', 'event-driven')
            else timedelta(days=1) if freq == 'daily'
            else timedelta(days=7)
        )
        # Synthesize the latest test result
        result = 'pass' if status == 'passing' else ('fail' if status == 'failing' else 'warn')
        # Synthesize 3 historical runs (last 3 cycles)
        history = []
        for h in range(3):
            hr_run = last_run - timedelta(hours=h + 1)
            hr_result = 'pass' if random.random() > 0.2 else 'warn'
            if status == 'failing' and h == 0:
                hr_result = 'fail'
            elif status == 'degraded' and h == 0:
                hr_result = 'warn'
            history.append({
                'runAt': iso(hr_run),
                'result': hr_result,
                'durationMs': random.randint(120, 4500),
                'evidenceCount': max(1, evid - h * 2),
                'passRate': max(0, pass_rate - h * random.randint(0, 3)),
            })
        items.append({
            'id': cuid('ccm_', i + 1),
            'controlId': cid,
            'name': name,
            'framework': fw,
            'frequency': freq,
            'owner': owner,
            'status': status,
            'lastRunAt': iso(last_run),
            'nextRunAt': iso(next_run),
            'evidenceCount': evid,
            'passRate': pass_rate,
            'lastResult': result,
            'history': history,
            'aiRecommendation': ai_rec(
                action=(
                    'Quarantine control and trigger remediation' if status == 'failing'
                    else 'Schedule engineering review' if status == 'degraded'
                    else 'Continue routine monitoring'
                ),
                confidence=96 if status == 'failing' else 84 if status == 'degraded' else 99,
                reasoning=(
                    f'Control {cid} status is "{status}" with pass rate {pass_rate}%. '
                    + (
                        'Immediate remediation required; evidence chain breaks if not addressed within 24h.'
                        if status == 'failing'
                        else 'Pass rate below 95% threshold; engineering review recommended within 7 days.'
                        if status == 'degraded'
                        else 'All test runs passing; routine monitoring cadence preserved.'
                    )
                ),
                reviewer_action=(
                    'approve_remediation_plan' if status == 'failing'
                    else 'approve_review_schedule' if status == 'degraded'
                    else 'acknowledge_control_healthy'
                ),
            ),
        })
    passing = sum(1 for c in items if c['status'] == 'passing')
    degraded = sum(1 for c in items if c['status'] == 'degraded')
    failing = sum(1 for c in items if c['status'] == 'failing')
    return {
        'controls': items,
        'total': len(items),
        'summary': {
            'passing': passing,
            'degraded': degraded,
            'failing': failing,
            'eventDriven': sum(1 for c in items if c['frequency'] in ('event-driven', 'real-time')),
            'batch': sum(1 for c in items if c['frequency'].startswith('batch')),
            'scheduled': sum(1 for c in items if c['frequency'] in ('daily', 'weekly')),
            'totalEvidenceItems': sum(c['evidenceCount'] for c in items),
            'avgPassRate': round(sum(c['passRate'] for c in items) / len(items), 1),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 2. RegTech API Feeds
# ──────────────────────────────────────────────────────────────────────
def gen_regtech_feeds() -> dict:
    feeds = [
        # (slug, name, regulator, country, endpoint, status, last_poll_min, records_pulled, error_count)
        ('fca-digital-gateway', 'FCA Digital Gateway', 'FCA', 'UK',
         'https://digital.fca.org.uk/api/v1/notifications', 'healthy', 4, 14, 0),
        ('mas-sgfind', 'MAS SGFINd', 'MAS', 'SG',
         'https://api.mas.gov.sg/sgfind/v1/financial-institutions', 'healthy', 7, 412, 0),
        ('esma-dora-register', 'ESMA DORA Register', 'ESMA', 'EU',
         'https://registers.esma.europa.eu/publication/api/dora-tps', 'degraded', 22, 0, 4),
        ('esma-mifid-iii', 'ESMA MiFID III Reference Data', 'ESMA', 'EU',
         'https://registers.esma.europa.eu/publication/api/firds', 'healthy', 38, 1874, 0),
        ('fca-connect', 'FCA Connect API', 'FCA', 'UK',
         'https://connect.fca.org.uk/api/v2/supervisory-requests', 'healthy', 12, 3, 0),
        ('sec-edgar-xbrl', 'SEC EDGAR XBRL', 'SEC', 'US',
         'https://efts.sec.gov/LATEST/search-index?q=%22form+ADV%22', 'healthy', 64, 28, 0),
        ('finra-rulebook', 'FINRA Rulebook API', 'FINRA', 'US',
         'https://api.finra.org/rulebook/v1/rules', 'healthy', 90, 162, 0),
        ('eba-eu-climate', 'EBA Climate Risk Pillar 3', 'EBA', 'EU',
         'https://eba.europa.eu/api/pillar3/climate/v1', 'unhealthy', 145, 0, 8),
        ('cftc-sdr', 'CFTC Swap Data Repository', 'CFTC', 'US',
         'https://sdr.cftc.gov/api/v1/data', 'healthy', 8, 4231, 0),
        ('hkma-gerf', 'HKMA GERF', 'HKMA', 'HK',
         'https://www.hkma.gov.hk/api/gerf/v1/eng', 'healthy', 240, 71, 0),
        ('accc-consumer', 'ACCC Consumer Guarantee Feed', 'ACCC', 'AU',
         'https://api.accc.gov.au/v1/consumer-guarantees', 'healthy', 360, 18, 0),
        ('pia-icris', 'PIA ICRIS', 'PIA', 'SG',
         'https://www.pia.gov.sg/api/icris/v1', 'healthy', 720, 9, 0),
    ]
    items = []
    for i, (slug, name, reg, country, endpoint, status, last_poll, records, errs) in enumerate(feeds):
        last_poll_dt = NOW - timedelta(minutes=last_poll)
        next_poll = last_poll_dt + timedelta(minutes=15 if status == 'healthy' else 60)
        items.append({
            'id': cuid('rtf_', i + 1),
            'slug': slug,
            'name': name,
            'regulator': reg,
            'jurisdiction': country,
            'endpoint': endpoint,
            'status': status,
            'lastPollAt': iso(last_poll_dt),
            'nextPollAt': iso(next_poll),
            'recordsPulled': records,
            'errorCount': errs,
            'authScheme': 'oauth2-client-credentials' if i % 2 == 0 else 'api-key-header',
            'rateLimitPerMin': random.choice([60, 120, 300, 600]),
            'avgLatencyMs': random.randint(80, 850),
            'aiRecommendation': ai_rec(
                action=(
                    'Mark feed for engineering escalation' if status == 'unhealthy'
                    else 'Reduce poll frequency to save rate budget' if status == 'degraded'
                    else 'Maintain current poll cadence'
                ),
                confidence=99 if status == 'healthy' else 78,
                reasoning=(
                    f'Feed {slug} has pulled {records} records with {errs} errors. '
                    + (
                        'Continuous failures for >2h — connectivity or upstream outage suspected.'
                        if status == 'unhealthy' else
                        'Partial failures detected; upstream returning 429 rate-limit responses.'
                        if status == 'degraded' else
                        'Healthy; rate budget at 23% utilization.'
                    )
                ),
                reviewer_action=(
                    'approve_feed_failover' if status == 'unhealthy'
                    else 'approve_poll_adjustment' if status == 'degraded'
                    else 'acknowledge_feed_healthy'
                ),
            ),
        })
    healthy = sum(1 for f in items if f['status'] == 'healthy')
    degraded = sum(1 for f in items if f['status'] == 'degraded')
    unhealthy = sum(1 for f in items if f['status'] == 'unhealthy')
    return {
        'feeds': items,
        'total': len(items),
        'summary': {
            'healthy': healthy,
            'degraded': degraded,
            'unhealthy': unhealthy,
            'totalRecordsPulled': sum(f['recordsPulled'] for f in items),
            'totalErrors': sum(f['errorCount'] for f in items),
            'regulatorsCovered': len(set(f['regulator'] for f in items)),
            'jurisdictionsCovered': len(set(f['jurisdiction'] for f in items)),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 3. Adaptive Thresholds + ML Anomaly Detection
# ──────────────────────────────────────────────────────────────────────
def gen_adaptive_thresholds() -> dict:
    metrics = [
        # (metric_id, name, jurisdiction, baseline, current, threshold_type, model_version, anomalies_24h)
        ('TXN-AMT-USD-95P', 'USD Transaction 95th Percentile Amount', 'US', 8500, 12400, 'upper', 'isolation-forest-v3.2', 3),
        ('TXN-AMT-EUR-95P', 'EUR Transaction 95th Percentile Amount', 'EU', 7800, 7950, 'upper', 'isolation-forest-v3.2', 0),
        ('TXN-AMT-SGD-95P', 'SGD Transaction 95th Percentile Amount', 'SG', 11500, 11200, 'upper', 'isolation-forest-v3.2', 0),
        ('STR-VOLUME-DAILY', 'Suspicious Transaction Report Volume', 'GLOBAL', 47, 89, 'upper', 'prophet-v1.4', 2),
        ('SANCTIONS-HITS-HR', 'Sanctions Hits Per Hour', 'US', 12, 11, 'upper', 'ewma-v2.1', 0),
        ('TRADE-VELOCITY-GBP', 'GBP Trade Velocity (per minute)', 'UK', 240, 312, 'upper', 'isolation-forest-v3.2', 1),
        ('LOGIN-FAILURE-RATE', 'Failed Login Rate %', 'GLOBAL', 2.4, 6.8, 'upper', 'lstm-v0.9', 4),
        ('CSAT-SCORE', 'Customer Satisfaction Score', 'GLOBAL', 4.6, 4.4, 'lower', 'prophet-v1.4', 0),
        ('SAR-LEAD-TIME-HRS', 'SAR Filing Lead Time (hours)', 'US', 18, 22, 'upper', 'ewma-v2.1', 1),
        ('COMMS-ALERT-VOL', 'Comms Surveillance Alert Volume', 'UK', 142, 318, 'upper', 'isolation-forest-v3.2', 5),
        ('VELOCITY-CRYPTO-USDT', 'USDT On-Chain Velocity', 'GLOBAL', 8.4, 14.2, 'upper', 'isolation-forest-v3.2', 2),
        ('PCI-DECRYPTION-FAIL', 'PCI Decryption Failure Rate', 'GLOBAL', 0.1, 0.4, 'upper', 'ewma-v2.1', 3),
    ]
    items = []
    for i, (mid, name, juris, baseline, current, ttype, model, anomalies) in enumerate(metrics):
        drift_pct = round(((current - baseline) / baseline) * 100, 1) if ttype == 'upper' else round(((baseline - current) / baseline) * 100, 1)
        # Anomaly score: 0..1 — higher means more anomalous
        anomaly_score = round(min(1.0, abs(drift_pct) / 50), 3)
        # Adaptive threshold: baseline + dynamic buffer
        dynamic_buffer_pct = 15 + (anomaly_score * 20)
        adaptive_threshold = round(baseline * (1 + dynamic_buffer_pct / 100), 1) if ttype == 'upper' else round(baseline * (1 - dynamic_buffer_pct / 100), 1)
        is_breached = (current > adaptive_threshold) if ttype == 'upper' else (current < adaptive_threshold)
        items.append({
            'id': cuid('at_', i + 1),
            'metricId': mid,
            'name': name,
            'jurisdiction': juris,
            'baselineValue': baseline,
            'currentValue': current,
            'adaptiveThreshold': adaptive_threshold,
            'driftPercent': drift_pct,
            'thresholdType': ttype,
            'anomalyScore': anomaly_score,
            'isBreached': is_breached,
            'modelVersion': model,
            'anomaliesLast24h': anomalies,
            'lastTrainedAt': iso(NOW - timedelta(hours=random.randint(2, 48))),
            'aiRecommendation': ai_rec(
                action=(
                    'Trigger escalation + freeze auto-approve workflows' if is_breached and anomaly_score > 0.5
                    else 'Investigate root cause + tighten threshold' if is_breached
                    else 'Continue monitoring and retrain model' if anomaly_score > 0.2
                    else 'Maintain current threshold'
                ),
                confidence=92 if is_breached else 75 if anomaly_score > 0.2 else 99,
                reasoning=(
                    f'{name} baseline={baseline}, current={current}, adaptive threshold={adaptive_threshold}. '
                    + (
                        f'Threshold breached with anomaly score {anomaly_score}. '
                        'Auto-approval workflows on this metric are frozen pending human review.'
                        if is_breached and anomaly_score > 0.5 else
                        f'Current value exceeds adaptive threshold ({adaptive_threshold}). '
                        'Investigation recommended within 4 hours.'
                        if is_breached else
                        f'Drift of {drift_pct}% detected but within adaptive threshold. '
                        f'Model {model} should be retrained at next cycle.'
                        if anomaly_score > 0.2 else
                        'Metric is within normal bounds. No action required.'
                    )
                ),
                reviewer_action=(
                    'approve_threshold_freeze' if is_breached and anomaly_score > 0.5
                    else 'approve_investigation' if is_breached
                    else 'approve_model_retrain' if anomaly_score > 0.2
                    else 'acknowledge_metric_healthy'
                ),
            ),
        })
    breached = sum(1 for m in items if m['isBreached'])
    high_anomaly = sum(1 for m in items if m['anomalyScore'] > 0.5)
    return {
        'metrics': items,
        'total': len(items),
        'summary': {
            'breached': breached,
            'highAnomaly': high_anomaly,
            'withinThreshold': len(items) - breached,
            'avgAnomalyScore': round(sum(m['anomalyScore'] for m in items) / len(items), 3),
            'modelsInUse': len(set(m['modelVersion'] for m in items)),
            'anomaliesLast24h': sum(m['anomaliesLast24h'] for m in items),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 4. Localization Matrix (Cross-Border Data Flows)
# ──────────────────────────────────────────────────────────────────────
def gen_localization() -> dict:
    # Each regulation: data type rules, transfer mechanism allowed, residency required
    regulations = [
        # (code, name, country, effective_date, residency, transfer_mechanisms, scope, data_types, penalty_max_usd)
        ('GDPR', 'EU General Data Protection Regulation', 'EU', '2018-05-25',
         False, ['adequacy', 'scc-2021', 'bcr', 'derogation-art-49'],
         'personal data of EU data subjects',
         ['personal', 'special-category', 'criminal'],
         23000000),
        ('PIPL', 'China Personal Information Protection Law', 'CN', '2021-11-01',
         True, ['cac-security-assessment', 'cac-standard-contract', 'cac-certification'],
         'personal info of CN residents + "important data"',
         ['personal', 'sensitive', 'important-data'],
         7700000),
        ('152-FZ', 'Russia Federal Law 152-FZ on Personal Data', 'RU', '2006-07-27',
         True, ['roskomnadzor-notification', 'adequacy-Belarus-Kazakhstan'],
         'personal data of RU subjects — initial collection must be in RU',
         ['personal'],
         1800000),
        ('DPDP', 'India Digital Personal Data Protection Act 2023', 'IN', '2024-08-11',
         False, ['adequacy-by-notification', 'consent'],
         'digital personal data of Indian data principals processed in India',
         ['personal', 'children', 'sensitive'],
         3600000),
        ('LGPD', 'Brazil Lei Geral de Protecao de Dados', 'BR', '2020-09-18',
         False, ['adequacy', 'scc', 'bcr', 'consent'],
         'personal data of BR data subjects',
         ['personal', 'sensitive'],
         11000000),
        ('CCPA-CPRA', 'California Consumer Privacy Act + CPRA', 'US-CA', '2023-01-01',
         False, ['no-transfer-restriction'],
         'personal info of CA consumers',
         ['personal', 'sensitive'],
         7500),
        ('PIPEDA', 'Canada PIPEDA + Provincial Laws', 'CA', '2001-01-01',
         False, ['adequacy-by-country', 'scc', 'consent'],
         'personal info collected in commercial activity',
         ['personal'],
         100000),
        ('POPIA', 'South Africa Protection of Personal Info Act', 'ZA', '2021-07-01',
         False, ['adequacy', 'scc', 'binding-agreement'],
         'personal info of ZA data subjects',
         ['personal', 'special'],
         1000000),
        ('APPI', 'Japan Act on Protection of Personal Information', 'JP', '2022-04-01',
         False, ['adequacy-by-ppc', 'consent', 'scc-equivalent'],
         'personal info of JP residents',
         ['personal', 'sensitive'],
         600000),
        ('PDPA-SG', 'Singapore Personal Data Protection Act', 'SG', '2014-07-02',
         False, ['consent', 'contractual-safeguards', 'binding-corporate-rules'],
         'personal data of SG individuals',
         ['personal'],
         740000),
    ]
    items = []
    for i, (code, name, country, eff_date, residency, mechanisms, scope, dtypes, penalty) in enumerate(regulations):
        # Build the rule matrix: which data types can flow where
        transfer_rules = []
        for dest in ['EU', 'US', 'UK', 'CN', 'IN', 'JP', 'SG', 'BR', 'CA']:
            allowed = 'conditional'
            if dest == country:
                allowed = 'allowed-domestic'
            elif 'adequacy' in mechanisms and dest in ['EU', 'UK', 'JP', 'SG', 'CA', 'BR']:
                # Adequacy assumed available for these destinations
                allowed = 'allowed-adequacy'
            elif 'scc' in mechanisms or 'scc-2021' in mechanisms or 'scc-equivalent' in mechanisms:
                allowed = 'allowed-scc'
            elif 'consent' in mechanisms:
                allowed = 'allowed-consent'
            elif residency and dest != country:
                allowed = 'restricted-residency'
            transfer_rules.append({
                'destination': dest,
                'allowed': allowed,
                'mechanism': (
                    'domestic' if allowed == 'allowed-domestic'
                    else 'adequacy-decision' if allowed == 'allowed-adequacy'
                    else 'standard-contractual-clauses' if allowed == 'allowed-scc'
                    else 'explicit-consent' if allowed == 'allowed-consent'
                    else 'residency-required-in-country'
                ),
            })
        items.append({
            'id': cuid('loc_', i + 1),
            'code': code,
            'name': name,
            'jurisdiction': country,
            'effectiveDate': eff_date,
            'residencyRequired': residency,
            'transferMechanisms': mechanisms,
            'scope': scope,
            'dataTypes': dtypes,
            'maxPenaltyUsd': penalty,
            'transferRules': transfer_rules,
            'lastReviewedAt': iso(NOW - timedelta(days=random.randint(5, 60))),
            'aiRecommendation': ai_rec(
                action=(
                    'Restrict new flows and run Transfer Impact Assessment' if residency
                    else 'Update DPA addendum and notify data subjects'
                ),
                confidence=88 if residency else 92,
                reasoning=(
                    f'{code} {"requires in-country residency for initial collection" if residency else "permits cross-border transfer with appropriate safeguards"}. '
                    f'Maximum penalty: ${penalty:,} USD. Last reviewed '
                    f'{random.randint(5, 60)} days ago.'
                ),
                reviewer_action='approve_localization_policy_update',
            ),
        })
    return {
        'regulations': items,
        'total': len(items),
        'summary': {
            'jurisdictionsCovered': len(items),
            'residencyRequired': sum(1 for r in items if r['residencyRequired']),
            'crossBorderAllowed': sum(1 for r in items if not r['residencyRequired']),
            'totalTransferRules': sum(len(r['transferRules']) for r in items),
            'highestPenaltyUsd': max(r['maxPenaltyUsd'] for r in items),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 5. TIA — Transfer Impact Assessments
# ──────────────────────────────────────────────────────────────────────
def gen_tia() -> dict:
    tias = [
        # (id, transfer_name, source, dest, mechanism, scc_version, status, residual_risk, decision_date)
        ('TIA-2026-014', 'EU Customer Data to US Cloud (AWS us-east-1)', 'EU', 'US', 'scc-2021', '2021/914', 'completed', 18, NOW - timedelta(days=12)),
        ('TIA-2026-021', 'HR Records to India BPO (Bangalore)', 'EU', 'IN', 'scc-2021', '2021/914', 'completed', 32, NOW - timedelta(days=8)),
        ('TIA-2026-029', 'CN Employee Data to Singapore HQ', 'CN', 'SG', 'cac-standard-contract', 'CAC-2023', 'completed', 24, NOW - timedelta(days=15)),
        ('TIA-2026-031', 'UK Trading Data to US Quant Vendor', 'UK', 'US', 'uk-idta', '2022 IDTA', 'in-progress', None, NOW - timedelta(days=2)),
        ('TIA-2026-033', 'JP Customer Records to EU Analytics Platform', 'JP', 'EU', 'adequacy', 'EU-JP 2019', 'completed', 8, NOW - timedelta(days=28)),
        ('TIA-2026-037', 'RU Payroll Data to Cyprus Parent Co', 'RU', 'CY', 'roskomnadzor-notification', 'RU-FZ-152', 'overdue', None, NOW - timedelta(days=45)),
        ('TIA-2026-041', 'BR Marketing Data to US Ad Platform', 'BR', 'US', 'scc', '2021/914', 'completed', 42, NOW - timedelta(days=5)),
        ('TIA-2026-044', 'SG Insurance Claims to PH Outsourcer', 'SG', 'PH', 'contractual-safeguards', 'Bilateral DPA', 'in-progress', None, NOW - timedelta(days=1)),
        ('TIA-2026-048', 'CA Health Records to US AI Model Trainer', 'CA', 'US', 'adequacy-by-country', 'PIPEDA-derogation', 'blocked', None, NOW - timedelta(days=3)),
        ('TIA-2026-050', 'IN Customer Data to EU Storage (Frankfurt)', 'IN', 'EU', 'consent', 'DPDP-2023', 'completed', 16, NOW - timedelta(days=20)),
        ('TIA-2026-053', 'ZA Beneficial Owner Data to UK Compliance', 'ZA', 'UK', 'adequacy', 'UK adequacy reg 2022', 'completed', 12, NOW - timedelta(days=18)),
        ('TIA-2026-057', 'AU Card Transactions to US Fraud Engine', 'AU', 'US', 'scc', '2021/914', 'in-progress', None, NOW - timedelta(days=4)),
    ]
    items = []
    for i, (tid, name, src, dst, mech, scc, status, residual, dec_date) in enumerate(tias):
        items.append({
            'id': cuid('tia_', i + 1),
            'tiaId': tid,
            'transferName': name,
            'sourceJurisdiction': src,
            'destinationJurisdiction': dst,
            'transferMechanism': mech,
            'sccVersion': scc,
            'status': status,
            'residualRiskScore': residual if residual is not None else 0,
            'decisionDate': iso(dec_date) if status != 'in-progress' else None,
            'startedAt': iso(dec_date - timedelta(days=random.randint(5, 20))),
            'nextReviewAt': iso(dec_date + timedelta(days=365)) if status == 'completed' else None,
            'schremsIiFactors': {
                'destinationSurveillance': 'high' if dst == 'US' else 'medium' if dst in ('CN', 'RU') else 'low',
                'governmentAccessRisk': 'high' if dst in ('US', 'CN', 'RU') else 'medium' if dst == 'IN' else 'low',
                'redressAvailability': 'limited' if dst == 'US' else 'available' if dst in ('UK', 'EU', 'JP', 'CA') else 'none',
                'supplementaryMeasures': ['encryption-at-rest', 'pseudonymisation'] if dst in ('US', 'CN') else ['encryption-at-rest'],
            },
            'aiRecommendation': ai_rec(
                action=(
                    'Block transfer — risk profile unacceptable' if status == 'blocked'
                    else 'Escalate for legal review — TIA overdue' if status == 'overdue'
                    else 'Complete TIA documentation' if status == 'in-progress'
                    else 'Renew TIA at next annual review'
                ),
                confidence=95 if status == 'blocked' else 88 if status == 'overdue' else 75,
                reasoning=(
                    f'Transfer {src}->{dst} via {mech} (SCC {scc}). '
                    + (
                        'Destination surveillance regime incompatible with EU standards — supplementary measures insufficient.'
                        if status == 'blocked' else
                        f'TIA started {(NOW - dec_date).days} days ago and is now overdue. Legal review required.'
                        if status == 'overdue' else
                        'TIA documentation in progress. Awaiting destination-country legal opinion.'
                        if status == 'in-progress' else
                        f'TIA completed with residual risk {residual}/100. Next review due in {(dec_date + timedelta(days=365) - NOW).days} days.'
                    )
                ),
                reviewer_action=(
                    'approve_transfer_block' if status == 'blocked'
                    else 'approve_legal_escalation' if status == 'overdue'
                    else 'approve_complete_documentation' if status == 'in-progress'
                    else 'acknowledge_tia_complete'
                ),
            ),
        })
    completed = sum(1 for t in items if t['status'] == 'completed')
    in_progress = sum(1 for t in items if t['status'] == 'in-progress')
    overdue = sum(1 for t in items if t['status'] == 'overdue')
    blocked = sum(1 for t in items if t['status'] == 'blocked')
    return {
        'tias': items,
        'total': len(items),
        'summary': {
            'completed': completed,
            'inProgress': in_progress,
            'overdue': overdue,
            'blocked': blocked,
            'avgResidualRisk': round(
                sum(t['residualRiskScore'] for t in items if t['status'] == 'completed') / max(1, completed), 1
            ),
            'schremsIiAnniversary': '2025-07-16 (5 years post-Schrems II)',
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 6. Algorithmic Discrimination Testing
# ──────────────────────────────────────────────────────────────────────
def gen_fairness() -> dict:
    models = [
        # (model_id, name, use_case, last_tested, fairness_metrics, status)
        ('M-CRDT-001', 'Credit Risk Decisioning v4.2', 'Consumer Loan Underwriting', NOW - timedelta(days=4),
         {'disparateImpactRatio': 0.82, 'demographicParityDiff': 0.09, 'equalOpportunityDiff': 0.14,
          'predictiveParity': 0.91, 'calibrationByGroup': 0.88, 'falsePositiveRateRatio': 1.21},
         'warning'),
        ('M-CRDT-002', 'Credit Limit Increase Model v2.1', 'Credit Card Limit Adjustment', NOW - timedelta(days=10),
         {'disparateImpactRatio': 0.94, 'demographicParityDiff': 0.04, 'equalOpportunityDiff': 0.06,
          'predictiveParity': 0.96, 'calibrationByGroup': 0.94, 'falsePositiveRateRatio': 1.08},
         'passing'),
        ('M-INSR-003', 'Insurance Underwriting Engine v3.0', 'Auto Insurance Pricing', NOW - timedelta(days=2),
         {'disparateImpactRatio': 0.71, 'demographicParityDiff': 0.18, 'equalOpportunityDiff': 0.22,
          'predictiveParity': 0.83, 'calibrationByGroup': 0.79, 'falsePositiveRateRatio': 1.45},
         'failing'),
        ('M-INSR-004', 'Life Insurance Pricing Model v5.1', 'Life Insurance Underwriting', NOW - timedelta(days=15),
         {'disparateImpactRatio': 0.89, 'demographicParityDiff': 0.07, 'equalOpportunityDiff': 0.09,
          'predictiveParity': 0.93, 'calibrationByGroup': 0.91, 'falsePositiveRateRatio': 1.14},
         'passing'),
        ('M-FRAUD-005', 'Transaction Fraud Scoring v6.0', 'Real-time Fraud Detection', NOW - timedelta(days=1),
         {'disparateImpactRatio': 0.97, 'demographicParityDiff': 0.02, 'equalOpportunityDiff': 0.03,
          'predictiveParity': 0.98, 'calibrationByGroup': 0.97, 'falsePositiveRateRatio': 1.03},
         'passing'),
        ('M-MKTG-006', 'Customer Churn Prediction v1.4', 'Retention Marketing', NOW - timedelta(days=8),
         {'disparateImpactRatio': 0.85, 'demographicParityDiff': 0.11, 'equalOpportunityDiff': 0.13,
          'predictiveParity': 0.89, 'calibrationByGroup': 0.86, 'falsePositiveRateRatio': 1.19},
         'warning'),
        ('M-COLL-007', 'Collections Strategy Model v2.8', 'Debt Collection Prioritization', NOW - timedelta(days=20),
         {'disparateImpactRatio': 0.65, 'demographicParityDiff': 0.24, 'equalOpportunityDiff': 0.31,
          'predictiveParity': 0.78, 'calibrationByGroup': 0.74, 'falsePositiveRateRatio': 1.62},
         'failing'),
        ('M-HIRE-008', 'Resume Screening AI v1.0', 'Recruitment Funnel', NOW - timedelta(days=30),
         {'disparateImpactRatio': 0.58, 'demographicParityDiff': 0.29, 'equalOpportunityDiff': 0.34,
          'predictiveParity': 0.71, 'calibrationByGroup': 0.68, 'falsePositiveRateRatio': 1.78},
         'failing'),
        ('M-CLMS-009', 'Claims Triage Model v3.4', 'Insurance Claims Routing', NOW - timedelta(days=5),
         {'disparateImpactRatio': 0.92, 'demographicParityDiff': 0.05, 'equalOpportunityDiff': 0.07,
          'predictiveParity': 0.95, 'calibrationByGroup': 0.93, 'falsePositiveRateRatio': 1.06},
         'passing'),
        ('M-PRICE-010', 'Dynamic Pricing Engine v2.5', 'Consumer Duty Price-Value Testing', NOW - timedelta(days=3),
         {'disparateImpactRatio': 0.78, 'demographicParityDiff': 0.14, 'equalOpportunityDiff': 0.18,
          'predictiveParity': 0.86, 'calibrationByGroup': 0.83, 'falsePositiveRateRatio': 1.32},
         'warning'),
    ]
    items = []
    for i, (mid, name, use_case, last_tested, metrics, status) in enumerate(models):
        # 80% rule (EEOC) — disparate impact ratio must be >= 0.80
        dir_pass = metrics['disparateImpactRatio'] >= 0.80
        # Add protected class breakdown (synthetic)
        protected_classes = [
            {'attribute': 'gender', 'groups': [
                {'name': 'Female', 'approvalRate': 0.62 + (metrics['disparateImpactRatio'] - 0.80) * 0.1, 'count': random.randint(1000, 5000)},
                {'name': 'Male', 'approvalRate': 0.71, 'count': random.randint(1000, 5000)},
                {'name': 'Non-binary', 'approvalRate': 0.65, 'count': random.randint(20, 200)},
            ]},
            {'attribute': 'race-ethnicity', 'groups': [
                {'name': 'White', 'approvalRate': 0.72, 'count': random.randint(2000, 8000)},
                {'name': 'Black', 'approvalRate': 0.72 * metrics['disparateImpactRatio'], 'count': random.randint(500, 3000)},
                {'name': 'Hispanic', 'approvalRate': 0.72 * (metrics['disparateImpactRatio'] - 0.02), 'count': random.randint(500, 3000)},
                {'name': 'Asian', 'approvalRate': 0.74, 'count': random.randint(500, 3000)},
                {'name': 'Other', 'approvalRate': 0.69, 'count': random.randint(100, 1000)},
            ]},
            {'attribute': 'age-bracket', 'groups': [
                {'name': '18-25', 'approvalRate': 0.58, 'count': random.randint(500, 2500)},
                {'name': '26-40', 'approvalRate': 0.71, 'count': random.randint(2000, 6000)},
                {'name': '41-55', 'approvalRate': 0.74, 'count': random.randint(2000, 6000)},
                {'name': '56-70', 'approvalRate': 0.69, 'count': random.randint(1000, 4000)},
                {'name': '70+', 'approvalRate': 0.61, 'count': random.randint(200, 1000)},
            ]},
        ]
        items.append({
            'id': cuid('fr_', i + 1),
            'modelId': mid,
            'name': name,
            'useCase': use_case,
            'lastTestedAt': iso(last_tested),
            'fairnessMetrics': metrics,
            'status': status,
            'eeocFourFifthsRulePassed': dir_pass,
            'protectedClassBreakdown': protected_classes,
            'proxyAttributesDetected': (
                ['zip-code', 'surname-prefix'] if status == 'failing'
                else ['zip-code'] if status == 'warning'
                else []
            ),
            'remediationActions': (
                ['Retrain with reweighing', 'Remove ZIP code feature', 'Add adversarial debiasing layer']
                if status == 'failing'
                else ['Feature importance review', 'Calibrate by group']
                if status == 'warning'
                else []
            ),
            'aiRecommendation': ai_rec(
                action=(
                    'Quarantine model + invoke adverse action review' if status == 'failing'
                    else 'Schedule fairness retraining sprint' if status == 'warning'
                    else 'Continue routine quarterly testing'
                ),
                confidence=98 if status == 'failing' else 84,
                reasoning=(
                    f'{name} has disparate impact ratio {metrics["disparateImpactRatio"]:.2f} '
                    f'(EEOC 4/5 rule threshold: 0.80). '
                    + (
                        'Significant disparity detected across protected classes. '
                        'Model should be quarantined pending ECOA adverse-action notice review.'
                        if status == 'failing' else
                        'Below-threshold disparity detected. Remediation recommended within 30 days.'
                        if status == 'warning' else
                        'All fairness metrics within acceptable bounds.'
                    )
                ),
                reviewer_action=(
                    'approve_model_quarantine' if status == 'failing'
                    else 'approve_retraining_sprint' if status == 'warning'
                    else 'acknowledge_model_fair'
                ),
            ),
        })
    passing = sum(1 for m in items if m['status'] == 'passing')
    warning = sum(1 for m in items if m['status'] == 'warning')
    failing = sum(1 for m in items if m['status'] == 'failing')
    return {
        'models': items,
        'total': len(items),
        'summary': {
            'passing': passing,
            'warning': warning,
            'failing': failing,
            'eeocRulePassed': sum(1 for m in items if m['eeocFourFifthsRulePassed']),
            'avgDisparateImpactRatio': round(sum(m['fairnessMetrics']['disparateImpactRatio'] for m in items) / len(items), 3),
            'modelsWithProxiesDetected': sum(1 for m in items if m['proxyAttributesDetected']),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# 7. Consumer Duty + ADM Rights + Layered Disclosure
# ──────────────────────────────────────────────────────────────────────
def gen_consumer_duty() -> dict:
    # 7a. Consumer Duty outcomes monitoring
    outcomes = [
        # (outcome, kpi_name, target, actual, status)
        ('products-services', 'Product Approval Cycle Time (days)', 5, 4, 'on-track'),
        ('products-services', 'Product Withdrawal Notices Sent (30d)', 100, 100, 'on-track'),
        ('price-value', 'Fair Value Assessment Completion %', 100, 87, 'at-risk'),
        ('price-value', 'Avg Price-to-Value Ratio', 0.85, 0.91, 'breach'),
        ('consumer-understanding', 'Comprehension Test Pass Rate %', 85, 78, 'at-risk'),
        ('consumer-understanding', 'Disclosures Acknowledged Within 24h %', 95, 91, 'at-risk'),
        ('consumer-support', 'Complaint Resolution SLA Met %', 90, 94, 'on-track'),
        ('consumer-support', 'Vulnerable Customer Flag Rate %', 5, 7, 'breach'),
    ]
    outcome_items = []
    for i, (outcome, kpi, target, actual, status) in enumerate(outcomes):
        outcome_items.append({
            'id': cuid('cd_', i + 1),
            'outcome': outcome,
            'kpi': kpi,
            'target': target,
            'actual': actual,
            'variance': round(actual - target, 2),
            'status': status,
            'lastMeasuredAt': iso(NOW - timedelta(hours=random.randint(2, 24))),
        })

    # 7b. Automated Decision-Making (ADM) Rights Registry — GDPR Art.22 + ECOA
    adm_decisions = [
        # (decision_id, use_case, regulation, solely_automated, human_review_available, notices_sent_30d, pending_requests)
        ('ADM-001', 'Instant Credit Pre-Approval', 'GDPR Art.22 + ECOA', False, True, 1247, 3),
        ('ADM-002', 'Insurance Auto-Underwriting', 'GDPR Art.22', False, True, 892, 1),
        ('ADM-003', 'Fraud Auto-Decline', 'GDPR Art.22(2)(b)', True, True, 47, 12),
        ('ADM-004', 'Loan Application Decisioning', 'ECOA Reg B', False, True, 3184, 8),
        ('ADM-005', 'AML Alert Auto-Closure', 'GDPR Art.22(2)(b)', True, False, 4821, 0),
        ('ADM-006', 'Insurance Claims Auto-Pay', 'GDPR Art.22', False, True, 247, 4),
        ('ADM-007', 'Dynamic Pricing Engine', 'Consumer Duty', True, True, 0, 2),
        ('ADM-008', 'Collections Strategy Auto-Assign', 'GDPR Art.22 + FDCPA', True, True, 192, 6),
    ]
    adm_items = []
    for i, (did, use_case, reg, solely, human_review, notices, pending) in enumerate(adm_decisions):
        adm_items.append({
            'id': cuid('adm_', i + 1),
            'decisionId': did,
            'useCase': use_case,
            'regulation': reg,
            'solelyAutomated': solely,
            'humanReviewAvailable': human_review,
            'adverseActionNoticesSent30d': notices,
            'humanReviewRequestsPending': pending,
            'lastAuditAt': iso(NOW - timedelta(days=random.randint(1, 14))),
            'aiRecommendation': ai_rec(
                action=(
                    'Enable human review workflow for affected decisions' if solely and not human_review
                    else 'Process pending human review requests within 30-day ECOA window'
                    if pending > 0 else 'Continue routine ADM monitoring'
                ),
                confidence=94 if solely and not human_review else 86 if pending > 0 else 99,
                reasoning=(
                    f'{use_case} under {reg}. '
                    + (
                        'Solely automated without human review — incompatible with GDPR Art.22(3).'
                        if solely and not human_review else
                        f'{pending} human review request(s) pending — ECOA 30-day clock running.'
                        if pending > 0 else
                        'All ADM workflows compliant with human-in-the-loop requirements.'
                    )
                ),
                reviewer_action=(
                    'approve_enable_human_review' if solely and not human_review
                    else 'approve_process_review_queue' if pending > 0
                    else 'acknowledge_adm_compliant'
                ),
            ),
        })

    # 7c. Layered Disclosure Inventory
    disclosures = [
        # (slug, product, layer, jurisdiction, last_updated, complexity_score)
        ('disc-credit-card-tc', 'Platinum Rewards Credit Card', 'full-terms', 'UK', NOW - timedelta(days=30), 78),
        ('disc-credit-card-kf', 'Platinum Rewards Credit Card', 'key-facts', 'UK', NOW - timedelta(days=30), 32),
        ('disc-credit-card-ss', 'Platinum Rewards Credit Card', 'summary-stat', 'UK', NOW - timedelta(days=30), 18),
        ('disc-loan-apr', 'Personal Loan 24m', 'apr-headline', 'US', NOW - timedelta(days=15), 12),
        ('disc-loan-tila', 'Personal Loan 24m', 'tila-box', 'US', NOW - timedelta(days=15), 24),
        ('disc-loan-tc', 'Personal Loan 24m', 'full-terms', 'US', NOW - timedelta(days=15), 82),
        ('disc-insurance-ipid', 'Travel Insurance Plus', 'ipid', 'EU', NOW - timedelta(days=60), 28),
        ('disc-insurance-tc', 'Travel Insurance Plus', 'full-terms', 'EU', NOW - timedelta(days=60), 75),
        ('disc-mortgage-esis', '30y Fixed Mortgage', 'esis-standard', 'EU', NOW - timedelta(days=45), 34),
        ('disc-mortgage-kf', '30y Fixed Mortgage', 'key-facts', 'UK', NOW - timedelta(days=45), 28),
        ('disc-savings-aer', 'High-Yield Savings', 'aer-headline', 'UK', NOW - timedelta(days=20), 10),
        ('disc-investment-ept', 'Stocks & Shares ISA', 'ex-ante-costs', 'EU', NOW - timedelta(days=10), 42),
    ]
    disclosure_items = []
    for i, (slug, product, layer, juris, updated, complexity) in enumerate(disclosures):
        layer_label = {
            'full-terms': 'Full Terms & Conditions',
            'key-facts': 'Key Facts Document',
            'summary-stat': 'Summary Statistics',
            'apr-headline': 'APR Headline Disclosure',
            'tila-box': 'TILA Box (US Federal)',
            'ipid': 'Insurance Product Information Document',
            'esis-standard': 'European Standardised Information Sheet',
            'aer-headline': 'AER Headline Rate',
            'ex-ante-costs': 'Ex-Ante Costs & Charges',
        }.get(layer, layer)
        disclosure_items.append({
            'id': cuid('dsc_', i + 1),
            'slug': slug,
            'product': product,
            'layer': layer,
            'layerLabel': layer_label,
            'jurisdiction': juris,
            'lastUpdatedAt': iso(updated),
            'complexityScore': complexity,  # 0-100, higher = harder to read
            'readingGradeLevel': 8 + (complexity // 12),  # rough Flesch-Kincaid grade
            'wordCount': random.randint(complexity * 12, complexity * 18),
            'aiRecommendation': ai_rec(
                action=(
                    'Simplify disclosure — reading grade too high' if complexity > 60
                    else 'Refresh disclosure with updated pricing' if (NOW - updated).days > 30
                    else 'Maintain current disclosure'
                ),
                confidence=88 if complexity > 60 else 75,
                reasoning=(
                    f'{layer_label} for {product} ({juris}). '
                    + (
                        f'Complexity score {complexity}/100 — reading grade level '
                        f'{8 + (complexity // 12)}. Consumer Duty guidance targets grade 8.'
                        if complexity > 60 else
                        f'Last updated {(NOW - updated).days} days ago. Refresh recommended.'
                        if (NOW - updated).days > 30 else
                        'Disclosure within complexity and freshness targets.'
                    )
                ),
                reviewer_action=(
                    'approve_disclosure_simplification' if complexity > 60
                    else 'approve_disclosure_refresh' if (NOW - updated).days > 30
                    else 'acknowledge_disclosure_current'
                ),
            ),
        })

    return {
        'outcomes': outcome_items,
        'admDecisions': adm_items,
        'disclosures': disclosure_items,
        'summary': {
            'consumerDutyOutcomes': {
                'onTrack': sum(1 for o in outcome_items if o['status'] == 'on-track'),
                'atRisk': sum(1 for o in outcome_items if o['status'] == 'at-risk'),
                'breach': sum(1 for o in outcome_items if o['status'] == 'breach'),
            },
            'admRights': {
                'solelyAutomated': sum(1 for a in adm_items if a['solelyAutomated']),
                'humanReviewAvailable': sum(1 for a in adm_items if a['humanReviewAvailable']),
                'pendingReviewRequests': sum(a['humanReviewRequestsPending'] for a in adm_items),
                'noticesSent30d': sum(a['adverseActionNoticesSent30d'] for a in adm_items),
            },
            'layeredDisclosures': {
                'total': len(disclosure_items),
                'avgComplexity': round(sum(d['complexityScore'] for d in disclosure_items) / len(disclosure_items), 1),
                'overdueRefresh': sum(1 for d in disclosure_items if (NOW - datetime.fromisoformat(d['lastUpdatedAt'].replace('Z', '+00:00'))).days > 30),
                'highComplexity': sum(1 for d in disclosure_items if d['complexityScore'] > 60),
            },
        },
    }


def main():
    print('Generating 7 new data files for Task 12 views...')
    write_json('ccm.json', gen_ccm())
    write_json('regtech-feeds.json', gen_regtech_feeds())
    write_json('adaptive-thresholds.json', gen_adaptive_thresholds())
    write_json('localization.json', gen_localization())
    write_json('tia.json', gen_tia())
    write_json('fairness.json', gen_fairness())
    write_json('consumer-duty.json', gen_consumer_duty())
    print('Done.')


if __name__ == '__main__':
    main()
