"""
Task 14 — Generate data JSON files for 4 new views.

Output files (under public/data/):
  - reporting-evolution.json   (ReportingEvolutionView)
  - ai-model-risk.json         (AiModelRiskView)
  - tm-alert-taxonomy.json     (TmAlertTaxonomyView)
  - data-sensitivity.json      (DataSensitivityView)

Each file follows the Task 12 convention:
  { items/controls: [...], total: N, summary: {...} }
with deterministic IDs, ISO-8601 timestamps, and an aiRecommendation
block on every record (BooleanActionCard pattern).
"""
import json
import os
from datetime import datetime, timezone, timedelta

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUT_DIR, exist_ok=True)

NOW = datetime.now(timezone.utc)
HOURS_AGO = lambda h: (NOW - timedelta(hours=h)).isoformat(timespec='seconds').replace('+00:00', 'Z')
DAYS_AGO = lambda d: (NOW - timedelta(days=d)).isoformat(timespec='seconds').replace('+00:00', 'Z')
DAYS_FROM_NOW = lambda d: (NOW + timedelta(days=d)).isoformat(timespec='seconds').replace('+00:00', 'Z')


# ──────────────────────────────────────────────────────────────────────
# 1. reporting-evolution.json — Machine-Readable Reporting Evolution
# ──────────────────────────────────────────────────────────────────────
# 7 timeline eras from paper/PDF (2010) to real-time streaming (2030).
# Each era shows: format, regulators adopted, adoption rate, latency,
# XBRL taxonomy version, and an AI recommendation.
# ──────────────────────────────────────────────────────────────────────

reporting_eras = [
    {
        "id": "rep_era_2010",
        "era": "2010-2013",
        "name": "Paper & PDF Era",
        "format": "paper-pdf",
        "description": "Regulatory reports submitted as paper forms or static PDF files. Manual data entry at the regulator end. No machine-readable structure. Average processing latency 30-60 days from submission to acknowledgement.",
        "regulatorsAdopted": ["SEC", "FinCEN", "FCA", "BaFin"],
        "regulatorsCount": 4,
        "adoptionRate": 12,
        "submissionLatencyDays": 45,
        "xbrlTaxonomyVersion": None,
        "machineReadable": False,
        "automationLevel": "manual",
        "keyStandards": ["PDF/A", "XBRL 2.1 (early adopters)"],
        "evidenceRetention": "physical + scanned PDF",
        "aiRecommendation": {
            "action": "Migrate remaining paper submissions to XBRL baseline",
            "confidence": 92,
            "reasoning": "Paper/PDF era submissions carry 30-60 day processing latency and prevent automated cross-firm pattern detection. All Tier-1 regulators have migrated; remaining paper submissions are from long-tail small firms.",
            "reviewerAction": "approve_xbrl_baseline_migration"
        }
    },
    {
        "id": "rep_era_2014",
        "era": "2014-2017",
        "name": "Structured PDF + Early XBRL",
        "format": "structured-pdf",
        "description": "PDF forms with embedded XFA or AcroForm fields. Early XBRL 2.1 adoption by SEC (EDGAR) and EBA (EBA Reporting Framework 1.0). Filing throughput improved but cross-regulator comparability remained limited.",
        "regulatorsAdopted": ["SEC", "EBA", "FINRA", "FCA", "ESMA"],
        "regulatorsCount": 5,
        "adoptionRate": 28,
        "submissionLatencyDays": 14,
        "xbrlTaxonomyVersion": "XBRL 2.1",
        "machineReadable": True,
        "automationLevel": "semi-automated",
        "keyStandards": ["XBRL 2.1", "AcroForm", "EBA RF 1.0"],
        "evidenceRetention": "PDF + XBRL instance",
        "aiRecommendation": {
            "action": "Decommission AcroForm-only filings",
            "confidence": 87,
            "reasoning": "AcroForm-based PDFs cannot be parsed by modern regulator pipelines without OCR fallback. Migrate to XBRL 2.1 baseline to enable automated validation.",
            "reviewerAction": "approve_form_decommission"
        }
    },
    {
        "id": "rep_era_2018",
        "era": "2018-2020",
        "name": "XBRL Taxonomy Standardization",
        "format": "xbrl",
        "description": "Industry-wide adoption of XBRL taxonomies (EBA RF 2.0, SEC EDGAR XBRL, FCA GABRIEL XBRL). Multi-jurisdictional frameworks (FINREP, COREP, AnaCredit) consolidated. Submission latency dropped to 3-5 days.",
        "regulatorsAdopted": ["SEC", "EBA", "FINRA", "FCA", "ESMA", "MAS", "HKMA", "APRA", "OSFI"],
        "regulatorsCount": 9,
        "adoptionRate": 58,
        "submissionLatencyDays": 4,
        "xbrlTaxonomyVersion": "XBRL 2.1 + Dimensions 1.0",
        "machineReadable": True,
        "automationLevel": "automated",
        "keyStandards": ["XBRL 2.1", "EBA RF 2.0", "FINREP", "COREP", "AnaCredit"],
        "evidenceRetention": "XBRL instance + DPM database",
        "aiRecommendation": {
            "action": "Continue current trajectory",
            "confidence": 95,
            "reasoning": "XBRL adoption reached 58% across Tier-1 regulators. Remaining gaps are in APAC (MAS, HKMA) and smaller EU member states. No immediate remediation required.",
            "reviewerAction": "acknowledge_trajectory"
        }
    },
    {
        "id": "rep_era_2021",
        "era": "2021-2023",
        "name": "API-Based Submission",
        "format": "api",
        "description": "Regulators expose REST/GraphQL submission APIs replacing batch XBRL file uploads. FCA Digital Gateway, MAS SGFinD, ESMA DORA Register all moved to API-first. Real-time validation feedback at submission time.",
        "regulatorsAdopted": ["SEC", "EBA", "FINRA", "FCA", "ESMA", "MAS", "HKMA", "APRA", "OSFI", "JFSA"],
        "regulatorsCount": 10,
        "adoptionRate": 78,
        "submissionLatencyDays": 1,
        "xbrlTaxonomyVersion": "XBRL 2.1 + xBRL-CSV",
        "machineReadable": True,
        "automationLevel": "api-first",
        "keyStandards": ["REST", "OAuth 2.0", "OpenAPI 3.0", "xBRL-CSV", "EBA RF 3.0"],
        "evidenceRetention": "API response + signed receipt",
        "aiRecommendation": {
            "action": "Onboard remaining long-tail firms to API submission",
            "confidence": 89,
            "reasoning": "API-first adoption reached 78%. Remaining 22% are small firms relying on batch XBRL via third-party filing agents. Targeted outreach required.",
            "reviewerAction": "approve_small_firm_outreach"
        }
    },
    {
        "id": "rep_era_2024",
        "era": "2024-2026",
        "name": "Streaming & Event-Driven",
        "format": "streaming",
        "description": "Real-time streaming submissions via Kafka, AWS Kinesis, or regulator-hosted message brokers. Event-driven architecture supports continuous reporting (e.g. EMIR T+1, SFTR intra-day). Average latency: 15 minutes.",
        "regulatorsAdopted": ["SEC", "EBA", "ESMA", "FCA", "MAS", "HKMA", "CFTC", "JFSA"],
        "regulatorsCount": 8,
        "adoptionRate": 42,
        "submissionLatencyDays": 0.01,
        "xbrlTaxonomyVersion": "xBRL-JSON + xBRL-CSV",
        "machineReadable": True,
        "automationLevel": "streaming",
        "keyStandards": ["Kafka", "Avro", "xBRL-JSON", "OpenAPI 3.1", "Webhook"],
        "evidenceRetention": "event log + merkle anchor",
        "aiRecommendation": {
            "action": "Expand streaming coverage to all real-time obligations",
            "confidence": 91,
            "reasoning": "Streaming adoption at 42% — concentrated in EMIR/SFTR trade reporting. Other obligations (FINREP, COREP) remain on daily batch. Expand streaming for time-sensitive obligations.",
            "reviewerAction": "approve_streaming_expansion"
        }
    },
    {
        "id": "rep_era_2027",
        "era": "2027-2029",
        "name": "Continuous Assurance",
        "format": "continuous-assurance",
        "description": "Regulator-as-code: firms expose live data via read-only regulator API access. In-line attestations replace periodic submissions. Continuous evidence collection via regulator-managed log streams.",
        "regulatorsAdopted": ["EBA", "ESMA", "FCA", "MAS"],
        "regulatorsCount": 4,
        "adoptionRate": 18,
        "submissionLatencyDays": 0.001,
        "xbrlTaxonomyVersion": "xBRL-JSON + RegTech Data Model",
        "machineReadable": True,
        "automationLevel": "continuous",
        "keyStandards": ["Regulator-as-Code", "Continuous Evidence", "Signed Log Streams"],
        "evidenceRetention": "regulator-side continuous log",
        "aiRecommendation": {
            "action": "Pilot continuous assurance for two regulator relationships",
            "confidence": 82,
            "reasoning": "Continuous assurance reduces submission overhead but requires substantial API infrastructure. Pilot with EBA and FCA before broader rollout.",
            "reviewerAction": "approve_pilot"
        }
    },
    {
        "id": "rep_era_2030",
        "era": "2030+",
        "name": "Autonomous Compliance",
        "format": "autonomous",
        "description": "AI agents negotiate with regulator agents in real-time. Self-executing compliance via smart contracts for standardised obligations. Zero-touch compliance for 80%+ of routine filings.",
        "regulatorsAdopted": [],
        "regulatorsCount": 0,
        "adoptionRate": 0,
        "submissionLatencyDays": 0.0,
        "xbrlTaxonomyVersion": "TBD",
        "machineReadable": True,
        "automationLevel": "autonomous",
        "keyStandards": ["AI-to-AI Protocol", "Smart Contracts", "Verifiable Credentials"],
        "evidenceRetention": "blockchain-anchored",
        "aiRecommendation": {
            "action": "Monitor emerging regulator guidance",
            "confidence": 68,
            "reasoning": "Autonomous compliance is conceptual. No regulator has published formal guidance. Monitor Bank of England, MAS, and EU Commission for pilot programs.",
            "reviewerAction": "acknowledge_horizon_scanning"
        }
    }
]

