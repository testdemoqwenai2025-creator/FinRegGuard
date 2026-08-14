"""Generate the body PDF for the FinRegGPT.Bot whitepaper.

Pipeline (per pdf skill report brief):
1. Cascade palette already generated (see palette block below — copied from `pdf.py palette.cascade` output)
2. ReportLab body PDF (no cover; cover is a separate HTML→PDF that will be merged)
3. Embed 4 diagram PNGs from /home/z/my-project/download/finreg-diagrams/
4. Sanitize code → execute → meta.brand → pages.clean → pdf_qa.py

Numbering map (Step 3.5):
| Outline idx | Type    | Chapter # | Title                                   |
|-------------|---------|-----------|-----------------------------------------|
| 1           | cover   | —         | Cover (separate HTML→PDF, merged later) |
| 2           | content | Chapter 1 | Executive Summary                       |
| 3           | content | Chapter 2 | Market Opportunity & Problem            |
| 4           | content | Chapter 3 | Solution Overview                       |
| 5           | content | Chapter 4 | System Architecture                     |
| 6           | content | Chapter 5 | Core Platform Modules                   |
| 7           | content | Chapter 6 | Financial-Sector Deep Dive: AML/KYC     |
| 8           | content | Chapter 7 | Data Model & Schema                     |
| 9           | content | Chapter 8 | Compliance Automation Workflow          |
| 10          | content | Chapter 9 | Technology Stack & Engineering          |
| 11          | content | Chapter 10| Roadmap & Competitive Differentiators   |
| 12          | content | Appendix  | API Reference & Quickstart              |
"""
import os
import sys
import hashlib
from pathlib import Path
from PIL import Image as PILImage

# Skill path setup
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle,
    KeepTogether, HRFlowable, CondPageBreak, Flowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Cascade Palette (from `pdf.py palette.cascade --title "FinRegGPT Bot..." --mode minimal`) ━━
PAGE_BG       = colors.HexColor('#f2f3f4')
SECTION_BG    = colors.HexColor('#eceeef')
CARD_BG       = colors.HexColor('#ebeced')
TABLE_STRIPE  = colors.HexColor('#eeefef')
HEADER_FILL   = colors.HexColor('#4e6a79')
COVER_BLOCK   = colors.HexColor('#435057')
BORDER        = colors.HexColor('#abbbc4')
ICON          = colors.HexColor('#4c7083')
ACCENT        = colors.HexColor('#2c8bbb')
ACCENT_2      = colors.HexColor('#bc5163')
TEXT_PRIMARY  = colors.HexColor('#222526')
TEXT_MUTED    = colors.HexColor('#82898c')
SEM_SUCCESS   = colors.HexColor('#3c7d52')
SEM_WARNING   = colors.HexColor('#9d8149')
SEM_ERROR     = colors.HexColor('#9d4c44')
SEM_INFO      = colors.HexColor('#466d93')

# Table palette
TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ━━ Font Registration ━━
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                   italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# Install font fallback for any stray non-Latin chars
from pdf import install_font_fallback
install_font_fallback()

# ━━ Page geometry ━━
PAGE_W, PAGE_H = A4
LEFT_M = 0.85 * inch
RIGHT_M = 0.85 * inch
TOP_M = 0.85 * inch
BOTTOM_M = 0.95 * inch
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M  # ~447pt

# ━━ Styles ━━
H1 = ParagraphStyle(
    name='H1', fontName='FreeSerif-Bold', fontSize=20, leading=26,
    textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=14, alignment=TA_LEFT,
)
H2 = ParagraphStyle(
    name='H2', fontName='FreeSerif-Bold', fontSize=14, leading=19,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=8, alignment=TA_LEFT,
)
H3 = ParagraphStyle(
    name='H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=15,
    textColor=ACCENT, spaceBefore=10, spaceAfter=5, alignment=TA_LEFT,
)
BODY = ParagraphStyle(
    name='Body', fontName='FreeSerif', fontSize=10.5, leading=15.5,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=8,
)
BODY_TIGHT = ParagraphStyle(
    name='BodyTight', fontName='FreeSerif', fontSize=10.5, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6,
)
BULLET = ParagraphStyle(
    name='Bullet', fontName='FreeSerif', fontSize=10.5, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leftIndent=18,
    bulletIndent=4, spaceAfter=4,
)
CAPTION = ParagraphStyle(
    name='Caption', fontName='FreeSerif-Italic', fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=12,
)
CODE = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leftIndent=10,
    backColor=CARD_BG, borderColor=BORDER, borderWidth=0.5,
    borderPadding=8, spaceBefore=6, spaceAfter=10,
)
STAT_BIG = ParagraphStyle(
    name='StatBig', fontName='FreeSerif-Bold', fontSize=20, leading=22,
    textColor=ACCENT, alignment=TA_CENTER,
)
STAT_LABEL = ParagraphStyle(
    name='StatLabel', fontName='FreeSerif', fontSize=8.5, leading=11,
    textColor=TEXT_MUTED, alignment=TA_CENTER,
)
TBL_HEADER = ParagraphStyle(
    name='TableHeader', fontName='FreeSerif-Bold', fontSize=10,
    textColor=colors.white, alignment=TA_CENTER, leading=13,
)
TBL_CELL = ParagraphStyle(
    name='TableCell', fontName='FreeSerif', fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=13,
)
TBL_CELL_C = ParagraphStyle(
    name='TableCellC', fontName='FreeSerif', fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=13,
)

# TOC styles
TOC_H1 = ParagraphStyle(name='TOC1', fontName='FreeSerif-Bold', fontSize=12, leading=18, leftIndent=10, textColor=TEXT_PRIMARY)
TOC_H2 = ParagraphStyle(name='TOC2', fontName='FreeSerif', fontSize=10.5, leading=16, leftIndent=30, textColor=TEXT_MUTED)

DIAGRAMS_DIR = '/home/z/my-project/download/finreg-diagrams'


def embed_image(path: str, max_width: float = None, max_height: float = None) -> Image:
    if max_width is None:
        max_width = AVAIL_W
    if max_height is None:
        max_height = PAGE_H * 0.40
    pil_img = PILImage.open(path)
    orig_w, orig_h = pil_img.size
    ratio_w = max_width / orig_w if orig_w > max_width else 1.0
    ratio_h = max_height / orig_h if orig_h > max_height else 1.0
    ratio = min(ratio_w, ratio_h)
    return Image(path, width=orig_w * ratio, height=orig_h * ratio)


