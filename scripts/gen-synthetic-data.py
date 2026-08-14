"""
RegGuard AI — Master Synthetic Data Generator
==============================================

Generates rich, realistic JSON data for all 22 non-core views.
Each record includes AI-generated recommendations so the UI can
follow the "machine proposes, human confirms Boolean" principle.

Output: /home/z/my-project/public/data/*.json
"""
import json
import os
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

random.seed(42)

OUT = Path("/home/z/my-project/public/data")
OUT.mkdir(parents=True, exist_ok=True)

NOW = datetime.now(timezone.utc)
def iso(dt): return dt.isoformat()
def ago(seconds): return iso(NOW - timedelta(seconds=seconds))
def future(seconds): return iso(NOW + timedelta(seconds=seconds))
def cuid(prefix="c"):
    return f"{prefix}{uuid.uuid4().hex[:22]}"

def write(name, payload):
    path = OUT / f"{name}.json"
    with open(path, "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print(f"  ✓ {name}.json ({len(json.dumps(payload))} bytes)")

# ─────────────────────────────────────────────────────────────────────
# SURVEILLANCE ZONE
# ─────────────────────────────────────────────────────────────────────

def gen_surveillance():
    typologies = [
        ("structuring", "Cash deposits split below $10k threshold", "high"),
        ("layering", "Funds moved through 4 shell entities in 3 jurisdictions", "critical"),
        ("smurfing", "23 sub-$10k deposits across 7 branches in 48h", "high"),
        ("rapid_movement", "Inbound SEPA → outbound SWIFT within 11 minutes", "medium"),
        ("integration", "Real-estate purchase with unexplained wealth source", "medium"),
        ("round_tripping", "A→B→C→A circular flow netting to ~0 over 5 days", "high"),
        ("funnel_account", "Multiple inbound → single outbound to high-risk jurisdiction", "critical"),
        ("cuckoo_smurfing", "Third-party cash deposits matching expected invoice amounts", "high"),
    ]
    channels = ["SWIFT", "SEPA", "RTP", "Wire", "Crypto", "CHIPS", "FedNow"]
    currencies = ["USD", "EUR", "GBP", "CHF", "USDT", "USDC", "SGD"]
    jurisdictions = ["US", "EU", "UK", "SG", "AE", "KY", "PA", "CN", "RU"]
    statuses = ["open", "under_review", "escalated", "closed", "false_positive"]
    statuses_weighted = ["open"]*4 + ["under_review"]*3 + ["escalated"]*2 + ["closed"] + ["false_positive"]*2

    alerts = []
    for i, (typ, narr, sev) in enumerate(typologies * 3):
        amt = round(random.uniform(1500, 9_950_000), 2)
        risk = random.randint(62, 99) if sev in ("high", "critical") else random.randint(30, 70)
        alert = {
            "id": cuid("alert_"),
            "alertType": typ,
            "severity": sev,
            "accountId": f"ACC-{random.randint(100000,999999)}",
            "counterparty": random.choice([
                "Meridian Holdings Ltd (KY)", "BluePeak Capital (CH)", "Sunrise Trading (HK)",
                "Atlas Logistics (PA)", "Orion Exchange (AE)", "Pinecrest LLC (US)",
                "Sterling & Co (UK)", "Nakamura Industries (JP)",
            ]),
            "amount": amt,
            "currency": random.choice(currencies),
            "jurisdiction": random.choice(jurisdictions),
            "channel": random.choice(channels),
            "riskScore": risk,
            "status": random.choice(statuses_weighted),
            "triggeredRule": f"Rule-{random.choice(['AML-001','AML-014','AML-027','AML-052','CFT-003','CFT-019'])}",
            "narrative": narr,
            "timestamp": ago(random.randint(60, 604800)),
            "aiRecommendation": {
                "action": random.choice([
                    "File SAR within 24h", "Escalate to MLRO", "Request KYC refresh",
                    "Block transaction", "Continue monitoring 30d", "Close as false positive",
                ]),
                "confidence": random.randint(72, 98),
                "reasoning": "Pattern matches 3 historical SAR filings; counterparty flagged in 2 peer-bank consortia reports.",
                "reviewerAction": "approve_to_file" if sev in ("high","critical") else "approve_to_monitor",
            },
        }
        alerts.append(alert)

    summary = {
        "total": len(alerts),
        "bySeverity": {s: sum(1 for a in alerts if a["severity"] == s) for s in ["low","medium","high","critical"]},
        "byStatus": {s: sum(1 for a in alerts if a["status"] == s) for s in set(a["status"] for a in alerts)},
        "avgRiskScore": round(sum(a["riskScore"] for a in alerts) / len(alerts), 1),
        "autoActioned": sum(1 for a in alerts if a["aiRecommendation"]["confidence"] >= 95),
        "slaBreaches": sum(1 for a in alerts if a["status"] == "open" and "T" in a["timestamp"]),
    }
    write("surveillance", {"alerts": alerts, "summary": summary})

def gen_comms():
    channels = ["email", "voice", "teams", "bloomberg_chat", "mobile", "slack", "refinitiv"]
    desks = ["Equities", "FX", "Rates", "Credit", "Macro", "Commodities", "Prime Brokerage"]
    signals = [
        ("insider_trading", "Reference to non-public M&A timeline detected", "critical"),
        ("market_abuse", "Coordinated bidding language across 2 counterparties", "critical"),
        ("collusion", "Price-fixing discussion inferred from context", "critical"),
        ("off_channel", "Use of personal WhatsApp for business communication", "high"),
        ("swearing", "Professionalism threshold breach (3 instances)", "low"),
        ("front_running", "Pre-trade chatter aligned with subsequent block trade", "high"),
        ("wash_trade", "Mutual acknowledgement of offsetting positions", "high"),
        ("spoofing", "Order cancellation pattern discussed", "high"),
    ]
    events = []
    for i, (sig, narr, sev) in enumerate(signals * 2):
        risk = random.randint(65, 99) if sev == "critical" else random.randint(40, 75)
        events.append({
            "id": cuid("comms_"),
            "channel": random.choice(channels),
            "participantA": random.choice([
                "t.murphy@desk.io", "j.chen@desk.io", "r.singh@desk.io",
                "k.larson@desk.io", "a.patel@desk.io", "m.dubois@desk.io",
            ]),
            "participantB": random.choice([
                "external.broker@broker.com", "client.hedgefund@fund.com",
                "counterparty.pe@pe.com", "sales.contact@sellside.com",
            ]),
            "desk": random.choice(desks),
            "signalType": sig,
            "riskScore": risk,
            "transcript": f"[{random.choice(['Mon','Tue','Wed','Thu','Fri'])} 14:32] {narrative_excerpt(sig, narr)}",
            "status": random.choice(["open", "open", "review", "escalated", "closed"]),
            "timestamp": ago(random.randint(120, 86400 * 14)),
            "aiRecommendation": {
                "action": "Escalate to Compliance + capture recording" if sev == "critical" else "Request context from desk head",
                "confidence": random.randint(68, 96),
                "reasoning": "NLP model v4.2 detected intent with 91% precision on this signal class.",
                "reviewerAction": "approve_escalate" if sev == "critical" else "approve_request_context",
            },
        })
    write("comms", {"events": events, "total": len(events)})

def narrative_excerpt(sig, narr):
    snippets = {
        "insider_trading": "Listen, the announcement is Tuesday after close. We should be positioned before then.",
        "market_abuse": "Yeah let's both go in at 9:31 — they won't see us coming.",
        "collusion": "What if we just… keep it at 4.25 for the next hour?",
        "off_channel": "Ping me on WhatsApp +44 7xxx — easier than this.",
        "swearing": "This f***ing market is impossible today.",
        "front_running": "Big block coming at 3pm. You know what to do.",
        "wash_trade": "I'll take your side, you take mine. Net zero, looks real.",
        "spoofing": "Put in 5 levels deep then pull before they fill.",
    }
    return snippets.get(sig, narr)

def gen_sanctions():
    lists = ["OFAC SDN", "UN Consolidated", "EU FSF", "HMT OFSI", "MAS", "OFSI Russia", "OFAC 50% Rule"]
    match_types = ["exact", "fuzzy", "partial", "phonetic"]
    statuses = ["pending", "true_positive", "false_positive", "escalated", "pending", "pending"]
    entities = [
        ("Nord Stream Trading LLC", "Moscow, RU", 94),
        ("Al-Rashid Exchange", "Dubai, AE", 88),
        ("Silk Road Holdings", "Hong Kong, CN", 91),
        ("Meridian Petroleum", "Moscow, RU", 96),
        ("Blue Ocean Shipping", "Tehran, IR", 89),
        ("Pyongyang Tech Corp", "Pyongyang, KP", 99),
        ("Caracas Capital SA", "Caracas, VE", 87),
        ("Minsk Industrial Group", "Minsk, BY", 85),
    ]
    hits = []
    for entity_name, jurisdiction, base_score in entities * 2:
        mt = random.choice(match_types)
        score = base_score + random.randint(-5, 5)
        hits.append({
            "id": cuid("sanc_"),
            "listName": random.choice(lists),
            "matchType": mt,
            "matchedName": entity_name,
            "listedEntity": entity_name.upper(),
            "entityId": f"SDN-{random.randint(10000,99999)}",
            "score": min(score, 100),
            "status": random.choice(statuses),
            "reviewedBy": random.choice([None, "auto-triage-v3", "k.larson@regco.io", "mlro@regco.io"]),
            "action": random.choice([None, "Block transaction", "Freeze account", "File SAR", "Continue monitoring"]),
            "timestamp": ago(random.randint(60, 86400 * 7)),
            "aiRecommendation": {
                "action": "Block + freeze + SAR" if score >= 90 else "Manual review by MLRO",
                "confidence": random.randint(80, 99),
                "reasoning": f"Match strength {score}/100. Entity appears on {random.choice(lists)}. OFAC 50% Rule analysis: ownership chain reaches blocked party.",
                "reviewerAction": "approve_block" if score >= 90 else "approve_review",
            },
        })
    write("sanctions", {"hits": hits, "total": len(hits)})

def gen_network_graph():
    nodes = []
    edges = []
    node_types = ["person", "company", "account", "address", "crypto_wallet"]
    for i in range(35):
        nt = random.choice(node_types)
        risk = random.randint(10, 99)
        nodes.append({
            "id": f"n{i}",
            "label": random.choice([
                "Meridian Holdings", "BluePeak Capital", "Sunrise Trading",
                "Atlas Logistics", "Orion Exchange", "J. Smith", "K. Chen",
                "R. Patel", "Account 4421", "Wallet 0x4a…b3", "Account 7788",
                "Pinecrest LLC", "Sterling & Co", "Nakamura Ind.",
            ]) + f" #{i}",
            "type": nt,
            "riskScore": risk,
            "jurisdiction": random.choice(["US","EU","UK","SG","AE","KY","PA","CN"]),
            "isFlagged": risk >= 75,
        })
    for i in range(70):
        src = random.randint(0, 34)
        dst = random.randint(0, 34)
        if src != dst:
            edges.append({
                "id": f"e{i}",
                "source": f"n{src}",
                "target": f"n{dst}",
                "type": random.choice(["ownership", "transaction", "beneficial_owner", "shared_address", "shared_phone"]),
                "weight": round(random.uniform(1000, 5_000_000), 2),
                "currency": random.choice(["USD","EUR","USDT"]),
                "timestamp": ago(random.randint(3600, 604800)),
            })
    clusters = [
        {"id": "c1", "label": "Meridian cluster (3 shells)", "risk": 89, "nodeCount": 8},
        {"id": "c2", "label": "BluePeak — Orion bridge", "risk": 76, "nodeCount": 5},
        {"id": "c3", "label": "Sunrise rapid-movement ring", "risk": 82, "nodeCount": 6},
    ]
    write("network", {"nodes": nodes, "edges": edges, "clusters": clusters, "aiRecommendation": {
        "action": "Open 3 new cases from top-risk clusters; submit 2 to FIU",
        "confidence": 87,
        "reasoning": "Graph community detection (Louvain) isolated 3 sub-networks with above-threshold Money Laundering Typology scores.",
        "reviewerAction": "approve_open_cases",
    }})

# ─────────────────────────────────────────────────────────────────────
# QUANT & COMPUTATIONAL ZONE
# ─────────────────────────────────────────────────────────────────────

def gen_quant():
    scenarios = [
        ("CCAR 2026 Severely Adverse", "CCAR", "Federal Reserve adverse macro scenario — GDP -8%, unemployment 10%, equity -50%", "1y"),
        ("EBA 2026 Adverse", "EBA", "European Banking Authority adverse — sovereign spread +400bps, real estate -25%", "1y"),
        ("BoE ACS 2026", "BoE_ACS", "Bank of England Annual Cyclical Scenario — rates +300bps, GBP -25%", "1y"),
        ("FRTB IMA — Rates Desk", "FRTB_IMA", "Fundamental Review of Trading Book — Internal Models Approach, 99% VaR 10-day", "10d"),
        ("FRTB IMA — Credit Desk", "FRTB_IMA", "FRTB IMA for credit spread risk, non-securitisation", "10d"),
        ("NGFS Disorderly Transition", "NGFS", "Late, then sudden policy response — carbon price $200/t by 2030", "30y"),
        ("NGFS Hot House World", "NGFS", "No further policy — 3°C warming, physical risk dominates", "30y"),
        ("Custom: Sovereign Default EU Periphery", "custom", "Italy + Spain sovereign default, 40% recovery", "1q"),
        ("Custom: Crypto Contagion", "custom", "Stablecoin de-peg + 3 exchange failures", "1w"),
        ("Liquidity Stress — 30d Run", "custom", "30% deposit outflow over 30 days, HQLA depletion", "30d"),
    ]
    out = []
    for desc, st, detail, horizon in scenarios:
        p99 = round(random.uniform(15, 480), 1)  # $M loss
        el = round(p99 * random.uniform(0.05, 0.15), 2)
        cap = round(p99 * random.uniform(0.8, 1.2), 1)
        out.append({
            "id": cuid("q_"),
            "scenarioType": st,
            "description": desc,
            "detail": detail,
            "timeHorizon": horizon,
            "p99Loss": p99,
            "expectedLoss": el,
            "capitalImpact": cap,
            "status": random.choice(["complete", "complete", "running", "draft"]),
            "createdAt": ago(random.randint(3600, 604800 * 4)),
            "aiRecommendation": {
                "action": "Reduce rates desk VaR limit by 18%" if p99 > 200 else "Accept — within Board appetite",
                "confidence": random.randint(75, 95),
                "reasoning": f"P99 loss of ${p99}M exceeds desk VaR limit by {round((p99-200)/2,1)}%. Recommend derisking via 5Y swap unwinds.",
                "reviewerAction": "approve_derisk" if p99 > 200 else "approve_accept",
            },
            "distribution": [round(random.gauss(el, p99*0.3), 1) for _ in range(50)],
        })
    write("quant", {"scenarios": out, "total": len(out)})

def gen_climate():
    sectors = ["Oil & Gas", "Utilities", "Real Estate", "Agriculture", "Transport", "Manufacturing", "Tech", "Financial Services"]
    metrics = []
    for s in sectors:
        scope3 = round(random.uniform(50_000, 8_000_000), 0)  # tCO2e
        financed = round(scope3 * random.uniform(0.02, 0.15), 0)
        metrics.append({
            "id": cuid("clim_"),
            "sector": s,
            "scope1Emissions": round(random.uniform(1_000, 500_000), 0),
            "scope2Emissions": round(random.uniform(500, 200_000), 0),
            "scope3Emissions": scope3,
            "financedEmissions": financed,
            "taxonomyAlignment": round(random.uniform(8, 92), 1),
            "physicalRiskScore": random.randint(20, 85),
            "transitionRiskScore": random.randint(25, 90),
            "reportingPeriod": "FY2025",
            "pcafMethod": f"PCAF Asset Class #{random.randint(1,6)}",
            "aiRecommendation": {
                "action": "Set 2030 financed-emissions target -45%" if financed > 500_000 else "Engage — set interim 2027 target",
                "confidence": random.randint(78, 94),
                "reasoning": f"Sector {s} financed emissions ${financed/1e6:.1f}Mt exceeds portfolio weighted average by {random.randint(20,80)}%.",
                "reviewerAction": "approve_target_setting" if financed > 500_000 else "approve_engagement",
            },
        })
    ngfs_scenarios = [
        {"name": "Net Zero 2050", "warming": "1.5°C", "policy": "Orderly", "cumLoss": 42.3},
        {"name": "Below 2°C", "warming": "1.7°C", "policy": "Orderly", "cumLoss": 68.1},
        {"name": "Delayed Transition", "warming": "1.8°C", "policy": "Disorderly", "cumLoss": 124.6},
        {"name": "Current Policies", "warming": "3.0°C+", "policy": "Hot House", "cumLoss": 287.4},
    ]
    write("climate", {"metrics": metrics, "ngfsScenarios": ngfs_scenarios, "total": len(metrics)})

def gen_counterfactual():
    scenarios = [
        {"trigger": "Fed raises rates +75bps", "probability": 35, "complianceImpact": "Basel III LCR -4pts", "riskImpact": "+8% credit risk", "costImpact": "$12M hedging"},
        {"trigger": "MiFID III passes Q1 2027", "probability": 68, "complianceImpact": "12 policies need update", "riskImpact": "Conduct risk +12pts", "costImpact": "$3M implementation"},
        {"trigger": "Italy sovereign default", "probability": 8, "complianceImpact": "CRR Article 47b trigger", "riskImpact": "+$340M credit loss", "costImpact": "Capital raise $800M"},
        {"trigger": "OFAC sanctions UAE", "probability": 5, "complianceImpact": "Block 340 counterparties", "riskImpact": "-$45M revenue", "costImpact": "$2M exit costs"},
        {"trigger": "EU AI Act enforcement begins", "probability": 95, "complianceImpact": "Conformity assessments ×4 models", "riskImpact": "Model risk +15pts", "costImpact": "$1.8M assessments"},
        {"trigger": "Stablecoin de-peg (USDT)", "probability": 22, "complianceImpact": "Travel Rule non-compliance cascade", "riskImpact": "+$18M crypto exposure", "costImpact": "$0.5M contingency"},
        {"trigger": "Republican sweep 2028", "probability": 45, "complianceImpact": "CFPB restructuring", "riskImpact": "Conduct oversight -20%", "costImpact": "Reg savings $4M/yr"},
    ]
    for s in scenarios:
        s["aiRecommendation"] = {
            "action": "Pre-emptively draft MiFID III policy updates" if s["probability"] >= 60 else "Monitor — no action yet",
            "confidence": random.randint(70, 92),
            "reasoning": f"Probability {s['probability']}% within 18 months. Expected cost impact {s['costImpact']}.",
            "reviewerAction": "approve_drafting" if s["probability"] >= 60 else "approve_monitor",
        }
    write("counterfactual", {"scenarios": scenarios, "total": len(scenarios)})

def gen_systemic():
    banks = ["JPMorgan", "Bank of America", "Citigroup", "Goldman Sachs", "Morgan Stanley",
             "Wells Fargo", "HSBC", "Barclays", "Deutsche Bank", "BNP Paribas",
             "UBS", "Credit Suisse Successor", "Santander", "UniCredit", "ING",
             "Standard Chartered", "Mizuho", "MUFG", "SMBC", "DBS"]
    nodes = []
    edges = []
    for i, b in enumerate(banks):
        size = random.uniform(200, 3500)  # $B assets
        debt_rank = round(random.uniform(0.05, 0.45), 3)
        systemic_score = round(random.uniform(0.3, 0.95), 2)
        nodes.append({
            "id": f"b{i}",
            "name": b,
            "assetSize": size,
            "debtRank": debt_rank,
            "systemicScore": systemic_score,
            "tier1Capital": round(random.uniform(8, 18), 1),
            "country": random.choice(["US","UK","DE","FR","CH","ES","IT","NL","SG","JP"]),
            "isSystemic": systemic_score >= 0.7,
        })
    for i in range(60):
        src = random.randint(0, 19)
        dst = random.randint(0, 19)
        if src != dst:
            edges.append({
                "source": f"b{src}",
                "target": f"b{dst}",
                "exposure": round(random.uniform(0.5, 80), 1),  # $B
                "type": random.choice(["interbank_loan", "derivatives", "repo", "cross_holdings"]),
            })
    cascades = [
        {"trigger": "Bank 7 (Barclays) fails", "banksAffected": 12, "cumulativeLoss": 285.4, "duration": "11 days"},
        {"trigger": "Bank 9 (Deutsche Bank) fails", "banksAffected": 15, "cumulativeLoss": 412.7, "duration": "17 days"},
        {"trigger": "Bank 11 (UBS) stress", "banksAffected": 6, "cumulativeLoss": 94.2, "duration": "5 days"},
    ]
    write("systemic", {"nodes": nodes, "edges": edges, "cascades": cascades, "aiRecommendation": {
        "action": "Increase bilateral exposure limit haircuts for banks 7, 9, 11",
        "confidence": 84,
        "reasoning": "DebtRank simulation: banks 7, 9, 11 are top-3 systemic nodes. Failure of any one triggers >10% cascade.",
        "reviewerAction": "approve_haircuts",
    }})

# ─────────────────────────────────────────────────────────────────────
# INTELLIGENCE & AUTOMATION ZONE
# ─────────────────────────────────────────────────────────────────────

def gen_agents():
    agent_names = [
        ("regulatory_watcher", "Monitors Federal Register / ESMA / FCA / MAS for new rules"),
        ("policy_drafter", "Drafts policy updates in response to regulatory changes"),
        ("control_tester", "Executes automated control tests and logs evidence"),
        ("regulator_liaison", "Manages examiner requests and response packets"),
        ("sanctions_screener", "Triage sanctions hits with OFAC 50% Rule analysis"),
        ("red_team", "Adversarial attacks against own controls"),
        ("knowledge_curator", "Maintains regulation→policy→control graph"),
        ("report_generator", "Auto-generates board / examiner reports"),
    ]
    statuses = ["queued", "running", "awaiting_approval", "complete", "failed"]
    statuses_weighted = ["complete"]*5 + ["running"]*3 + ["awaiting_approval"]*4 + ["queued"]*2 + ["failed"]
    runs = []
    for i in range(20):
        an, desc = random.choice(agent_names)
        status = random.choice(statuses_weighted)
        started = ago(random.randint(60, 86400 * 3))
        completed = future(random.randint(-86400, 300)) if status in ("complete","failed") else None
        runs.append({
            "id": cuid("agent_"),
            "agentName": an,
            "agentDescription": desc,
            "task": random.choice([
                "Parse 14 new ESMA publications; classify by impact score",
                "Draft MiFID II Article 16(7) policy update v3.2",
                "Execute 47 sanctions screening controls; evidence to ChainAnchor",
                "Package Q3 SAR filing for FinCEN submission",
                "Run 12 red-team adversarial scenarios against AML engine",
                "Curate 23 new edges in regulation→control graph",
                "Generate Q3 Board Risk Committee pack (47 slides)",
                "Triage 89 OFAC hits; apply 50% Rule ownership chain",
            ]),
            "status": status,
            "inputs": f"source feeds ×{random.randint(2,8)}, context window 32k tokens",
            "outputs": f"{random.randint(1,47)} artifacts, {random.randint(50,2000)} tokens",
            "toolsUsed": ", ".join(random.sample(["web_search","vector_rag","sanctions_api","blockchain_anchor","pdf_parser","policy_diff","knowledge_graph","smtp"], k=random.randint(2,5))),
            "approvedBy": random.choice([None, "sarah.chen@regco.io", "mlro@regco.io", "cRO@regco.io"]),
            "startedAt": started,
            "completedAt": completed,
            "aiRecommendation": {
                "action": "Approve to publish" if status == "awaiting_approval" else "Acknowledge",
                "confidence": random.randint(82, 99),
                "reasoning": f"Agent followed approved playbook {an}_v2.3. No anomalies in tool usage. Outputs within scope.",
                "reviewerAction": "approve_publish" if status == "awaiting_approval" else "acknowledge",
            },
        })
    write("agents", {"runs": runs, "total": len(runs)})

def gen_regwatch():
    sources = ["Federal Register", "ESMA", "FCA", "MAS", "FSB", "Basel Committee", "EBA", "IOSCO", "FinCEN", "OFAC"]
    changes = []
    items = [
        ("SEC Climate Disclosure Rule", "Federal Register", "US", 87, "Effective Q1 2026 — Scope 1, 2, 3 disclosure for public companies"),
        ("MiFID III — Retail Investor Protection", "ESMA", "EU", 92, "Ban on inducements, value-for-money assessments, more disclosures"),
        ("Consumer Duty — Implementation Review", "FCA", "UK", 78, "FCA finds 23% of firms still not meeting outcomes monitoring requirements"),
        ("MAS Guidelines on AI Risk Management", "MAS", "SG", 81, "Updated model governance for banks using AI in credit decisions"),
        ("FSB G20 Roadmap on Cross-Border Payments", "FSB", "Global", 65, "Phase 3 — PXN access, LVPS alignment, supervisory college"),
        ("Basel III Final — Output Floor", "Basel Committee", "Global", 94, "72.5% output floor effective Jan 2028 — capital +8% for large EU banks"),
        ("EBA Guidelines on ML/TF Risk Factors", "EBA", "EU", 76, "Updated sectoral guidance for crypto-asset service providers"),
        ("IOSCO — AI in Market Surveillance", "IOSCO", "Global", 71, "New standards for AI-driven market-abuse detection"),
        ("FinCEN — Beneficial Ownership Access Rule", "FinCEN", "US", 88, "Beneficial ownership registry access for law enforcement"),
        ("OFAC — Secondary Sanctions on Russia", "OFAC", "US", 95, "Secondary sanctions on 3rd-country financial institutions supporting Russia"),
        ("EU AI Act — Implementing Acts", "ESMA", "EU", 90, "Draft implementing acts on high-risk AI conformity assessments"),
        ("FCA — Cryptoasset Registration", "FCA", "UK", 82, "Tightened ML/TF controls for crypto-asset firms"),
        ("MAS — Digital Asset Tokenization", "MAS", "SG", 74, "Project Guardian — tokenized deposits regulatory framework"),
        ("EBA — Internal Governance", "EBA", "EU", 68, "Updated guidelines on internal governance under DORA"),
        ("SEC — Predictive Data Analytics", "Federal Register", "US", 85, "Conflict-of-interest rules for AI-driven investor interactions"),
    ]
    for title, source, juris, impact, summary in items:
        changes.append({
            "id": cuid("rw_"),
            "source": source,
            "title": title,
            "jurisdiction": juris,
            "publishedAt": ago(random.randint(3600, 86400 * 30)),
            "impactScore": impact,
            "affectedPolicies": random.randint(0, 14),
            "status": random.choice(["new", "new", "triaged", "drafting", "applied", "dismissed"]),
            "summary": summary,
            "aiRecommendation": {
                "action": "Auto-draft policy update + impact assessment" if impact >= 80 else "Queue for weekly review",
                "confidence": random.randint(75, 97),
                "reasoning": f"Impact score {impact}/100. Affects {random.randint(2,12)} business units. Identified {random.randint(1,8)} policy clauses to update.",
                "reviewerAction": "approve_auto_draft" if impact >= 80 else "approve_queue",
            },
        })
    write("regwatch", {"changes": changes, "total": len(changes)})

def gen_redteam():
    attacks = [
        ("Smurfing via 7 branches", "smurfing", "AML engine v4.2", "blocked", "low"),
        ("Sanctions evasion via crypto mixer", "sanctions_evasion", "Chainalysis integration", "detected", "medium"),
        ("Layering through 4 shells", "structuring", "AML engine v4.2", "bypassed", "critical"),
        ("Prompt injection on AI Assistant", "prompt_injection", "AI Assistant v1.0", "blocked", "high"),
        ("Insider trading — collusion NLP", "market_abuse", "Comms surveillance v3", "detected", "medium"),
        ("OFAC 50% Rule bypass", "sanctions_evasion", "Ownership graph engine", "detected", "medium"),
        ("Trade-based money laundering", "structuring", "TBML detector v2", "bypassed", "high"),
        ("Deepfake voice — client verification", "spoofing", "Voice biometric v2", "detected", "high"),
        ("Wash trading — same desk accounts", "market_abuse", "Order surveillance v3", "blocked", "low"),
        ("Adversarial ML on credit scoring", "model_attack", "Model monitoring v2", "detected", "high"),
        ("BEC attack on payments", "spoofing", "Email security v4", "blocked", "low"),
        ("Data exfiltration via DNS tunnel", "data_exfiltration", "Network monitoring v3", "detected", "medium"),
    ]
    out = []
    for name, vector, target, result, sev in attacks:
        out.append({
            "id": cuid("rt_"),
            "testName": name,
            "attackVector": vector,
            "target": target,
            "result": result,
            "severity": sev,
            "evidence": f"Captured {random.randint(8,47)} indicators of compromise. Replay packet at /evidence/{uuid.uuid4().hex[:8]}",
            "remediation": "Patch rule AML-027 to include sub-branch aggregation" if result == "bypassed" else None,
            "timestamp": ago(random.randint(3600, 86400 * 14)),
            "aiRecommendation": {
                "action": "Apply remediation patch immediately" if result == "bypassed" else "Log + monitor",
                "confidence": random.randint(85, 99),
                "reasoning": f"Attack {result}. {('Control gap identified.' if result == 'bypassed' else 'Control functioned as designed.')}",
                "reviewerAction": "approve_patch" if result == "bypassed" else "acknowledge_log",
            },
        })
    write("redteam", {"tests": out, "total": len(out)})

def gen_knowledge_graph():
    nodes = [
        {"id": "r1", "type": "regulation", "label": "MiFID II Article 16(7)", "jurisdiction": "EU"},
        {"id": "r2", "type": "regulation", "label": "HIPAA Security Rule §164.312", "jurisdiction": "US"},
        {"id": "r3", "type": "regulation", "label": "MAS TRM Guidelines 6.4", "jurisdiction": "SG"},
        {"id": "r4", "type": "regulation", "label": "EU AI Act Art. 10 (Data Governance)", "jurisdiction": "EU"},
        {"id": "p1", "type": "policy", "label": "Best Execution Policy v2.4"},
        {"id": "p2", "type": "policy", "label": "ePHI Encryption Policy v3.1"},
        {"id": "p3", "type": "policy", "label": "AI Model Governance Policy v1.2"},
        {"id": "p4", "type": "policy", "label": "Cloud Risk Policy v2.0"},
        {"id": "c1", "type": "control", "label": "Order routing venue analysis"},
        {"id": "c2", "type": "control", "label": "AES-256 encryption at rest"},
        {"id": "c3", "type": "control", "label": "Model validation gate"},
        {"id": "c4", "type": "control", "label": "Cloud provider SOC 2 review"},
        {"id": "e1", "type": "evidence", "label": "Q3 venue analysis report"},
        {"id": "e2", "type": "evidence", "label": "KMS rotation log Aug 2025"},
        {"id": "e3", "type": "evidence", "label": "Model card v1.2 — credit scorer"},
        {"id": "e4", "type": "evidence", "label": "AWS SOC 2 Type II 2024"},
    ]
    edges = [
        {"source": "r1", "target": "p1", "type": "implements"},
        {"source": "r2", "target": "p2", "type": "implements"},
        {"source": "r4", "target": "p3", "type": "implements"},
        {"source": "r3", "target": "p4", "type": "implements"},
        {"source": "p1", "target": "c1", "type": "enforced_by"},
        {"source": "p2", "target": "c2", "type": "enforced_by"},
        {"source": "p3", "target": "c3", "type": "enforced_by"},
        {"source": "p4", "target": "c4", "type": "enforced_by"},
        {"source": "c1", "target": "e1", "type": "evidenced_by"},
        {"source": "c2", "target": "e2", "type": "evidenced_by"},
        {"source": "c3", "target": "e3", "type": "evidenced_by"},
        {"source": "c4", "target": "e4", "type": "evidenced_by"},
    ]
    write("knowledge-graph", {"nodes": nodes, "edges": edges, "aiRecommendation": {
        "action": "Auto-link 5 new regulations to existing policies (90% confidence)",
        "confidence": 90,
        "reasoning": "Vector RAG retrieved 5 high-similarity regulation→policy pairs not yet linked in the graph.",
        "reviewerAction": "approve_auto_link",
    }})

# ─────────────────────────────────────────────────────────────────────
# COLLABORATION & TRUST ZONE
# ─────────────────────────────────────────────────────────────────────

def gen_cases():
    cases = []
    items = [
        ("examination", "SEC Cycle Examination Q4 2025", "SEC", "critical", "in_progress", 7),
        ("examination", "FCA Consumer Duty Review", "FCA", "high", "open", 14),
        ("investigation", "OFAC Sanctions Investigation — Meridian", "OFAC", "critical", "in_progress", 3),
        ("regulatory_request", "EBA Stress Test Data Call", "EBA", "high", "awaiting_response", 5),
        ("regulatory_request", "MAS TRM Self-Assessment", "MAS", "medium", "open", 21),
        ("internal_review", "Q3 AML Effectiveness Review", None, "medium", "in_progress", 14),
        ("examination", "HHS HIPAA Audit — Hospital Wing", "HHS-OCR", "high", "open", 30),
        ("investigation", "Whistleblower Report #2025-08-14", None, "high", "open", 7),
    ]
    for ct, title, regulator, priority, status, days in items:
        cases.append({
            "id": cuid("case_"),
            "caseType": ct,
            "title": title,
            "regulator": regulator,
            "priority": priority,
            "status": status,
            "assignee": random.choice(["sarah.chen@regco.io","mlro@regco.io","cRO@regco.io","james.okafor@regco.io"]),
            "dueDate": future(days * 86400),
            "description": f"Case management workflow for {title}. Auto-assembled evidence pack: 47 documents, 12 witness statements, 8 control attestations.",
            "createdAt": ago(random.randint(86400, 86400 * 30)),
            "evidenceCount": random.randint(12, 89),
            "slaStatus": "on_track" if days > 10 else "at_risk" if days > 5 else "breach_imminent",
            "aiRecommendation": {
                "action": "Auto-prepare response packet + schedule pre-exam briefing" if status == "awaiting_response" else "Auto-compile evidence index",
                "confidence": random.randint(80, 95),
                "reasoning": "All required artifacts identified. 0 gaps vs regulator template. Precedent: similar case closed in 12 days.",
                "reviewerAction": "approve_response_packet" if status == "awaiting_response" else "approve_evidence_index",
            },
        })
    write("cases", {"cases": cases, "total": len(cases)})

def gen_regulator_portal():
    return {
        "examiner": {
            "name": "Examiner Jordan Reyes",
            "agency": "SEC",
            "examinationId": "SEC-2025-Q4-04471",
            "scopedEntities": ["Retail Banking", "Wealth Management"],
            "scopedDateRange": ["2024-01-01", "2025-08-14"],
        },
        "queries": [
            {"id": "q1", "query": "Show all Consumer Duty breaches Q1 2025", "timestamp": ago(3600), "recordsReturned": 23, "logged": True},
            {"id": "q2", "query": "List all SAR filings >$10k Mar-May 2025", "timestamp": ago(7200), "recordsReturned": 47, "logged": True},
            {"id": "q3", "query": "Best execution venue analysis Aug 2025", "timestamp": ago(86400), "recordsReturned": 12, "logged": True},
            {"id": "q4", "query": "Risk matrix for Wealth Management", "timestamp": ago(172800), "recordsReturned": 8, "logged": True},
        ],
        "availableDocuments": [
            {"id": "d1", "type": "Policy", "title": "Consumer Duty Outcomes Monitoring v2.1", "scoped": True},
            {"id": "d2", "type": "Audit Trail", "title": "Aug 2025 audit log export", "scoped": True},
            {"id": "d3", "type": "Risk Register", "title": "Wealth Mgmt Q3 risk register", "scoped": True},
            {"id": "d4", "type": "Policy", "title": "Capital Markets — Market Integrity", "scoped": False},
            {"id": "d5", "type": "Audit Trail", "title": "Hospital Wing HIPAA logs", "scoped": False},
        ],
        "aiRecommendation": {
            "action": "Auto-prepare scoped evidence packet (47 documents) — examiner sees only entitlements",
            "confidence": 100,
            "reasoning": "Every examiner query logged to ChainAnchor. All scoped documents pre-assembled. 0 entitlement violations detected.",
            "reviewerAction": "approve_release_to_examiner",
        },
    }

def gen_whistleblower():
    items = [
        ("fraud", "critical", "Front office desk allegedly concealing losses via offsetting swaps with related party.", 89),
        ("market_abuse", "high", "Trader reportedly sharing client flow info with external hedge fund.", 82),
        ("harassment", "medium", "Repeated inappropriate comments by senior manager in Wealth Mgmt.", 65),
        ("safety", "low", "Hospital wing understaffing leading to HIPAA shortcuts.", 48),
        ("fraud", "high", "AML analyst pressured to close alerts as false positive to meet SLA.", 78),
        ("other", "medium", "Concerns about AI underwriting model showing gender bias in pricing.", 72),
    ]
    out = []
    for cat, sev, desc, score in items:
        out.append({
            "id": cuid("wb_"),
            "category": cat,
            "severity": sev,
            "description": desc,
            "anonymous": True,
            "status": random.choice(["received", "triaged", "investigating", "resolved"]),
            "triageScore": score,
            "assignedTo": random.choice([None, "ethics@regco.io", "mlro@regco.io", "cRO@regco.io"]),
            "encryptedHash": "0x" + uuid.uuid4().hex,
            "createdAt": ago(random.randint(86400, 86400 * 60)),
            "aiRecommendation": {
                "action": "Escalate to Ethics Committee + independent counsel" if sev in ("critical","high") else "Assign to HR for investigation",
                "confidence": random.randint(78, 94),
                "reasoning": f"LLM triage v3 scored {score}/100. {('Multiple corroboration signals detected.' if score >= 80 else 'Insufficient corroboration — needs intake interview.')}",
                "reviewerAction": "approve_escalate" if sev in ("critical","high") else "approve_hr_assignment",
            },
        })
    write("whistleblower", {"reports": out, "total": len(out)})
    write("regulator-portal", gen_regulator_portal())

def gen_chain():
    chains = ["hyperledger_besu", "ethereum_sepolia", "polygon_amoy"]
    types = ["audit_log", "evidence", "decision", "attestation"]
    items = []
    for i in range(25):
        items.append({
            "id": cuid("chain_"),
            "payloadHash": "0x" + uuid.uuid4().hex,
            "chain": random.choice(chains),
            "txHash": "0x" + uuid.uuid4().hex,
            "blockNumber": random.randint(4_000_000, 6_000_000),
            "anchorType": random.choice(types),
            "anchoredBy": random.choice(["system","sarah.chen@regco.io","mlro@regco.io"]),
            "verifiedAt": ago(random.randint(60, 86400 * 7)) if random.random() > 0.15 else None,
            "createdAt": ago(random.randint(60, 86400 * 30)),
            "verified": random.random() > 0.15,
        })
    write("chain", {"anchors": items, "total": len(items)})

def gen_digital_assets():
    events = []
    items = [
        ("travel_rule", "BTC", "0x4a23...b3f1", "0x91ab...c2d4", 12.5, "Travel Rule applies — originator/ beneficiary data required", "pending"),
        ("sanctions_screen", "ETH", "0x32af...11ed", "Tornado Cash", 450, "OFAC sanctioned address match", "blocked"),
        ("mixer_detection", "ETH", "0x91ab...c2d4", "Tornado Cash", 230, "Funds routed through OFAC-sanctioned mixer", "escalated"),
        ("ofac_match", "USDT", "0xab12...cd34", "SDN-listed entity", 50000, "Direct match to SDN list", "blocked"),
        ("travel_rule", "USDC", "0xff42...98a1", "0x77cd...01ef", 2.3, "Below $3k threshold — Travel Rule not triggered", "auto_clear"),
        ("sanctions_screen", "BTC", "0x55de...22ab", "Garantex", 8.9, "OFAC-sanctioned exchange", "blocked"),
        ("mixer_detection", "BTC", "0x88aa...11bb", "Blender.io", 4.2, "OFAC-sanctioned mixer", "escalated"),
        ("travel_rule", "CBDC", "digital-pound:test-001", "digital-pound:test-099", 1500, "Travel Rule applies — CBDC rails comply", "compliant"),
        ("ofac_match", "USDT", "0x22ab...34cd", "OFAC 50% Rule entity", 25000, "50% Rule — beneficial owner is SDN", "blocked"),
        ("mixer_detection", "ETH", "0x66dd...77ee", "CoinJoin variant", 12, "Novel mixer pattern — ML model 0.87 confidence", "escalated"),
        ("sanctions_screen", "BTC", "0x99ff...00aa", "Bitzlato", 1.8, "OFAC-sanctioned exchange", "blocked"),
        ("travel_rule", "ETH", "0x11bb...22cc", "0x33dd...44ee", 8.0, "Travel Rule applies", "compliant"),
        ("ofac_match", "USDT", "0x55ff...66aa", "Russian bank under sanctions", 80000, "Sectoral sanctions", "blocked"),
        ("mixer_detection", "BTC", "0x77aa...88bb", "Wasabi CoinJoin", 3.5, "Privacy-preserving — flag for monitoring", "monitor"),
        ("travel_rule", "USDC", "0x99cc...00dd", "0x11ee...22ff", 4.7, "Travel Rule applies", "pending"),
    ]
    for evt, asset, wallet, cpty, amt, narr, status in items:
        events.append({
            "id": cuid("da_"),
            "asset": asset,
            "wallet": wallet,
            "counterparty": cpty,
            "amount": amt,
            "eventType": evt,
            "riskScore": random.randint(35, 99) if status in ("blocked","escalated") else random.randint(15, 50),
            "status": status,
            "chain": "BTC" if asset == "BTC" else "ETH" if asset in ("ETH","USDT","USDC") else "CBDC",
            "timestamp": ago(random.randint(60, 86400 * 7)),
            "narrative": narr,
            "aiRecommendation": {
                "action": "Block + file SAR + freeze wallet" if status == "blocked" else "Collect Travel Rule data" if status == "pending" else "Approve",
                "confidence": random.randint(82, 99),
                "reasoning": narr,
                "reviewerAction": "approve_block" if status == "blocked" else "approve_collect_data" if status == "pending" else "approve",
            },
        })
    write("digital-assets", {"events": events, "total": len(events)})

# ─────────────────────────────────────────────────────────────────────
# PLATFORM & GOVERNANCE ZONE
# ─────────────────────────────────────────────────────────────────────

def gen_pets():
    datasets = ["Customer PII", "Transaction History", "Health Records (PHI)", "Credit Scores", "Biometric Voiceprints", "Trading Communications", "Employee HR Data"]
    techniques = ["federated_learning", "homomorphic_encryption", "differential_privacy", "secure_enclave"]
    out = []
    for ds in datasets:
        out.append({
            "id": cuid("pet_"),
            "dataset": ds,
            "technique": random.choice(techniques),
            "enabled": random.random() > 0.4,
            "parameters": json.dumps({
                "epsilon": round(random.uniform(0.1, 3.0), 2),
                "delta": 1e-5,
                "key_rotation_days": random.choice([30, 60, 90]),
                "enclave": "aws_nitro" if random.random() > 0.5 else "sgx",
            }),
            "approvedBy": random.choice([None, "dpo@regco.io", "ciso@regco.io"]),
            "updatedAt": ago(random.randint(86400, 86400 * 30)),
            "aiRecommendation": {
                "action": "Enable DP with ε=1.2 (recommended privacy budget)",
                "confidence": random.randint(80, 95),
                "reasoning": "Dataset contains PII. Differential privacy with ε=1.2 preserves 96% analytical utility while bounding re-identification risk.",
                "reviewerAction": "approve_enable_dp",
            },
        })
    write("pets", {"configs": out, "total": len(out)})

def gen_developer():
    keys = [
        ("Production — Risk Engine", "rg_live_", 5000, "active", "2025-09-01"),
        ("Sandbox — QA Team", "rg_test_", 500, "active", "2025-08-15"),
        ("Regulatory Watch Webhook", "rg_wh_", 1000, "active", "2025-09-10"),
        ("BI Dashboard — Read-only", "rg_ro_", 2000, "active", "2025-07-22"),
        ("Partner — Regulator API", "rg_ext_", 500, "active", "2025-10-01"),
        ("Legacy Mobile App", "rg_mob_", 100, "revoked", "2025-06-30"),
    ]
    out = []
    for name, prefix, rate, status, expiry in keys:
        out.append({
            "id": cuid("key_"),
            "name": name,
            "keyPrefix": prefix + uuid.uuid4().hex[:8],
            "scopes": random.choice(["read:regulations,read:policies", "read:*,write:audit", "write:cases,read:risk", "read:metrics"]),
            "rateLimit": rate,
            "status": status,
            "lastUsedAt": ago(random.randint(60, 86400)) if status == "active" else None,
            "createdAt": ago(random.randint(86400 * 7, 86400 * 365)),
            "expiresAt": f"20{expiry[2:]}",
            "calls30d": random.randint(120, 4_500_000) if status == "active" else 0,
            "aiRecommendation": {
                "action": "Rotate key (90-day policy)" if status == "active" and random.random() > 0.5 else "OK — no action",
                "confidence": random.randint(85, 97),
                "reasoning": "Key is 87 days old. Rotation policy mandates 90-day cycle.",
                "reviewerAction": "approve_rotate" if status == "active" and random.random() > 0.5 else "acknowledge",
            },
        })
    endpoints = [
        {"method": "GET", "path": "/api/v1/regulations", "auth": "API Key", "rateLimit": 100},
        {"method": "POST", "path": "/api/v1/audit/anchor", "auth": "API Key + mTLS", "rateLimit": 10},
        {"method": "GET", "path": "/api/v1/cases/{id}", "auth": "OAuth2", "rateLimit": 200},
        {"method": "POST", "path": "/api/v1/whistleblower", "auth": "Public (encrypted)", "rateLimit": 5},
        {"method": "GET", "path": "/api/v1/sanctions/screen", "auth": "API Key", "rateLimit": 500},
        {"method": "POST", "path": "/api/v1/agents/run", "auth": "API Key + RBAC", "rateLimit": 20},
    ]
    write("developer", {"keys": out, "endpoints": endpoints, "total": len(out)})

def gen_time_machine():
    snapshots = []
    for days_ago in [1, 7, 30, 90, 180, 365]:
        snap_time = NOW - timedelta(days=days_ago)
        snapshots.append({
            "id": cuid("tm_"),
            "timestamp": iso(snap_time),
            "complianceScore": random.randint(65, 92),
            "openFindings": random.randint(15, 80),
            "activePolicies": random.randint(5, 9),
            "trackedRegulations": random.randint(8, 14),
            "riskItems": random.randint(8, 14),
            "auditEvents": random.randint(420, 1850),
            "activeCases": random.randint(1, 8),
            "blockchainAnchors": random.randint(80, 470),
            "aiRecommendation": {
                "action": "Replay point-in-time query for examiner request",
                "confidence": 100,
                "reasoning": f"Snapshot reconstructs full state as of {snap_time.strftime('%Y-%m-%d %H:%M UTC')}. Defensible in examination.",
                "reviewerAction": "approve_replay",
            },
        })
    write("time-machine", {"snapshots": snapshots, "total": len(snapshots)})

def gen_harmonizer():
    topics = [
        ("Derivatives Reporting", "US (CFTC Part 45), EU (EMIR RTS), UK (EMIR Refit), SG (MAS SFA)", "UTI format, collateral fields, reporting T+1 vs T"),
        ("Climate Disclosure", "US (SEC), EU (CSRD), UK (TCFD-aligned), JP (SSBJ)", "Scope 3 mandatory in EU/UK, voluntary in US; assurance differing levels"),
        ("AI Governance", "US (state laws), EU (AI Act), UK (principles-based), SG (MAS Guidelines)", "EU bans social scoring; US state-by-state; risk classification differs"),
        ("Crypto Travel Rule", "US (FinCEN), EU (TFR), UK (MLR 2017), SG (MAS PSN02)", "Threshold: $3k US, €1k EU, £1k UK, SGD 1.5k SG"),
        ("Operational Resilience", "US (SR 20-24), EU (DORA), UK (PS21/3), SG (MAS TRM)", "DORA covers ICT third-party; US covers BCP; UK covers impact tolerance"),
        ("Beneficial Ownership", "US (CTA), EU (AMLD6), UK (PSC Register), SG (ACRA)", "Threshold: 25% US/EU, 25% UK, 25% SG; access rules vary"),
    ]
    out = []
    for topic, jurisdictions, diffs in topics:
        out.append({
            "id": cuid("har_"),
            "topic": topic,
            "jurisdictions": jurisdictions,
            "differences": diffs,
            "harmonizationPath": f"Adopt most stringent (EU) baseline; document local variations in Rule Mapping v3",
            "impactScore": random.randint(65, 95),
            "affectedPolicies": random.randint(2, 8),
            "createdAt": ago(random.randint(86400, 86400 * 14)),
            "aiRecommendation": {
                "action": "Apply EU-baseline harmonization (auto-draft policy delta)",
                "confidence": random.randint(82, 95),
                "reasoning": f"EU is most stringent on {topic}. Adopting EU baseline closes 87% of jurisdictional gaps in one pass.",
                "reviewerAction": "approve_harmonize_eu_baseline",
            },
        })
    write("harmonizer", {"comparisons": out, "total": len(out)})

def gen_xcc():
    decisions = [
        ("approved", "Loan Application L-2025-08-4471", "Basel III IRB", "credit_risk_policy_v2.3", "PD 1.8% × LGD 42% × EAD $450k = EL $3.4k; within appetite", 94),
        ("declined", "Transaction T-2025-08-88912", "OFAC Sanctions", "sanctions_policy_v4.1", "Counterparty matches SDN list entry OFAC-12345; 50% Rule analysis: 65% owned by blocked party", 99),
        ("flagged", "Trade Order O-2025-08-55204", "MiFID II Best Ex", "best_execution_policy_v2.4", "Venue offered 3bps better price but worse fill ratio; trade-through detected", 88),
        ("approved", "Policy Update P-2025-08-12", "EU AI Act Art 13", "ai_governance_policy_v1.2", "Model card complete; human oversight documented; post-market monitoring plan attached", 91),
        ("declined", "Customer Onboarding C-2025-08-9921", "AML/CFT KYC", "kyc_policy_v3.1", "PEP status confirmed; source of wealth unverifiable from 3 independent sources", 95),
        ("flagged", "Crypto Deposit D-2025-08-447", "FATF Travel Rule", "digital_asset_policy_v1.0", "Deposit >$3k from non-compliant VASP; Travel Rule data missing", 92),
        ("approved", "Cross-Border Wire W-2025-08-6634", "Fx Settlement", "fx_risk_policy_v2.0", "Within CLS eligible currencies; PvP settlement; counterparty limit OK", 96),
        ("declined", "AI Model Deployment M-2025-08-3", "EU AI Act Annex III", "ai_governance_policy_v1.2", "High-risk system without conformity assessment; CE marking absent", 97),
        ("flagged", "Vendor Onboarding V-2025-08-22", "DORA ICT Risk", "vendor_risk_policy_v2.1", "Critical ICT provider; missing SOC 2 Type II report; concentration risk", 89),
        ("approved", "Insurance Underwriting U-2025-08-71", "EU AI Act Art 6", "ai_underwriting_policy_v1.0", "Model validated; bias testing passed; explainability via SHAP; conformity assessment complete", 93),
    ]
    out = []
    for decision, ref, regulation, policy, reasoning, conf in decisions:
        out.append({
            "id": cuid("xcc_"),
            "decisionId": ref,
            "decision": decision,
            "regulation": regulation,
            "policyRef": policy,
            "evidence": f"Anchor 0x{uuid.uuid4().hex[:16]} — 8 artifacts, 23 audit events",
            "reasoning": reasoning,
            "confidence": conf,
            "generatedAt": ago(random.randint(60, 86400)),
            "aiRecommendation": {
                "action": f"Publish XCC to decision registry (immutable)" if conf >= 90 else "Human review before publish",
                "confidence": conf,
                "reasoning": "XCC complies with EU AI Act Art 13 transparency requirements. Includes regulation citation, policy reference, evidence anchor, and plain-language reasoning.",
                "reviewerAction": "approve_publish" if conf >= 90 else "approve_human_review",
            },
        })
    write("xcc", {"cards": out, "total": len(out)})

# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────

def main():
    print("Generating synthetic data for all 22 views…")
    print()
    print("Surveillance Zone:")
    gen_surveillance()
    gen_comms()
    gen_sanctions()
    gen_network_graph()
    print()
    print("Quant & Computational Zone:")
    gen_quant()
    gen_climate()
    gen_counterfactual()
    gen_systemic()
    print()
    print("Intelligence & Automation Zone:")
    gen_agents()
    gen_regwatch()
    gen_redteam()
    gen_knowledge_graph()
    print()
    print("Collaboration & Trust Zone:")
    gen_cases()
    gen_whistleblower()  # also writes regulator-portal
    gen_chain()
    gen_digital_assets()
    print()
    print("Platform & Governance Zone:")
    gen_pets()
    gen_developer()
    gen_time_machine()
    gen_harmonizer()
    gen_xcc()
    print()
    print(f"✓ All 22 data files written to {OUT}")

if __name__ == "__main__":
    main()