# Build summary stats
adoption_rates = [e["adoptionRate"] for e in reporting_eras]
latencies = [e["submissionLatencyDays"] for e in reporting_eras]
reporting_summary = {
    "eras": len(reporting_eras),
    "currentEra": "2024-2026",
    "avgAdoptionRate": round(sum(adoption_rates) / len(adoption_rates), 1),
    "currentLatencyMinutes": 15,
    "machineReadableEras": sum(1 for e in reporting_eras if e["machineReadable"]),
    "streamingAdopters": sum(1 for e in reporting_eras if e["format"] in ("streaming", "continuous-assurance", "autonomous")),
    "trajectory": "Paper → PDF → XBRL → API → Streaming → Continuous → Autonomous"
}

with open(os.path.join(OUT_DIR, 'reporting-evolution.json'), 'w') as f:
    json.dump({"eras": reporting_eras, "total": len(reporting_eras), "summary": reporting_summary}, f, indent=2)
print(f"  reporting-evolution.json: {len(reporting_eras)} eras")


# ──────────────────────────────────────────────────────────────────────
# 2. ai-model-risk.json — AI/ML Model Risk Tiers
# ──────────────────────────────────────────────────────────────────────
# 14 deployed models classified across the 4 tiers (Critical/High/Medium/Low)
# with governance metadata, human-override status, audit cadence, and bias test results.
# ──────────────────────────────────────────────────────────────────────

