"""
Generate v2.0 workflow diagrams for FinRegGPT.Bot repo.
Produces 5 PNG diagrams under /home/z/my-project/FinRegGPT.Bot/docs/diagrams/
"""
import os
import matplotlib.font_manager as fm

# Register fonts for CJK + Latin
fm.fontManager.addfont('/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
import matplotlib.patheffects as path_effects

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Noto Serif SC']
plt.rcParams['axes.unicode_minus'] = False

OUT_DIR = '/home/z/my-project/FinRegGPT.Bot/docs/diagrams'
os.makedirs(OUT_DIR, exist_ok=True)

# Color palette per zone
ZONE_COLORS = {
    'Core':           {'bg': '#10b981', 'light': '#d1fae5', 'text': '#065f46'},
    'Surveillance':   {'bg': '#f43f5e', 'light': '#ffe4e6', 'text': '#9f1239'},
    'Quant':          {'bg': '#8b5cf6', 'light': '#ede9fe', 'text': '#5b21b6'},
    'Intelligence':   {'bg': '#3b82f6', 'light': '#dbeafe', 'text': '#1e3a8a'},
    'Collaboration':  {'bg': '#f59e0b', 'light': '#fef3c7', 'text': '#92400e'},
    'Platform':       {'bg': '#64748b', 'light': '#f1f5f9', 'text': '#0f172a'},
}

def box(ax, x, y, w, h, label, color_bg, color_light, color_text, fontsize=9, bold=False, sublabel=None):
    p = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.02,rounding_size=0.08',
                       linewidth=1.2, edgecolor=color_bg, facecolor=color_light)
    ax.add_patch(p)
    weight = 'bold' if bold else 'normal'
    if sublabel:
        ax.text(x + w/2, y + h*0.65, label, ha='center', va='center',
                fontsize=fontsize, color=color_text, fontweight=weight)
        ax.text(x + w/2, y + h*0.30, sublabel, ha='center', va='center',
                fontsize=fontsize-2, color=color_text, alpha=0.75)
    else:
        ax.text(x + w/2, y + h/2, label, ha='center', va='center',
                fontsize=fontsize, color=color_text, fontweight=weight)

def arrow(ax, x1, y1, x2, y2, color='#475569', lw=1.2, style='->', curve=0.0):
    a = FancyArrowPatch((x1, y1), (x2, y2),
                        arrowstyle=style, color=color, lw=lw,
                        connectionstyle=f'arc3,rad={curve}',
                        mutation_scale=14)
    ax.add_patch(a)

def title(ax, text, y=0.97, size=16):
    ax.text(0.5, y, text, transform=ax.transAxes,
            ha='center', va='top', fontsize=size, fontweight='bold', color='#0f172a')

def subtitle(ax, text, y=0.93, size=9):
    ax.text(0.5, y, text, transform=ax.transAxes,
            ha='center', va='top', fontsize=size, color='#64748b', style='italic')


# ─── Diagram 1: System Architecture (6 zones, 29 state machines) ─────────────