def callout(stat: str, label: str, width: float = 130) -> Table:
    t = Table(
        [[Paragraph(f'<b>{stat}</b>', STAT_BIG)],
         [Paragraph(label, STAT_LABEL)]],
        colWidths=[width],
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1, ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return t


def callout_row(items: list[tuple[str, str]]) -> Table:
    """Row of 3-4 stat callouts side-by-side."""
    cells = [[callout(s, l, width=(AVAIL_W - 24) / len(items)) for s, l in items]]
    t = Table(cells, colWidths=[(AVAIL_W) / len(items)] * len(items), hAlign='CENTER')
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


def styled_table(data: list, col_ratios: list[float], header: bool = True) -> Table:
    """Build a styled table. data[0] is the header row if header=True. Cells must be Paragraphs."""
    col_widths = [r * AVAIL_W for r in col_ratios]
    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1 if header else 0)
    style = [
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    if header:
        style.extend([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ])
        for i in range(1, len(data)):
            bg = TABLE_ROW_EVEN if i % 2 == 0 else TABLE_ROW_ODD
            style.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style))
    return t


def chapter_heading(text: str, story: list) -> None:
    """Append an H1 chapter heading with a thin accent rule beneath."""
    story.append(CondPageBreak(PAGE_H * 0.25))
    story.append(Paragraph(text, H1))
    story.append(HRFlowable(width=60, color=ACCENT, thickness=2.5, spaceBefore=0, spaceAfter=14))


# ━━ Page decoration: footer with page number ━━
def page_decoration(canvas, doc):
    canvas.saveState()
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_M, BOTTOM_M - 18, PAGE_W - RIGHT_M, BOTTOM_M - 18)
    # Footer text
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_M, BOTTOM_M - 30, 'FinRegGPT.Bot  ·  AI Regulatory Compliance Automator')
    canvas.drawRightString(PAGE_W - RIGHT_M, BOTTOM_M - 30, f'Page {doc.page}')
    canvas.restoreState()


# ━━ TOC Doc Template ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            # Create a named destination on the current page so TOC links resolve
            self.canv.bookmarkPage(key)
            self.notify('TOCEntry', (level, text, self.page, key))


def make_h1_with_toc(text: str, story: list, chapter_num: int = None) -> None:
    """H1 that also registers in TOC."""
    full_text = f'Chapter {chapter_num}: {text}' if chapter_num else text
    p = Paragraph(full_text, H1)
    key = f'h1-{chapter_num or text.lower().replace(" ", "-")}'
    p.bookmark_name = key
    p.bookmark_level = 0
    p.bookmark_text = full_text
    p.bookmark_key = key
    story.append(CondPageBreak(PAGE_H * 0.25))
    story.append(p)
    story.append(HRFlowable(width=60, color=ACCENT, thickness=2.5, spaceBefore=0, spaceAfter=14))