ai_models = [
    # Critical tier (4 models)
    {
        "id": "aim_001",
        "modelId": "MODEL-CREDIT-RETAIL-001",
        "name": "Retail Mortgage Credit Decisioning",
        "tier": "critical",
        "useCase": "Automated underwriting for retail mortgages above $250k",
        "owner": "Retail Lending",
        "approvalAuthority": "board",
        "deployedAt": DAYS_AGO(180),
        "lastAuditAt": DAYS_AGO(42),
        "nextAuditAt": DAYS_FROM_NOW(138),
        "auditFrequencyMonths": 6,
        "humanOverrideRequired": True,
        "overrideRatePct": 8.4,
        "retrainingCadenceMonths": 6,
        "lastRetrainedAt": DAYS_AGO(95),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(14),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.87,
        "explainabilityMethod": "SHAP",
        "dataLineageDoc": "DL-CREDIT-001-v3.2.pdf",
        "modelInventoryUrl": "/inventory/MODEL-CREDIT-RETAIL-001",
        "status": "production",
        "aiRecommendation": {
            "action": "Schedule quarterly bias test refresh",
            "confidence": 88,
            "reasoning": "Critical-tier model with DIR 0.87 (above 0.80 EEOC threshold) but last bias test 14 days ago. Schedule next test in 76 days to maintain quarterly cadence.",
            "reviewerAction": "approve_bias_test_schedule"
        }
    },
    {
        "id": "aim_002",
        "modelId": "MODEL-AML-TM-002",
        "name": "Real-time AML Transaction Monitoring (auto-block)",
        "tier": "critical",
        "useCase": "Real-time transaction screening with auto-block for high-risk patterns",
        "owner": "AML Ops",
        "approvalAuthority": "board",
        "deployedAt": DAYS_AGO(310),
        "lastAuditAt": DAYS_AGO(58),
        "nextAuditAt": DAYS_FROM_NOW(122),
        "auditFrequencyMonths": 6,
        "humanOverrideRequired": True,
        "overrideRatePct": 12.1,
        "retrainingCadenceMonths": 6,
        "lastRetrainedAt": DAYS_AGO(48),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(7),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.91,
        "explainabilityMethod": "Counterfactual",
        "dataLineageDoc": "DL-AML-TM-002-v2.1.pdf",
        "modelInventoryUrl": "/inventory/MODEL-AML-TM-002",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 96,
            "reasoning": "Critical-tier model performing within validated envelope. Override rate 12.1% within expected range (10-15%). Last audit 58 days ago, next in 122 days.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_003",
        "modelId": "MODEL-TRADE-EXEC-003",
        "name": "Autonomous Trading Algorithm (customer orders)",
        "tier": "critical",
        "useCase": "Autonomous execution of customer equity orders above $1M",
        "owner": "Equities Trading",
        "approvalAuthority": "board",
        "deployedAt": DAYS_AGO(420),
        "lastAuditAt": DAYS_AGO(112),
        "nextAuditAt": DAYS_FROM_NOW(68),
        "auditFrequencyMonths": 6,
        "humanOverrideRequired": True,
        "overrideRatePct": 3.2,
        "retrainingCadenceMonths": 6,
        "lastRetrainedAt": DAYS_AGO(160),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(91),
        "biasTestResult": "warn",
        "disparateImpactRatio": 0.78,
        "explainabilityMethod": "SHAP",
        "dataLineageDoc": "DL-TRADE-EXEC-003-v1.4.pdf",
        "modelInventoryUrl": "/inventory/MODEL-TRADE-EXEC-003",
        "status": "production-quarantine-pending",
        "aiRecommendation": {
            "action": "Quarantine model and trigger re-validation",
            "confidence": 94,
            "reasoning": "Critical-tier model with DIR 0.78 (below 0.80 EEOC threshold). Bias test result 'warn'. Last bias test 91 days ago — overdue for refresh. Quarantine recommended.",
            "reviewerAction": "approve_quarantine"
        }
    },
    {
        "id": "aim_004",
        "modelId": "MODEL-INSURANCE-UNDERWRITE-004",
        "name": "Life Insurance Underwriting",
        "tier": "critical",
        "useCase": "Automated life insurance underwriting above $500k sum assured",
        "owner": "Insurance Underwriting",
        "approvalAuthority": "board",
        "deployedAt": DAYS_AGO(220),
        "lastAuditAt": DAYS_AGO(35),
        "nextAuditAt": DAYS_FROM_NOW(145),
        "auditFrequencyMonths": 6,
        "humanOverrideRequired": True,
        "overrideRatePct": 6.8,
        "retrainingCadenceMonths": 6,
        "lastRetrainedAt": DAYS_AGO(78),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(21),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.84,
        "explainabilityMethod": "SHAP + LIME",
        "dataLineageDoc": "DL-INSURANCE-004-v2.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-INSURANCE-UNDERWRITE-004",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 94,
            "reasoning": "Critical-tier model performing within envelope. DIR 0.84 (above threshold). All audits current. No remediation required.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    # High tier (5 models)
    {
        "id": "aim_005",
        "modelId": "MODEL-ROBO-ADV-005",
        "name": "Robo-Advisory Portfolio Allocation",
        "tier": "high",
        "useCase": "Automated portfolio allocation for retail wealth customers",
        "owner": "Wealth Management",
        "approvalAuthority": "ceo",
        "deployedAt": DAYS_AGO(150),
        "lastAuditAt": DAYS_AGO(45),
        "nextAuditAt": DAYS_FROM_NOW(320),
        "auditFrequencyMonths": 12,
        "humanOverrideRequired": True,
        "overrideRatePct": 4.2,
        "retrainingCadenceMonths": 12,
        "lastRetrainedAt": DAYS_AGO(120),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(60),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.89,
        "explainabilityMethod": "SHAP",
        "dataLineageDoc": "DL-ROBO-005-v1.2.pdf",
        "modelInventoryUrl": "/inventory/MODEL-ROBO-ADV-005",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 95,
            "reasoning": "High-tier model performing within envelope. DIR 0.89. All audits current. Next audit 320 days out.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_006",
        "modelId": "MODEL-SANCTIONS-RANK-006",
        "name": "Sanctions Screening Name-Match Ranking",
        "tier": "high",
        "useCase": "Ranks fuzzy name-match results for sanctions screening analyst review",
        "owner": "AML Ops",
        "approvalAuthority": "ceo",
        "deployedAt": DAYS_AGO(280),
        "lastAuditAt": DAYS_AGO(80),
        "nextAuditAt": DAYS_FROM_NOW(285),
        "auditFrequencyMonths": 12,
        "humanOverrideRequired": True,
        "overrideRatePct": 15.3,
        "retrainingCadenceMonths": 12,
        "lastRetrainedAt": DAYS_AGO(105),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(45),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.93,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-SANCTIONS-006-v2.3.pdf",
        "modelInventoryUrl": "/inventory/MODEL-SANCTIONS-RANK-006",
        "status": "production",
        "aiRecommendation": {
            "action": "Schedule engineering review for override rate",
            "confidence": 81,
            "reasoning": "High-tier model with override rate 15.3% (above 15% threshold). DIR healthy at 0.93. Investigate override patterns to identify rule-tuning opportunities.",
            "reviewerAction": "approve_engineering_review"
        }
    },
    {
        "id": "aim_007",
        "modelId": "MODEL-FRAUD-SCORE-007",
        "name": "Fraud Scoring (queue prioritisation)",
        "tier": "high",
        "useCase": "Prioritises fraud investigation queue based on predicted fraud probability",
        "owner": "Fraud Operations",
        "approvalAuthority": "ceo",
        "deployedAt": DAYS_AGO(195),
        "lastAuditAt": DAYS_AGO(60),
        "nextAuditAt": DAYS_FROM_NOW(305),
        "auditFrequencyMonths": 12,
        "humanOverrideRequired": True,
        "overrideRatePct": 7.1,
        "retrainingCadenceMonths": 12,
        "lastRetrainedAt": DAYS_AGO(90),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(30),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.86,
        "explainabilityMethod": "LIME",
        "dataLineageDoc": "DL-FRAUD-007-v1.5.pdf",
        "modelInventoryUrl": "/inventory/MODEL-FRAUD-SCORE-007",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 93,
            "reasoning": "High-tier model healthy. DIR 0.86, override 7.1%, all audits current.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_008",
        "modelId": "MODEL-KYC-DOC-008",
        "name": "KYC Document Classification",
        "tier": "high",
        "useCase": "Classifies uploaded KYC documents (passport, utility bill, bank statement)",
        "owner": "KYC Operations",
        "approvalAuthority": "ceo",
        "deployedAt": DAYS_AGO(110),
        "lastAuditAt": DAYS_AGO(15),
        "nextAuditAt": DAYS_FROM_NOW(350),
        "auditFrequencyMonths": 12,
        "humanOverrideRequired": False,
        "overrideRatePct": 2.4,
        "retrainingCadenceMonths": 12,
        "lastRetrainedAt": DAYS_AGO(60),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(15),
        "biasTestResult": "pass",
        "disparateImpactRatio": 0.97,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-KYC-DOC-008-v1.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-KYC-DOC-008",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 97,
            "reasoning": "High-tier model performing well. DIR 0.97, low override rate 2.4%, audits current.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_009",
        "modelId": "MODEL-INSURANCE-CLAIM-009",
        "name": "Insurance Claim Triage",
        "tier": "high",
        "useCase": "Auto-triages insurance claims into fast-track / standard / investigate queues",
        "owner": "Insurance Claims",
        "approvalAuthority": "ceo",
        "deployedAt": DAYS_AGO(220),
        "lastAuditAt": DAYS_AGO(90),
        "nextAuditAt": DAYS_FROM_NOW(275),
        "auditFrequencyMonths": 12,
        "humanOverrideRequired": True,
        "overrideRatePct": 9.8,
        "retrainingCadenceMonths": 12,
        "lastRetrainedAt": DAYS_AGO(115),
        "biasTestRequired": True,
        "lastBiasTestAt": DAYS_AGO(75),
        "biasTestResult": "warn",
        "disparateImpactRatio": 0.79,
        "explainabilityMethod": "SHAP",
        "dataLineageDoc": "DL-CLAIM-009-v1.3.pdf",
        "modelInventoryUrl": "/inventory/MODEL-INSURANCE-CLAIM-009",
        "status": "production",
        "aiRecommendation": {
            "action": "Schedule retraining and bias test refresh",
            "confidence": 86,
            "reasoning": "High-tier model with DIR 0.79 (below 0.80 threshold). Bias test result 'warn'. Last retrained 115 days ago — overdue for refresh.",
            "reviewerAction": "approve_retraining_schedule"
        }
    },
    # Medium tier (3 models)
    {
        "id": "aim_010",
        "modelId": "MODEL-CHURN-010",
        "name": "Customer Churn Prediction",
        "tier": "medium",
        "useCase": "Predicts customer churn likelihood for retention outreach",
        "owner": "Customer Analytics",
        "approvalAuthority": "cRO",
        "deployedAt": DAYS_AGO(75),
        "lastAuditAt": DAYS_AGO(30),
        "nextAuditAt": DAYS_FROM_NOW(510),
        "auditFrequencyMonths": 18,
        "humanOverrideRequired": False,
        "overrideRatePct": 0.0,
        "retrainingCadenceMonths": 18,
        "lastRetrainedAt": DAYS_AGO(40),
        "biasTestRequired": False,
        "lastBiasTestAt": None,
        "biasTestResult": "n/a",
        "disparateImpactRatio": None,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-CHURN-010-v1.1.pdf",
        "modelInventoryUrl": "/inventory/MODEL-CHURN-010",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 96,
            "reasoning": "Medium-tier model healthy. No bias test requirement. All audits current.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_011",
        "modelId": "MODEL-MKTG-SEG-011",
        "name": "Marketing Segmentation",
        "tier": "medium",
        "useCase": "Segments customers for targeted marketing campaigns",
        "owner": "Marketing",
        "approvalAuthority": "cRO",
        "deployedAt": DAYS_AGO(140),
        "lastAuditAt": DAYS_AGO(50),
        "nextAuditAt": DAYS_FROM_NOW(490),
        "auditFrequencyMonths": 18,
        "humanOverrideRequired": False,
        "overrideRatePct": 0.0,
        "retrainingCadenceMonths": 18,
        "lastRetrainedAt": DAYS_AGO(75),
        "biasTestRequired": False,
        "lastBiasTestAt": None,
        "biasTestResult": "n/a",
        "disparateImpactRatio": None,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-MKTG-011-v1.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-MKTG-SEG-011",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 97,
            "reasoning": "Medium-tier model healthy. No bias test requirement. All audits current.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_012",
        "modelId": "MODEL-AGENT-PRIORITY-012",
        "name": "Customer Service Agent Priority Queue",
        "tier": "medium",
        "useCase": "Prioritises customer service agent queue by predicted escalation risk",
        "owner": "Customer Service",
        "approvalAuthority": "cRO",
        "deployedAt": DAYS_AGO(95),
        "lastAuditAt": DAYS_AGO(20),
        "nextAuditAt": DAYS_FROM_NOW(520),
        "auditFrequencyMonths": 18,
        "humanOverrideRequired": False,
        "overrideRatePct": 0.0,
        "retrainingCadenceMonths": 18,
        "lastRetrainedAt": DAYS_AGO(55),
        "biasTestRequired": False,
        "lastBiasTestAt": None,
        "biasTestResult": "n/a",
        "disparateImpactRatio": None,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-AGENT-012-v1.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-AGENT-PRIORITY-012",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 95,
            "reasoning": "Medium-tier model healthy. No issues identified.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    # Low tier (2 models)
    {
        "id": "aim_013",
        "modelId": "MODEL-ROOM-SCHED-013",
        "name": "Meeting Room Scheduling Optimiser",
        "tier": "low",
        "useCase": "Optimises meeting room assignments based on attendance predictions",
        "owner": "Workplace Services",
        "approvalAuthority": "team_lead",
        "deployedAt": DAYS_AGO(45),
        "lastAuditAt": DAYS_AGO(10),
        "nextAuditAt": DAYS_FROM_NOW(710),
        "auditFrequencyMonths": 24,
        "humanOverrideRequired": False,
        "overrideRatePct": 0.0,
        "retrainingCadenceMonths": 24,
        "lastRetrainedAt": DAYS_AGO(45),
        "biasTestRequired": False,
        "lastBiasTestAt": None,
        "biasTestResult": "n/a",
        "disparateImpactRatio": None,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-ROOM-013-v1.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-ROOM-SCHED-013",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 99,
            "reasoning": "Low-tier model with no consumer impact. Routine monitoring sufficient.",
            "reviewerAction": "acknowledge_healthy"
        }
    },
    {
        "id": "aim_014",
        "modelId": "MODEL-DOC-CLASSIFY-014",
        "name": "Internal Document Classification",
        "tier": "low",
        "useCase": "Classifies internal documents into category tags for knowledge base",
        "owner": "Knowledge Management",
        "approvalAuthority": "team_lead",
        "deployedAt": DAYS_AGO(180),
        "lastAuditAt": DAYS_AGO(60),
        "nextAuditAt": DAYS_FROM_NOW(660),
        "auditFrequencyMonths": 24,
        "humanOverrideRequired": False,
        "overrideRatePct": 0.0,
        "retrainingCadenceMonths": 24,
        "lastRetrainedAt": DAYS_AGO(180),
        "biasTestRequired": False,
        "lastBiasTestAt": None,
        "biasTestResult": "n/a",
        "disparateImpactRatio": None,
        "explainabilityMethod": "Feature Importance",
        "dataLineageDoc": "DL-DOC-014-v1.0.pdf",
        "modelInventoryUrl": "/inventory/MODEL-DOC-CLASSIFY-014",
        "status": "production",
        "aiRecommendation": {
            "action": "Continue routine monitoring",
            "confidence": 99,
            "reasoning": "Low-tier model. No remediation required.",
            "reviewerAction": "acknowledge_healthy"
        }
    }
]

# Compute summary stats
tier_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
override_required_count = 0
bias_fail_count = 0
quarantine_count = 0
avg_dir_values = []

for m in ai_models:
    tier_counts[m["tier"]] += 1
    if m["humanOverrideRequired"]:
        override_required_count += 1
    if m["biasTestResult"] in ("fail", "warn"):
        bias_fail_count += 1
    if "quarantine" in m["status"]:
        quarantine_count += 1
    if m["disparateImpactRatio"] is not None:
        avg_dir_values.append(m["disparateImpactRatio"])

ai_summary = {
    "totalModels": len(ai_models),
    "critical": tier_counts["critical"],
    "high": tier_counts["high"],
    "medium": tier_counts["medium"],
    "low": tier_counts["low"],
    "humanOverrideRequired": override_required_count,
    "biasTestIssues": bias_fail_count,
    "quarantinePending": quarantine_count,
    "avgDisparateImpactRatio": round(sum(avg_dir_values) / len(avg_dir_values), 3) if avg_dir_values else 0
}

with open(os.path.join(OUT_DIR, 'ai-model-risk.json'), 'w') as f:
    json.dump({"models": ai_models, "total": len(ai_models), "summary": ai_summary}, f, indent=2)
print(f"  ai-model-risk.json: {len(ai_models)} models across 4 tiers")


# ──────────────────────────────────────────────────────────────────────
# 3. tm-alert-taxonomy.json — Transaction Monitoring Alert Taxonomy
# ──────────────────────────────────────────────────────────────────────
# All 20 categories from the label-tm-alert-taxonomy plugin, with
# detection method, last 30-day alert volume, false-positive rate,
# and an AI recommendation.
# ──────────────────────────────────────────────────────────────────────

tm_categories = [
    {"code": "TM-001", "name": "Structuring", "category": "structuring", "fatfRef": "FATF RE-2023 PL-01", "detectionMethod": "rule", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 1247, "falsePositivePct": 34, "avgResolutionHours": 8.4, "description": "Transactions broken into amounts just below the $10,000 CTR threshold", "aiRecommendation": {"action": "Tune threshold from $9,500 to $9,800", "confidence": 84, "reasoning": "FP rate 34% suggests threshold too aggressive. Adjusting to $9,800 should reduce FP by ~12% while maintaining detection of genuine structuring.", "reviewerAction": "approve_threshold_tune"}},
    {"code": "TM-002", "name": "Layering", "category": "layering", "fatfRef": "FATF RE-2023 PL-02", "detectionMethod": "ml-model", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 412, "falsePositivePct": 41, "avgResolutionHours": 18.7, "description": "Multi-hop transfers through correspondent banks to obscure audit trail", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 92, "reasoning": "Layering detection via isolation-forest model performing within envelope. FP rate 41% is typical for anomaly-based detection.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-003", "name": "Integration", "category": "integration", "fatfRef": "FATF RE-2023 PL-03", "detectionMethod": "hybrid", "riskSeverity": "medium", "autoEscalate": False, "alerts30d": 287, "falsePositivePct": 52, "avgResolutionHours": 24.1, "description": "Funds re-entering legitimate economy via property, luxury goods, business investment", "aiRecommendation": {"action": "Schedule rule refresh", "confidence": 78, "reasoning": "FP rate 52% indicates rules are too broad. Refresh integration detection logic with property-registry data integration.", "reviewerAction": "approve_rule_refresh"}},
    {"code": "TM-004", "name": "Smurfing", "category": "smurfing", "fatfRef": "FATF RE-2023 PL-04", "detectionMethod": "rule", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 156, "falsePositivePct": 22, "avgResolutionHours": 6.2, "description": "Multiple low-value cash deposits by networks of individuals across branches", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 95, "reasoning": "Smurfing detection healthy. FP rate 22% within expected range.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-005", "name": "Rapid Movement", "category": "rapid_movement", "fatfRef": "FATF RE-2023 PL-05", "detectionMethod": "rule", "riskSeverity": "medium", "autoEscalate": False, "alerts30d": 598, "falsePositivePct": 38, "avgResolutionHours": 4.8, "description": "Funds transferred in and out of account within 24 hours via real-time payment rails", "aiRecommendation": {"action": "Tune RTP threshold for Faster Payments", "confidence": 86, "reasoning": "FP rate 38% driven by legitimate business payments. Add business-account exemption for amounts below £50k.", "reviewerAction": "approve_exemption_rule"}},
    {"code": "TM-006", "name": "Funnel Account", "category": "funnel_account", "fatfRef": "FATF RE-2023 PL-06", "detectionMethod": "ml-model", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 89, "falsePositivePct": 28, "avgResolutionHours": 32.5, "description": "One account receiving deposits from many geographically dispersed individuals, remitting to single beneficiary", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 93, "reasoning": "Funnel account detection performing well. Network-graph model effective at identifying coordinated deposit patterns.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-007", "name": "Trade-Based ML", "category": "trade_based_ml", "fatfRef": "FATF RE-2023 TB-01", "detectionMethod": "hybrid", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 134, "falsePositivePct": 45, "avgResolutionHours": 48.2, "description": "Over/under-invoicing, phantom shipments, multiple invoicing against single trade", "aiRecommendation": {"action": "Schedule model retraining", "confidence": 82, "reasoning": "FP rate 45% indicates model drift. Retrain with latest customs data and World Trade Organization reference prices.", "reviewerAction": "approve_retraining"}},
    {"code": "TM-008", "name": "Cyber Crime", "category": "cyber_crime", "fatfRef": "FATF RE-2023 CY-01", "detectionMethod": "hybrid", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 723, "falsePositivePct": 31, "avgResolutionHours": 12.4, "description": "Cyber-enabled fraud: account takeover, synthetic identity, card-not-present fraud", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 91, "reasoning": "Cyber crime detection healthy. Hybrid rule+ML approach effective.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-009", "name": "Ransomware", "category": "ransomware", "fatfRef": "FATF RE-2023 CY-02", "detectionMethod": "rule", "riskSeverity": "critical", "autoEscalate": True, "alerts30d": 18, "falsePositivePct": 11, "avgResolutionHours": 4.2, "description": "Payments to ransomware-affiliated wallets, exact-amount payments to known RaaS infrastructure", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 97, "reasoning": "Ransomware detection healthy. Auto-escalation working correctly. FP rate 11% reflects precision of wallet-cluster intelligence.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-010", "name": "Business Email Compromise", "category": "bec", "fatfRef": "FATF RE-2023 CY-03", "detectionMethod": "rule", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 89, "falsePositivePct": 26, "avgResolutionHours": 6.8, "description": "Fraudulent payment instructions impersonating executives or suppliers, wires to mule accounts", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 94, "reasoning": "BEC detection healthy. Rule-based detection effective given well-known mule-account patterns.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-011", "name": "Sanctions Evasion", "category": "sanctions_evasion", "fatfRef": "FATF RE-2023 SE-01", "detectionMethod": "hybrid", "riskSeverity": "critical", "autoEscalate": True, "alerts30d": 42, "falsePositivePct": 8, "avgResolutionHours": 2.4, "description": "Transactions involving sanctioned entities, indirect routing via enablers, front companies obscuring UBO", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 98, "reasoning": "Sanctions detection performing with very low FP rate 8%. Auto-escalation ensuring 2.4h avg resolution.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-012", "name": "PEP Corruption", "category": "pep_corruption", "fatfRef": "FATF RE-2023 CO-01", "detectionMethod": "hybrid", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 67, "falsePositivePct": 35, "avgResolutionHours": 28.4, "description": "Funds linked to PEPs from high-corruption-risk jurisdictions, state-owned enterprise embezzlement", "aiRecommendation": {"action": "Refresh PEP list with latest transparency international data", "confidence": 88, "reasoning": "FP rate 35% suggests some PEP designations are stale. Refresh list with latest TI Corruption Perceptions Index.", "reviewerAction": "approve_list_refresh"}},
    {"code": "TM-013", "name": "Terrorist Financing", "category": "terrorist_financing", "fatfRef": "FATF RE-2023 TF-01", "detectionMethod": "hybrid", "riskSeverity": "critical", "autoEscalate": True, "alerts30d": 12, "falsePositivePct": 17, "avgResolutionHours": 6.8, "description": "Small-value transfers to known/suspected terrorist financiers, hawala, money service businesses", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 96, "reasoning": "TF detection healthy. Low alert volume expected given targeted nature of detection.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-014", "name": "Proliferation Financing", "category": "proliferation_financing", "fatfRef": "FATF RE-2023 PF-01", "detectionMethod": "manual", "riskSeverity": "critical", "autoEscalate": True, "alerts30d": 5, "falsePositivePct": 0, "avgResolutionHours": 96.0, "description": "Procurement of dual-use goods for WMD programmes, third-country intermediaries, designated-entity exposure", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 92, "reasoning": "PF detection manual-driven due to evolving procurement patterns. Zero false positives across 5 alerts reflects analyst precision.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-015", "name": "DeFi Exploit", "category": "defi_exploit", "fatfRef": "FATF RE-2023 VA-01", "detectionMethod": "rule", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 23, "falsePositivePct": 13, "avgResolutionHours": 16.5, "description": "Funds derived from DeFi protocol exploits: flash loan attacks, oracle manipulation, bridge exploits", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 95, "reasoning": "DeFi exploit detection healthy. Rules effective against known exploit signatures from Rekt News feed.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-016", "name": "Mixer Exposure", "category": "mixer_exposure", "fatfRef": "FATF RE-2023 VA-02", "detectionMethod": "rule", "riskSeverity": "high", "autoEscalate": True, "alerts30d": 47, "falsePositivePct": 19, "avgResolutionHours": 12.3, "description": "On-chain exposure to mixer services (Tornado Cash, Blender.io, ChipMixer)", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 96, "reasoning": "Mixer detection healthy. Auto-escalation working. Chainalysis cluster intelligence current.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-017", "name": "Privacy Coin", "category": "privacy_coin", "fatfRef": "FATF RE-2023 VA-03", "detectionMethod": "rule", "riskSeverity": "medium", "autoEscalate": False, "alerts30d": 31, "falsePositivePct": 42, "avgResolutionHours": 18.4, "description": "Use of Monero, Zcash, or other privacy-preserving cryptocurrencies designed to defeat chain analysis", "aiRecommendation": {"action": "Schedule rule review", "confidence": 80, "reasoning": "FP rate 42% suggests legitimate privacy-coin users being flagged. Refine rule to exclude shielded-but-disclosed transactions.", "reviewerAction": "approve_rule_review"}},
    {"code": "TM-018", "name": "NFT Laundering", "category": "nft_laundering", "fatfRef": "FATF RE-2023 VA-04", "detectionMethod": "ml-model", "riskSeverity": "medium", "autoEscalate": False, "alerts30d": 19, "falsePositivePct": 37, "avgResolutionHours": 22.7, "description": "Use of NFT marketplaces for wash trading and self-dealing to legitimise illicit cryptocurrency", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 89, "reasoning": "NFT laundering detection healthy. ML model effective at identifying wash-trading patterns via gas-price clustering.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-019", "name": "Cross-Border Funnel", "category": "cross_border_funnel", "fatfRef": "FATF RE-2023 VA-05", "detectionMethod": "hybrid", "riskSeverity": "high", "autoEscalate": False, "alerts30d": 38, "falsePositivePct": 29, "avgResolutionHours": 26.4, "description": "Coordinated movement across multiple jurisdictions via crypto exchanges with weak KYC", "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 92, "reasoning": "Cross-border funnel detection healthy. Hybrid approach effective at correlating crypto+fiat movement.", "reviewerAction": "acknowledge_healthy"}},
    {"code": "TM-020", "name": "Crypto-Fiat Ramp", "category": "crypto_fiat_ramp", "fatfRef": "FATF RE-2023 VA-06", "detectionMethod": "hybrid", "riskSeverity": "medium", "autoEscalate": False, "alerts30d": 84, "falsePositivePct": 44, "avgResolutionHours": 14.2, "description": "Suspicious activity at crypto-to-fiat interface: structured ATM withdrawals, P2P trading, unexplained bank-to-exchange transfers", "aiRecommendation": {"action": "Tune ATM withdrawal threshold", "confidence": 83, "reasoning": "FP rate 44% driven by legitimate ATM users. Add threshold exemption for verified KYC Tier-3 customers.", "reviewerAction": "approve_threshold_tune"}}
]

# Compute summary
total_alerts_30d = sum(c["alerts30d"] for c in tm_categories)
avg_fp = sum(c["falsePositivePct"] for c in tm_categories) / len(tm_categories)
auto_escalate_count = sum(1 for c in tm_categories if c["autoEscalate"])
critical_count = sum(1 for c in tm_categories if c["riskSeverity"] == "critical")
tm_summary = {
    "totalCategories": len(tm_categories),
    "totalAlerts30d": total_alerts_30d,
    "avgFalsePositivePct": round(avg_fp, 1),
    "autoEscalateCategories": auto_escalate_count,
    "criticalSeverityCategories": critical_count,
    "detectionMethods": {
        "rule": sum(1 for c in tm_categories if c["detectionMethod"] == "rule"),
        "ml-model": sum(1 for c in tm_categories if c["detectionMethod"] == "ml-model"),
        "hybrid": sum(1 for c in tm_categories if c["detectionMethod"] == "hybrid"),
        "manual": sum(1 for c in tm_categories if c["detectionMethod"] == "manual"),
    }
}

with open(os.path.join(OUT_DIR, 'tm-alert-taxonomy.json'), 'w') as f:
    json.dump({"categories": tm_categories, "total": len(tm_categories), "summary": tm_summary}, f, indent=2)
print(f"  tm-alert-taxonomy.json: {len(tm_categories)} categories")


# ──────────────────────────────────────────────────────────────────────
# 4. data-sensitivity.json — Data Sensitivity Classification
# ──────────────────────────────────────────────────────────────────────
# 5 tier definitions + 14 classified data assets. Each asset shows
# its classification, GDPR article refs, PIPL article refs, encryption
# status, retention, cross-border mechanism, and an AI recommendation.
# ──────────────────────────────────────────────────────────────────────

tier_defs = [
    {
        "tier": "restricted",
        "rank": 1,
        "name": "Restricted",
        "description": "Special category personal data under GDPR Art.9 and PIPL Art.28 sensitive personal information. Biometrics, health, racial/ethnic origin, religious belief, sexual orientation, trade union membership, genetic data, minors under 14.",
        "gdprArticleRefs": ["Art.9", "Art.32"],
        "piplArticleRefs": ["Art.28", "Art.29"],
        "encryptionAtRest": "AES-256",
        "encryptionInTransit": "TLS 1.3",
        "accessControlModel": "abac",
        "retentionPeriodYears": 7,
        "crossBorderAllowed": False,
        "crossBorderMechanism": "none",
        "breachNotificationHours": 72,
        "assetsCount": 4
    },
    {
        "tier": "confidential",
        "rank": 2,
        "name": "Confidential",
        "description": "Personal data not special-category but elevated protection: customer financial records, account numbers, transaction histories, employment records, supplier contracts.",
        "gdprArticleRefs": ["Art.5", "Art.32"],
        "piplArticleRefs": ["Art.13"],
        "encryptionAtRest": "AES-256",
        "encryptionInTransit": "TLS 1.3",
        "accessControlModel": "rbac",
        "retentionPeriodYears": 7,
        "crossBorderAllowed": True,
        "crossBorderMechanism": "scc",
        "breachNotificationHours": 72,
        "assetsCount": 5
    },
    {
        "tier": "internal",
        "rank": 3,
        "name": "Internal",
        "description": "Internal operational data not customer-facing: internal policies, training materials, non-public risk assessments, internal audit reports.",
        "gdprArticleRefs": ["Art.5"],
        "piplArticleRefs": ["Art.13"],
        "encryptionAtRest": "AES-128",
        "encryptionInTransit": "TLS 1.3",
        "accessControlModel": "rbac",
        "retentionPeriodYears": 5,
        "crossBorderAllowed": True,
        "crossBorderMechanism": "scc",
        "breachNotificationHours": 72,
        "assetsCount": 3
    },
    {
        "tier": "public",
        "rank": 4,
        "name": "Public",
        "description": "Data explicitly approved for public release: published annual reports, regulatory disclosures, marketing materials, press releases. Subject to declassification review.",
        "gdprArticleRefs": [],
        "piplArticleRefs": [],
        "encryptionAtRest": "none",
        "encryptionInTransit": "none",
        "accessControlModel": "rbac",
        "retentionPeriodYears": 3,
        "crossBorderAllowed": True,
        "crossBorderMechanism": "adequacy",
        "breachNotificationHours": None,
        "assetsCount": 1
    },
    {
        "tier": "deprecated",
        "rank": 5,
        "name": "Deprecated",
        "description": "Data that has reached end of retention or whose lawful basis has lapsed. Must be securely deleted within 90 days. Only DPO + records management can access (PBAC).",
        "gdprArticleRefs": ["Art.5(1)(e)"],
        "piplArticleRefs": ["Art.47"],
        "encryptionAtRest": "AES-256",
        "encryptionInTransit": "none",
        "accessControlModel": "pbac",
        "retentionPeriodYears": 0,
        "crossBorderAllowed": False,
        "crossBorderMechanism": "none",
        "breachNotificationHours": None,
        "assetsCount": 1
    }
]

data_assets = [
    # Restricted (4)
    {"id": "asset_001", "assetName": "Customer Biometric Templates (KYC)", "classification": "restricted", "owner": "KYC Operations", "dataVolumeGB": 12.4, "recordsCount": 1240000, "lastClassifiedAt": DAYS_AGO(45), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 98, "reasoning": "Restricted-tier asset with biometric data. ABAC enforcement active. Zero breaches in last 12 months.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_002", "assetName": "Customer Health Questionnaire Data (Insurance)", "classification": "restricted", "owner": "Insurance Underwriting", "dataVolumeGB": 4.8, "recordsCount": 380000, "lastClassifiedAt": DAYS_AGO(60), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 97, "reasoning": "Health data under GDPR Art.9. Restricted classification correct. Residency enforced EU-only.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_003", "assetName": "PEP Status Declarations", "classification": "restricted", "owner": "AML Ops", "dataVolumeGB": 0.2, "recordsCount": 84000, "lastClassifiedAt": DAYS_AGO(30), "crossBorderTransferRequested": True, "residencyRegion": "EU+US", "breachIncidents12m": 0, "aiRecommendation": {"action": "Block cross-border transfer to US — apply BCR + TIA", "confidence": 91, "reasoning": "PEP declarations are restricted under GDPR Art.9 (political opinions). Cross-border to US requires BCR + Transfer Impact Assessment. TIA not on file — block transfer.", "reviewerAction": "approve_block_transfer"}},
    {"id": "asset_004", "assetName": "Children's Savings Account Data (minors under 14)", "classification": "restricted", "owner": "Retail Banking", "dataVolumeGB": 1.1, "recordsCount": 22000, "lastClassifiedAt": DAYS_AGO(15), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 99, "reasoning": "PIPL Art.28 minors data. Restricted classification correct. Zero breaches.", "reviewerAction": "acknowledge_healthy"}},
    # Confidential (5)
    {"id": "asset_005", "assetName": "Customer Transaction Histories", "classification": "confidential", "owner": "Retail Banking", "dataVolumeGB": 1840.5, "recordsCount": 4200000000, "lastClassifiedAt": DAYS_AGO(20), "crossBorderTransferRequested": True, "residencyRegion": "EU+US+SG", "breachIncidents12m": 1, "aiRecommendation": {"action": "Refresh SCC for US transfer", "confidence": 87, "reasoning": "2021 SCC version on file but TIA last refreshed 14 months ago. Schrems II requires annual TIA refresh for US transfers.", "reviewerAction": "approve_tia_refresh"}},
    {"id": "asset_006", "assetName": "Account Numbers and Balances", "classification": "confidential", "owner": "Core Banking", "dataVolumeGB": 324.7, "recordsCount": 89000000, "lastClassifiedAt": DAYS_AGO(35), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 96, "reasoning": "Confidential-tier asset healthy. RBAC with quarterly recertification current.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_007", "assetName": "Employment Records (HR)", "classification": "confidential", "owner": "Human Resources", "dataVolumeGB": 18.2, "recordsCount": 145000, "lastClassifiedAt": DAYS_AGO(75), "crossBorderTransferRequested": True, "residencyRegion": "EU+UK+US", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 94, "reasoning": "Employment records classified confidential correctly. SCCs on file for all cross-border transfers.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_008", "assetName": "Supplier Contracts and Pricing", "classification": "confidential", "owner": "Procurement", "dataVolumeGB": 6.4, "recordsCount": 8200, "lastClassifiedAt": DAYS_AGO(90), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 97, "reasoning": "Confidential-tier asset healthy. No cross-border transfers.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_009", "assetName": "Credit Bureau Scores", "classification": "confidential", "owner": "Retail Lending", "dataVolumeGB": 22.7, "recordsCount": 4100000, "lastClassifiedAt": DAYS_AGO(40), "crossBorderTransferRequested": True, "residencyRegion": "EU+UK", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 95, "reasoning": "Confidential-tier asset healthy. SCCs current for UK transfer (adequacy decision pending).", "reviewerAction": "acknowledge_healthy"}},
    # Internal (3)
    {"id": "asset_010", "assetName": "Internal Audit Reports", "classification": "internal", "owner": "Internal Audit", "dataVolumeGB": 14.2, "recordsCount": 1240, "lastClassifiedAt": DAYS_AGO(50), "crossBorderTransferRequested": True, "residencyRegion": "EU+US", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 96, "reasoning": "Internal-tier asset. RBAC with annual recertification current.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_011", "assetName": "Risk Assessment Reports", "classification": "internal", "owner": "Risk Management", "dataVolumeGB": 8.9, "recordsCount": 890, "lastClassifiedAt": DAYS_AGO(28), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 97, "reasoning": "Internal-tier asset healthy. No cross-border transfers.", "reviewerAction": "acknowledge_healthy"}},
    {"id": "asset_012", "assetName": "Training Materials", "classification": "internal", "owner": "Learning & Development", "dataVolumeGB": 32.1, "recordsCount": 4500, "lastClassifiedAt": DAYS_AGO(120), "crossBorderTransferRequested": True, "residencyRegion": "GLOBAL", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 98, "reasoning": "Internal-tier training materials. Global distribution approved under SCCs.", "reviewerAction": "acknowledge_healthy"}},
    # Public (1)
    {"id": "asset_013", "assetName": "Published Annual Report 2025", "classification": "public", "owner": "Investor Relations", "dataVolumeGB": 0.8, "recordsCount": 1, "lastClassifiedAt": DAYS_AGO(60), "crossBorderTransferRequested": True, "residencyRegion": "GLOBAL", "breachIncidents12m": 0, "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 99, "reasoning": "Public-tier asset. Declared public via formal declassification review (DR-2025-04).", "reviewerAction": "acknowledge_healthy"}},
    # Deprecated (1)
    {"id": "asset_014", "assetName": "Legacy Customer Service Chat Logs (2018-2020)", "classification": "deprecated", "owner": "Customer Service", "dataVolumeGB": 287.3, "recordsCount": 18000000, "lastClassifiedAt": DAYS_AGO(15), "crossBorderTransferRequested": False, "residencyRegion": "EU", "breachIncidents12m": 0, "destructionScheduledAt": DAYS_FROM_NOW(75), "aiRecommendation": {"action": "Schedule destruction verification", "confidence": 89, "reasoning": "Deprecated-tier asset scheduled for destruction in 75 days. PIPL Art.47 right to deletion. DPO to verify destruction certificate within 7 days of execution.", "reviewerAction": "approve_destruction_schedule"}}
]