def diagram_1_system_architecture():
    fig, ax = plt.subplots(figsize=(18, 11), constrained_layout=True)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 11)
    ax.axis('off')
    title(ax, 'RegGuard AI — System Architecture (29 State Machines, 6 Zones)', size=18)
    subtitle(ax, 'v2.0 — Agentic AI · Blockchain-anchored audit · PETs · Quant computational risk · Developer platform')

    # 6 zone panels arranged in a 3x2 grid
    zones = [
        ('Core Compliance (7)', ZONE_COLORS['Core'], 0.4, 7.5,
         ['Dashboard', 'Regulations', 'Policies', 'Audit Trail', 'Risk Matrix', 'AI Assistant', 'Reports']),
        ('Surveillance (4)', ZONE_COLORS['Surveillance'], 6.4, 7.5,
         ['Transaction Surveillance', 'Comms Surveillance', 'Sanctions Screening', 'Network Graph']),
        ('Quant & Computational (4)', ZONE_COLORS['Quant'], 12.4, 7.5,
         ['Quant Lab', 'Climate & ESG', 'Counterfactual', 'Systemic Risk']),
        ('Intelligence & Automation (4)', ZONE_COLORS['Intelligence'], 0.4, 3.0,
         ['Multi-Agent Console', 'Regulatory Watch', 'Red Team', 'Knowledge Graph']),
        ('Collaboration & Trust (5)', ZONE_COLORS['Collaboration'], 6.4, 3.0,
         ['Case Management', 'Regulator Portal', 'Whistleblower', 'Chain Evidence', 'Digital Assets']),
        ('Platform & Governance (5)', ZONE_COLORS['Platform'], 12.4, 3.0,
         ['Privacy / PETs', 'Developer Hub', 'Time Machine', 'Rule Harmonizer', 'XCC']),
    ]

    for zname, c, x0, y0, items in zones:
        # Zone panel
        rect = FancyBboxPatch((x0, y0), 5.2, 3.3, boxstyle='round,pad=0.05,rounding_size=0.12',
                              linewidth=2, edgecolor=c['bg'], facecolor='white', alpha=0.6)
        ax.add_patch(rect)
        # Zone title
        ax.text(x0 + 0.2, y0 + 3.05, zname, fontsize=11, fontweight='bold', color=c['text'])
        # Items
        for i, item in enumerate(items):
            ix = x0 + 0.2 + (i % 2) * 2.5
            iy = y0 + 1.9 - (i // 2) * 0.75
            box(ax, ix, iy, 2.35, 0.62, item, c['bg'], c['light'], c['text'], fontsize=8.5, bold=True)

    # Cross-zone arrows
    # Core -> Surveillance (alerts flow up)
    arrow(ax, 5.6, 9.0, 6.4, 9.0, color='#10b981', lw=1.5)
    # Core -> Quant (risk posture)
    arrow(ax, 11.6, 9.0, 12.4, 9.0, color='#10b981', lw=1.5)
    # Core -> Intelligence (AI Assistant consumes graph)
    arrow(ax, 3.0, 7.5, 3.0, 6.3, color='#3b82f6', lw=1.5)
    # Surveillance -> Collaboration (case creation)
    arrow(ax, 9.0, 7.5, 9.0, 6.3, color='#f43f5e', lw=1.5)
    # Quant -> Collaboration (case evidence)
    arrow(ax, 14.5, 7.5, 14.5, 6.3, color='#8b5cf6', lw=1.5)
    # Intelligence -> Collaboration (agent actions create cases)
    arrow(ax, 5.6, 4.5, 6.4, 4.5, color='#3b82f6', lw=1.5)
    # Collaboration -> Platform (anchoring)
    arrow(ax, 11.6, 4.5, 12.4, 4.5, color='#f59e0b', lw=1.5)
    # Platform -> All (PETs, Time Machine, XCC all transverse)
    arrow(ax, 14.9, 6.3, 14.9, 7.5, color='#64748b', lw=1.5, style='<->')

    # Bottom strip: foundational infrastructure
    infra_y = 0.3
    box(ax, 0.4, infra_y, 3.0, 0.8, 'Prisma + SQLite\n(PostgreSQL + Neo4j in prod)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 3.6, infra_y, 3.0, 0.8, 'Hyperledger Besu\n+ Ethereum Sepolia',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 6.8, infra_y, 3.0, 0.8, 'z-ai-web-dev-sdk\n(LLM + embeddings)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 10.0, infra_y, 3.0, 0.8, 'FATE / OpenFHE /\nOpenDP / Nitro',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 13.2, infra_y, 4.5, 0.8, 'REST + GraphQL + Webhooks\n+ TS/Python SDK',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)

    plt.savefig(f'{OUT_DIR}/v2-01-system-architecture.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-01-system-architecture.png')


# ─── Diagram 2: Multi-Agent Orchestration Flow ────────────────────────────────

def diagram_2_agent_orchestration():
    fig, ax = plt.subplots(figsize=(16, 10), constrained_layout=True)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    title(ax, 'Multi-Agent Orchestration Flow (Wave 1 Highlight)', size=16)
    subtitle(ax, '4 persistent agents with human-in-the-loop approval gates · every action anchored to chain')

    c = ZONE_COLORS['Intelligence']

    # Sources (left column)
    src_x = 0.4
    sources = [
        ('Federal Register', 8.5),
        ('ESMA / FCA / MAS', 7.4),
        ('EBA / BoE PRA', 6.3),
        ('FSB publications', 5.2),
    ]
    for s, y in sources:
        box(ax, src_x, y, 2.4, 0.7, s, '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)

    # Agent Console (middle column)
    box(ax, 4.2, 4.3, 3.5, 5.2, '', c['bg'], '#ffffff', c['text'], fontsize=11, bold=True)
    ax.text(5.95, 9.15, 'Multi-Agent Console', ha='center', fontsize=12, fontweight='bold', color=c['text'])

    agents = [
        ('Regulatory Watcher', 'Daily scrape + classify + triage', 8.3),
        ('Policy Drafter', 'Generate redlines with citations', 7.0),
        ('Control Tester', 'Simulate control failures', 5.7),
        ('Regulator Liaison', 'Pre-populate returns', 4.4),
    ]
    for name, sub, y in agents:
        box(ax, 4.4, y, 3.1, 1.0, name, c['bg'], c['light'], c['text'], fontsize=9, bold=True, sublabel=sub)

    # Approval gate (middle-right)
    gate_x = 8.4
    box(ax, gate_x, 6.0, 2.2, 2.0, 'Human Approval Gate',
        '#f59e0b', '#fef3c7', '#92400e', fontsize=10, bold=True,
        sublabel='CCO / Policy owner\nreviews + approves')

    # Outputs (right column)
    out_x = 11.4
    outputs = [
        ('Regulatory Watch\nfeed (new rules)', 8.5, ZONE_COLORS['Core']),
        ('Policy redlines\n(awaiting sign-off)', 7.0, ZONE_COLORS['Core']),
        ('Control gap\nreports', 5.5, ZONE_COLORS['Surveillance']),
        ('Pre-populated\nregulator returns', 4.0, ZONE_COLORS['Collaboration']),
    ]
    for label, y, col in outputs:
        box(ax, out_x, y, 3.0, 1.0, label, col['bg'], col['light'], col['text'], fontsize=9, bold=True)

    # Chain Evidence anchor (bottom)
    box(ax, 4.2, 1.5, 11.2, 1.2, 'Chain Evidence — Every AgentRun + approval logged, hashed (SHA-256), anchored to Hyperledger Besu within 60s',
        '#f59e0b', '#fef3c7', '#92400e', fontsize=10, bold=True)

    # Arrows from sources to agents
    for _, y in sources:
        arrow(ax, 2.8, y, 4.2, y if y > 5.5 else 5.5, color='#94a3b8', lw=1, curve=0.05)

    # Arrows from agents to gate
    for _, _, y in agents:
        arrow(ax, 7.5, y + 0.5, 8.4, 7.0, color=c['bg'], lw=1.2, curve=0.0)

    # Arrows from gate to outputs
    for _, y, _ in outputs:
        arrow(ax, 10.6, 7.0, 11.4, y + 0.5, color='#f59e0b', lw=1.2, curve=0.0)

    # Arrow from gate to chain
    arrow(ax, 9.5, 6.0, 9.5, 2.7, color='#f59e0b', lw=1.5, style='->')

    plt.savefig(f'{OUT_DIR}/v2-02-agent-orchestration.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-02-agent-orchestration.png')


# ─── Diagram 3: Blockchain-Anchored Audit Trail ──────────────────────────────

def diagram_3_chain_evidence():
    fig, ax = plt.subplots(figsize=(16, 9), constrained_layout=True)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis('off')
    title(ax, 'Blockchain-Anchored Audit Trail — Cryptographic Tamper Detection', size=16)
    subtitle(ax, 'Every AuditLog row → SHA-256 hash → anchored to 3 chains → daily verification')

    cc = ZONE_COLORS['Core']
    bc = ZONE_COLORS['Collaboration']

    # Step 1: Audit Log entry
    box(ax, 0.5, 5.5, 2.8, 1.6, 'AuditLog entry\n(actor, action,\ntarget, timestamp)',
        cc['bg'], cc['light'], cc['text'], fontsize=9, bold=True)

    # Step 2: SHA-256 hash
    box(ax, 4.0, 5.5, 2.5, 1.6, 'SHA-256 hash\n(cryptographic\nfingerprint)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)

    # Step 3: Anchor to 3 chains (parallel)
    box(ax, 7.5, 7.0, 3.0, 1.2, 'Hyperledger Besu\n(permissioned, default)',
        bc['bg'], bc['light'], bc['text'], fontsize=9, bold=True)
    box(ax, 7.5, 5.5, 3.0, 1.2, 'Ethereum Sepolia\n(public verification)',
        bc['bg'], bc['light'], bc['text'], fontsize=9, bold=True)
    box(ax, 7.5, 4.0, 3.0, 1.2, 'Polygon\n(low-cost anchor)',
        bc['bg'], bc['light'], bc['text'], fontsize=9, bold=True)

    # Step 4: ChainAnchor record
    box(ax, 11.5, 5.5, 3.5, 1.6, 'ChainAnchor record\n(txHash, blockNumber,\nchain, verifiedAt)',
        bc['bg'], bc['light'], bc['text'], fontsize=9, bold=True)

    # Step 5: Daily verification job
    box(ax, 5.0, 1.5, 6.0, 1.5, 'Daily Verification Job — re-hash every AuditLog row,\ncompare to on-chain hash, flag any mismatch as TAMPERING',
        '#ef4444', '#fee2e2', '#991b1b', fontsize=10, bold=True)

    # Arrows
    arrow(ax, 3.3, 6.3, 4.0, 6.3, color='#475569', lw=1.5)
    arrow(ax, 6.5, 6.3, 7.5, 7.6, color='#475569', lw=1.5)
    arrow(ax, 6.5, 6.3, 7.5, 6.1, color='#475569', lw=1.5)
    arrow(ax, 6.5, 6.3, 7.5, 4.6, color='#475569', lw=1.5)
    arrow(ax, 10.5, 7.6, 11.5, 6.3, color='#475569', lw=1.2, curve=0.1)
    arrow(ax, 10.5, 6.1, 11.5, 6.3, color='#475569', lw=1.2)
    arrow(ax, 10.5, 4.6, 11.5, 6.3, color='#475569', lw=1.2, curve=-0.1)
    arrow(ax, 13.25, 5.5, 11.0, 3.0, color='#ef4444', lw=1.5, curve=0.2)
    arrow(ax, 5.0, 2.5, 1.9, 5.5, color='#ef4444', lw=1.2, style='->', curve=0.3)

    # Side note: Regulator access
    box(ax, 0.5, 1.5, 3.8, 1.5, 'Regulator read-only node\n(real-time supervision,\nno document dumps)',
        '#3b82f6', '#dbeafe', '#1e3a8a', fontsize=9, bold=True)

    plt.savefig(f'{OUT_DIR}/v2-03-chain-evidence.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-03-chain-evidence.png')


# ─── Diagram 4: Surveillance + Network Graph Flow ────────────────────────────

def diagram_4_surveillance_flow():
    fig, ax = plt.subplots(figsize=(16, 10), constrained_layout=True)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    title(ax, 'Surveillance Zone — Transaction + Comms + Sanctions → Network Graph → Case', size=16)
    subtitle(ax, 'Real-time AML/CFT + market abuse + sanctions screening with entity resolution as a graph problem')

    sc = ZONE_COLORS['Surveillance']
    cl = ZONE_COLORS['Collaboration']

    # Ingestion layer (top)
    box(ax, 0.5, 8.5, 3.0, 1.0, 'SWIFT / SEPA / RTP\nstream (Kafka)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 3.8, 8.5, 3.0, 1.0, 'Voice / Email /\nBloomberg / Teams',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 7.1, 8.5, 3.0, 1.0, 'OFAC / UN / EU /\nHMT / MAS lists',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 10.4, 8.5, 3.0, 1.0, 'On-chain\n(BTC / ETH / USDT)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)

    # Surveillance engines (middle)
    box(ax, 0.5, 6.5, 3.0, 1.5, 'Transaction\nSurveillance\nEngine',
        sc['bg'], sc['light'], sc['text'], fontsize=10, bold=True)
    box(ax, 3.8, 6.5, 3.0, 1.5, 'Comms\nSurveillance\n(NLP)',
        sc['bg'], sc['light'], sc['text'], fontsize=10, bold=True)
    box(ax, 7.1, 6.5, 3.0, 1.5, 'Sanctions\nScreening\n(fuzzy + phonetic)',
        sc['bg'], sc['light'], sc['text'], fontsize=10, bold=True)
    box(ax, 10.4, 6.5, 3.0, 1.5, 'Digital Asset\nCompliance\n(Travel Rule)',
        sc['bg'], sc['light'], sc['text'], fontsize=10, bold=True)

    # Entity Resolution + Network Graph (middle bottom)
    box(ax, 4.0, 4.5, 6.0, 1.5, 'Entity Resolution + Network Graph Explorer\n(Louvain clustering · bridge node detection · path finding)',
        sc['bg'], sc['light'], sc['text'], fontsize=10, bold=True)

    # Outputs: Alerts + Hits + Events
    box(ax, 0.5, 4.5, 3.0, 1.5, 'SurveillanceAlert\nrecords\n(risk score 0-100)',
        sc['bg'], sc['light'], sc['text'], fontsize=9, bold=True)
    box(ax, 10.5, 4.5, 4.0, 1.5, 'SanctionsHit + CommsEvent\n+ DigitalAssetEvent records\n(status, severity, evidence)',
        sc['bg'], sc['light'], sc['text'], fontsize=9, bold=True)

    # Case Management (bottom)
    box(ax, 3.0, 2.0, 9.0, 1.8, 'Case Management — Examination / Investigation workflows with SLA tracking\n+ evidence packaging + Regulator Portal visibility',
        cl['bg'], cl['light'], cl['text'], fontsize=11, bold=True)

    # Red Team (bottom-most, attacking the surveillance layer)
    box(ax, 0.5, 0.3, 4.0, 1.2, 'Red Team Engine\n(continuously attacks surveillance)',
        ZONE_COLORS['Intelligence']['bg'], ZONE_COLORS['Intelligence']['light'], ZONE_COLORS['Intelligence']['text'],
        fontsize=9, bold=True)
    box(ax, 11.5, 0.3, 4.0, 1.2, 'XCC Card per decision\n(cited, defensible)',
        ZONE_COLORS['Platform']['bg'], ZONE_COLORS['Platform']['light'], ZONE_COLORS['Platform']['text'],
        fontsize=9, bold=True)

    # Arrows
    for x in [2.0, 5.3, 8.6, 11.9]:
        arrow(ax, x, 8.5, x, 8.0, color='#475569', lw=1.2)
    for x in [2.0, 5.3, 8.6, 11.9]:
        arrow(ax, x, 6.5, x, 6.0, color=sc['bg'], lw=1.2, style='->')

    # Engines feed into entity resolution
    arrow(ax, 2.0, 6.5, 5.0, 6.0, color=sc['bg'], lw=1.2, curve=0.1)
    arrow(ax, 5.3, 6.5, 6.0, 6.0, color=sc['bg'], lw=1.2)
    arrow(ax, 8.6, 6.5, 8.0, 6.0, color=sc['bg'], lw=1.2)
    arrow(ax, 11.9, 6.5, 10.0, 6.0, color=sc['bg'], lw=1.2, curve=-0.1)

    # Alerts + hits feed into case management
    arrow(ax, 2.0, 4.5, 5.0, 3.8, color=cl['bg'], lw=1.5, curve=0.15)
    arrow(ax, 7.0, 4.5, 7.5, 3.8, color=cl['bg'], lw=1.5)
    arrow(ax, 12.5, 4.5, 10.0, 3.8, color=cl['bg'], lw=1.5, curve=-0.15)

    # Red team attacks engines
    arrow(ax, 2.5, 1.5, 2.0, 4.5, color=ZONE_COLORS['Intelligence']['bg'], lw=1, style='->', curve=0.2)
    # XCC generates from decisions
    arrow(ax, 11.9, 6.5, 13.5, 1.5, color=ZONE_COLORS['Platform']['bg'], lw=1, style='->', curve=-0.3)

    plt.savefig(f'{OUT_DIR}/v2-04-surveillance-flow.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-04-surveillance-flow.png')


# ─── Diagram 5: 3-Wave Roadmap ───────────────────────────────────────────────

def diagram_5_roadmap():
    fig, ax = plt.subplots(figsize=(18, 8), constrained_layout=True)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 8)
    ax.axis('off')
    title(ax, 'Three-Wave Execution Roadmap — 7 → 19 → 29 State Machines', size=16)
    subtitle(ax, 'Weeks 1-3: MVP+ with agentic + blockchain foundation · Weeks 4-6: Surveillance + Quant · Weeks 7-10: Platform + frontier')

    # Wave 1
    w1_x = 0.4
    box(ax, w1_x, 5.5, 5.5, 1.8,
        'Wave 1: MVP+ (weeks 1-3)\n11 views',
        ZONE_COLORS['Core']['bg'], ZONE_COLORS['Core']['light'], ZONE_COLORS['Core']['text'],
        fontsize=11, bold=True,
        sublabel='7 Core refactored + Multi-Agent Console\n+ Regulatory Watch + Case Mgmt + Chain Evidence')

    # Wave 2
    w2_x = 6.2
    box(ax, w2_x, 5.5, 5.5, 1.8,
        'Wave 2: Surveillance + Quant (weeks 4-6)\n+8 views = 19 cumulative',
        ZONE_COLORS['Surveillance']['bg'], ZONE_COLORS['Surveillance']['light'], ZONE_COLORS['Surveillance']['text'],
        fontsize=11, bold=True,
        sublabel='4 Surveillance + 4 Quant\n(AML, comms, sanctions, graph, Monte Carlo, climate)')

    # Wave 3
    w3_x = 12.0
    box(ax, w3_x, 5.5, 5.5, 1.8,
        'Wave 3: Platform + Frontier (weeks 7-10)\n+10 views = 29 final',
        ZONE_COLORS['Platform']['bg'], ZONE_COLORS['Platform']['light'], ZONE_COLORS['Platform']['text'],
        fontsize=11, bold=True,
        sublabel='Red Team, Knowledge Graph, Regulator Portal,\nWhistleblower, Digital Assets, PETs, Dev Hub,\nTime Machine, Rule Harmonizer, XCC')

    # Arrows between waves
    arrow(ax, 5.9, 6.4, 6.2, 6.4, color='#0f172a', lw=2)
    arrow(ax, 11.7, 6.4, 12.0, 6.4, color='#0f172a', lw=2)

    # Wave 1 acceptance criteria
    box(ax, w1_x, 2.5, 5.5, 2.5,
        'Wave 1 Acceptance Criteria',
        '#10b981', '#d1fae5', '#065f46', fontsize=10, bold=True,
        sublabel='• 4 agents running daily w/ approval gates\n• Every AuditLog anchored within 60s\n• Examination case workflow live\n• 3 design partners signed')
    # Wave 2 acceptance
    box(ax, w2_x, 2.5, 5.5, 2.5,
        'Wave 2 Acceptance Criteria',
        '#f43f5e', '#ffe4e6', '#9f1239', fontsize=10, bold=True,
        sublabel='• Transaction surveillance <1s latency\n• Sanctions screening <50ms p99\n• Quant Lab: 10k+ Monte Carlo paths\n• PCAF financed emissions live')
    # Wave 3 acceptance
    box(ax, w3_x, 2.5, 5.5, 2.5,
        'Wave 3 Acceptance Criteria',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=10, bold=True,
        sublabel='• Red Team running 24/7\n• Knowledge Graph: 10k+ nodes, <100ms RAG\n• Regulator Portal with scoped access\n• PETs: 1+ federated learning deployment\n• Dev Hub: public SDK v1.0')

    # Bottom: business milestones
    box(ax, 0.4, 0.3, 5.5, 1.5,
        'Business Milestones (Wave 1)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True,
        sublabel='3 design partners · $0.5M ARR · Seed closed')
    box(ax, 6.2, 0.3, 5.5, 1.5,
        'Business Milestones (Wave 2)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True,
        sublabel='15 paying customers · $4M ARR · Series A')
    box(ax, 12.0, 0.3, 5.5, 1.5,
        'Business Milestones (Wave 3)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True,
        sublabel='25 customers · $20M ARR · 130% NRR')

    plt.savefig(f'{OUT_DIR}/v2-05-three-wave-roadmap.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-05-three-wave-roadmap.png')


# ─── Diagram 6: Knowledge Graph + Vector RAG ─────────────────────────────────

def diagram_6_knowledge_graph():
    fig, ax = plt.subplots(figsize=(16, 10), constrained_layout=True)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    title(ax, 'Regulatory Knowledge Graph + Vector RAG', size=16)
    subtitle(ax, 'Regulation → Policy → Control → Evidence as a navigable semantic graph with 1,536-dim embeddings')

    ic = ZONE_COLORS['Intelligence']

    # Nodes (left side: graph visualization)
    nodes = [
        ('Reg-1\nMiFID II', 1.5, 8.0, ZONE_COLORS['Core']),
        ('Reg-2\nBasel III', 1.5, 6.5, ZONE_COLORS['Core']),
        ('Reg-3\nGDPR', 1.5, 5.0, ZONE_COLORS['Core']),
        ('Pol-1\nAML v3.2', 4.0, 8.5, ZONE_COLORS['Core']),
        ('Pol-2\nMarket Risk', 4.0, 7.0, ZONE_COLORS['Core']),
        ('Pol-3\nPrivacy', 4.0, 5.5, ZONE_COLORS['Core']),
        ('Ctrl-1\nKYC', 6.5, 9.0, ZONE_COLORS['Surveillance']),
        ('Ctrl-2\nPre-trade', 6.5, 7.5, ZONE_COLORS['Surveillance']),
        ('Ctrl-3\nConsent', 6.5, 6.0, ZONE_COLORS['Surveillance']),
        ('Ctrl-4\nRetention', 6.5, 4.5, ZONE_COLORS['Surveillance']),
        ('Ev-1\nSARs', 9.0, 8.5, ZONE_COLORS['Collaboration']),
        ('Ev-2\nAudit logs', 9.0, 7.0, ZONE_COLORS['Collaboration']),
        ('Ev-3\nXCC cards', 9.0, 5.5, ZONE_COLORS['Collaboration']),
        ('Risk-1\nAML', 4.0, 3.5, ZONE_COLORS['Quant']),
        ('Risk-2\nCapital', 4.0, 2.0, ZONE_COLORS['Quant']),
    ]

    for item in nodes:
        label, x, y, col = item
        circ = Circle((x, y), 0.4, facecolor=col['light'], edgecolor=col['bg'], linewidth=1.8)
        ax.add_patch(circ)
        ax.text(x, y, label, ha='center', va='center', fontsize=7.5,
                color=col['text'], fontweight='bold')

    # Edges
    edges = [
        (0, 3, 'regulates'), (1, 4, 'regulates'), (2, 5, 'regulates'),
        (3, 6, 'implements'), (3, 7, 'implements'), (4, 7, 'implements'), (5, 8, 'implements'), (5, 9, 'implements'),
        (6, 10, 'evidences'), (7, 11, 'evidences'), (8, 12, 'evidences'),
        (3, 13, 'mitigates'), (4, 14, 'mitigates'),
    ]
    for a, b, etype in edges:
        # node tuple = (label, x, y, color_dict)
        x1 = float(nodes[a][1]); y1 = float(nodes[a][2])
        x2 = float(nodes[b][1]); y2 = float(nodes[b][2])
        col = '#10b981' if etype == 'regulates' else '#0ea5e9' if etype == 'implements' else '#f59e0b' if etype == 'evidences' else '#8b5cf6'
        arrow(ax, x1 + 0.35, y1, x2 - 0.35, y2, color=col, lw=0.8, style='->')

    # Right side: Vector RAG retrieval flow
    box(ax, 11.0, 8.0, 4.5, 1.2, 'User query\n"What controls mitigate AML risk?"',
        ic['bg'], ic['light'], ic['text'], fontsize=10, bold=True)
    box(ax, 11.0, 6.3, 4.5, 1.2, 'Vector embedding\n(1,536-dim, OpenAI text-embedding-3-small)',
        '#64748b', '#f1f5f9', '#0f172a', fontsize=9, bold=True)
    box(ax, 11.0, 4.6, 4.5, 1.2, 'Cosine similarity search\n(top-K nodes, <100ms p95)',
        ic['bg'], ic['light'], ic['text'], fontsize=9, bold=True)
    box(ax, 11.0, 2.9, 4.5, 1.2, 'Graph traversal\n(expand to neighbors)',
        ic['bg'], ic['light'], ic['text'], fontsize=9, bold=True)
    box(ax, 11.0, 1.2, 4.5, 1.2, 'Response with 23 citations\n+ XCC card generated',
        ZONE_COLORS['Platform']['bg'], ZONE_COLORS['Platform']['light'], ZONE_COLORS['Platform']['text'],
        fontsize=9, bold=True)

    arrow(ax, 13.25, 8.0, 13.25, 7.5, color='#475569', lw=1.5)
    arrow(ax, 13.25, 6.3, 13.25, 5.8, color='#475569', lw=1.5)
    arrow(ax, 13.25, 4.6, 13.25, 4.1, color='#475569', lw=1.5)
    arrow(ax, 13.25, 2.9, 13.25, 2.4, color='#475569', lw=1.5)

    # Arrow from graph to retrieval
    arrow(ax, 9.8, 6.5, 11.0, 6.9, color='#3b82f6', lw=1.5, style='<->', curve=0.1)

    # Legend
    legend_items = [
        ('regulates', '#10b981'),
        ('implements', '#0ea5e9'),
        ('evidences', '#f59e0b'),
        ('mitigates', '#8b5cf6'),
    ]
    for i, (lbl, col) in enumerate(legend_items):
        ax.plot([0.4 + i*1.4, 0.7 + i*1.4], [0.5, 0.5], color=col, lw=2)
        ax.text(0.8 + i*1.4, 0.5, lbl, fontsize=9, va='center', color='#475569')

    plt.savefig(f'{OUT_DIR}/v2-06-knowledge-graph.png', dpi=150, facecolor='white')
    plt.close()
    print(f'✓ {OUT_DIR}/v2-06-knowledge-graph.png')


if __name__ == '__main__':
    diagram_1_system_architecture()
    diagram_2_agent_orchestration()
    diagram_3_chain_evidence()
    diagram_4_surveillance_flow()
    diagram_5_roadmap()
    diagram_6_knowledge_graph()
    print('\nAll v2.0 diagrams generated.')