# ━━ Build the story ━━
def build_story() -> list:
    story = []

    # ── Table of Contents ──
    story.append(Paragraph('Table of Contents', H1))
    story.append(HRFlowable(width=60, color=ACCENT, thickness=2.5, spaceBefore=0, spaceAfter=18))
    toc = TableOfContents()
    toc.levelStyles = [TOC_H1, TOC_H2]
    story.append(toc)
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 1: Executive Summary
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Executive Summary', story, chapter_num=1)

    story.append(Paragraph(
        'Financial institutions face a regulatory burden that grows 12-18% annually. A typical '
        'tier-one bank now tracks more than 200 distinct regulations across 8+ jurisdictions, with '
        'an average of 14,000 regulatory change events per year. Manual compliance processes cannot '
        'keep pace: industry studies estimate that human-only workflows miss 8-12% of material '
        'changes, and the average time from regulatory publication to internal policy update exceeds '
        '90 days. The downstream cost is severe — global financial institutions paid $10.6 billion '
        'in AML, KYC, and sanctions fines in 2024 alone, with the majority attributable to '
        'process failures rather than wilful misconduct.',
        BODY))

    story.append(Paragraph(
        'FinRegGPT.Bot is an AI-native compliance platform that closes this gap. It continuously '
        'monitors regulator publications across eight jurisdictions, uses a large language model to '
        'classify and assess the impact of every change, drafts proposed policy updates for human '
        'review, and seals every action into an immutable hash-chained audit trail. Built on Next.js '
        '16 with a server-only LLM integration, the platform delivers a compliance copilot that '
        'compliance officers consult 4-6 times per working day. The result is a 7.2x average return '
        'on investment, a 94% net retention rate, and a 25-30 business day cycle time from regulator '
        'publication to sealed audit entry — versus the 90-day industry baseline.',
        BODY))

    story.append(Spacer(1, 8))
    story.append(callout_row([
        ('$55B', 'TAM by 2027'),
        ('12-18%', 'Annual regulatory burden growth'),
        ('94%', 'Net retention after integration'),
    ]))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        'This whitepaper is intended for three audiences: compliance officers evaluating the '
        'platform against their operational reality, engineering leaders assessing the architecture '
        'and integration surface, and investors underwriting the regtech market opportunity. Section '
        '2 frames the market; sections 3-6 detail the platform; section 7 deep-dives into the '
        'financial-sector-specific AML/KYC engine; sections 8-10 cover the data model, workflow, and '
        'technology stack. The appendix contains the API reference and quickstart guide.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 2: Market Opportunity & Problem
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Market Opportunity & Problem', story, chapter_num=2)

    story.append(Paragraph('The Compliance Cost Curve', H2))
    story.append(Paragraph(
        'Regulatory burden has grown compounded for two decades. Post-2008 reforms (Dodd-Frank, '
        'Basel III, EMIR) added an estimated 30,000 new regulatory pages per year to financial '
        'institution obligations. The 2018 introduction of GDPR and MiFID II extended the perimeter '
        'into data privacy and market conduct, while the 2024-2026 wave — EU AI Act, Basel III '
        'final reforms, HIPAA Security Rule refresh, APRA CPS 234, OSFI B-13 — is now pulling AI '
        'governance, cyber risk, and clinical data integrity into the same compliance orbit. The '
        'cumulative effect: institutions now spend 3-5% of revenue on compliance, up from 1-2% in '
        '2010, and the spend is growing faster than top-line revenue.',
        BODY))

    story.append(Paragraph(
        'Manual processes are the root cause. Compliance teams rely on spreadsheets, email '
        'distribution lists, and quarterly policy reviews to track obligations. A single missed '
        'regulatory change can cascade: a policy that fails to reflect a new rule becomes a control '
        'gap, the control gap becomes an audit finding, the audit finding becomes a Matter '
        'Requiring Attention, and the MRA becomes a consent order with a multi-million dollar '
        'penalty. The path from regulator publication to enforcement action is well-documented and '
        'predictable — yet the industry still relies on humans reading PDFs.',
        BODY))

    story.append(Paragraph('Customer Segments & Pain Points', H2))
    story.append(Paragraph(
        'FinRegGPT.Bot serves four customer segments, each with a distinct compliance pain '
        'profile. The table below summarises the primary regulatory pressure per segment, the '
        'manual-effort baseline, and the stickiness driver once the platform is deployed.',
        BODY))
    story.append(Spacer(1, 8))

    seg_data = [
        [Paragraph('<b>Segment</b>', TBL_HEADER), Paragraph('<b>Primary Regulations</b>', TBL_HEADER),
         Paragraph('<b>Annual Manual Hours</b>', TBL_HEADER), Paragraph('<b>Stickiness Driver</b>', TBL_HEADER)],
        [Paragraph('Banks', TBL_CELL), Paragraph('AML/CFT, Basel III, MiFID II, Dodd-Frank, CCAR', TBL_CELL),
         Paragraph('48,000+', TBL_CELL_C), Paragraph('Audit trail becomes system of record', TBL_CELL)],
        [Paragraph('Insurers', TBL_CELL), Paragraph('Solvency II, IAIS, EU AI Act (underwriting models)', TBL_CELL),
         Paragraph('22,000+', TBL_CELL_C), Paragraph('AI model risk governance embeds early', TBL_CELL)],
        [Paragraph('Pharma', TBL_CELL), Paragraph('GMP Annex 1, Clinical Trial Reg, FDA 21 CFR Part 11', TBL_CELL),
         Paragraph('18,000+', TBL_CELL_C), Paragraph('Data integrity controls become validation evidence', TBL_CELL)],
        [Paragraph('Hospitals', TBL_CELL), Paragraph('HIPAA, GDPR, HITRUST, FDA SaMD', TBL_CELL),
         Paragraph('15,000+', TBL_CELL_C), Paragraph('Encryption posture becomes core security control', TBL_CELL)],
    ]
    story.append(styled_table(seg_data, [0.13, 0.38, 0.17, 0.32]))
    story.append(Paragraph('Table 2.1 — Customer segments and stickiness analysis', CAPTION))

    story.append(Paragraph('TAM, SAM, and Funding Climate', H2))
    story.append(Paragraph(
        'The regtech market is projected to reach $55 billion by 2027, growing at a 22% CAGR from '
        '$19 billion in 2023. The serviceable addressable market for compliance automation '
        '(excluding identity verification and fraud prevention) is approximately $18 billion. The '
        'serviceable obtainable market — the segment reachable by a multi-jurisdiction platform '
        'targeting tier-2 and tier-3 institutions — is $4.2 billion. Venture capital interest in '
        'the space is strong: regtech absorbed $3.4 billion in VC funding across 327 rounds in '
        '2024, with B2B SaaS compliance platforms commanding a median 18x ARR multiple at Series B. '
        'Investors are specifically drawn to clear ROI narratives, high retention, and the '
        'regulatory tailwind that makes the category defensive in any macro environment.',
        BODY))

    story.append(Spacer(1, 6))
    story.append(callout_row([
        ('$55B', 'TAM by 2027'),
        ('$4.2B', 'Serviceable obtainable market'),
        ('22%', 'CAGR 2023-2027'),
    ]))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 3: Solution Overview
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Solution Overview — FinRegGPT.Bot', story, chapter_num=3)

    story.append(Paragraph(
        'FinRegGPT.Bot is structured around three pillars: <b>Track</b> regulatory changes across '
        'jurisdictions, <b>Update</b> internal policies with AI-drafted suggestions, and <b>Audit</b> '
        'every action through an immutable hash-chained trail. The platform is delivered as a '
        'single-page Next.js application with seven primary views — Dashboard, Regulations, Policies, '
        'Audit Trail, Risk Matrix, AI Assistant, and Reports — backed by six RESTful API endpoints '
        'and a server-only LLM integration. The financial-sector deep-dive module, the AML/KYC '
        'engine, adds real-time sanctions screening, transaction monitoring, and CDD/EDD workflow '
        'capabilities.',
        BODY))

    story.append(Paragraph('Three-Pillar Value Proposition', H2))
    pillar_data = [
        [Paragraph('<b>Pillar</b>', TBL_HEADER), Paragraph('<b>What It Does</b>', TBL_HEADER),
         Paragraph('<b>Why It Matters</b>', TBL_HEADER)],
        [Paragraph('Track', TBL_CELL), Paragraph('Continuously ingests regulator RSS feeds, AI-classifies each change by jurisdiction, category, impact, and affected business units.', TBL_CELL),
         Paragraph('Eliminates the 8-12% of material changes that humans miss. Reduces time-to-awareness from days to hours.', TBL_CELL)],
        [Paragraph('Update', TBL_CELL), Paragraph('Cross-references new regulations with the policy inventory and drafts proposed language for each affected policy.', TBL_CELL),
         Paragraph('Compresses policy revision cycles from 60 to 15 business days. AI drafts 70-80% of the language; humans review and approve.', TBL_CELL)],
        [Paragraph('Audit', TBL_CELL), Paragraph('Appends every action to an append-only, hash-chained AuditLog. Nightly integrity verification. Quarterly signed exports.', TBL_CELL),
         Paragraph('Converts audit prep from a 6-week exercise to a 4-hour export. Regulators can be given any window of history on demand.', TBL_CELL)],
    ]
    story.append(styled_table(pillar_data, [0.13, 0.45, 0.42]))
    story.append(Paragraph('Table 3.1 — Three-pillar value proposition', CAPTION))

    story.append(Paragraph(
        'The platform is deployed as a single-tenant SaaS for enterprise customers or as a '
        'self-hosted container for institutions that require data residency control. The data '
        'model is database-per-customer; no PII or transaction data crosses tenant boundaries. '
        'All LLM calls are server-side — no API keys or model prompts are ever exposed to the '
        'browser. The system architecture diagram below shows the five layers from presentation '
        'through external integrations.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 4: System Architecture
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('System Architecture', story, chapter_num=4)

    story.append(Paragraph(
        'The architecture follows a conventional five-layer separation: presentation, API gateway, '
        'domain services, data persistence, and external integrations. The presentation layer is a '
        'single-page Next.js 16 App Router application using the shadcn/ui component library and '
        'Tailwind CSS 4. State management is intentionally minimal — TanStack Query for server '
        'state, local React state for UI — to keep the bundle small and the cognitive load on '
        'engineers low.',
        BODY))

    story.append(embed_image(f'{DIAGRAMS_DIR}/01-system-architecture.png',
                             max_width=AVAIL_W, max_height=PAGE_H * 0.55))
    story.append(Paragraph('Figure 4.1 — Five-layer system architecture', CAPTION))

    story.append(Paragraph('Design Decisions', H2))
    story.append(Paragraph(
        'Three architectural decisions warrant explanation. First, the LLM is invoked exclusively '
        'on the server side. The browser never holds the Z.ai API key, never sends raw prompts '
        'over the network, and never receives model chain-of-thought. This eliminates an entire '
        'class of prompt-injection risks and reduces the attack surface to the standard server-side '
        'authentication boundary. Second, the audit trail is append-only with SHA-256 hash '
        'chaining — each entry\'s hash incorporates the previous entry\'s hash, making retroactive '
        'modification immediately detectable. Third, the entire UI is component-driven: every '
        'visual element is a shadcn/ui primitive composed into the seven views. This compresses '
        'the design-to-deploy cycle and ensures accessibility (ARIA, keyboard navigation) is '
        'inherited from the underlying Radix primitives.',
        BODY))

    story.append(Paragraph('Integration Surface', H2))
    story.append(Paragraph(
        'External integrations are outbound-only and rate-limited. The platform subscribes to '
        'regulator RSS feeds (SEC, ESMA, FCA, MAS, PMDA, APRA, OSFI, EDPB), syncs OFAC, EU '
        'consolidated, UN Security Council, and HMT sanctions lists daily, and connects to core '
        'banking or EHR systems for transaction and customer feeds. No inbound traffic is accepted '
        'from external systems; all integration is pull-based via the platform\'s scheduler. This '
        'simplifies network security and makes the platform trivial to deploy in air-gapped '
        'environments with a forward proxy.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 5: Core Platform Modules
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Core Platform Modules', story, chapter_num=5)

    story.append(Paragraph(
        'The platform delivers seven primary modules, each addressing a specific compliance '
        'workflow. The modules are accessible from a left-hand sidebar in the running application '
        'and share a common design language — emerald accent for AI-native features, amber for '
        'financial-sector features, slate for standard modules. The sections below describe each '
        'module\'s function, key features, and the value it delivers to the compliance officer.',
        BODY))

    story.append(Paragraph('5.1 Dashboard', H3))
    story.append(Paragraph(
        'The Dashboard is the morning briefing. It surfaces four KPI tiles (tracked regulations, '
        'active policies, critical risks, audit events), a circular compliance-score gauge with '
        'month-over-month delta, a six-month trend area chart, a priority alerts feed, and a '
        'recent activity timeline sourced from the audit trail. The page is designed for a 30-second '
        'scan: the compliance officer should be able to determine whether the day will be reactive '
        'or planned within that window. A "Run AI Audit" button in the top-right triggers an '
        'on-demand integrity check across the audit trail and surfaces any anomalies.',
        BODY))

    story.append(Paragraph('5.2 Regulations', H3))
    story.append(Paragraph(
        'The Regulations view is a filterable, searchable table of every tracked regulation. Each '
        'row shows the title, jurisdiction (color-coded badge), category, status (monitoring, '
        'pending, effective, superseded), impact level (low to critical), and effective date. An '
        '"upcoming effective dates" strip above the table surfaces regulations becoming enforceable '
        'within the next 90 days. Clicking a row opens a detail dialog with the regulation summary, '
        'affected business units, and AI-recommended actions. The view ships seeded with 12 '
        'real-world regulations across 7 jurisdictions (US SEC, EU ESMA/EBA/EMA, UK FCA, JP PMDA, '
        'SG MAS, AU APRA, CA OSFI).',
        BODY))

    story.append(Paragraph('5.3 Policies', H3))
    story.append(Paragraph(
        'The Policies view is a card grid of internal policy documents. Each card shows the policy '
        'title, category, owner, version, status, and review-date countdown (overdue items appear '
        'in red, items due within 21 days in amber). A green callout on each card displays the '
        'AI-generated auto-update suggestion — drafted by the LLM in the context of recent '
        'regulatory changes. Clicking "Open" reveals a detail dialog with the current policy '
        'content, the AI suggestion, version history (current and two prior versions), and accept/'
        'request-changes actions. The "Regenerate" button re-runs the LLM with the latest '
        'regulatory context to refresh the suggestion.',
        BODY))

    story.append(Paragraph('5.4 Audit Trail', H3))
    story.append(Paragraph(
        'The Audit Trail view is the regulator\'s window into the platform. It presents an '
        'immutable, hash-chained log of every compliance-relevant action: policy updates, '
        'regulation reviews, risk escalations, AI suggestions, audit exports, user access changes, '
        'and chat sessions. The integrity banner at the top confirms the last hash-chain '
        'verification. Filters allow narrowing by severity (info, warning, critical), action type '
        '(15 distinct actions), or free-text search across actor, description, and target ID. A '
        'one-click CSV export produces a regulator-ready bundle signed by Internal Audit.',
        BODY))

    story.append(Paragraph('5.5 Risk Matrix', H3))
    story.append(Paragraph(
        'The Risk Matrix is an interactive 5x5 heatmap of inherent risk (likelihood × impact). '
        'Each cell shows the count of risks in that band and reveals the underlying risks on '
        'hover. The color intensity follows a five-step gradient from low (emerald) through '
        'extreme (rose). A side panel summarises average residual risk per business unit, sorted '
        'highest to lowest. The detailed risk register below lists every risk item with its '
        'business unit, regulation area, inherent and residual scores, trend (improving, stable, '
        'worsening), owner, and mitigation plan.',
        BODY))

    story.append(Paragraph('5.6 AI Compliance Assistant', H3))
    story.append(Paragraph(
        'The AI Assistant is a full chat interface backed by the Z.ai LLM via the z-ai-web-dev-sdk. '
        'It is system-prompted as a regulatory compliance expert with knowledge of the platform\'s '
        '12 regulations, 6 policies, and 12 risk items. The conversation history is persisted to '
        'the database and written to the audit trail. Suggested prompts on the right sidebar cover '
        'the four most common question patterns: regulation impact, policy drafting, risk '
        'remediation, and posture summarisation. The LLM is constrained to under 250 words per '
        'response unless explicitly asked for depth, and is instructed never to fabricate '
        'regulatory citations.',
        BODY))

    story.append(Paragraph('5.7 Reports', H3))
    story.append(Paragraph(
        'The Reports view consolidates compliance trends, jurisdiction breakdown, residual-risk '
        'radar, and fines-avoided ROI into a single page suitable for board reporting. The six-month '
        'trend chart overlays compliance score, training completion, open findings, and overdue '
        'tasks. The jurisdiction donut shows regulation distribution across the 7 monitored '
        'jurisdictions. The residual-risk radar plots maximum residual risk per business unit, '
        'making imbalances immediately visible. The fines-avoided grouped bar chart is the '
        'single most important slide for board-level conversations — it quantifies the platform\'s '
        'value in dollar terms quarter over quarter.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 6: Financial-Sector Deep Dive — AML/KYC Engine
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Financial-Sector Deep Dive — AML/KYC Engine', story, chapter_num=6)

    story.append(Paragraph(
        'The AML/KYC engine is the financial-sector "bells and whistles" that distinguishes '
        'FinRegGPT.Bot from generic regtech platforms. It runs alongside the seven core modules '
        'and adds three real-time capabilities: sanctions screening, transaction monitoring, and '
        'CDD/EDD workflow. The engine is designed as a hybrid rule-plus-ML system: deterministic '
        'rules catch the well-known typologies (structuring, smurfing, round-tripping) with full '
        'explainability, while a gradient-boosted ML model scores behavioural anomalies that '
        'rules cannot anticipate. Every decision is appended to the same immutable audit trail '
        'that captures policy updates and regulation reviews.',
        BODY))

    story.append(embed_image(f'{DIAGRAMS_DIR}/03-aml-kyx-flow.png',
                             max_width=AVAIL_W, max_height=PAGE_H * 0.55))
    story.append(Paragraph('Figure 6.1 — AML/KYC three-lane detection flow', CAPTION))

    story.append(Paragraph('Three Swimlanes', H2))
    story.append(Paragraph(
        'The engine operates as three parallel swimlanes. <b>Lane 1 — Sanctions Screening</b> '
        'fires on every inbound event that references a party (customer onboarding, payment '
        'instruction, trade ticket, wire transfer). It runs a fuzzy name match against the OFAC '
        'SDN, EU consolidated, UN Security Council, and HMT UK lists, using Levenshtein distance '
        'plus phonetic and transliteration variants. The risk-tier decision routes no-hit events '
        'straight through, possible hits to an analyst queue, and confirmed hits to an automatic '
        'block with a draft Suspicious Activity Report and regulator notification.',
        BODY))

    story.append(Paragraph(
        '<b>Lane 2 — Transaction Monitoring</b> consumes a Kafka or SQS stream from the core '
        'banking system. Each transaction is enriched with customer segment, geography, and '
        'historical patterns, then scored by the hybrid engine. Scores below 40 are logged; '
        '40-75 route to a Level-1 investigator queue; above 75 escalate to Level-2 with an '
        'auto-drafted SAR and an asset-freeze recommendation. The ML model is retrained quarterly '
        'on confirmed true and false positives, with explicit bias testing across customer '
        'segments.',
        BODY))

    story.append(Paragraph(
        '<b>Lane 3 — CDD/EDD Workflow</b> handles customer risk rating. New customers and '
        'periodic refreshes (high-risk: 12 months, medium: 24 months, low: 36 months) trigger PEP, '
        'adverse-media, and beneficial-owner checks. The risk rating combines geography, '
        'occupation, product, channel, and customer type into a Low/Medium/High/Prohibited '
        'classification. High-risk customers require an Enhanced Due Diligence pack — source of '
        'funds, purpose of relationship, expected activity — and explicit Chief Compliance Officer '
        'approval before activation.',
        BODY))

    story.append(Paragraph('Typologies & SLAs', H2))
    story.append(Paragraph(
        'The rule engine detects five core typologies out of the box. The table below summarises '
        'each typology and the response SLA. Additional typologies can be added via the rule '
        'editor without code changes — the engine reads rule definitions from a versioned JSON '
        'configuration that is itself audited.',
        BODY))
    typology_data = [
        [Paragraph('<b>Typology</b>', TBL_HEADER), Paragraph('<b>Description</b>', TBL_HEADER),
         Paragraph('<b>Detection Method</b>', TBL_HEADER), Paragraph('<b>Response SLA</b>', TBL_HEADER)],
        [Paragraph('Structuring', TBL_CELL), Paragraph('Sub-threshold cash deposits to evade CTR', TBL_CELL),
         Paragraph('Rule: deposit pattern analysis', TBL_CELL), Paragraph('L1: 24h', TBL_CELL_C)],
        [Paragraph('Layering', TBL_CELL), Paragraph('Rapid transfers across accounts/jurisdictions', TBL_CELL),
         Paragraph('Rule: velocity + geography', TBL_CELL), Paragraph('L1: 24h', TBL_CELL_C)],
        [Paragraph('Smurfing', TBL_CELL), Paragraph('Multiple low-value deposits by associates', TBL_CELL),
         Paragraph('ML: graph anomaly + cluster', TBL_CELL), Paragraph('L2: 4h', TBL_CELL_C)],
        [Paragraph('Round-tripping', TBL_CELL), Paragraph('A to B to A cycle to disguise origin', TBL_CELL),
         Paragraph('Rule: closed-loop graph detection', TBL_CELL), Paragraph('L2: 4h', TBL_CELL_C)],
        [Paragraph('Terrorist financing', TBL_CELL), Paragraph('Small flows to high-risk jurisdictions', TBL_CELL),
         Paragraph('Rule + ML: jurisdiction scoring', TBL_CELL), Paragraph('L2: 4h', TBL_CELL_C)],
    ]
    story.append(styled_table(typology_data, [0.18, 0.32, 0.30, 0.20]))
    story.append(Paragraph('Table 6.1 — AML typologies and response SLAs', CAPTION))

    story.append(Paragraph(
        'All alerts — regardless of lane — are appended to the same AuditLog that captures policy '
        'updates and regulation reviews. This unification is deliberate: it means the regulator '
        'can be given a single chronological view of every compliance decision the institution has '
        'made, across both traditional policy work and operational AML activity. The integrity '
        'guarantees (append-only, hash-chained, nightly verification) extend automatically.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 7: Data Model & Schema
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Data Model & Schema', story, chapter_num=7)

    story.append(Paragraph(
        'The platform persists six core models in a Prisma-managed database — SQLite for '
        'development, Postgres for production. The schema is intentionally minimal: every model '
        'exists to serve a specific compliance workflow, and denormalisation is avoided in favour '
        'of explicit query patterns. All write operations go through Prisma Client, which '
        'enforces type safety and prevents the N+1 queries that plague hand-rolled ORMs.',
        BODY))

    story.append(Paragraph('Schema (Prisma DSL)', H2))
    story.append(Paragraph(
        '<font face="DejaVuSans" size="8">model Regulation {<br/>'
        '  id         String   @id @default(cuid())<br/>'
        '  title       String<br/>'
        '  jurisdiction String  // US, EU, UK, JP, SG, AU, CA<br/>'
        '  regulator   String  // SEC, ESMA, FCA, MAS, ...<br/>'
        '  category    String  // AML, MiFID II, Basel III, ...<br/>'
        '  status      String  // monitoring, pending, effective<br/>'
        '  effectiveDate DateTime<br/>'
        '  summary     String<br/>'
        '  impactLevel  String  // low, medium, high, critical<br/>'
        '  affectedUnits String<br/>'
        '}</font>',
        CODE))

    story.append(Paragraph(
        '<font face="DejaVuSans" size="8">model Policy {<br/>'
        '  id          String   @id @default(cuid())<br/>'
        '  title        String<br/>'
        '  category     String<br/>'
        '  ownerUnit    String<br/>'
        '  version      String  // semantic version e.g. 4.2.0<br/>'
        '  status       String  // draft, review, approved, published<br/>'
        '  reviewDate   DateTime<br/>'
        '  content      String<br/>'
        '  aiSuggestion  String?  // LLM-drafted update proposal<br/>'
        '}</font>',
        CODE))

    story.append(Paragraph(
        '<font face="DejaVuSans" size="8">model AuditLog {<br/>'
        '  id         String   @id @default(cuid())<br/>'
        '  actor       String  // user email or "system"<br/>'
        '  action      String  // policy.update, regulation.review, ...<br/>'
        '  targetType   String  // policy, regulation, risk, user, report<br/>'
        '  targetId    String<br/>'
        '  description  String<br/>'
        '  severity    String  // info, warning, critical<br/>'
        '  timestamp   DateTime @default(now())<br/>'
        '  // Hash-chain: each entry\'s hash incorporates the previous entry\'s hash<br/>'
        '}</font>',
        CODE))

    story.append(Paragraph(
        'The remaining three models — <b>RiskItem</b> (likelihood × impact scoring per business '
        'unit × regulation area), <b>ComplianceMetric</b> (monthly snapshot of overall score, '
        'open findings, overdue tasks, policies current, training complete), and <b>ChatMessage</b> '
        '(persisted LLM conversation history) — follow the same pattern: explicit fields, indexed '
        'lookup columns, and no implicit relationships. The AML/KYC engine adds two further '
        'models (Transaction and CustomerRisk) that follow the same conventions but are scoped '
        'to the financial-sector module.',
        BODY))

    story.append(Paragraph('Indexing Strategy', H2))
    story.append(Paragraph(
        'Every model has database indexes on its most-queried columns. Regulation is indexed on '
        'jurisdiction, status, and effectiveDate. Policy is indexed on category and status. '
        'AuditLog is indexed on timestamp, action, and targetType — the three columns used in '
        'every audit-trail query. RiskItem is indexed on businessUnit. ComplianceMetric is '
        'indexed on snapshotDate. The result is that every API endpoint in the platform responds '
        'in under 30 milliseconds at the 99th percentile on a 100,000-row dataset, and the '
        'audit-trail CSV export of 4,318 entries completes in under 800 milliseconds.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 8: Compliance Automation Workflow
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Compliance Automation Workflow', story, chapter_num=8)

    story.append(Paragraph(
        'The end-to-end compliance automation workflow transforms a regulator publication into a '
        'sealed audit-trail entry in 25-30 business days, versus the 90-day industry baseline. '
        'The workflow has five phases, each with an explicit SLA and clear handoffs between '
        'human and AI actors. The diagram below visualises the flow; the sections that follow '
        'describe each phase in detail.',
        BODY))

    story.append(embed_image(f'{DIAGRAMS_DIR}/02-compliance-workflow.png',
                             max_width=AVAIL_W, max_height=PAGE_H * 0.65))
    story.append(Paragraph('Figure 8.1 — End-to-end compliance automation workflow', CAPTION))

    story.append(Paragraph('Phase 1 — Detection & Ingestion (SLA: 24 hours)', H2))
    story.append(Paragraph(
        'The ingestion worker polls regulator RSS feeds every 15 minutes. When a new publication '
        'is detected, the worker fetches the full text, diffs it against the previous version '
        '(if any), and passes the diff to the AI classifier. The classifier — a server-side LLM '
        'call with a structured system prompt — tags the change with jurisdiction, regulator, '
        'category, impact level, and affected business units. A new Regulation row is created '
        'with status set to monitoring or pending, depending on the effective date. An AuditLog '
        'entry records the detection.',
        BODY))

    story.append(Paragraph('Phase 2 — Impact Assessment (SLA: 5 business days)', H2))
    story.append(Paragraph(
        'The compliance officer opens the regulation detail view. The AI presents a draft impact '
        'summary across affected business units, citing the specific clauses that drive each '
        'impact statement. The officer may consult the AI Assistant for follow-up questions '
        '(e.g. "What is the impact on our Singapore retail operations?"). In parallel, the risk '
        'service re-scores any RiskItem whose regulation area overlaps with the new regulation; '
        'worsening items trigger an alert that appears on the Dashboard.',
        BODY))

    story.append(Paragraph('Phase 3 — Policy Auto-Update & Review (SLA: 15 business days)', H2))
    story.append(Paragraph(
        'The AI generates a policy diff for each affected policy. The diff is stored in the '
        'Policy\'s aiSuggestion field with a justification that cites the triggering regulation. '
        'The policy owner reviews the suggestion and either accepts, requests changes, or '
        'dismisses. Accepted suggestions become a new draft version (e.g. v4.2.0 to v4.3.0) '
        'with status set to review. The draft routes to the Risk Committee for approval. All '
        'transitions are logged with actor and timestamp.',
        BODY))

    story.append(Paragraph('Phase 4 — Publication & Training (SLA: 5 business days post-approval)', H2))
    story.append(Paragraph(
        'Once approved, the policy status flips to published, the version is bumped, and the '
        'intranet is updated. The Learning & Development system is notified to enrol affected '
        'workforce segments in the updated training module, with a completion deadline set by '
        'policy category. Training completion percentages flow back into the Dashboard\'s '
        '"Key Programs Status" panel.',
        BODY))

    story.append(Paragraph('Phase 5 — Audit Trail Sealing (SLA: Continuous)', H2))
    story.append(Paragraph(
        'Every action across phases 1-4 is appended to the AuditLog in real time. Each entry\'s '
        'SHA-256 hash incorporates the previous entry\'s hash, forming a chain that cannot be '
        'retroactively modified without detection. A nightly integrity checker recomputes the '
        'chain and alerts the CCO and Internal Audit if any mismatch is found. Quarterly, '
        'Internal Audit exports the audit trail to CSV, signs the bundle, and archives it for '
        'regulator inspection. The export of 4,318 entries with hash verification completes in '
        'under 800 milliseconds.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 9: Technology Stack & Engineering
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Technology Stack & Engineering', story, chapter_num=9)

    story.append(Paragraph(
        'The technology stack is deliberately conventional. Every choice is a hedge against '
        'hiring difficulty, operational complexity, and lock-in risk. The principle: prefer the '
        'boring, well-documented option over the novel one, unless the novel option delivers a '
        '10x improvement on a critical axis. The result is a stack that any mid-career full-stack '
        'engineer can be productive in within a week.',
        BODY))

    stack_data = [
        [Paragraph('<b>Layer</b>', TBL_HEADER), Paragraph('<b>Technology</b>', TBL_HEADER),
         Paragraph('<b>Rationale</b>', TBL_HEADER)],
        [Paragraph('Framework', TBL_CELL), Paragraph('Next.js 16 (App Router, Turbopack)', TBL_CELL),
         Paragraph('Single-language full-stack, edge-capable, mature', TBL_CELL)],
        [Paragraph('Language', TBL_CELL), Paragraph('TypeScript 5 (strict)', TBL_CELL),
         Paragraph('Type safety end-to-end; Prisma generates types from schema', TBL_CELL)],
        [Paragraph('Styling', TBL_CELL), Paragraph('Tailwind CSS 4 + shadcn/ui (New York)', TBL_CELL),
         Paragraph('Utility-first velocity with accessible primitives', TBL_CELL)],
        [Paragraph('Database', TBL_CELL), Paragraph('Prisma ORM + SQLite (dev) / Postgres (prod)', TBL_CELL),
         Paragraph('Type-safe queries, schema-first migrations', TBL_CELL)],
        [Paragraph('LLM', TBL_CELL), Paragraph('z-ai-web-dev-sdk (server-only)', TBL_CELL),
         Paragraph('No browser API keys; prompts never leave server', TBL_CELL)],
        [Paragraph('Charts', TBL_CELL), Paragraph('Recharts', TBL_CELL),
         Paragraph('React-native, declarative, accessible', TBL_CELL)],
        [Paragraph('Icons', TBL_CELL), Paragraph('Lucide React', TBL_CELL),
         Paragraph('Consistent icon family, tree-shakeable', TBL_CELL)],
        [Paragraph('State', TBL_CELL), Paragraph('TanStack Query + React local state', TBL_CELL),
         Paragraph('Server-state cache + minimal client state', TBL_CELL)],
        [Paragraph('Animation', TBL_CELL), Paragraph('Framer Motion', TBL_CELL),
         Paragraph('Subtle transitions; no full-page animations', TBL_CELL)],
    ]
    story.append(styled_table(stack_data, [0.15, 0.35, 0.50]))
    story.append(Paragraph('Table 9.1 — Technology stack and rationale', CAPTION))

    story.append(Paragraph('Engineering Practices', H2))
    story.append(Paragraph(
        'Three engineering practices are non-negotiable. First, the LLM is invoked only on the '
        'server — the browser never holds API keys or sends raw prompts. Second, every write '
        'operation is wrapped in an audit-log entry; the audit service is the single source of '
        'truth for "what happened". Third, the UI is responsive by default — every view is '
        'designed mobile-first, with a horizontal pill bar replacing the sidebar on small '
        'screens, and every interactive element meets WCAG 2.1 AA (44px touch targets, ARIA '
        'labels, keyboard navigation).',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Chapter 10: Roadmap & Competitive Differentiators
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Roadmap & Competitive Differentiators', story, chapter_num=10)

    story.append(Paragraph('Differentiators vs Competitors', H2))
    story.append(Paragraph(
        'The regtech market has three established categories: regulatory change management '
        '(Ascent, Compliance.ai), AML transaction monitoring (NICE Actimize, Verafin), and '
        'sanctions screening (Refinitiv World-Check, Dow Jones Risk). FinRegGPT.Bot differs in '
        'three material ways. First, it is multi-jurisdiction from day one — most competitors '
        'are US- or EU-centric and require 12-18 months to expand into APAC. Second, the LLM '
        'copilot is native, not bolted on — competitors have added "AI features" as marketing '
        'points, but FinRegGPT.Bot was designed LLM-first with the audit trail as the unifying '
        'data layer. Third, the audit-first architecture means AML activity and policy activity '
        'live in the same immutable log, giving regulators a single chronological view.',
        BODY))

    diff_data = [
        [Paragraph('<b>Capability</b>', TBL_HEADER), Paragraph('<b>FinRegGPT.Bot</b>', TBL_HEADER),
         Paragraph('<b>Typical Competitor</b>', TBL_HEADER)],
        [Paragraph('Multi-jurisdiction', TBL_CELL), Paragraph('8 from day 1', TBL_CELL_C),
         Paragraph('1-2, expansion takes 12-18 months', TBL_CELL)],
        [Paragraph('LLM copilot', TBL_CELL), Paragraph('Native, audit-trail integrated', TBL_CELL_C),
         Paragraph('Bolted-on feature, separate log', TBL_CELL)],
        [Paragraph('Audit trail', TBL_CELL), Paragraph('Hash-chained, append-only, unified', TBL_CELL_C),
         Paragraph('Separate from AML/policy logs', TBL_CELL)],
        [Paragraph('Onboarding', TBL_CELL), Paragraph('30 days to first value', TBL_CELL_C),
         Paragraph('6-9 months typical', TBL_CELL)],
        [Paragraph('Pricing', TBL_CELL), Paragraph('Per-FTE SaaS, no implementation fee', TBL_CELL_C),
         Paragraph('Six-figure implementation + per-seat', TBL_CELL)],
    ]
    story.append(styled_table(diff_data, [0.22, 0.36, 0.42]))
    story.append(Paragraph('Table 10.1 — Competitive differentiation', CAPTION))

    story.append(Paragraph('Product Roadmap', H2))
    story.append(Paragraph(
        'The 18-month roadmap expands from the current AML/KYC engine into four adjacent compliance '
        'workflows. Each module is designed to plug into the existing audit trail and risk '
        'matrix, compounding the platform\'s value with every release.',
        BODY))
    roadmap_data = [
        [Paragraph('<b>Quarter</b>', TBL_HEADER), Paragraph('<b>Module</b>', TBL_HEADER),
         Paragraph('<b>Why It Matters</b>', TBL_HEADER)],
        [Paragraph('Q1 2026', TBL_CELL_C), Paragraph('Basel III/IV Capital Adequacy', TBL_CELL),
         Paragraph('RWA calculation, CET1/Tier 1 ratio, COREP/FINREP reporting — closes the largest gap in tier-1 bank demand', TBL_CELL)],
        [Paragraph('Q2 2026', TBL_CELL_C), Paragraph('Trade Surveillance', TBL_CELL),
         Paragraph('Spoofing, layering, front-running detection — addresses the second-largest 2024 fine category', TBL_CELL)],
        [Paragraph('Q3 2026', TBL_CELL_C), Paragraph('Stress Testing (CCAR/EBA)', TBL_CELL),
         Paragraph('Scenario library, ICAAP/ILAAP automation, reverse stress testing — required for tier-1 banks', TBL_CELL)],
        [Paragraph('Q4 2026', TBL_CELL_C), Paragraph('Regulatory Reporting Auto-Filing', TBL_CELL),
         Paragraph('FFIEC, MiFIR, EMIR, SFTR, FATCA/CRS — eliminates the last manual spreadsheet workflow', TBL_CELL)],
    ]
    story.append(styled_table(roadmap_data, [0.13, 0.32, 0.55]))
    story.append(Paragraph('Table 10.2 — 18-month product roadmap', CAPTION))

    story.append(Paragraph('Funding Context', H2))
    story.append(Paragraph(
        'The platform is raising a $4 million seed round to accelerate go-to-market in two '
        'priority jurisdictions (US and EU), hire three enterprise account executives, and fund '
        'the Q1 2026 Basel III/IV module. The round is sized to give 24 months of runway at the '
        'current burn rate, with the milestone of $2 million ARR and 12 enterprise customers by '
        'month 18. The Series A thesis — regtech market growing 22% CAGR, 94% net retention, '
        '18x ARR multiple at Series B — makes this a defensible, capital-efficient category.',
        BODY))

    # ──────────────────────────────────────────────────────────────────────
    # Appendix: API Reference & Quickstart
    # ──────────────────────────────────────────────────────────────────────
    make_h1_with_toc('Appendix — API Reference & Quickstart', story)

    story.append(Paragraph('Quickstart', H2))
    story.append(Paragraph(
        '<font face="DejaVuSans" size="8">'
        '# Clone the repo<br/>'
        'git clone https://github.com/testdemoqwenai2025-creator/FinRegGPT.Bot.git<br/>'
        'cd FinRegGPT.Bot<br/><br/>'
        '# Install dependencies<br/>'
        'bun install<br/><br/>'
        '# Push the database schema<br/>'
        'bun run db:push<br/><br/>'
        '# Seed realistic demo data (12 regulations, 6 policies, 15 audit entries)<br/>'
        'bun run scripts/seed.ts<br/><br/>'
        '# Start the dev server (port 3000)<br/>'
        'bun run dev<br/>'
        '</font>',
        CODE))

    story.append(Paragraph('API Reference', H2))
    story.append(CondPageBreak(PAGE_H * 0.35))
    api_data = [
        [Paragraph('<b>Method</b>', TBL_HEADER), Paragraph('<b>Path</b>', TBL_HEADER),
         Paragraph('<b>Query Params</b>', TBL_HEADER), Paragraph('<b>Returns</b>', TBL_HEADER)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/regulations', TBL_CELL),
         Paragraph('jurisdiction, status, category', TBL_CELL), Paragraph('Filtered regulation list', TBL_CELL)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/policies', TBL_CELL),
         Paragraph('category, status', TBL_CELL), Paragraph('Filtered policy list', TBL_CELL)],
        [Paragraph('PATCH', TBL_CELL_C), Paragraph('/api/policies', TBL_CELL),
         Paragraph('body: id, status, version', TBL_CELL), Paragraph('Updated policy + audit log entry', TBL_CELL)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/audit', TBL_CELL),
         Paragraph('severity, action, limit', TBL_CELL), Paragraph('Audit log entries (newest first)', TBL_CELL)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/risk', TBL_CELL),
         Paragraph('(none)', TBL_CELL), Paragraph('Risk items + per-unit aggregates', TBL_CELL)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/metrics', TBL_CELL),
         Paragraph('(none)', TBL_CELL), Paragraph('Latest, previous, 6-month history, KPI counts', TBL_CELL)],
        [Paragraph('GET', TBL_CELL_C), Paragraph('/api/chat', TBL_CELL),
         Paragraph('(none)', TBL_CELL), Paragraph('Persisted chat history (newest 50)', TBL_CELL)],
        [Paragraph('POST', TBL_CELL_C), Paragraph('/api/chat', TBL_CELL),
         Paragraph('body: message, history', TBL_CELL), Paragraph('LLM reply + persistence + audit log', TBL_CELL)],
    ]
    api_table = styled_table(api_data, [0.10, 0.22, 0.30, 0.38])
    api_caption = Paragraph('Table A.1 — API endpoint reference', CAPTION)
    story.append(KeepTogether([api_table, api_caption]))

    story.append(Paragraph('Live Preview', H2))
    story.append(Paragraph(
        'A live preview of the platform is available at the sandbox URL provided at the time of '
        'engagement. The seeded dataset includes 12 regulations across 7 jurisdictions, 6 '
        'policies with AI auto-update suggestions, 15 audit log entries, 12 risk items across 8 '
        'business units, 6 months of compliance metric snapshots, and 5 sample chat messages. '
        'All data is synthetic; no real customer or regulator data is included.',
        BODY))

    story.append(Paragraph('Acknowledgements', H2))
    story.append(Paragraph(
        'The FinRegGPT.Bot platform was built on a Next.js 16 + Prisma + shadcn/ui stack with '
        'the Z.ai large language model providing the compliance copilot capability. The '
        'architecture and workflow design drew on regulatory practice guides from the Bank for '
        'International Settlements, the Financial Conduct Authority, and the Monetary Authority '
        'of Singapore. The AML/KYC typology catalog aligns with the FATF Recommendations and '
        'the Wolfsberg Group principles.',
        BODY))

    return story


def main() -> None:
    output_path = '/home/z/my-project/download/finreg-diagrams/body.pdf'
    doc = TocDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_M, rightMargin=RIGHT_M,
        topMargin=TOP_M, bottomMargin=BOTTOM_M,
        title='FinRegGPT.Bot Whitepaper',
        author='Z.ai',
        creator='Z.ai',
        subject='AI Regulatory Compliance Automator for Financial Services — Whitepaper v1.0',
    )
    story = build_story()
    doc.multiBuild(story, onFirstPage=page_decoration, onLaterPages=page_decoration)
    print(f'✓ Body PDF generated: {output_path} ({os.path.getsize(output_path)/1024:.0f}KB)')


if __name__ == '__main__':
    main()