# Summary
asset_counts = {t["tier"]: 0 for t in tier_defs}
total_volume = 0
total_breaches = 0
for a in data_assets:
    asset_counts[a["classification"]] += 1
    total_volume += a["dataVolumeGB"]
    total_breaches += a["breachIncidents12m"]

sensitivity_summary = {
    "totalAssets": len(data_assets),
    "totalDataVolumeGB": round(total_volume, 1),
    "restrictedAssets": asset_counts["restricted"],
    "confidentialAssets": asset_counts["confidential"],
    "internalAssets": asset_counts["internal"],
    "publicAssets": asset_counts["public"],
    "deprecatedAssets": asset_counts["deprecated"],
    "breachIncidents12m": total_breaches,
    "crossBorderTransfersActive": sum(1 for a in data_assets if a["crossBorderTransferRequested"]),
    "destructionScheduled": sum(1 for a in data_assets if "destructionScheduledAt" in a)
}

with open(os.path.join(OUT_DIR, 'data-sensitivity.json'), 'w') as f:
    json.dump({"tiers": tier_defs, "assets": data_assets, "total": len(data_assets), "summary": sensitivity_summary}, f, indent=2)
print(f"  data-sensitivity.json: {len(tier_defs)} tiers, {len(data_assets)} assets")

print("\nAll 4 data files written to:", OUT_DIR)
