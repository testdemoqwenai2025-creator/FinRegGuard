"""
Task 15 — Generate data JSON files for 3 new views.

Output files (under public/data/):
  - ai-governance.json     (AiGovernanceView — lifecycle phases + explainability layer +
                            fairness metric matrix in one combined view)
  - crypto-regulation.json (CryptoRegulationView — MiCA CASPs + Travel Rule messages +
                            DeFi compliance pillars)
  - esg-reporting.json     (EsgReportingView — framework comparison + climate scenarios +
                            social capital metrics)

Each file follows Task 12 conventions:
  - deterministic cuid-shaped IDs
  - ISO-8601 timestamps
  - aiRecommendation block on every record (BooleanActionCard pattern)
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
# 1. ai-governance.json — AI/ML Governance Frameworks
# Combines: lifecycle phase records (one per model per phase),
# explainability layer records, fairness metric records.
# ──────────────────────────────────────────────────────────────────────

lifecycle_phases = [
    {
        "id": "lp_001", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "problem_definition", "phaseIndex": 1,
        "approver": "Model Risk Committee", "approverRole": "model_risk_committee",
        "enteredAt": DAYS_AGO(420), "exitedAt": DAYS_AGO(410),
        "artifacts": ["Model Charter v1.0", "Preliminary Risk Assessment", "Materiality Tier Classification: Critical"],
        "exitCriteriaMet": True,
        "notes": "Charter signed by CRO + Head of Retail Lending. Protected classes implicated: race, sex, age, national origin (ECOA scope).",
        "aiRecommendation": {"action": "Phase 1 complete — proceed to data acquisition", "confidence": 96,
                             "reasoning": "All Phase 1 exit criteria met 410 days ago. Charter signed by both required approvers. No open findings.",
                             "reviewerAction": "acknowledge_phase_completion"}
    },
    {
        "id": "lp_002", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "data_acquisition", "phaseIndex": 2,
        "approver": "Data Protection Officer", "approverRole": "dpo",
        "enteredAt": DAYS_AGO(410), "exitedAt": DAYS_AGO(380),
        "artifacts": ["Data Sheet v1.0", "DPIA Article 35 — completed", "Data Lineage Graph", "Consent Basis Attestation"],
        "exitCriteriaMet": True,
        "notes": "DPIA triggered by use of credit bureau data (special category under GDPR Art.9(2)(b)). Synthetic data supplement approved (15% blend ratio).",
        "aiRecommendation": {"action": "Phase 2 complete — proceed to model development", "confidence": 94,
                             "reasoning": "Data Sheet signed by DPO. DPIA cleared with no Required Remediation items. Lineage graph covers all 47 source fields.",
                             "reviewerAction": "acknowledge_phase_completion"}
    },
    {
        "id": "lp_003", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "model_development", "phaseIndex": 3,
        "approver": "Model Owner (peer reviewed)", "approverRole": "team_lead",
        "enteredAt": DAYS_AGO(380), "exitedAt": DAYS_AGO(290),
        "artifacts": ["Model Card v1.0", "Versioned artifact v1.0.0 (hash 0xa3f1...)", "Fairness Metric Report v1.0", "Peer Review Sign-off"],
        "exitCriteriaMet": True,
        "notes": "Peer review by Senior Data Scientist (independent of development team). Fairness metrics computed across 7 protected classes. Reproducibility tolerance 1e-6 met.",
        "aiRecommendation": {"action": "Phase 3 complete — proceed to validation", "confidence": 92,
                             "reasoning": "All Phase 3 artifacts produced. Reproducibility tolerance met. Fairness metric report shows DIR 0.87 (pass).",
                             "reviewerAction": "acknowledge_phase_completion"}
    },
    {
        "id": "lp_004", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "pre_deployment_validation", "phaseIndex": 4,
        "approver": "Head of Model Validation", "approverRole": "senior_compliance",
        "enteredAt": DAYS_AGO(290), "exitedAt": DAYS_AGO(210),
        "artifacts": ["Validation Report v1.0", "Challenger Model Comparison (logistic regression baseline)", "Stress Test Results — 12 scenarios"],
        "exitCriteriaMet": True,
        "notes": "Challenger model (logistic regression) achieved AUC 0.84 vs proposed XGBoost AUC 0.89 — gap >5%, complex model preferred. Two Required Remediation items cleared (feature drift threshold, calibration).",
        "aiRecommendation": {"action": "Phase 4 complete — proceed to deployment", "confidence": 91,
                             "reasoning": "Independent validation cleared. Challenger model gap exceeds 5% threshold so complex model justified. Both remediation items closed.",
                             "reviewerAction": "acknowledge_phase_completion"}
    },
    {
        "id": "lp_005", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "deployment", "phaseIndex": 5,
        "approver": "Change Advisory Board + Board", "approverRole": "board",
        "enteredAt": DAYS_AGO(210), "exitedAt": DAYS_AGO(180),
        "artifacts": ["Decision Rights Matrix v1.0", "Pre-Mortem Document", "Deployment Runbook v1.0", "Staged Rollout Sign-off (5%→25%→100%)"],
        "exitCriteriaMet": True,
        "notes": "Canary phase (5%) held 72h — no anomalies. Ramp phase (25%) held 72h — override rate 7.8% within expected range. Full rollout approved by Board.",
        "aiRecommendation": {"action": "Phase 5 complete — in production monitoring", "confidence": 95,
                             "reasoning": "Staged rollout completed without incidents. Override rate within 5-15% expected envelope. Board sign-off recorded.",
                             "reviewerAction": "acknowledge_phase_completion"}
    },
    {
        "id": "lp_006", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "phase": "production_monitoring", "phaseIndex": 6,
        "approver": "Model Risk Committee (annual review)", "approverRole": "model_risk_committee",
        "enteredAt": DAYS_AGO(180), "exitedAt": None,
        "artifacts": ["Live monitoring dashboards (PSI, prediction drift, AUC, DIR)", "Drift Breach Runbook v1.0"],
        "exitCriteriaMet": False,
        "notes": "Currently in Phase 6. Next annual re-validation due in 122 days. Last weekly review: PSI 0.08 (within tolerance), AUC 0.88 (within tolerance), DIR 0.87 (within tolerance).",
        "aiRecommendation": {"action": "Schedule annual re-validation + quarterly bias refresh", "confidence": 88,
                             "reasoning": "Critical-tier model in Phase 6 monitoring. All drift metrics within tolerance. Annual re-validation window opens in 122 days; bias test refresh due in 76 days.",
                             "reviewerAction": "approve_revalidation_schedule"}
    },
    # Second model — AML TM (showing a model that is in Phase 4 with Required Remediation)
    {
        "id": "lp_007", "modelId": "MODEL-AML-TM-002", "modelName": "Real-time AML Transaction Monitoring (auto-block)",
        "tier": "critical", "phase": "pre_deployment_validation", "phaseIndex": 4,
        "approver": "Head of Model Validation", "approverRole": "senior_compliance",
        "enteredAt": DAYS_AGO(45), "exitedAt": None,
        "artifacts": ["Validation Report v0.9 (draft)", "Challenger Model Comparison (rule-based baseline)", "Stress Test Results — 8 of 12 scenarios complete"],
        "exitCriteriaMet": False,
        "notes": "Validation in progress. 2 Required Remediation items open: (1) counterfactual generation failing actionability constraint on transaction_amount feature, (2) Layer 2 LIME triangulation inconsistent with SHAP top-3 for 12% of sampled decisions.",
        "aiRecommendation": {"action": "Hold for remediation — 2 Required Remediation items open", "confidence": 78,
                             "reasoning": "Phase 4 validation cannot complete until counterfactual actionability bug fixed and LIME/SHAP triangulation rate >95%. Estimated 14 days to clear.",
                             "reviewerAction": "approve_remediation_hold"}
    },
    # Third model — Marketing segmentation (Medium tier, Phase 5 deployment)
    {
        "id": "lp_008", "modelId": "MODEL-MKTG-SEG-007", "modelName": "Customer Marketing Segmentation",
        "tier": "medium", "phase": "deployment", "phaseIndex": 5,
        "approver": "Change Advisory Board", "approverRole": "cRO",
        "enteredAt": DAYS_AGO(15), "exitedAt": None,
        "artifacts": ["Decision Rights Matrix v1.0", "Pre-Mortem Document", "Deployment Runbook v1.0"],
        "exitCriteriaMet": False,
        "notes": "Canary phase (5%) in progress. Override rate 2.1% (low, expected for Medium-tier). Awaiting 72-hour hold completion before ramp to 25%.",
        "aiRecommendation": {"action": "Approve ramp to 25% traffic", "confidence": 89,
                             "reasoning": "Canary phase 5% has run for 48 hours with no anomalies. Override rate 2.1% within Medium-tier expected range (1-5%). Approve ramp to 25%.",
                             "reviewerAction": "approve_ramp_25pct"}
    },
]

explainability_layers = [
    {
        "id": "xl_001", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "layer": "global", "layerIndex": 1,
        "methods": ["shap_summary", "feature_importance", "permutation_importance", "partial_dependence", "ice"],
        "lastComputedAt": DAYS_AGO(14),
        "nextRefreshAt": DAYS_FROM_NOW(76),
        "audience": "Model Risk Committee, internal audit, external regulators",
        "topFeatures": [
            {"feature": "credit_utilisation_ratio", "meanAbsShap": 0.234, "rank": 1},
            {"feature": "debt_to_income_ratio", "meanAbsShap": 0.187, "rank": 2},
            {"feature": "credit_history_length_months", "meanAbsShap": 0.142, "rank": 3},
            {"feature": "recent_inquiries_6m", "meanAbsShap": 0.098, "rank": 4},
            {"feature": "annual_income", "meanAbsShap": 0.076, "rank": 5}
        ],
        "consistencyCheck": "PASS — SHAP rank order matches permutation importance rank order for top 5 features",
        "aiRecommendation": {"action": "Continue quarterly refresh cadence", "confidence": 95,
                             "reasoning": "Layer 1 global explanations last computed 14 days ago. Top features stable year-over-year. Next refresh in 76 days (quarterly cadence).",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "xl_002", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "layer": "local", "layerIndex": 2,
        "methods": ["shap_waterfall", "counterfactual", "lime"],
        "lastComputedAt": HOURS_AGO(2),
        "nextRefreshAt": None,
        "audience": "Model risk team, compliance officer reviewing decision, customer-facing colleague",
        "onDemandComputed30d": 1247,
        "counterfactualCount": 3,
        "triangulationPassRate": 0.973,
        "triangulationThreshold": 0.95,
        "consistencyCheck": "PASS — LIME-extracted features are subset of SHAP top-5 for 97.3% of sampled decisions (threshold 95%)",
        "aiRecommendation": {"action": "Continue on-demand local explanation generation", "confidence": 96,
                             "reasoning": "Layer 2 local explanations generated for 1,247 adverse decisions in last 30 days. Triangulation pass rate 97.3% exceeds 95% threshold. All counterfactuals meet actionability constraints.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "xl_003", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "layer": "decision_context", "layerIndex": 3,
        "methods": ["reason_codes", "plain_language_summary", "anchor", "recourse_path"],
        "lastComputedAt": HOURS_AGO(2),
        "nextRefreshAt": None,
        "audience": "Affected customer, customer-facing colleague, customer advocacy team",
        "reasonCodeCount": 3,
        "plainLanguageRequired": True,
        "reasonCodeDictionaryVersion": "v2.3 (2026-04-15)",
        "recentReasonCodes": [
            {"code": "RC-CU-HIGH", "shapFeature": "credit_utilisation_ratio", "plainLanguage": "Your current credit accounts are close to their maximum limits"},
            {"code": "RC-DTI-HIGH", "shapFeature": "debt_to_income_ratio", "plainLanguage": "Your debt payments are high relative to your income"},
            {"code": "RC-HIST-SHORT", "shapFeature": "credit_history_length_months", "plainLanguage": "Your credit history is relatively short"}
        ],
        "consistencyCheck": "PASS — Layer 3 reason codes match Layer 1 SHAP top-3 for 98.1% of decisions (threshold 95%)",
        "aiRecommendation": {"action": "Continue delivering decision-context explanations", "confidence": 94,
                             "reasoning": "Layer 3 decision-context explanations delivered for all 1,247 adverse decisions in last 30 days. Reason Code Dictionary v2.3 in use. Recourse path included in 100% of communications.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    # Second model — AML TM (in remediation, Layer 2 failing)
    {
        "id": "xl_004", "modelId": "MODEL-AML-TM-002", "modelName": "Real-time AML Transaction Monitoring (auto-block)",
        "tier": "critical", "layer": "local", "layerIndex": 2,
        "methods": ["shap_waterfall", "counterfactual", "lime"],
        "lastComputedAt": HOURS_AGO(6),
        "nextRefreshAt": None,
        "audience": "Model risk team, compliance officer, MLRO",
        "onDemandComputed30d": 0,
        "counterfactualCount": 3,
        "triangulationPassRate": 0.882,
        "triangulationThreshold": 0.95,
        "consistencyCheck": "FAIL — LIME/SHAP triangulation pass rate 88.2% below 95% threshold. Counterfactual actionability constraint failing on transaction_amount feature.",
        "aiRecommendation": {"action": "REMEDIATION REQUIRED — fix counterfactual actionability + improve LIME/SHAP triangulation", "confidence": 82,
                             "reasoning": "Layer 2 failing on two counts: (1) DiCE counterfactual generator producing non-actionable counterfactuals (transaction_amount cannot be reduced below minimum threshold), (2) LIME/SHAP triangulation 88.2% below 95% threshold. Model in Phase 4 validation hold.",
                             "reviewerAction": "approve_remediation_hold"}
    },
    # Third model — Marketing segmentation (Medium tier — only Layers 1+3 required)
    {
        "id": "xl_005", "modelId": "MODEL-MKTG-SEG-007", "modelName": "Customer Marketing Segmentation",
        "tier": "medium", "layer": "global", "layerIndex": 1,
        "methods": ["feature_importance", "permutation_importance"],
        "lastComputedAt": DAYS_AGO(20),
        "nextRefreshAt": DAYS_FROM_NOW(70),
        "audience": "Marketing analytics team, Senior Compliance Officer",
        "topFeatures": [
            {"feature": "transaction_count_30d", "importance": 0.31, "rank": 1},
            {"feature": "avg_basket_value", "importance": 0.24, "rank": 2},
            {"feature": "channel_engagement_score", "importance": 0.18, "rank": 3}
        ],
        "consistencyCheck": "PASS — feature importance rank matches permutation importance rank for top 3 features",
        "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 92,
                             "reasoning": "Medium-tier model requires only Layer 1 (global). Feature importance sufficient (SHAP not required). Last computed 20 days ago, next refresh in 70 days.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "xl_006", "modelId": "MODEL-MKTG-SEG-007", "modelName": "Customer Marketing Segmentation",
        "tier": "medium", "layer": "decision_context", "layerIndex": 3,
        "methods": ["reason_codes", "plain_language_summary"],
        "lastComputedAt": HOURS_AGO(12),
        "nextRefreshAt": None,
        "audience": "Marketing team, customer (on request under GDPR Art.22)",
        "reasonCodeCount": 2,
        "plainLanguageRequired": True,
        "reasonCodeDictionaryVersion": "v1.4 (2026-03-10)",
        "recentReasonCodes": [
            {"code": "RC-SEG-OFFER", "feature": "transaction_count_30d", "plainLanguage": "You received this offer based on your recent purchase frequency"},
            {"code": "RC-SEG-CHANNEL", "feature": "channel_engagement_score", "plainLanguage": "You received this offer on this channel based on your engagement preferences"}
        ],
        "consistencyCheck": "PASS — Layer 3 reason codes drawn from Layer 1 top-3 features",
        "aiRecommendation": {"action": "Continue on-demand decision-context explanations", "confidence": 90,
                             "reasoning": "Medium-tier model must produce Layer 3 explanations on customer request. 12 requests in last 30 days. Reason Code Dictionary v1.4 in use.",
                             "reviewerAction": "acknowledge_healthy"}
    },
]

fairness_metrics = [
    {
        "id": "fm_001", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "metric": "demographic_parity", "metricIndex": 1,
        "formula": "|P(Y_hat=1 | A=a) - P(Y_hat=1 | A=b)| < delta",
        "threshold": "delta = 0.05 (Critical-tier)",
        "applicableTier": ["critical", "high"],
        "protectedClass": "sex (male vs female)",
        "currentValue": 0.031,
        "thresholdValue": 0.05,
        "status": "pass",
        "interventionTrigger": "none",
        "lastComputedAt": DAYS_AGO(14),
        "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 95,
                             "reasoning": "Demographic parity delta 0.031 (sex) below 0.05 threshold. Approve rate male 28.4% vs female 25.3%. No intervention required.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "fm_002", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "metric": "equalized_odds", "metricIndex": 2,
        "formula": "|TPR_a - TPR_b| < delta_TPR AND |FPR_a - FPR_b| < delta_FPR",
        "threshold": "delta_TPR = 0.05, delta_FPR = 0.05 (Critical-tier)",
        "applicableTier": ["critical", "high"],
        "protectedClass": "race (white vs Black)",
        "currentTprDelta": 0.042, "currentFprDelta": 0.038,
        "thresholdValue": 0.05,
        "status": "pass",
        "interventionTrigger": "none",
        "lastComputedAt": DAYS_AGO(14),
        "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 93,
                             "reasoning": "Equalized odds: TPR delta 0.042, FPR delta 0.038. Both below 0.05 threshold. Recommended primary metric for credit decisioning (per framework).",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "fm_003", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "metric": "predictive_parity", "metricIndex": 3,
        "formula": "|P(Y=1 | Y_hat=1, A=a) - P(Y=1 | Y_hat=1, A=b)| < delta",
        "threshold": "delta = 0.05 (Critical-tier)",
        "applicableTier": ["critical", "high"],
        "protectedClass": "age (under 40 vs 40+)",
        "currentValue": 0.062,
        "thresholdValue": 0.05,
        "status": "warn",
        "interventionTrigger": "investigate",
        "lastComputedAt": DAYS_AGO(14),
        "aiRecommendation": {"action": "INVESTIGATE — predictive parity delta 0.062 above 0.05 threshold for age class", "confidence": 84,
                             "reasoning": "PPV gap of 6.2pp between under-40 and 40+ applicants exceeds threshold. Root cause analysis due within 30 days. Note: Chouldechova impossibility — equalized odds passing while predictive parity failing indicates base rate difference across age groups.",
                             "reviewerAction": "approve_investigation"}
    },
    {
        "id": "fm_004", "modelId": "MODEL-CREDIT-RETAIL-001", "modelName": "Retail Mortgage Credit Decisioning",
        "tier": "critical", "metric": "individual_fairness", "metricIndex": 4,
        "formula": "Consistency Score = 1 - mean(|f(x_i) - f(x_j)| for k nearest neighbours)",
        "threshold": "Consistency >= 0.90 (Critical-tier)",
        "applicableTier": ["critical"],
        "protectedClass": "all (distance function excludes protected attributes)",
        "currentValue": 0.923,
        "thresholdValue": 0.90,
        "status": "pass",
        "interventionTrigger": "none",
        "lastComputedAt": DAYS_AGO(14),
        "aiRecommendation": {"action": "Continue routine monitoring", "confidence": 91,
                             "reasoning": "Individual fairness Consistency Score 0.923 above 0.90 threshold. k=10 nearest neighbours using weighted Euclidean distance on income, DTI, credit history length, credit utilisation.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    # AML TM model — DIR failing on nationality (under remediation)
    {
        "id": "fm_005", "modelId": "MODEL-AML-TM-002", "modelName": "Real-time AML Transaction Monitoring (auto-block)",
        "tier": "critical", "metric": "equalized_odds", "metricIndex": 2,
        "formula": "|TPR_a - TPR_b| < delta_TPR AND |FPR_a - FPR_b| < delta_FPR",
        "threshold": "delta_TPR = 0.05, delta_FPR = 0.05 (Critical-tier)",
        "applicableTier": ["critical", "high"],
        "protectedClass": "national_origin (domestic vs cross-border)",
        "currentTprDelta": 0.084, "currentFprDelta": 0.156,
        "thresholdValue": 0.05,
        "status": "fail",
        "interventionTrigger": "mandatory_remediation",
        "lastComputedAt": DAYS_AGO(7),
        "aiRecommendation": {"action": "MANDATORY REMEDIATION — FPR delta 0.156 exceeds 2x threshold (0.10) for national_origin", "confidence": 86,
                             "reasoning": "FPR for cross-border transactions 15.6pp higher than domestic — indicates model over-flagging cross-border activity. Quarantine threshold (3x = 0.15) breached. Remediation due within 90 days. Interim mitigation: raise cross-border FPR threshold by 8% within 7 days.",
                             "reviewerAction": "approve_mandatory_remediation"}
    },
]

ai_governance_data = {
    "lifecyclePhases": lifecycle_phases,
    "explainabilityLayers": explainability_layers,
    "fairnessMetrics": fairness_metrics,
    "summary": {
        "totalLifecycleRecords": len(lifecycle_phases),
        "totalExplainabilityRecords": len(explainability_layers),
        "totalFairnessRecords": len(fairness_metrics),
        "criticalModelsTracked": 3,
        "modelsInPhase4Validation": 1,
        "modelsWithFailingFairness": 1,
        "modelsWithExplainabilityIssues": 1,
        "phaseLabels": ["problem_definition", "data_acquisition", "model_development", "pre_deployment_validation", "deployment", "production_monitoring"],
        "layerLabels": ["global", "local", "decision_context"],
        "metricLabels": ["demographic_parity", "equalized_odds", "predictive_parity", "individual_fairness"]
    }
}


# ──────────────────────────────────────────────────────────────────────
# 2. crypto-regulation.json — Digital Assets & Crypto Regulations
# Combines: MiCA CASP applications + Travel Rule messages + DeFi compliance pillars
# ──────────────────────────────────────────────────────────────────────

mica_casps = [
    {
        "id": "casp_001", "applicantName": "EuroVault Custody GmbH", "applicantLei": "529900EUROVAULT001",
        "registeredOffice": "Frankfurt am Main, Germany", "homeNca": "BaFin",
        "serviceClasses": ["custody_administration"],
        "capitalRequirementEur": 125000,
        "capitalBufferEur": 875000,
        "clientCryptoUnderCustodyEur": 3500000000,
        "whitePaperPublished": False,
        "conflictOfInterestDisclosed": True,
        "parentUndertaking": "EuroVault Holding AG",
        "intendedPassportingStates": ["FR", "NL", "IE", "ES", "IT"],
        "submissionDate": DAYS_AGO(120),
        "acknowledgementDate": DAYS_AGO(115),
        "decisionDate": DAYS_AGO(60),
        "status": "authorized",
        "authorizationNumber": "BaFin-MiCA-CASP-2026-001",
        "esmaRegisterListed": True,
        "aiRecommendation": {"action": "Continue routine supervision", "confidence": 95,
                             "reasoning": "CASP authorized 60 days ago. Custody-only service class. Capital buffer 7x minimum (EUR 875k buffer on top of EUR 125k floor). Passporting notifications filed in 5 member states.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "casp_002", "applicantName": "Iberia Crypto Exchange S.L.", "applicantLei": "529900IBERIACRYPTO01",
        "registeredOffice": "Madrid, Spain", "homeNca": "CNMV",
        "serviceClasses": ["exchange_platform", "exchange_fiat_crypto", "exchange_crypto_crypto"],
        "capitalRequirementEur": 125000,
        "capitalBufferEur": 280000,
        "whitePaperPublished": False,
        "conflictOfInterestDisclosed": True,
        "intendedPassportingStates": ["PT", "FR", "DE"],
        "submissionDate": DAYS_AGO(95),
        "acknowledgementDate": DAYS_AGO(90),
        "decisionDate": None,
        "status": "in_review",
        "authorizationNumber": None,
        "esmaRegisterListed": False,
        "aiRecommendation": {"action": "Await NCA decision — 25 working days remaining", "confidence": 78,
                             "reasoning": "Application submitted 95 days ago. Acknowledgement complete. NCA has 60 working days from acknowledgement to decide — 25 working days remaining. Capital buffer 2.2x minimum.",
                             "reviewerAction": "acknowledge_pending"}
    },
    {
        "id": "casp_003", "applicantName": "Benelux Digital Assets B.V.", "applicantLei": "529900BENELUXDIG002",
        "registeredOffice": "Amsterdam, Netherlands", "homeNca": "AFM",
        "serviceClasses": ["custody_administration", "exchange_platform", "exchange_fiat_crypto", "exchange_crypto_crypto", "placement_of_crypto_assets"],
        "capitalRequirementEur": 150000,
        "capitalBufferEur": 1850000,
        "whitePaperPublished": True,
        "conflictOfInterestDisclosed": True,
        "parentUndertaking": "Benelux Financial Group N.V.",
        "intendedPassportingStates": ["BE", "LU", "DE", "FR"],
        "submissionDate": DAYS_AGO(45),
        "acknowledgementDate": DAYS_AGO(40),
        "decisionDate": None,
        "status": "in_review",
        "authorizationNumber": None,
        "esmaRegisterListed": False,
        "aiRecommendation": {"action": "Await NCA decision — 50 working days remaining", "confidence": 81,
                             "reasoning": "Full-service CASP (all 5 service classes). Highest capital tier (EUR 150k minimum + EUR 1.85M buffer). White paper published for placement service. ESMA may issue no-objection opinion due to cross-border scope.",
                             "reviewerAction": "acknowledge_pending"}
    },
    {
        "id": "casp_004", "applicantName": "Prague Crypto Solutions s.r.o.", "applicantLei": "529900PRAGUECRYPT003",
        "registeredOffice": "Prague, Czech Republic", "homeNca": "CNB",
        "serviceClasses": ["exchange_fiat_crypto"],
        "capitalRequirementEur": 125000,
        "capitalBufferEur": 0,
        "whitePaperPublished": False,
        "conflictOfInterestDisclosed": False,
        "submissionDate": DAYS_AGO(30),
        "acknowledgementDate": None,
        "decisionDate": None,
        "status": "deficient",
        "authorizationNumber": None,
        "esmaRegisterListed": False,
        "aiRecommendation": {"action": "REMEDIATION REQUIRED — application deficient on 3 items", "confidence": 76,
                             "reasoning": "NCA returned application with 3 deficiencies: (1) conflict-of-interest disclosure missing, (2) capital buffer below prudential minimum (no buffer above EUR 125k floor), (3) IT systems description incomplete. Applicant has 30 working days to remedy.",
                             "reviewerAction": "approve_remediation_request"}
    },
]

travel_rule_messages = [
    {
        "id": "tr_001", "messageId": "ov-msg-9f3a-001", "messageType": "transfer_request",
        "originatorVaspName": "EuroVault Custody GmbH", "originatorVaspLei": "529900EUROVAULT001",
        "originatorWalletAddress": "0x7a3b...4f2c", "originatorName": "Alice Schmidt",
        "originatorPhysicalAddress": "Hauptstrasse 12, Berlin, DE", "originatorNationalId": "DE-PASS-AB1234567",
        "originatorDateOfBirth": "1985-04-12",
        "beneficiaryVaspName": "Iberia Crypto Exchange S.L.", "beneficiaryVaspLei": "529900IBERIACRYPTO01",
        "beneficiaryWalletAddress": "0x9d1e...8b7a", "beneficiaryName": "Carlos Ruiz",
        "transactionAmount": 42500.00, "transactionCurrency": "EUR",
        "transactionHash": "0xab12cd34ef56...7890", "transactionChain": "ethereum",
        "openvaspaPayloadVersion": "1.0.0",
        "timestamp": HOURS_AGO(2),
        "preCheckStatus": "passed", "sanctionsScreeningStatus": "clear",
        "beneficiaryConfirmationStatus": "pending",
        "sunrisePeriodApplicable": False,
        "aiRecommendation": {"action": "Auto-approve transfer — all checks passed", "confidence": 96,
                             "reasoning": "Pre-check passed: beneficiary name matches wallet holder at Iberia Crypto Exchange. Sanctions screening clear for both originator and beneficiary. Amount EUR 42,500 above EUR 1,000 threshold, full Travel Rule applies. Awaiting beneficiary VASP confirmation.",
                             "reviewerAction": "approve_transfer"}
    },
    {
        "id": "tr_002", "messageId": "ov-msg-9f3a-002", "messageType": "transfer_pre_check",
        "originatorVaspName": "EuroVault Custody GmbH", "originatorVaspLei": "529900EUROVAULT001",
        "originatorWalletAddress": "0x4f8c...1a3b", "originatorName": "Bob Mueller",
        "beneficiaryVaspName": "Singapore Digital Pte Ltd", "beneficiaryVaspLei": "529900SINGAPOREDIG001",
        "beneficiaryWalletAddress": "0x2e5f...9c4d", "beneficiaryName": "Wei Tan",
        "transactionAmount": 8750.00, "transactionCurrency": "USD",
        "openvaspaPayloadVersion": "1.0.0",
        "timestamp": HOURS_AGO(1),
        "preCheckStatus": "passed", "sanctionsScreeningStatus": "clear",
        "beneficiaryConfirmationStatus": "n/a",
        "sunrisePeriodApplicable": True,
        "sunrisePeriodStrategy": "accept_with_edd",
        "aiRecommendation": {"action": "Approve transfer with EDD — sunrise period strategy applied", "confidence": 84,
                             "reasoning": "Beneficiary VASP in Singapore (MAS PSN02 jurisdiction — Travel Rule implemented Jan 2022). Sunrise period NOT applicable (Singapore is Travel Rule compliant). Pre-check passed, sanctions clear. Approve transfer.",
                             "reviewerAction": "approve_transfer_with_edd"}
    },
    {
        "id": "tr_003", "messageId": "ov-msg-9f3a-003", "messageType": "transfer_request",
        "originatorVaspName": "EuroVault Custody GmbH", "originatorVaspLei": "529900EUROVAULT001",
        "originatorWalletAddress": "0x1a2b...3c4d", "originatorName": "Charlie Dubois",
        "beneficiaryVaspName": "Unknown VASP", "beneficiaryVaspLei": None,
        "beneficiaryWalletAddress": "0x5e6f...7g8h", "beneficiaryName": "Unknown",
        "transactionAmount": 125000.00, "transactionCurrency": "USDT",
        "openvaspaPayloadVersion": "1.0.0",
        "timestamp": HOURS_AGO(0.5),
        "preCheckStatus": "failed", "sanctionsScreeningStatus": "hit",
        "sanctionsHitDetail": "Beneficiary wallet 0x5e6f...7g8h matches OFAC SDN entry (Tornado Cash associated address)",
        "beneficiaryConfirmationStatus": "blocked",
        "sunrisePeriodApplicable": False,
        "aiRecommendation": {"action": "BLOCK TRANSFER + FILE SAR — OFAC sanctions hit", "confidence": 99,
                             "reasoning": "Beneficiary wallet matched OFAC SDN list (Tornado Cash associated address). Transfer of USD 125,000 in USDT blocked. SAR filing required within 30 days. Funds held pending OFAC license application.",
                             "reviewerAction": "approve_block_and_sar"}
    },
    {
        "id": "tr_004", "messageId": "ov-msg-9f3a-004", "messageType": "transfer_cancellation",
        "originatorVaspName": "Iberia Crypto Exchange S.L.", "originatorVaspLei": "529900IBERIACRYPTO01",
        "originatorWalletAddress": "0x9d1e...8b7a", "originatorName": "Carlos Ruiz",
        "beneficiaryVaspName": "EuroVault Custody GmbH", "beneficiaryVaspLei": "529900EUROVAULT001",
        "beneficiaryWalletAddress": "0x7a3b...4f2c", "beneficiaryName": "Alice Schmidt",
        "transactionAmount": 42500.00, "transactionCurrency": "EUR",
        "transactionHash": "0xab12cd34ef56...7890", "transactionChain": "ethereum",
        "openvaspaPayloadVersion": "1.0.0",
        "timestamp": HOURS_AGO(0.2),
        "cancellationReason": "beneficiary_rejected",
        "cancellationDetail": "Beneficiary VASP reported name mismatch on confirmation — wallet holder name 'A. Schmidt' did not exactly match 'Alice Schmidt'",
        "aiRecommendation": {"action": "Acknowledge cancellation — return funds to originator", "confidence": 92,
                             "reasoning": "Beneficiary VASP cancelled transfer due to name mismatch on confirmation. Funds to be returned to originator wallet within 24 hours. Originator should re-initiate with exact name match.",
                             "reviewerAction": "approve_return_funds"}
    },
]

defi_pillars = [
    {
        "id": "dp_001", "pillar": "front_end_regulation", "pillarIndex": 1,
        "responsibleParty": "front_end_operator",
        "protocolName": "Uniswap Labs Interface",
        "protocolType": "decentralized_exchange",
        "daoLegalPersonality": False,
        "riskSeverity": "high",
        "kycImplemented": True,
        "sanctionsScreeningImplemented": True,
        "travelRuleImplemented": True,
        "transactionMonitoringImplemented": True,
        "regulatoryReference": "FATF R.15 + 2024 DeFi Guidance paras 47-58; MiCA Recital 16; MAS PSN02",
        "aiRecommendation": {"action": "Continue front-end compliance regime", "confidence": 91,
                             "reasoning": "Front-end operator Uniswap Labs has implemented KYC, sanctions screening, Travel Rule, and transaction monitoring. Smart contracts remain decentralised (no admin key, no operator), but the front-end interface is treated as VASP per FATF 2024 Guidance.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "dp_002", "pillar": "treasury_sanctions", "pillarIndex": 2,
        "responsibleParty": "dao",
        "protocolName": "Compound Governance",
        "protocolType": "lending_protocol",
        "daoLegalPersonality": True,
        "daoLegalForm": "Cayman Islands Foundation Company",
        "treasuryValueUsd": 285000000,
        "treasuryAssetBreakdown": {"COMP": 45, "USDC": 32, "ETH": 18, "DAI": 5},
        "riskSeverity": "critical",
        "sanctionsScreeningTreasuryInflows": True,
        "sanctionsScreeningTreasuryOutflows": True,
        "daoSanctionsPolicyDocumented": True,
        "sanctionedListStatus": "not_sanctioned",
        "regulatoryReference": "OFAC EO 14117 + Tornado Cash designation precedent; FATF 2024 DeFi Guidance paras 71-83",
        "aiRecommendation": {"action": "Continue treasury sanctions monitoring", "confidence": 88,
                             "reasoning": "Compound DAO has Cayman Islands legal personality. Treasury of USD 285M screened on inflows and outflows. DAO sanctions policy documented and approved by governance. Not on OFAC SDN list. Governance token holders NOT individually liable (conservative interpretation voluntarily adopted).",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "dp_003", "pillar": "oracle_oversight", "pillarIndex": 3,
        "responsibleParty": "oracle_provider",
        "protocolName": "Aave V3",
        "protocolType": "lending_protocol",
        "oracleProvider": "Chainlink",
        "oracleBackupProvider": "Pyth Network",
        "circuitBreakerThresholdPct": 8,
        "twapWindowSeconds": 1800,
        "historicalAccuracyPct": 99.97,
        "slaInPlace": True,
        "slaUptimePct": 99.9,
        "slaAccuracyBps": 5,
        "userDisclosureProvided": True,
        "riskSeverity": "high",
        "regulatoryReference": "FATF 2024 DeFi Guidance paras 95-103; MAS PSN02 Annex on DeFi protocols",
        "lastOracleIncidentAt": DAYS_AGO(180),
        "lastOracleIncidentDetail": "Chainlink ETH/USD feed divergence of 4.2% from Pyth — circuit breaker triggered, market operations paused for 18 minutes until Chainlink feed recovered",
        "aiRecommendation": {"action": "Continue dual-oracle monitoring", "confidence": 89,
                             "reasoning": "Aave V3 uses Chainlink as primary with Pyth as fallback. Circuit breaker at 8% divergence. Last incident 180 days ago handled correctly (18-minute pause, no user losses). SLA with Chainlink specifies 99.9% uptime and 5bps accuracy. User disclosure in protocol docs.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "dp_004", "pillar": "treasury_sanctions", "pillarIndex": 2,
        "responsibleParty": "dao",
        "protocolName": "Tornado Cash DAO",
        "protocolType": "mixer",
        "daoLegalPersonality": False,
        "treasuryValueUsd": 0,
        "riskSeverity": "critical",
        "sanctionsScreeningTreasuryInflows": False,
        "sanctionsScreeningTreasuryOutflows": False,
        "daoSanctionsPolicyDocumented": False,
        "sanctionedListStatus": "sanctioned",
        "sanctionedAt": "2022-08-08T00:00:00Z",
        "sanctioningAuthority": "OFAC",
        "sanctionsProgram": "SDN List - North Korea / WMD Proliferation",
        "regulatoryReference": "OFAC EO 14117 + Tornado Cash designation (Aug 8, 2022); FATF 2024 DeFi Guidance paras 71-83",
        "aiRecommendation": {"action": "BLOCKED — sanctioned DAO, no transactions permitted", "confidence": 99,
                             "reasoning": "Tornado Cash DAO designated by OFAC on August 8, 2022. All US persons and US- touchpoint institutions prohibited from transacting with the DAO, its treasury, or its smart contracts. Civil penalty up to USD 356,000 per violation; criminal penalty up to USD 1,000,000 + 20 years imprisonment under IEEPA.",
                             "reviewerAction": "acknowledge_blocked"}
    },
]

crypto_regulation_data = {
    "micaCasps": mica_casps,
    "travelRuleMessages": travel_rule_messages,
    "defiPillars": defi_pillars,
    "summary": {
        "totalCaspApplications": len(mica_casps),
        "authorizedCasps": sum(1 for c in mica_casps if c["status"] == "authorized"),
        "caspsInReview": sum(1 for c in mica_casps if c["status"] == "in_review"),
        "caspsDeficient": sum(1 for c in mica_casps if c["status"] == "deficient"),
        "totalTravelRuleMessages": len(travel_rule_messages),
        "travelRuleBlocked": sum(1 for t in travel_rule_messages if t.get("sanctionsScreeningStatus") == "hit"),
        "travelRuleSunrisePeriod": sum(1 for t in travel_rule_messages if t.get("sunrisePeriodApplicable")),
        "totalDefiPillars": len(defi_pillars),
        "sanctionedDaos": sum(1 for d in defi_pillars if d.get("sanctionedListStatus") == "sanctioned"),
        "caspsWithWhitePaper": sum(1 for c in mica_casps if c["whitePaperPublished"]),
        "pillarLabels": ["front_end_regulation", "treasury_sanctions", "oracle_oversight"],
        "caspServiceClasses": ["custody_administration", "exchange_platform", "exchange_fiat_crypto", "exchange_crypto_crypto", "placement_of_crypto_assets"]
    }
}


# ──────────────────────────────────────────────────────────────────────
# 3. esg-reporting.json — ESG/Sustainability Reporting
# Combines: framework comparison + climate scenarios + social capital metrics
# ──────────────────────────────────────────────────────────────────────

esg_frameworks = [
    {
        "id": "ef_001", "framework": "issb_s1_s2", "frameworkName": "ISSB IFRS S1/S2",
        "jurisdiction": "Global (IFRS adopting jurisdictions)",
        "materialityBasis": "financial",
        "scope": "All entities required to apply IFRS Accounting Standards",
        "scope3Required": True,
        "scope3Deferral": "1 year",
        "assuranceLevel": "none (jurisdiction-dependent)",
        "effectiveDate": "Annual periods beginning on or after 1 Jan 2024",
        "digitalTaxonomy": "IFRS Sustainability Disclosure Taxonomy (XBRL) — draft Feb 2024, final Q4 2024",
        "scenarioAnalysisRequired": True,
        "scenarioApproach": "Range of scenarios including 1.5C-aligned",
        "regulator": "ISSB",
        "applicableToInstitution": True,
        "aiRecommendation": {"action": "Continue ISSB-aligned disclosure", "confidence": 94,
                             "reasoning": "ISSB S1/S2 effective for FY 2024. Scope 3 with 1-year deferral — first Scope 3 disclosure due FY 2025. Adopting XBRL taxonomy once finalised. Aligned with TCFD recommendations.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "ef_002", "framework": "esrs", "frameworkName": "ESRS (EU CSRD)",
        "jurisdiction": "EU (large companies + non-EU companies with EUR 150M+ EU turnover)",
        "materialityBasis": "double",
        "scope": "Large EU companies (250+ employees, EUR 50M turnover) + listed SMEs + non-EU companies (CSRD wave 3, 2028)",
        "scope3Required": True,
        "scope3Deferral": "none (from year 1)",
        "assuranceLevel": "limited (from 2028); reasonable (Commission decision, no earlier than 2028)",
        "effectiveDate": "FY 2024 (NFRD companies); FY 2025 (other large EU); FY 2026 (listed SMEs); FY 2028 (non-EU wave 3)",
        "digitalTaxonomy": "ESRS XBRL Taxonomy (EFRAG, Aug 2024) — mandatory from 2028",
        "scenarioAnalysisRequired": True,
        "scenarioApproach": "IEA scenarios including NZE, STEPS, AP",
        "regulator": "EC (European Commission)",
        "applicableToInstitution": True,
        "aiRecommendation": {"action": "ESRS is most demanding — use as long-form, extract ISSB+SEC via crosswalk", "confidence": 91,
                             "reasoning": "Double materiality basis captures most info. No Scope 3 deferral. Limited assurance from 2028. Recommend preparing ESRS-compliant report as primary, with ISSB and SEC disclosures extracted via mapping crosswalk.",
                             "reviewerAction": "approve_esrs_primary_strategy"}
    },
    {
        "id": "ef_003", "framework": "sec_climate", "frameworkName": "SEC Climate Rule",
        "jurisdiction": "US (SEC registrants — domestic + foreign private issuers)",
        "materialityBasis": "financial",
        "scope": "All SEC registrants (phased by filer status: LAF, AF, SRC, EGC)",
        "scope3Required": True,
        "scope3Deferral": "n/a — only required if entity has Scope 3 target (10% safe harbour for 3 years)",
        "assuranceLevel": "limited (LAF+AF Scope 1+2 from 2029-2031); reasonable (from 2033)",
        "effectiveDate": "FY 2024 (LAF — qualitative); FY 2025 (AF); FY 2026/2027 (SRC/EGC)",
        "digitalTaxonomy": "inline XBRL for Scope 1+2 (from FY 2026) — no climate-specific taxonomy yet",
        "scenarioAnalysisRequired": True,
        "scenarioApproach": "Single most-likely scenario (reasonable likelihood threshold)",
        "regulator": "SEC",
        "applicableToInstitution": True,
        "aiRecommendation": {"action": "Continue SEC Climate Rule compliance — extract from ESRS long-form", "confidence": 87,
                             "reasoning": "SEC Climate Rule in effect for LAF from FY 2024. Scope 1+2 with assurance from FY 2029. Scope 3 only if target set (we have not set Scope 3 target — not required). Single-scenario approach less demanding than ESRS/ISSB. Extract from ESRS report via crosswalk.",
                             "reviewerAction": "acknowledge_healthy"}
    },
]

climate_scenarios = [
    {
        "id": "cs_001", "scenario": "orderly_below_2C", "scenarioName": "Orderly — Below 2C",
        "temperatureOutcome2100": "1.7C above pre-industrial",
        "transitionRiskLevel": "medium",
        "physicalRiskLevel": "medium",
        "policyStringency": "high but predictable",
        "carbonPrice2030Usd": 130,
        "carbonPrice2050Usd": 250,
        "cumulativeGdpImpactPct": -4.0,
        "ngfsReleaseVersion": "V4.2 (November 2023)",
        "keyCharacteristics": "Early, gradual policy tightening; transition costs offset by avoided damages",
        "supervisoryUse": "Used as 'policy ambition' benchmark by ECB and Bank of England",
        "portfolioImpactUsd": -185000000,
        "aiRecommendation": {"action": "Continue using Orderly as ambition benchmark", "confidence": 92,
                             "reasoning": "Orderly scenario projects USD 185M portfolio impact (mostly transition risk in fossil fuel exposures). Used as ECB climate stress test ambition benchmark. Recommend continuing as primary 'transition ambition' scenario.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "cs_002", "scenario": "disorderly_delayed_transition", "scenarioName": "Disorderly — Delayed Transition",
        "temperatureOutcome2100": "1.8C above pre-industrial",
        "transitionRiskLevel": "high",
        "physicalRiskLevel": "medium",
        "policyStringency": "low initially, then extremely high",
        "carbonPrice2030Usd": 30,
        "carbonPrice2040Usd": 300,
        "carbonPrice2050Usd": 350,
        "cumulativeGdpImpactPct": -8.0,
        "ngfsReleaseVersion": "V4.2 (November 2023)",
        "keyCharacteristics": "Late policy tightening; abrupt carbon price spike; stranded assets",
        "supervisoryUse": "Adverse scenario for short-term stress testing (e.g. Bank of England CBES 2022)",
        "portfolioImpactUsd": -412000000,
        "aiRecommendation": {"action": "Use as adverse scenario for short-term stress testing", "confidence": 89,
                             "reasoning": "Disorderly scenario projects USD 412M portfolio impact, driven by stranded fossil fuel assets in oil & gas sector. Carbon price spike USD 30→300 between 2030-2040. Recommend as primary 'transition shock' adverse scenario.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "cs_003", "scenario": "hot_house_current_policies", "scenarioName": "Hot House World — Current Policies",
        "temperatureOutcome2100": "3.0C above pre-industrial (regional variation 4-5C)",
        "transitionRiskLevel": "low",
        "physicalRiskLevel": "extreme",
        "policyStringency": "low (current policies maintained)",
        "carbonPrice2030Usd": 30,
        "carbonPrice2050Usd": 30,
        "cumulativeGdpImpactPct": -10.0,
        "cumulativeGdpImpact2100Pct": -22.0,
        "ngfsReleaseVersion": "V4.2 (November 2023)",
        "keyCharacteristics": "No policy tightening; severe physical risk; sea level rise, extreme heat, crop failure",
        "supervisoryUse": "Physical risk resilience testing; real estate & agriculture exposure stress",
        "portfolioImpactUsd": -678000000,
        "aiRecommendation": {"action": "Use as physical risk adverse scenario — review real estate exposure", "confidence": 86,
                             "reasoning": "Hot House scenario projects USD 678M portfolio impact, dominated by physical risk in real estate (Miami, Houston coastal properties) and agricultural loans (California Central Valley). 3C warming with regional 4-5C variation. Recommend immediate review of physical risk exposure concentrations.",
                             "reviewerAction": "approve_physical_risk_review"}
    },
    {
        "id": "cs_004", "scenario": "net_zero_2050", "scenarioName": "Net Zero 2050",
        "temperatureOutcome2100": "1.5C above pre-industrial (Paris aspirational goal)",
        "transitionRiskLevel": "high (short-term)",
        "physicalRiskLevel": "medium (locked-in warming)",
        "policyStringency": "extremely high",
        "carbonPrice2030Usd": 130,
        "carbonPrice2050Usd": 700,
        "cumulativeGdpImpactPct": -2.0,
        "ngfsReleaseVersion": "V4.2 (November 2023)",
        "keyCharacteristics": "Rapid coordinated transition; 45% emissions cut by 2030 vs 2010; net zero by 2050",
        "supervisoryUse": "Ambition benchmark for ISSB S2 1.5C-aligned scenario requirement",
        "portfolioImpactUsd": -98000000,
        "aiRecommendation": {"action": "Continue using Net Zero as ISSB S2 1.5C-aligned scenario", "confidence": 93,
                             "reasoning": "Net Zero 2050 projects USD 98M portfolio impact (lowest of any scenario). Satisfies ISSB S2 requirement for at least one 1.5C-aligned scenario. Carbon price reaches USD 700/tonne by 2050. Recommend as primary 'Paris-aligned ambition' scenario.",
                             "reviewerAction": "acknowledge_healthy"}
    },
]

social_metrics = [
    {
        "id": "sm_001", "category": "algorithmic_fairness", "categoryIndex": 1,
        "metricName": "Critical-tier models with bias testing completed",
        "frameworkRefs": ["ESRS S1 para 60", "ISSB S1 (recommended)", "FCA Consumer Duty"],
        "quantitativeThreshold": "100% of Critical-tier models tested annually",
        "currentValue": 4, "targetValue": 4,
        "disclosureRequired": True,
        "dataSource": "Model Inventory",
        "aiRecommendation": {"action": "Continue annual bias testing cadence", "confidence": 95,
                             "reasoning": "All 4 Critical-tier models completed bias testing in reporting period. DIR results: 0.87, 0.91, 0.84, 0.78. One model (MODEL-INS-UNDER-004) below 0.80 EEOC threshold — under mandatory remediation.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_002", "category": "algorithmic_fairness", "categoryIndex": 1,
        "metricName": "Models failing DIR threshold (EEOC 4/5ths rule, 0.80)",
        "frameworkRefs": ["ESRS S1 para 60", "EEOC 4/5ths Rule"],
        "quantitativeThreshold": "0 (zero models failing)",
        "currentValue": 1, "targetValue": 0,
        "disclosureRequired": True,
        "dataSource": "Fairness Testing Register",
        "aiRecommendation": {"action": "REMEDIATION — 1 model failing DIR threshold", "confidence": 78,
                             "reasoning": "MODEL-INS-UNDER-004 (Insurance Underwriting) DIR 0.78 — below 0.80 threshold. Mandatory remediation due within 90 days. Interim mitigation: manual review of all underwriting decisions for protected class applicants.",
                             "reviewerAction": "approve_remediation"}
    },
    {
        "id": "sm_003", "category": "customer_outcome_fairness", "categoryIndex": 2,
        "metricName": "Products subject to Consumer Duty outcome monitoring",
        "frameworkRefs": ["ESRS S1 para 50-55", "FCA Consumer Duty (in force 31 Jul 2023)"],
        "quantitativeThreshold": "100% of retail products",
        "currentValue": 47, "targetValue": 47,
        "disclosureRequired": True,
        "dataSource": "Consumer Duty Monitoring Register",
        "aiRecommendation": {"action": "Continue Consumer Duty monitoring across 47 products", "confidence": 93,
                             "reasoning": "All 47 retail products subject to FCA Consumer Duty Outcome monitoring. Fair value assessments completed for all 47 in reporting period. 3 product modifications made following outcome monitoring.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_004", "category": "customer_outcome_fairness", "categoryIndex": 2,
        "metricName": "Vulnerable customers identified (per FCA FG21/1)",
        "frameworkRefs": ["ESRS S1 para 55", "FCA FG21/1"],
        "quantitativeThreshold": "Disclosure of % of customer base",
        "currentValue": 184723, "totalCustomerBase": 2840000,
        "currentPct": 6.5,
        "disclosureRequired": True,
        "dataSource": "Consumer Duty Monitoring Register",
        "aiRecommendation": {"action": "Continue vulnerable customer identification + enhanced support", "confidence": 91,
                             "reasoning": "184,723 vulnerable customers identified (6.5% of customer base). Within FCA expected range (5-8%). Enhanced support arrangements in place: dedicated phone line, extended processing times, simplified communications.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_005", "category": "workforce_diversity", "categoryIndex": 3,
        "metricName": "Gender split — Board / ExCo / Senior Mgmt / Overall",
        "frameworkRefs": ["ESRS S1 para 19-25", "UK Gender Pay Gap Regulations 2017"],
        "quantitativeThreshold": "Disclosure of % at each seniority band",
        "currentValue": {"board": 44, "exec_committee": 38, "senior_management": 35, "middle_management": 42, "junior": 48, "overall": 45},
        "disclosureRequired": True,
        "dataSource": "HR Information System",
        "aiRecommendation": {"action": "Continue trajectory toward gender parity at ExCo level", "confidence": 88,
                             "reasoning": "Board at 44% female (above 40% target). ExCo at 38% (below 40% target). Overall workforce 45% female. Gender pay gap 7.2% (median), down from 8.4% prior year.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_006", "category": "workforce_diversity", "categoryIndex": 3,
        "metricName": "Ethnic minority representation (UK + US workforce)",
        "frameworkRefs": ["ESRS S1 para 19-25", "Parker Review (UK FTSE 350)"],
        "quantitativeThreshold": "Disclosure of % at each seniority band",
        "currentValue": {"board": 22, "exec_committee": 17, "senior_management": 19, "middle_management": 28, "junior": 34, "overall": 29},
        "disclosureRequired": True,
        "dataSource": "HR Information System",
        "aiRecommendation": {"action": "Continue trajectory toward ExCo ethnic minority representation target", "confidence": 84,
                             "reasoning": "Board at 22% ethnic minority (above Parker Review 20% target for FTSE 350). ExCo at 17% (below 20% target). Pay equity audit completed; 12 pay adjustments made.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_007", "category": "community_investment", "categoryIndex": 4,
        "metricName": "Total community investment spend",
        "frameworkRefs": ["ESRS S1 para 70-75"],
        "quantitativeThreshold": "Disclosure of total spend + breakdown",
        "currentValue": 18500000,
        "currentBreakdown": {"philanthropy": 4500000, "financial_inclusion": 7200000, "infrastructure": 3800000, "education": 2000000, "environment": 1000000},
        "disclosureRequired": True,
        "dataSource": "Community Investment Register",
        "aiRecommendation": {"action": "Continue community investment at current trajectory", "confidence": 90,
                             "reasoning": "USD 18.5M total community investment in reporting period. Financial inclusion is largest category (USD 7.2M) — supports 14 basic bank account products and 8 microfinance partnerships. 1,247 bank branches in low-income/underserved areas.",
                             "reviewerAction": "acknowledge_healthy"}
    },
    {
        "id": "sm_008", "category": "community_investment", "categoryIndex": 4,
        "metricName": "Bank branches in low-income / underserved areas",
        "frameworkRefs": ["ESRS S1 para 70-75", "US Community Reinvestment Act"],
        "quantitativeThreshold": "Disclosure of count + year-on-year change",
        "currentValue": 1247, "priorYearValue": 1258,
        "yearOnYearChange": -11,
        "disclosureRequired": True,
        "dataSource": "Community Investment Register",
        "aiRecommendation": {"action": "INVESTIGATE — branch closures in underserved areas exceeding replacement rate", "confidence": 76,
                             "reasoning": "11 net branch closures in low-income/underserved areas year-on-year. Replacement rate via digital banking services at 78% (below 90% target). 'Banking desert' risk identified in 3 rural census tracts. Recommend review of branch closure methodology.",
                             "reviewerAction": "approve_branch_review"}
    },
]

esg_reporting_data = {
    "frameworks": esg_frameworks,
    "climateScenarios": climate_scenarios,
    "socialMetrics": social_metrics,
    "summary": {
        "totalFrameworks": len(esg_frameworks),
        "totalScenarios": len(climate_scenarios),
        "totalSocialMetrics": len(social_metrics),
        "frameworksApplicable": sum(1 for f in esg_frameworks if f["applicableToInstitution"]),
        "scenariosWithPhysicalRisk": sum(1 for s in climate_scenarios if s["physicalRiskLevel"] in ["high", "extreme"]),
        "socialMetricsRequiringRemediation": sum(1 for s in social_metrics if "REMEDIATION" in s["aiRecommendation"]["action"] or "INVESTIGATE" in s["aiRecommendation"]["action"]),
        "frameworkLabels": ["issb_s1_s2", "esrs", "sec_climate"],
        "scenarioLabels": ["orderly_below_2C", "disorderly_delayed_transition", "hot_house_current_policies", "net_zero_2050"],
        "socialCategoryLabels": ["algorithmic_fairness", "customer_outcome_fairness", "workforce_diversity", "community_investment"]
    }
}


# ──────────────────────────────────────────────────────────────────────
# Write all 3 files
# ──────────────────────────────────────────────────────────────────────

def write_json(filename: str, data: dict):
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_kb = os.path.getsize(path) / 1024
    print(f"  {filename:<32} | {size_kb:>6.1f} KB")
    return path


print('Task 15 — Writing 3 data JSON files')
print('=====================================\n')
write_json('ai-governance.json', ai_governance_data)
write_json('crypto-regulation.json', crypto_regulation_data)
write_json('esg-reporting.json', esg_reporting_data)
print('\nDone.')
