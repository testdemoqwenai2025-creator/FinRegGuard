#!/usr/bin/env python3
"""
Build the RegGuard AI Product Roadmap HTML (Bloomberg-dark, investor-grade).

Output: /home/z/my-project/scripts/roadmap.html

Then rendered to PDF via:
    node /home/z/my-project/skills/pdf/scripts/html2pdf-next.js \
        /home/z/my-project/scripts/roadmap.html \
        --output /home/z/my-project/download/RegGuard-AI-Roadmap-v2.3.pdf \
        --width 720px --height 1020px
"""

from pathlib import Path

OUT_HTML = Path("/home/z/my-project/scripts/roadmap.html")

CSS = r"""
@page {
    size: 720px 1020px;
    margin: 0 0 32px 0;
    @bottom-right {
        content: counter(page);
        font-family: 'JetBrains Mono', 'Liberation Mono', monospace;
        font-size: 9px;
        color: #6B7280;
        margin: 0 24px 8px 0;
    }
    @bottom-left {
        content: "RegGuard AI · Roadmap v2.3 · Investor Confidential";
        font-family: 'JetBrains Mono', 'Liberation Mono', monospace;
        font-size: 9px;
        color: #6B7280;
        margin: 0 0 8px 24px;
    }
}
@page :first {
    margin: 0;
    @bottom-right { content: none; }
    @bottom-left { content: none; }
}
@page ending-page {
    margin: 0;
    @bottom-right { content: none; }
    @bottom-left { content: none; }
}
.ending {
    page: ending-page;
}
:root {
    --c-bg: #0B1220;
    --c-bg-soft: #111B2E;
    --c-bg-card: #16223A;
    --c-border: #1F2D4A;
    --c-text: #E5E7EB;
    --c-text-soft: #9CA3AF;
    --c-text-dim: #6B7280;
    --c-amber: #F59E0B;
    --c-amber-soft: #FCD34D;
    --c-cyan: #06B6D4;
    --c-cyan-soft: #67E8F9;
    --c-emerald: #10B981;
    --c-rose: #F43F5E;
    --c-violet: #8B5CF6;
}
html, body {
    margin: 0;
    padding: 0;
    width: 720px;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: 'Inter', 'Liberation Sans', sans-serif;
    font-size: 13px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}
@media screen {
    html {
        height: auto;
        display: flex;
        justify-content: center;
        background: #1a1a1a;
    }
    body {
        transform-origin: top center;
        margin: 20px auto;
        box-shadow: 0 0 60px rgba(0,0,0,0.6);
    }
}

/* ──────────────────────────────────────────────────────────────
   COVER PAGE
   ────────────────────────────────────────────────────────────── */
.cover {
    width: 720px;
    height: 1020px;
    box-sizing: border-box;
    background:
        radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.08), transparent 50%),
        radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.08), transparent 50%),
        var(--c-bg);
    position: relative;
    overflow: hidden;
    break-after: page;
    padding: 80px 70px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.cover-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(31, 45, 74, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(31, 45, 74, 0.3) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    opacity: 0.5;
}
.cover-top {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.cover-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}
.cover-brand-mark {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--c-amber), var(--c-cyan));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    color: #0B1220;
    font-size: 16px;
}
.cover-brand-name {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--c-text);
}
.cover-brand-tag {
    font-size: 10px;
    color: var(--c-text-dim);
    letter-spacing: 1.5px;
    text-transform: uppercase;
}
.cover-meta {
    text-align: right;
    font-family: 'JetBrains Mono', 'Liberation Mono', monospace;
    font-size: 10px;
    color: var(--c-text-dim);
    line-height: 1.7;
}
.cover-meta-row {
    display: block;
}
.cover-meta-row .label {
    color: var(--c-text-dim);
}
.cover-meta-row .value {
    color: var(--c-cyan-soft);
    margin-left: 6px;
}

.cover-middle {
    position: relative;
    z-index: 2;
    margin-top: 60px;
}
.cover-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--c-amber);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}
.cover-eyebrow::before {
    content: "";
    display: inline-block;
    width: 32px;
    height: 1px;
    background: var(--c-amber);
}
.cover-title {
    font-size: 60px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -1.5px;
    color: var(--c-text);
    margin: 0 0 24px 0;
}
.cover-title .accent {
    background: linear-gradient(135deg, var(--c-amber), var(--c-amber-soft));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.cover-subtitle {
    font-size: 18px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--c-text-soft);
    max-width: 520px;
    margin-bottom: 32px;
}
.cover-ticker {
    display: flex;
    gap: 28px;
    margin-top: 24px;
    padding: 18px 22px;
    background: rgba(22, 34, 58, 0.6);
    border: 1px solid var(--c-border);
    border-radius: 6px;
    backdrop-filter: blur(8px);
}
.cover-ticker-item {
    display: flex;
    flex-direction: column;
}
.cover-ticker-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-text-dim);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
}
.cover-ticker-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--c-cyan-soft);
}
.cover-ticker-value.amber {
    color: var(--c-amber);
}

.cover-bottom {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 24px;
    border-top: 1px solid var(--c-border);
}
.cover-author {
    font-size: 11px;
    color: var(--c-text-soft);
    line-height: 1.6;
}
.cover-author .name {
    color: var(--c-text);
    font-weight: 600;
}
.cover-classification {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-amber);
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 6px 10px;
    border: 1px solid var(--c-amber);
    border-radius: 3px;
}

/* ──────────────────────────────────────────────────────────────
   MAIN CONTENT (FLOWING)
   ────────────────────────────────────────────────────────────── */
.main-content {
    padding: 60px 60px 50px 60px;
}

/* TOC */
.toc-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--c-amber);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 8px;
}
.toc-h1 {
    font-size: 32px;
    font-weight: 800;
    color: var(--c-text);
    margin: 0 0 32px 0;
    letter-spacing: -0.5px;
}
.toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.toc-item {
    display: flex;
    align-items: baseline;
    padding: 9px 0;
    border-bottom: 1px solid var(--c-border);
    font-size: 13px;
}
.toc-num {
    font-family: 'JetBrains Mono', monospace;
    color: var(--c-cyan);
    width: 36px;
    flex-shrink: 0;
    font-weight: 600;
}
.toc-name {
    color: var(--c-text);
    flex: 1;
}
.toc-dots {
    flex: 0 1 auto;
    border-bottom: 1px dotted var(--c-text-dim);
    margin: 0 8px;
    min-width: 20px;
    height: 0;
    position: relative;
    top: -3px;
}
.toc-page {
    font-family: 'JetBrains Mono', monospace;
    color: var(--c-text-soft);
    font-size: 12px;
}

/* Chapter headers */
.chapter-header {
    break-after: avoid;
    break-inside: avoid;
    margin-top: 28px;
    margin-bottom: 18px;
}
.chapter-header:first-of-type {
    margin-top: 0;
}
.chapter-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--c-amber);
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.chapter-tag::before {
    content: "";
    display: inline-block;
    width: 18px;
    height: 1px;
    background: var(--c-amber);
}
.chapter-title {
    font-size: 24px;
    font-weight: 800;
    color: var(--c-text);
    margin: 0 0 8px 0;
    letter-spacing: -0.3px;
    line-height: 1.2;
}
.chapter-subtitle {
    font-size: 13px;
    color: var(--c-text-soft);
    font-weight: 400;
    line-height: 1.5;
}
.chapter-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, var(--c-amber), var(--c-border) 30%, transparent);
    margin: 12px 0 18px 0;
}

/* Body text */
.body-text {
    color: var(--c-text);
    font-size: 12.5px;
    line-height: 1.7;
    margin: 0 0 12px 0;
    text-align: left;
}
.body-text strong {
    color: var(--c-amber-soft);
    font-weight: 600;
}
.body-text em {
    color: var(--c-cyan-soft);
    font-style: normal;
    font-weight: 500;
}

/* Pull quote / callout */
.callout {
    break-inside: avoid;
    margin: 16px 0;
    padding: 16px 18px;
    background: var(--c-bg-card);
    border-left: 3px solid var(--c-amber);
    border-radius: 4px;
}
.callout-cyan {
    border-left-color: var(--c-cyan);
}
.callout-emerald {
    border-left-color: var(--c-emerald);
}
.callout-rose {
    border-left-color: var(--c-rose);
}
.callout-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-amber);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
}
.callout-cyan .callout-label { color: var(--c-cyan); }
.callout-emerald .callout-label { color: var(--c-emerald); }
.callout-rose .callout-label { color: var(--c-rose); }
.callout-body {
    font-size: 12.5px;
    color: var(--c-text);
    line-height: 1.6;
}
.callout-body strong {
    color: var(--c-amber-soft);
}

/* Stat blocks */
.stat-grid {
    break-inside: avoid;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 16px 0;
}
.stat-card {
    background: var(--c-bg-card);
    border: 1px solid var(--c-border);
    border-radius: 4px;
    padding: 14px 12px;
}
.stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-text-dim);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
}
.stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    color: var(--c-cyan-soft);
    line-height: 1;
}
.stat-value.amber { color: var(--c-amber); }
.stat-value.emerald { color: var(--c-emerald); }
.stat-sub {
    font-size: 10px;
    color: var(--c-text-soft);
    margin-top: 4px;
    line-height: 1.3;
}

/* Feature card */
.feature-card {
    break-inside: avoid;
    margin: 12px 0;
    padding: 14px 16px;
    background: var(--c-bg-soft);
    border: 1px solid var(--c-border);
    border-radius: 5px;
}
.feature-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
}
.feature-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--c-amber);
    font-weight: 700;
}
.feature-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--c-text);
    flex: 1;
}
.feature-effort {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-cyan);
    padding: 2px 6px;
    border: 1px solid var(--c-cyan);
    border-radius: 3px;
    letter-spacing: 0.5px;
}
.feature-body {
    font-size: 12px;
    color: var(--c-text-soft);
    line-height: 1.55;
    margin: 0;
}
.feature-body strong {
    color: var(--c-text);
}

/* Tables */
.data-table {
    break-inside: avoid;
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 11.5px;
}
.data-table thead th {
    background: var(--c-bg-card);
    color: var(--c-amber);
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--c-border);
    letter-spacing: 1px;
    text-transform: uppercase;
}
.data-table tbody td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--c-border);
    color: var(--c-text);
    vertical-align: top;
    line-height: 1.5;
}
.data-table tbody tr:last-child td {
    border-bottom: none;
}
.data-table .mono {
    font-family: 'JetBrains Mono', monospace;
    color: var(--c-cyan-soft);
    font-size: 11px;
}

/* Inline list */
.inline-list {
    margin: 10px 0;
    padding: 0;
    list-style: none;
}
.inline-list li {
    padding: 6px 0 6px 18px;
    position: relative;
    font-size: 12.5px;
    color: var(--c-text);
    line-height: 1.55;
}
.inline-list li::before {
    content: "▸";
    position: absolute;
    left: 0;
    color: var(--c-amber);
    font-weight: 700;
}
.inline-list li strong {
    color: var(--c-amber-soft);
    font-weight: 600;
}

/* SVG chart containers */
.chart-container {
    break-inside: avoid;
    margin: 18px 0;
    padding: 18px 16px 14px 16px;
    background: var(--c-bg-soft);
    border: 1px solid var(--c-border);
    border-radius: 6px;
}
.chart-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--c-amber);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
}
.chart-subtitle {
    font-size: 11px;
    color: var(--c-text-soft);
    margin-bottom: 12px;
}
.chart-svg {
    width: 100%;
    height: auto;
    display: block;
}
.chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-top: 10px;
    font-size: 10px;
    color: var(--c-text-soft);
}
.chart-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
}
.chart-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}
.chart-legend-square {
    width: 12px;
    height: 8px;
    flex-shrink: 0;
}

/* Recommendation card */
.rec-card {
    break-inside: avoid;
    margin: 12px 0;
    padding: 16px 18px;
    background: linear-gradient(135deg, var(--c-bg-card) 0%, var(--c-bg-soft) 100%);
    border: 1px solid var(--c-border);
    border-left: 4px solid var(--c-amber);
    border-radius: 4px;
}
.rec-card.cyan { border-left-color: var(--c-cyan); }
.rec-card.emerald { border-left-color: var(--c-emerald); }
.rec-card.violet { border-left-color: var(--c-violet); }
.rec-card.rose { border-left-color: var(--c-rose); }
.rec-rank {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px;
    font-weight: 900;
    color: var(--c-amber);
    line-height: 1;
    margin-bottom: 4px;
}
.rec-card.cyan .rec-rank { color: var(--c-cyan); }
.rec-card.emerald .rec-rank { color: var(--c-emerald); }
.rec-card.violet .rec-rank { color: var(--c-violet); }
.rec-card.rose .rec-rank { color: var(--c-rose); }
.rec-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-text);
    margin: 0 0 6px 0;
}
.rec-body {
    font-size: 12px;
    color: var(--c-text-soft);
    line-height: 1.55;
    margin: 0 0 8px 0;
}
.rec-meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--c-border);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
}
.rec-meta-label {
    color: var(--c-text-dim);
    letter-spacing: 1px;
    text-transform: uppercase;
}
.rec-meta-value {
    color: var(--c-cyan-soft);
    margin-left: 4px;
    font-weight: 600;
}

/* Ending */
.ending {
    width: 720px;
    height: 1020px;
    box-sizing: border-box;
    break-before: page;
    overflow: hidden;
    background:
        radial-gradient(ellipse at center, rgba(245, 158, 11, 0.06), transparent 60%),
        var(--c-bg);
    padding: 80px 70px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
}
.ending-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(31, 45, 74, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(31, 45, 74, 0.3) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    opacity: 0.4;
}
.ending-middle {
    position: relative;
    z-index: 2;
}
.ending-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--c-amber);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 16px;
}
.ending-title {
    font-size: 36px;
    font-weight: 800;
    color: var(--c-text);
    line-height: 1.15;
    margin: 0 0 18px 0;
    letter-spacing: -0.5px;
}
.ending-body {
    font-size: 13px;
    color: var(--c-text-soft);
    line-height: 1.65;
    max-width: 540px;
}
.ending-bottom {
    position: relative;
    z-index: 2;
    padding-top: 24px;
    border-top: 1px solid var(--c-border);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}
.ending-contact {
    font-size: 11px;
    color: var(--c-text-soft);
    line-height: 1.6;
}
.ending-contact .name {
    color: var(--c-text);
    font-weight: 600;
}
.ending-mark {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--c-text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    text-align: right;
    line-height: 1.6;
}
"""

# ──────────────────────────────────────────────────────────────
# CHART SVGs
# ──────────────────────────────────────────────────────────────

IMPACT_EFFORT_SVG = r"""
<svg viewBox="0 0 580 380" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
  <defs>
    <linearGradient id="bubbleAmber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#D97706" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="bubbleCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#0891B2" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <!-- Quadrant backgrounds -->
  <rect x="60" y="40" width="240" height="150" fill="#10B981" fill-opacity="0.05"/>
  <rect x="300" y="40" width="240" height="150" fill="#F59E0B" fill-opacity="0.06"/>
  <rect x="60" y="190" width="240" height="150" fill="#6B7280" fill-opacity="0.04"/>
  <rect x="300" y="190" width="240" height="150" fill="#6B7280" fill-opacity="0.04"/>

  <!-- Quadrant labels -->
  <text x="180" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#10B981" letter-spacing="1.5">QUICK WINS</text>
  <text x="420" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#F59E0B" letter-spacing="1.5">STRATEGIC BETS</text>
  <text x="180" y="208" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#6B7280" letter-spacing="1.5">FILL-INS</text>
  <text x="420" y="208" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#6B7280" letter-spacing="1.5">DEFER</text>

  <!-- Axes -->
  <line x1="60" y1="40" x2="60" y2="340" stroke="#1F2D4A" stroke-width="1"/>
  <line x1="60" y1="340" x2="540" y2="340" stroke="#1F2D4A" stroke-width="1"/>

  <!-- Axis labels -->
  <text x="300" y="365" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#9CA3AF" letter-spacing="1.5">ENGINEERING EFFORT (engineer-weeks) →</text>
  <text x="22" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#9CA3AF" letter-spacing="1.5" transform="rotate(-90 22 190)">BUSINESS IMPACT →</text>

  <!-- Grid lines -->
  <line x1="300" y1="40" x2="300" y2="340" stroke="#1F2D4A" stroke-width="0.5" stroke-dasharray="2,3"/>
  <line x1="60" y1="190" x2="540" y2="190" stroke="#1F2D4A" stroke-width="0.5" stroke-dasharray="2,3"/>

  <!-- Tick labels -->
  <text x="60" y="354" font-family="JetBrains Mono, monospace" font-size="8" fill="#6B7280">0</text>
  <text x="180" y="354" font-family="JetBrains Mono, monospace" font-size="8" fill="#6B7280" text-anchor="middle">12</text>
  <text x="300" y="354" font-family="JetBrains Mono, monospace" font-size="8" fill="#6B7280" text-anchor="middle">24</text>
  <text x="420" y="354" font-family="JetBrains Mono, monospace" font-size="8" fill="#6B7280" text-anchor="middle">40</text>
  <text x="540" y="354" font-family="JetBrains Mono, monospace" font-size="8" fill="#6B7280" text-anchor="middle">60+</text>

  <!-- Bubbles: position based on effort (x: 60→540 = 0→60 ew) and impact (y: 340→40 = 1→10) -->
  <!-- 1. AI Intelligence Layer — effort=42, impact=9.5, rev=high → amber large -->
  <circle cx="408" cy="50" r="32" fill="url(#bubbleAmber)" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="408" y="48" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#0B1220">1</text>
  <text x="408" y="62" text-anchor="middle" font-family="Inter, sans-serif" font-size="7.5" fill="#0B1220" font-weight="600">AI Layer</text>

  <!-- 2. Workflow & Collaboration — effort=22, impact=7.5, amber medium -->
  <circle cx="278" cy="113" r="22" fill="url(#bubbleAmber)" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="278" y="111" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#0B1220">2</text>
  <text x="278" y="123" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" fill="#0B1220" font-weight="600">Workflow</text>

  <!-- 3. Evidence Vault — effort=14, impact=8.5, amber medium-high -->
  <circle cx="200" cy="83" r="26" fill="url(#bubbleAmber)" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="200" y="81" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#0B1220">3</text>
  <text x="200" y="93" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" fill="#0B1220" font-weight="600">Audit Vault</text>

  <!-- 4. Broader Data Coverage — effort=30, impact=6.5, cyan medium -->
  <circle cx="360" cy="143" r="18" fill="url(#bubbleCyan)" stroke="#06B6D4" stroke-width="1.5"/>
  <text x="360" y="141" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#0B1220">4</text>
  <text x="360" y="152" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" fill="#0B1220" font-weight="600">Jurisdictions</text>

  <!-- 5. Risk & Screening — effort=28, impact=7, cyan medium -->
  <circle cx="344" cy="128" r="20" fill="url(#bubbleCyan)" stroke="#06B6D4" stroke-width="1.5"/>
  <text x="344" y="126" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#0B1220">5</text>
  <text x="344" y="137" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" fill="#0B1220" font-weight="600">Screening</text>

  <!-- 6. Public API & Integrations — effort=18, impact=8, cyan medium-high -->
  <circle cx="240" cy="98" r="22" fill="url(#bubbleCyan)" stroke="#06B6D4" stroke-width="1.5"/>
  <text x="240" y="96" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#0B1220">6</text>
  <text x="240" y="108" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" fill="#0B1220" font-weight="600">API</text>

  <!-- 7. Security & Trust (SSO + SOC 2) — effort=20, impact=9, amber high (enterprise unlock) -->
  <circle cx="260" cy="68" r="28" fill="url(#bubbleAmber)" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="260" y="66" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#0B1220">7</text>
  <text x="260" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" fill="#0B1220" font-weight="600">SOC 2 / SSO</text>

  <!-- 8. UX Polish — effort=10, impact=5, cyan small (Quick Win) -->
  <circle cx="160" cy="158" r="14" fill="url(#bubbleCyan)" stroke="#06B6D4" stroke-width="1.5"/>
  <text x="160" y="156" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#0B1220">8</text>
  <text x="160" y="166" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" fill="#0B1220" font-weight="600">UX</text>

  <!-- 9. AI Governance — effort=12, impact=7.5, cyan medium (Quick Win) -->
  <circle cx="180" cy="113" r="18" fill="url(#bubbleCyan)" stroke="#06B6D4" stroke-width="1.5"/>
  <text x="180" y="111" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#0B1220">9</text>
  <text x="180" y="122" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" fill="#0B1220" font-weight="600">Governance</text>

  <!-- Right-side legend / pillar key -->
  <g transform="translate(556, 50)">
    <text x="0" y="0" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B" letter-spacing="1">PILLARS</text>
    <text x="0" y="14" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">1 AI Layer</text>
    <text x="0" y="26" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">2 Workflow</text>
    <text x="0" y="38" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">3 Audit Vault</text>
    <text x="0" y="50" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">4 Jurisdictions</text>
    <text x="0" y="62" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">5 Screening</text>
    <text x="0" y="74" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">6 API</text>
    <text x="0" y="86" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">7 SOC2/SSO</text>
    <text x="0" y="98" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">8 UX</text>
    <text x="0" y="110" font-family="Inter, sans-serif" font-size="7.5" fill="#9CA3AF">9 Governance</text>
  </g>
</svg>
"""

GANTT_SVG = r"""
<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
  <defs>
    <linearGradient id="ganttAmber" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#FCD34D" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="ganttCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#67E8F9" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="ganttEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#34D399" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <!-- Quarter columns -->
  <g>
    <rect x="160" y="30" width="100" height="380" fill="#16223A" fill-opacity="0.3"/>
    <rect x="260" y="30" width="100" height="380" fill="#16223A" fill-opacity="0.5"/>
    <rect x="360" y="30" width="100" height="380" fill="#16223A" fill-opacity="0.3"/>
    <rect x="460" y="30" width="100" height="380" fill="#16223A" fill-opacity="0.5"/>
  </g>

  <!-- Quarter headers -->
  <g>
    <text x="210" y="22" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#F59E0B" font-weight="700" letter-spacing="1.5">Q3</text>
    <text x="310" y="22" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#F59E0B" font-weight="700" letter-spacing="1.5">Q4</text>
    <text x="410" y="22" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#F59E0B" font-weight="700" letter-spacing="1.5">Q1</text>
    <text x="510" y="22" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#F59E0B" font-weight="700" letter-spacing="1.5">Q2</text>
  </g>

  <!-- Vertical quarter dividers -->
  <line x1="160" y1="30" x2="160" y2="410" stroke="#1F2D4A" stroke-width="1"/>
  <line x1="260" y1="30" x2="260" y2="410" stroke="#1F2D4A" stroke-width="0.5"/>
  <line x1="360" y1="30" x2="360" y2="410" stroke="#1F2D4A" stroke-width="0.5"/>
  <line x1="460" y1="30" x2="460" y2="410" stroke="#1F2D4A" stroke-width="0.5"/>
  <line x1="560" y1="30" x2="560" y2="410" stroke="#1F2D4A" stroke-width="1"/>

  <!-- Pillar labels (left column) -->
  <g font-family="Inter, sans-serif" font-size="10" fill="#E5E7EB" font-weight="600">
    <text x="20" y="58">1. AI Intelligence Layer</text>
    <text x="20" y="98">2. Workflow & Collab</text>
    <text x="20" y="138">3. Evidence Vault</text>
    <text x="20" y="178">4. Jurisdiction Coverage</text>
    <text x="20" y="218">5. Risk & Screening</text>
    <text x="20" y="258">6. Public API</text>
    <text x="20" y="298">7. Security (SSO+SOC2)</text>
    <text x="20" y="338">8. UX Polish</text>
    <text x="20" y="378">9. AI Governance</text>
  </g>

  <!-- Gantt bars: each pillar = 1 row, spans quarters -->
  <!-- 1. AI Layer: Q3 dev → Q4 GA → Q2 stretch -->
  <rect x="170" y="48" width="180" height="14" rx="2" fill="url(#ganttAmber)"/>
  <rect x="350" y="48" width="90" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <rect x="470" y="48" width="80" height="14" rx="2" fill="none" stroke="#06B6D4" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="172" y="44" font-family="JetBrains Mono, monospace" font-size="7" fill="#F59E0B">dev</text>
  <text x="352" y="44" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">GA Copilot v1</text>

  <!-- 2. Workflow: Q3 dev → Q4 GA -->
  <rect x="170" y="88" width="180" height="14" rx="2" fill="url(#ganttAmber)"/>
  <rect x="350" y="88" width="100" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <text x="172" y="84" font-family="JetBrains Mono, monospace" font-size="7" fill="#F59E0B">dev</text>
  <text x="352" y="84" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">GA</text>

  <!-- 3. Evidence Vault: Q3 dev → Q4 GA -->
  <rect x="170" y="128" width="90" height="14" rx="2" fill="url(#ganttAmber)"/>
  <rect x="260" y="128" width="100" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <text x="172" y="124" font-family="JetBrains Mono, monospace" font-size="7" fill="#F59E0B">dev</text>
  <text x="262" y="124" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">GA Vault v1</text>

  <!-- 4. Jurisdictions: Q4 dev → Q1 GA → Q2 stretch -->
  <rect x="270" y="168" width="180" height="14" rx="2" fill="url(#ganttCyan)"/>
  <rect x="460" y="168" width="90" height="14" rx="2" fill="#10B981" fill-opacity="0.5"/>
  <text x="272" y="164" font-family="JetBrains Mono, monospace" font-size="7" fill="#06B6D4">FCA / MAS first</text>
  <text x="462" y="164" font-family="JetBrains Mono, monospace" font-size="7" fill="#34D399">SFC + FINMA</text>

  <!-- 5. Risk & Screening: Q4 dev → Q1 GA -->
  <rect x="270" y="208" width="180" height="14" rx="2" fill="url(#ganttCyan)"/>
  <rect x="460" y="208" width="90" height="14" rx="2" fill="#10B981" fill-opacity="0.5"/>
  <text x="272" y="204" font-family="JetBrains Mono, monospace" font-size="7" fill="#06B6D4">PEP + UBO graph</text>
  <text x="462" y="204" font-family="JetBrains Mono, monospace" font-size="7" fill="#34D399">GA</text>

  <!-- 6. Public API: Q3 dev → Q4 GA -->
  <rect x="170" y="248" width="90" height="14" rx="2" fill="url(#ganttAmber)"/>
  <rect x="260" y="248" width="100" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <rect x="360" y="248" width="100" height="14" rx="2" fill="#10B981" fill-opacity="0.4"/>
  <text x="172" y="244" font-family="JetBrains Mono, monospace" font-size="7" fill="#F59E0B">spec + impl</text>
  <text x="262" y="244" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">beta</text>
  <text x="362" y="244" font-family="JetBrains Mono, monospace" font-size="7" fill="#34D399">GA + metering</text>

  <!-- 7. Security (SSO + SOC 2): Q3 audit kickoff → Q4 SSO GA → Q1 SOC2 report -->
  <rect x="170" y="288" width="90" height="14" rx="2" fill="url(#ganttAmber)"/>
  <rect x="260" y="288" width="100" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <rect x="360" y="288" width="100" height="14" rx="2" fill="#10B981" fill-opacity="0.5"/>
  <text x="172" y="284" font-family="JetBrains Mono, monospace" font-size="7" fill="#F59E0B">SSO dev</text>
  <text x="262" y="284" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">SSO GA</text>
  <text x="362" y="284" font-family="JetBrains Mono, monospace" font-size="7" fill="#34D399">SOC2 Type II</text>

  <!-- 8. UX Polish: Q3 dev → Q3 GA (Quick Win) -->
  <rect x="170" y="328" width="80" height="14" rx="2" fill="url(#ganttEmerald)"/>
  <text x="172" y="324" font-family="JetBrains Mono, monospace" font-size="7" fill="#34D399">Cmd+K, dark mode, i18n</text>

  <!-- 9. AI Governance: Q3 dev → Q4 GA -->
  <rect x="170" y="368" width="90" height="14" rx="2" fill="url(#ganttCyan)"/>
  <rect x="260" y="368" width="100" height="14" rx="2" fill="#06B6D4" fill-opacity="0.5"/>
  <text x="172" y="364" font-family="JetBrains Mono, monospace" font-size="7" fill="#06B6D4">model cards</text>
  <text x="262" y="364" font-family="JetBrains Mono, monospace" font-size="7" fill="#67E8F9">bias detection</text>
</svg>
"""

CAPABILITY_RADAR_SVG = r"""
<svg viewBox="0 0 360 320" xmlns="http://www.w3.org/2000/svg" class="chart-svg" style="max-width: 360px; margin: 0 auto;">
  <defs>
    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.1"/>
    </radialGradient>
  </defs>

  <!-- Concentric hexagons (5 levels) -->
  <g stroke="#1F2D4A" fill="none" stroke-width="0.7">
    <polygon points="180,60 261,107 261,201 180,248 99,201 99,107" />
    <polygon points="180,84 240,118 240,190 180,224 120,190 120,118" />
    <polygon points="180,108 219,130 219,178 180,200 141,178 141,130" />
    <polygon points="180,132 198,142 198,166 180,176 162,166 162,142" />
  </g>

  <!-- Target level (level 5) outline dashed -->
  <polygon points="180,36 282,95 282,213 180,272 78,213 78,95"
           fill="none" stroke="#06B6D4" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>

  <!-- Spokes -->
  <g stroke="#1F2D4A" stroke-width="0.5">
    <line x1="180" y1="156" x2="180" y2="60"/>
    <line x1="180" y1="156" x2="261" y2="107"/>
    <line x1="180" y1="156" x2="261" y2="201"/>
    <line x1="180" y1="156" x2="180" y2="248"/>
    <line x1="180" y1="156" x2="99" y2="201"/>
    <line x1="180" y1="156" x2="99" y2="107"/>
  </g>

  <!-- Current capability polygon: Data=3, AI=2, Workflow=2, Audit=4, Security=2, Integration=1 -->
  <!-- Level 1 = 24px from center, level 2 = 48px, level 3 = 72px, level 4 = 96px, level 5 = 120px -->
  <polygon points="180,84 228,128 228,184 180,252 132,184 132,128"
           fill="url(#radarFill)" stroke="#F59E0B" stroke-width="2"/>

  <!-- Vertex dots -->
  <circle cx="180" cy="84" r="3" fill="#F59E0B"/>
  <circle cx="228" cy="128" r="3" fill="#F59E0B"/>
  <circle cx="228" cy="184" r="3" fill="#F59E0B"/>
  <circle cx="180" cy="252" r="3" fill="#F59E0B"/>
  <circle cx="132" cy="184" r="3" fill="#F59E0B"/>
  <circle cx="132" cy="128" r="3" fill="#F59E0B"/>

  <!-- Axis labels -->
  <text x="180" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">Data Coverage</text>
  <text x="180" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L3</text>

  <text x="280" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">AI Depth</text>
  <text x="280" y="88" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L2</text>

  <text x="280" y="216" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">Workflow</text>
  <text x="280" y="228" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L2</text>

  <text x="180" y="270" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">Audit</text>
  <text x="180" y="282" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L4</text>

  <text x="80" y="216" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">Security</text>
  <text x="80" y="228" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L2</text>

  <text x="80" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#E5E7EB">Integration</text>
  <text x="80" y="88" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#F59E0B">L1</text>

  <!-- Target label -->
  <text x="180" y="306" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#06B6D4" letter-spacing="1.5">- - TARGET L5 (POST-ENHANCEMENT)</text>
</svg>
"""

# ──────────────────────────────────────────────────────────────
# HTML BODY (chapter content)
# ──────────────────────────────────────────────────────────────

COVER = f"""
<div class="cover">
  <div class="cover-grid"></div>
  <div class="cover-top">
    <div class="cover-brand">
      <div class="cover-brand-mark">R</div>
      <div>
        <div class="cover-brand-name">RegGuard AI</div>
        <div class="cover-brand-tag">Compliance Automator</div>
      </div>
    </div>
    <div class="cover-meta">
      <span class="cover-meta-row"><span class="label">VERSION</span><span class="value">v2.3 DRAFT</span></span>
      <span class="cover-meta-row"><span class="label">BASELINE</span><span class="value">v2.2 (LIVE)</span></span>
      <span class="cover-meta-row"><span class="label">DATE</span><span class="value">2026.08.15</span></span>
      <span class="cover-meta-row"><span class="label">DOC ID</span><span class="value">RG-ROADMAP-023</span></span>
    </div>
  </div>

  <div class="cover-middle">
    <div class="cover-eyebrow">PRODUCT ROADMAP &middot; INVESTOR BRIEF</div>
    <h1 class="cover-title">
      Pre-Market<br/>
      <span class="accent">Enhancement</span><br/>
      Roadmap
    </h1>
    <p class="cover-subtitle">
      Nine enhancement pillars to convert RegGuard AI v2.2 from a working
      technical demonstration into an enterprise-grade, investable compliance
      automation platform &mdash; sequenced for impact ahead of formal market
      assessment.
    </p>

    <div class="cover-ticker">
      <div class="cover-ticker-item">
        <div class="cover-ticker-label">PILLARS</div>
        <div class="cover-ticker-value">09</div>
      </div>
      <div class="cover-ticker-item">
        <div class="cover-ticker-label">HORIZON</div>
        <div class="cover-ticker-value amber">4Q</div>
      </div>
      <div class="cover-ticker-item">
        <div class="cover-ticker-label">VIEWS LIVE</div>
        <div class="cover-ticker-value">29</div>
      </div>
      <div class="cover-ticker-item">
        <div class="cover-ticker-label">FEEDS</div>
        <div class="cover-ticker-value amber">04</div>
      </div>
    </div>
  </div>

  <div class="cover-bottom">
    <div class="cover-author">
      <div class="name">RegGuard AI &mdash; Product Office</div>
      <div>Prepared for investor and stakeholder review</div>
    </div>
    <div class="cover-classification">Investor Confidential</div>
  </div>
</div>
"""

TOC = """
<div class="main-content">

  <div class="toc-title">CONTENTS</div>
  <h1 class="toc-h1">Table of Contents</h1>

  <ul class="toc-list">
    <li class="toc-item"><span class="toc-num">01</span><span class="toc-name">Executive Summary</span><span class="toc-dots"></span><span class="toc-page">03</span></li>
    <li class="toc-item"><span class="toc-num">02</span><span class="toc-name">Current State Snapshot (v2.2 Baseline)</span><span class="toc-dots"></span><span class="toc-page">04</span></li>
    <li class="toc-item"><span class="toc-num">03</span><span class="toc-name">Strategic Thesis &amp; Market Window</span><span class="toc-dots"></span><span class="toc-page">05</span></li>
    <li class="toc-item"><span class="toc-num">04</span><span class="toc-name">Pillar 1 &mdash; AI Intelligence Layer</span><span class="toc-dots"></span><span class="toc-page">06</span></li>
    <li class="toc-item"><span class="toc-num">05</span><span class="toc-name">Pillar 2 &mdash; Workflow &amp; Collaboration</span><span class="toc-dots"></span><span class="toc-page">08</span></li>
    <li class="toc-item"><span class="toc-num">06</span><span class="toc-name">Pillar 3 &mdash; Evidence Vault &amp; Audit Readiness</span><span class="toc-dots"></span><span class="toc-page">09</span></li>
    <li class="toc-item"><span class="toc-num">07</span><span class="toc-name">Pillar 4 &mdash; Broader Data Coverage</span><span class="toc-dots"></span><span class="toc-page">10</span></li>
    <li class="toc-item"><span class="toc-num">08</span><span class="toc-name">Pillar 5 &mdash; Risk &amp; Screening Automation</span><span class="toc-dots"></span><span class="toc-page">11</span></li>
    <li class="toc-item"><span class="toc-num">09</span><span class="toc-name">Pillar 6 &mdash; Integration &amp; Public API</span><span class="toc-dots"></span><span class="toc-page">12</span></li>
    <li class="toc-item"><span class="toc-num">10</span><span class="toc-name">Pillar 7 &mdash; Security &amp; Trust (Enterprise Sales Unlock)</span><span class="toc-dots"></span><span class="toc-page">13</span></li>
    <li class="toc-item"><span class="toc-num">11</span><span class="toc-name">Pillar 8 &mdash; UX Polish</span><span class="toc-dots"></span><span class="toc-page">14</span></li>
    <li class="toc-item"><span class="toc-num">12</span><span class="toc-name">Pillar 9 &mdash; AI Governance &amp; Explainability</span><span class="toc-dots"></span><span class="toc-page">15</span></li>
    <li class="toc-item"><span class="toc-num">13</span><span class="toc-name">Impact vs Effort Prioritization Matrix</span><span class="toc-dots"></span><span class="toc-page">16</span></li>
    <li class="toc-item"><span class="toc-num">14</span><span class="toc-name">Quarterly Delivery Timeline</span><span class="toc-dots"></span><span class="toc-page">17</span></li>
    <li class="toc-item"><span class="toc-num">15</span><span class="toc-name">Top 5 Pre-Market Recommendations</span><span class="toc-dots"></span><span class="toc-page">18</span></li>
  </ul>
"""

EXEC_SUMMARY = """
  <div class="chapter-header">
    <div class="chapter-tag">01 &middot; EXECUTIVE SUMMARY</div>
    <h2 class="chapter-title">From Technical Demonstration to Investable Platform</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    RegGuard AI v2.2 has reached a meaningful inflection point. The platform
    ships <strong>29 state-machine views</strong> across six functional zones,
    four of which are wired to real free-tier regulatory data feeds
    (Federal Register, ESMA RSS, OFAC SDN, EU CFSP, GLEIF LEI). Audit entries
    are anchored to a real SHA-256 Merkle root with optional Polygon Amoy
    testnet broadcast, and the Network Graph Explorer runs a custom
    force-directed simulation with full mobile touch support. The
    &ldquo;machine proposes, human confirms&rdquo; design principle is
    enforced consistently across every view via the shared
    <em>BooleanActionCard</em> component.
  </p>

  <p class="body-text">
    However, technical capability alone does not translate into enterprise
    revenue. Before formal market assessment can begin, three conversion
    gaps must be closed. First, the AI layer is currently informational
    rather than operational &mdash; it surfaces data but does not generate
    grounded recommendations or automate policy gap analysis. Second, the
    platform lacks the enterprise security primitives (SSO, SOC 2, audit
    packaging) that procurement teams require before signing contracts above
    $50K ARR. Third, the data layer is US/OFAC-centric, which limits the
    addressable market to roughly one-third of the global GRC opportunity.
  </p>

  <p class="body-text">
    This document proposes <strong>nine enhancement pillars</strong> organized
    into three investment tiers. Tier 1 (Pillars 1, 3, 7) addresses the
    highest-leverage gaps: AI moat depth, audit-ready evidence vault, and
    SOC 2 / SSO for enterprise sales unlock. Tier 2 (Pillars 4, 5, 6) expands
    addressable market through jurisdiction coverage, screening depth, and a
    public REST API enabling platform partnerships. Tier 3 (Pillars 2, 8, 9)
    delivers workflow, UX, and AI governance polish that compound the value
    of Tier 1 and Tier 2 investments.
  </p>

  <div class="callout">
    <div class="callout-label">TARGET OUTCOME</div>
    <div class="callout-body">
      By end of H2 next year, RegGuard AI should achieve a <strong>4x
      improvement</strong> in three priority dimensions: AI moat depth
      (informational &rarr; grounded &amp; actionable), enterprise readiness
      (no SSO &rarr; SOC 2 Type II + SSO + audit packages), and platform
      extensibility (read-only dashboard &rarr; public REST API with usage
      metering). These three shifts convert the platform from a technical
      showcase into a credible Series A investment opportunity.
    </div>
  </div>

  <p class="body-text">
    The remainder of this document walks through each pillar in detail,
    including technical approach, effort estimate in engineer-weeks, and
    the strategic rationale. The closing two sections provide a visual
    impact-vs-effort prioritization matrix and a quarter-by-quarter delivery
    timeline covering Q3 this year through Q2 next year.
  </p>
"""

CURRENT_STATE = f"""
  <div class="chapter-header">
    <div class="chapter-tag">02 &middot; BASELINE</div>
    <h2 class="chapter-title">Current State Snapshot (v2.2)</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    Before proposing enhancements, it is essential to anchor on what
    RegGuard AI v2.2 has already shipped. The table below quantifies the
    baseline across the six dimensions that matter most to enterprise
    buyers and investors. The numbers reflect the live deployment at the
    project&rsquo;s GitHub Pages URL, not a roadmap aspiration.
  </p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">VIEWS LIVE</div>
      <div class="stat-value">29</div>
      <div class="stat-sub">across 6 zones</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">REAL FEEDS</div>
      <div class="stat-value amber">04</div>
      <div class="stat-sub">Federal Register, ESMA, OFAC, EU CFSP, GLEIF</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">PRISMA MODELS</div>
      <div class="stat-value">29</div>
      <div class="stat-sub">SQLite, streaming-ready</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">CHAIN ANCHORS</div>
      <div class="stat-value emerald">16</div>
      <div class="stat-sub">Merkle root + Polygon Amoy</div>
    </div>
  </div>

  <p class="body-text">
    The capability radar below scores RegGuard AI on six axes, with each
    axis rated on a 1-to-5 maturity scale where 5 represents enterprise-grade.
    The amber polygon is current state; the dashed cyan outline is the
    target after the enhancements in this roadmap are delivered. Audit
    capability is the strongest axis today (level 4) thanks to the existing
    Merkle anchoring work. Integration is the weakest (level 1) because no
    public API or third-party connectors exist yet.
  </p>

  <div class="chart-container">
    <div class="chart-title">CAPABILITY MATURITY RADAR</div>
    <div class="chart-subtitle">Current state (amber) vs target state after enhancement (dashed cyan)</div>
    {CAPABILITY_RADAR_SVG}
    <div class="chart-legend">
      <div class="chart-legend-item"><span class="chart-legend-dot" style="background: #F59E0B; opacity: 0.6;"></span>Current v2.2</div>
      <div class="chart-legend-item"><span style="display:inline-block;width:14px;height:0;border-top:1px dashed #06B6D4;"></span>Target v2.3+</div>
    </div>
  </div>

  <p class="body-text">
    Three observations frame the rest of this document. First, the
    <strong>data layer is mature for US/OFAC</strong> but shallow for other
    jurisdictions &mdash; this caps the addressable market. Second, the
    <strong>AI layer is informational</strong> (it surfaces regulations and
    entities) but does not yet generate grounded recommendations, gap
    analyses, or drafted policy language. Third, the <strong>security and
    integration layers are at level 1-2</strong>, which is the single
    biggest blocker to closing enterprise deals above pilot pricing.
  </p>
"""

STRATEGIC_THESIS = """
  <div class="chapter-header">
    <div class="chapter-tag">03 &middot; STRATEGIC THESIS</div>
    <h2 class="chapter-title">Market Window &amp; Competitive Position</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    The global Governance, Risk &amp; Compliance (GRC) software market is
    estimated at <strong>$36B in 2025</strong> and projected to reach $64B
    by 2027, growing at roughly 12% CAGR. The AI-native compliance sub-segment
    is growing 3-4x faster than the overall market, driven by three
    converging forces that create a rare window for an AI-first entrant.
  </p>

  <p class="body-text">
    <strong>Force 1 &mdash; Regulatory velocity outpacing manual capacity.</strong>
    Federal Register publishes 3,000-4,000 final rules per year, ESMA issues
    200+ opinions and guidelines annually, and global sanctions list updates
    occur daily. No compliance team can manually track this volume; AI-driven
    monitoring is becoming a survival requirement, not a productivity
    enhancement.
  </p>

  <p class="body-text">
    <strong>Force 2 &mdash; EU AI Act enforcement creates mandatory AI governance
    tooling demand.</strong> The EU AI Act&rsquo;s risk-tier framework, with
    enforcement beginning phased rollout this year and next, makes AI
    governance tooling a regulatory requirement rather than a nice-to-have.
    Financial services firms using AI for credit scoring, fraud detection,
    or customer segmentation must demonstrate conformity &mdash; creating
    direct demand for the governance capabilities proposed in Pillar 9.
  </p>

  <p class="body-text">
    <strong>Force 3 &mdash; Enterprise buyers shifting from GRC suites to composable
    AI-native platforms.</strong> Incumbent GRC suites (ServiceNow GRC, Archer,
    MetricStream) are workflow tools with thin AI layers bolted on. Modern
    buyers increasingly prefer composable platforms that combine native AI,
    real-time data feeds, and modern APIs &mdash; exactly the positioning
    RegGuard AI is built for.
  </p>

  <div class="callout callout-cyan">
    <div class="callout-label">DIFFERENTIATOR</div>
    <div class="callout-body">
      RegGuard AI&rsquo;s &ldquo;<strong>machine proposes, human confirms</strong>&rdquo;
      design principle is the single most defensible positioning against
      both incumbent GRC suites (which lack native AI) and emerging AI-only
      compliance startups (which lack human accountability constructs).
      Regulators care about human accountability; operations teams care
      about AI scaling. This principle addresses both.
    </div>
  </div>

  <p class="body-text">
    The nine enhancement pillars in the following sections are sequenced to
    capture this window. Tier 1 investments (Pillars 1, 3, 7) reinforce the
    AI moat and unlock enterprise sales. Tier 2 investments (Pillars 4, 5, 6)
    expand addressable market and enable platform partnerships. Tier 3
    investments (Pillars 2, 8, 9) compound the value of Tier 1 and 2 by
    making the platform operationally useful, visually polished, and
    regulator-friendly.
  </p>
"""

PILLAR_1 = """
  <div class="chapter-header">
    <div class="chapter-tag">04 &middot; PILLAR 1</div>
    <h2 class="chapter-title">AI Intelligence Layer</h2>
    <div class="chapter-subtitle">The deepest moat &mdash; converts RegGuard from a data dashboard into a reasoning platform.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    The AI Intelligence Layer is the single highest-impact investment in this
    roadmap. RegGuard AI today surfaces regulatory data and entity matches
    but does not reason over them. This pillar adds five capabilities that
    together convert the platform from an informational tool into a grounded
    reasoning system &mdash; the kind of moat that incumbent GRC suites
    cannot replicate without rebuilding their data layer from scratch.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">1.1</span>
      <span class="feature-title">Regulatory Impact Analyzer</span>
      <span class="feature-effort">10 EW</span>
    </div>
    <p class="feature-body">
      Paste a new regulation (or point RegGuard at a Federal Register URL)
      and receive an auto-generated <strong>gap analysis</strong> against
      existing internal policies, scored by severity (critical / material /
      informational). Each gap includes a recommended remediation step and
      a traceable citation back to the regulation text. Technical approach:
      embedding similarity over a vector store of policy chunks, with an
      LLM-generated gap summary constrained to grounded citations.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">1.2</span>
      <span class="feature-title">Multi-Jurisdiction Diff Engine</span>
      <span class="feature-effort">8 EW</span>
    </div>
    <p class="feature-body">
      Compare the same regulatory concept (e.g. beneficial ownership
      threshold, AML transaction reporting limit) across <strong>EU, US, UK,
      and APAC jurisdictions</strong>, surfacing arbitrage opportunities and
      conflicting obligations. Particularly valuable for multinational
      financial institutions that must reconcile divergent regimes. Builds
      on the existing Regulation Watch infrastructure.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">1.3</span>
      <span class="feature-title">Semantic Regulation Search</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Embedding-based search across the full regulation corpus &mdash; not
      keyword matching. Users ask natural-language questions
      (&ldquo;what are our obligations for crypto-asset custody?&rdquo;)
      and receive ranked passages with <strong>cited source paragraphs</strong>
      and a deep-link back to the original text. Underlying model: a
      sentence-transformer encoder with periodic re-indexing on regulation
      updates.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">1.4</span>
      <span class="feature-title">Compliance Q&amp;A Copilot</span>
      <span class="feature-effort">9 EW</span>
    </div>
    <p class="feature-body">
      Upgrade the existing Assistant view from a generic chatbot into a
      <strong>RAG-powered compliance assistant</strong> that grounds every
      answer in cited regulations and internal policies. Critical design
      rule: the copilot must always show its sources and must refuse to
      answer when grounding is unavailable. This refusal behavior is itself
      a regulator-facing feature &mdash; it demonstrates that the AI is
      accountable, not hallucinating.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">1.5</span>
      <span class="feature-title">Auto-Generated Compliance Checklists</span>
      <span class="feature-effort">9 EW</span>
    </div>
    <p class="feature-body">
      Extract actionable obligations from regulation text and convert them
      into <strong>assignable checklists</strong> with owners, due dates,
      and evidence requirements. Closes the loop between regulation ingestion
      and operational execution. Builds on Pillar 2 (Workflow) for assignment
      and SLA tracking &mdash; the two pillars should be sequenced together.
    </p>
  </div>

  <div class="callout">
    <div class="callout-label">REVENUE IMPLICATION</div>
    <div class="callout-body">
      This pillar alone could justify a <strong>2-3x ARR uplift</strong>
      versus the current feature set, because it shifts RegGuard from a
      &ldquo;read-only intelligence dashboard&rdquo; ($20-40K ARR per mid-market
      customer) into a &ldquo;reasoning copilot&rdquo; ($60-120K ARR per
      enterprise customer). The gap-analyzer and checklist features map
      directly to budget lines that compliance teams already fund.
    </div>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 1: <strong>42 engineer-weeks</strong>
    across the five features, plus a shared infra investment of approximately
    6 engineer-weeks for the vector store, embedding pipeline, and citation
    framework. Recommended team: 2 ML/LLM engineers + 1 backend engineer +
    1 frontend engineer, working in parallel across the five features.
    Realistic delivery: Q3 dev &rarr; Q4 Copilot v1 GA &rarr; Q2 next year
    full layer GA.
  </p>
"""

PILLAR_2 = """
  <div class="chapter-header">
    <div class="chapter-tag">05 &middot; PILLAR 2</div>
    <h2 class="chapter-title">Workflow &amp; Collaboration</h2>
    <div class="chapter-subtitle">Converts RegGuard from a dashboard into an operational system of record.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    Today, RegGuard AI surfaces insights but does not act on them. The
    &ldquo;machine proposes, human confirms&rdquo; pattern is implemented
    at the UI level via the BooleanActionCard component, but confirmed
    actions do not flow into assignments, SLAs, or audit trails. This
    pillar closes that loop, converting RegGuard from a tool that compliance
    teams look at into a tool they work inside of every day. Enterprise
    buyers consistently rank this capability as a top-three purchase
    criterion.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">2.1</span>
      <span class="feature-title">Approval Workflows with Multi-Stage Sign-Off</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Configurable approval chains (e.g. analyst &rarr; manager &rarr; CCO)
      with full audit trails. Each stage records the reviewer, timestamp,
      decision rationale, and a hash anchor extending the existing Merkle
      chain. Critical for regulator examinations: every decision is
      reconstructable end-to-end.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">2.2</span>
      <span class="feature-title">Task Assignment + SLA Tracking with Auto-Escalation</span>
      <span class="feature-effort">5 EW</span>
    </div>
    <p class="feature-body">
      Convert AI recommendations into assigned tasks with due dates and SLA
      policies. Overdue tasks <strong>auto-escalate</strong> to the next
      reviewer in the chain. This single feature transforms the daily
      operations of a compliance team &mdash; it eliminates the spreadsheet
      and email round-trips that today consume 30-40% of analyst time.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">2.3</span>
      <span class="feature-title">Comments &amp; Annotations on Regulation Clauses</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      Inline commenting anchored to specific regulation paragraphs, with
      @-mention notifications. Creates a persistent institutional knowledge
      layer &mdash; when a regulator asks &ldquo;why did you interpret this
      clause this way?&rdquo;, the answer is one click away.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">2.4</span>
      <span class="feature-title">Notification Channels (Email / Slack / Teams / Webhook)</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      Configurable per-user and per-event-type notifications. Webhook
      channel enables downstream automation (e.g. auto-create a Jira ticket
      when a high-severity regulation change is detected).
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">2.5</span>
      <span class="feature-title">Calendar Integration for Filing Deadlines (iCal Export)</span>
      <span class="feature-effort">3 EW</span>
    </div>
    <p class="feature-body">
      Every regulation with a filing deadline automatically appears on the
      user&rsquo;s Outlook / Google Calendar via an iCal feed. Eliminates the
      &ldquo;missed deadline&rdquo; failure mode that drives the most
      expensive compliance incidents.
    </p>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 2: <strong>22 engineer-weeks</strong>.
    Recommended team: 1 backend engineer + 1 frontend engineer, sequenced
    after Pillar 1 because the workflow layer depends on AI-generated
    recommendations to be useful. Realistic delivery: Q3 dev &rarr; Q4 GA.
  </p>
"""

PILLAR_3 = """
  <div class="chapter-header">
    <div class="chapter-tag">06 &middot; PILLAR 3</div>
    <h2 class="chapter-title">Evidence Vault &amp; Audit Readiness</h2>
    <div class="chapter-subtitle">The single feature every compliance team buys &mdash; direct revenue driver, low technical risk.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    The Evidence Vault extends RegGuard&rsquo;s existing Merkle anchoring
    work into a complete audit-readiness system. Today, the chain evidence
    view anchors audit log entries to a Merkle root on Polygon Amoy. This
    pillar adds the surrounding capabilities that turn anchored logs into
    <strong>regulator-ready audit packages</strong> &mdash; the artifact
    every compliance team must produce during an examination. Most of the
    infrastructure already exists; the work is primarily UX and packaging.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">3.1</span>
      <span class="feature-title">Centralized Evidence Storage with Hash-Anchored Timestamps</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      A document store for proof-of-compliance artifacts (policy documents,
      training records, attestation screenshots, configuration exports).
      Every artifact is automatically hashed and anchored to the existing
      Merkle chain, providing cryptographic proof that the artifact existed
      at a specific time and has not been modified since.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">3.2</span>
      <span class="feature-title">One-Click Regulator-Ready Audit Packages</span>
      <span class="feature-effort">5 EW</span>
    </div>
    <p class="feature-body">
      Generate a structured PDF / Excel bundle grouping evidence by
      examination scope (e.g. &ldquo;AML program review&rdquo;,
      &ldquo;sanctions screening effectiveness&rdquo;). Each artifact in
      the bundle carries its Merkle proof and a verification URL. This is
      the single feature compliance teams reference most when explaining
      why they bought the platform.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">3.3</span>
      <span class="feature-title">Historical Trend Analysis of Compliance Posture</span>
      <span class="feature-effort">3 EW</span>
    </div>
    <p class="feature-body">
      Show how key compliance metrics (open risk items, policy review
      currency, training completion rates) evolved over the past 6-18 months.
      During an examination, this proves continuous improvement &mdash;
      a story regulators reward.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">3.4</span>
      <span class="feature-title">Heat Maps by Jurisdiction / Business Unit / Risk Category</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      Visual heat maps identifying where compliance posture is weakest
      across the organization. Drives prioritization conversations between
      the CCO and business unit leaders &mdash; positioning RegGuard as the
      system of truth for the entire compliance program.
    </p>
  </div>

  <div class="callout callout-emerald">
    <div class="callout-label">WHY THIS IS THE EASIEST SELL</div>
    <div class="callout-body">
      Every compliance team has lived through the pain of assembling audit
      packages under deadline pressure. The phrase &ldquo;one-click audit
      package&rdquo; triggers an immediate emotional recognition that
      shortens sales cycles by weeks. <strong>Low technical risk</strong>
      because most infrastructure (Merkle anchoring, audit log, document
      storage primitives) already exists in v2.2.
    </div>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 3: <strong>14 engineer-weeks</strong>.
    Recommended team: 1 backend engineer + 1 frontend engineer, can be
    delivered in Q3 alongside Pillar 1 since the two are largely independent.
    Realistic delivery: Q3 dev &rarr; Q4 GA Vault v1.
  </p>
"""

PILLAR_4 = """
  <div class="chapter-header">
    <div class="chapter-tag">07 &middot; PILLAR 4</div>
    <h2 class="chapter-title">Broader Data Coverage</h2>
    <div class="chapter-subtitle">Expands addressable market &mdash; each new jurisdiction unlocks 5-15 enterprise prospects in region.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    RegGuard AI v2.2 is heavily US/OFAC-centric. Four real feeds are wired
    in (Federal Register, ESMA, OFAC SDN, EU CFSP), which is enough to
    demonstrate the concept but caps the addressable market. Enterprise
    buyers in the UK, Singapore, Hong Kong, Switzerland, Germany, France,
    and Australia evaluate compliance platforms primarily on whether they
    cover <em>their</em> local regulators. Without that coverage, deals
    stall at the technical evaluation stage.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">4.1</span>
      <span class="feature-title">Jurisdiction Expansion: FCA, MAS, SFC, FINMA, BaFin, AMF, ASIC</span>
      <span class="feature-effort">14 EW</span>
    </div>
    <p class="feature-body">
      Each new regulator requires identifying the official publication
      channel (RSS, API, or curated dataset), building a fetcher module
      compatible with the existing <em>fetch-free-tier-data.py</em>
      architecture, normalizing the data into the existing regwatch schema,
      and adding jurisdiction-aware filtering to the Regulation Watch view.
      Estimated 2 engineer-weeks per jurisdiction, batched.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">4.2</span>
      <span class="feature-title">Sanctions List Expansion: UN, UK HMT, AU DFAT, CA SEMA</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Extend the existing OFAC + EU CFSP coverage to include the four other
      major global sanctions lists. UN list is the most strategically
      valuable because it is the reference list that many other jurisdictions
      re-publish. All four lists are available as free downloads.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">4.3</span>
      <span class="feature-title">Enforcement Actions &amp; Court Cases Feed</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Beyond regulation text, enterprise buyers want to see <strong>how
      regulators are actually enforcing</strong> the rules. Add a curated
      feed of enforcement actions (SEC, CFTC, FCA, MAS) and relevant court
      decisions, normalized into the existing case-management schema.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">4.4</span>
      <span class="feature-title">Adverse Media Feeds for Entity Screening</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      Negative news screening is a regulatory expectation for KYC/KYB
      programs. Wire in a curated adverse media feed (GDELT or similar
      free-tier source) and surface matches alongside sanctions hits in the
      Sanctions Screening view.
    </p>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 4: <strong>30 engineer-weeks</strong>.
    Recommended team: 1 data engineer (primary) + 1 backend engineer
    (support). Realistic delivery: Q4 this year for first three
    jurisdictions (FCA, MAS, SFC) &rarr; Q1 next year for the remaining four.
  </p>
"""

PILLAR_5 = """
  <div class="chapter-header">
    <div class="chapter-tag">08 &middot; PILLAR 5</div>
    <h2 class="chapter-title">Risk &amp; Screening Automation</h2>
    <div class="chapter-subtitle">Each feature maps to a specific compliance team budget line &mdash; sales-led growth opportunity.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    This pillar extends RegGuard&rsquo;s surveillance capabilities with
    features that map directly to budget lines compliance teams already
    fund. Unlike Pillar 1 (which creates a new category of spend), Pillar 5
    features displace existing tools &mdash; making budget reallocation the
    natural sales motion. The Network Graph Explorer v2.2 already provides
    the foundation for the beneficial ownership graph feature.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">5.1</span>
      <span class="feature-title">PEP Screening (Politically Exposed Persons)</span>
      <span class="feature-effort">5 EW</span>
    </div>
    <p class="feature-body">
      Integrate a curated PEP dataset (free tier from OpenSanctions or
      similar) and surface matches in the Sanctions Screening view alongside
      OFAC/CFSP hits. Each match carries a risk tier (e.g. current senior
      official vs. family member of former official) and a recommended
      enhanced due diligence workflow.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">5.2</span>
      <span class="feature-title">Beneficial Ownership Graph (extends Network Graph)</span>
      <span class="feature-effort">8 EW</span>
    </div>
    <p class="feature-body">
      Extend the existing force-directed Network Graph Explorer to ingest
      <strong>corporate ownership chains</strong> from GLEIF LEI data and
      registry sources. Reveals hidden control relationships &mdash; e.g.
      an apparently clean counterparty whose ultimate beneficial owner
      appears on a sanctions list three layers up the ownership chain.
      Builds on the v2.2 enrichment work.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">5.3</span>
      <span class="feature-title">Anomaly Detection on Transaction Patterns</span>
      <span class="feature-effort">8 EW</span>
    </div>
    <p class="feature-body">
      Statistical anomaly detection on transaction streams (unsupervised
      isolation forest or similar) surfacing structuring patterns, velocity
      anomalies, and unusual counterparty clusters. Each anomaly carries
      an explainability score so the human reviewer understands why the
      model flagged it.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">5.4</span>
      <span class="feature-title">KYC / KYB Document OCR with Auto-Extracted Fields</span>
      <span class="feature-effort">7 EW</span>
    </div>
    <p class="feature-body">
      Upload a passport, utility bill, or incorporation document &mdash;
      RegGuard extracts structured fields (name, DOB, address, registration
      number) using a free-tier OCR pipeline and pre-populates the KYC/KYB
      record. Eliminates manual data entry, the most-hated compliance task.
    </p>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 5: <strong>28 engineer-weeks</strong>.
    Recommended team: 1 backend engineer + 1 ML engineer. Realistic delivery:
    Q4 dev &rarr; Q1 next year GA for PEP + UBO graph; Q2 next year for
    anomaly detection and OCR.
  </p>
"""

PILLAR_6 = """
  <div class="chapter-header">
    <div class="chapter-tag">09 &middot; PILLAR 6</div>
    <h2 class="chapter-title">Integration &amp; Public API</h2>
    <div class="chapter-subtitle">Turns RegGuard from product to platform &mdash; enables partner ecosystem and 3rd-party integrations.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    A public REST API transforms RegGuard from a single product into a
    platform that other tools integrate with. This unlocks three strategic
    outcomes: (1) direct revenue via API usage metering, (2) distribution
    via partner ecosystems (GRC suites, CRMs, SIEMs), and (3) a defensible
    technical moat. Once enterprises build integrations against the
    RegGuard API, switching costs lock them in. The API-first pivot is the
    single highest-leverage strategic move in this roadmap after Pillar 1.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">6.1</span>
      <span class="feature-title">Public REST API with Usage Metering</span>
      <span class="feature-effort">8 EW</span>
    </div>
    <p class="feature-body">
      Versioned REST API exposing regulation search, sanctions screening,
      risk scoring, and audit anchoring endpoints. Built-in usage metering
      (per-customer rate limits, monthly call counts) enables usage-based
      pricing &mdash; a monetization model that scales with customer value.
      Includes developer portal with interactive docs and API keys
      management.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">6.2</span>
      <span class="feature-title">Webhook Subscriptions for Real-Time Regulation Alerts</span>
      <span class="feature-effort">3 EW</span>
    </div>
    <p class="feature-body">
      Customers register webhook URLs and receive push notifications when
      regulations relevant to their configured jurisdictions change. Enables
      downstream automation (auto-create Jira tickets, trigger policy
      review workflows) without polling.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">6.3</span>
      <span class="feature-title">GRC Connectors: ServiceNow GRC, Archer, MetricStream</span>
      <span class="feature-effort">5 EW</span>
    </div>
    <p class="feature-body">
      Bidirectional connectors to the three major GRC suites. Strategy:
      position RegGuard as the AI-native intelligence layer that feeds
      insights into the customer&rsquo;s existing GRC system of record,
      rather than competing head-on. Co-sell motion with the GRC vendors.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">6.4</span>
      <span class="feature-title">CRM / ERP Connectors: Salesforce, HubSpot, SAP, Oracle</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      Lightweight connectors (most of the work is API mapping, not deep
      integration). Enables compliance screening to fire automatically when
      a new customer or vendor is onboarded in the CRM/ERP &mdash; a
      high-value workflow for sales-led growth.
    </p>
  </div>

  <div class="callout callout-cyan">
    <div class="callout-label">PLATFORM PLAY</div>
    <div class="callout-body">
      The combination of public API + webhook subscriptions + GRC connectors
      positions RegGuard as the <strong>AI compliance intelligence layer</strong>
      that plugs into the customer&rsquo;s existing toolchain. This is the
      platform positioning that justifies a Series A valuation premium
      versus a single-product SaaS multiple.
    </div>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 6: <strong>18 engineer-weeks</strong>
    (excluding CRM/ERP partner-built connectors). Recommended team: 1 backend
    engineer + 1 developer-experience engineer. Realistic delivery: Q3 spec
    &rarr; Q4 beta &rarr; Q1 next year GA + metering.
  </p>
"""

PILLAR_7 = """
  <div class="chapter-header">
    <div class="chapter-tag">10 &middot; PILLAR 7</div>
    <h2 class="chapter-title">Security &amp; Trust (Enterprise Sales Unlock)</h2>
    <div class="chapter-subtitle">SOC 2 Type II badge alone unlocks 80% of enterprise procurement gates.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    Enterprise procurement processes for compliance software routinely
    require SSO, MFA, and a SOC 2 Type II report before contracts above
    $50K ARR can be signed. Without these, deals die at the security review
    stage regardless of how impressive the product is. This pillar is the
    single highest-leverage investment for compressing enterprise sales
    cycles &mdash; every dollar spent here multiplies the close rate of
    every other pillar&rsquo;s feature.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">7.1</span>
      <span class="feature-title">SSO (SAML 2.0 + OpenID Connect)</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Non-negotiable for enterprise buyers. Support both SAML 2.0 (Okta,
      Azure AD, Google Workspace) and OIDC. Includes just-in-time user
      provisioning, SCIM for automated user lifecycle management, and
      tenant-aware role mapping. Without SSO, no enterprise will deploy
      RegGuard to its compliance team.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">7.2</span>
      <span class="feature-title">MFA Enforcement + Session Policies</span>
      <span class="feature-effort">3 EW</span>
    </div>
    <p class="feature-body">
      Configurable per-tenant MFA requirements (TOTP, WebAuthn), session
      timeouts, IP allowlists, and concurrent-session limits. Maps directly
      to the security questionnaire every enterprise buyer sends.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">7.3</span>
      <span class="feature-title">Data Residency Options (EU / US / APAC)</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      For multi-region enterprises, the ability to pin tenant data to a
      specific region is a hard requirement. Requires region-aware routing,
      per-tenant storage selection, and clear data-flow documentation for
      the security review.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">7.4</span>
      <span class="feature-title">Customer-Managed Encryption Keys (CMEK)</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      Allow enterprise customers to bring their own encryption keys (AWS
      KMS, Azure Key Vault, GCP Cloud KMS). Particularly important for
      financial services customers who must demonstrate key custody to
      their own regulators.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">7.5</span>
      <span class="feature-title">SOC 2 Type II Readiness &amp; Audit</span>
      <span class="feature-effort">3 EW + audit cost</span>
    </div>
    <p class="feature-body">
      Implement SOC 2 controls (access logging, change management,
      incident response), engage a CPA firm for the Type II audit, and
      publish the resulting report under NDA to prospects. The audit itself
      takes 6-9 months &mdash; the work begins in Q3 this year for a
      Type II report available in Q1 next year.
    </p>
  </div>

  <div class="callout callout-rose">
    <div class="callout-label">HIGHEST-LEVERAGE INVESTMENT</div>
    <div class="callout-body">
      <strong>SOC 2 Type II badge alone unlocks 80% of enterprise procurement
      gates.</strong> Without it, every enterprise deal requires a custom
      security review that adds 6-12 weeks to the sales cycle. With it,
      deals pass through procurement in days. This is the single highest-ROI
      investment in the entire roadmap for sales cycle compression.
    </div>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 7: <strong>20 engineer-weeks</strong>
    plus SOC 2 audit fees (typically $40K-$80K). Recommended team: 1
    security engineer + external auditor. Realistic delivery: Q3 SSO dev
    &rarr; Q4 SSO GA + SOC 2 audit kickoff &rarr; Q1 next year SOC 2
    Type II report.
  </p>
"""

PILLAR_8 = """
  <div class="chapter-header">
    <div class="chapter-tag">11 &middot; PILLAR 8</div>
    <h2 class="chapter-title">UX Polish</h2>
    <div class="chapter-subtitle">Lower effort, high perceived value &mdash; multiplies demo-to-close conversions.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    UX polish features are low engineering cost but disproportionately
    affect perceived product maturity. A demo that includes a command
    palette, multi-language UI, and drag-and-drop dashboard feels like a
    mature platform; the same demo without these features feels like a
    prototype. This pillar is the cheapest way to multiply demo-to-close
    conversion rates &mdash; budget 10 engineer-weeks and ship in Q3 as
    quick wins alongside the heavier Pillar 1 work.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">8.1</span>
      <span class="feature-title">Command Palette (Cmd+K)</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      Power-user shortcut to navigate views, search regulations, and run
      common actions (assign task, export report) without leaving the
      keyboard. A 2-engineer-week feature that signals product maturity
      out of proportion to its cost.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">8.2</span>
      <span class="feature-title">Saved Searches + Custom Alerts</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      Let users save frequent regulation searches and subscribe to email
      alerts when new results appear. A foundational personalization
      feature that drives daily-active usage.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">8.3</span>
      <span class="feature-title">Multi-Language UI (EN / FR / DE / ES / ZH)</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      i18n framework with the four priority languages beyond English.
      Translation memory per tenant so customers can override standard
      translations with their internal terminology. Required for European
      enterprise sales.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">8.4</span>
      <span class="feature-title">Personalized Dashboard with Drag-and-Drop Widgets</span>
      <span class="feature-effort">3 EW</span>
    </div>
    <p class="feature-body">
      Each user composes their own dashboard from a widget library
      (regulation watchlist, my tasks, risk heat map, recent audit log).
      Persists per user, not per tenant. Drives daily-active engagement.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">8.5</span>
      <span class="feature-title">Dark Mode Toggle + Onboarding Wizard</span>
      <span class="feature-effort">1 EW</span>
    </div>
    <p class="feature-body">
      Dark mode is already partially supported (this very document is dark
      themed). Expose the toggle in the user menu. The onboarding wizard
      reduces time-to-value for new tenants &mdash; a 5-step setup flow
      covering jurisdiction selection, team invite, first policy import.
    </p>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 8: <strong>10 engineer-weeks</strong>.
    Recommended team: 1 frontend engineer, sequenced in Q3 as a Quick Win
    track running parallel to the heavier Pillar 1 work. Realistic delivery:
    Q3 dev &rarr; Q3 GA.
  </p>
"""

PILLAR_9 = """
  <div class="chapter-header">
    <div class="chapter-tag">12 &middot; PILLAR 9</div>
    <h2 class="chapter-title">AI Governance &amp; Explainability</h2>
    <div class="chapter-subtitle">Regulator-facing capabilities &mdash; uniquely valuable as EU AI Act enforcement begins.</div>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    As EU AI Act enforcement phases in over the next 12-18 months, financial
    services firms using AI for credit scoring, fraud detection, AML
    screening, or customer segmentation must demonstrate conformity. The
    governance capabilities in this pillar position RegGuard as the
    <strong>AI governance ready platform</strong> &mdash; uniquely valuable
    because RegGuard can govern not just its own AI features but also serve
    as the governance layer for the customer&rsquo;s other AI systems.
  </p>

  <p class="body-text">
    The existing &ldquo;machine proposes, human confirms&rdquo; design
    principle is itself a governance feature &mdash; it provides a clear
    audit trail of AI recommendations and the human decisions that
    confirmed or rejected them. This pillar formalizes and extends that
    pattern.
  </p>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">9.1</span>
      <span class="feature-title">Model Cards Published Per AI Feature</span>
      <span class="feature-effort">2 EW</span>
    </div>
    <p class="feature-body">
      Every AI feature ships with a published model card documenting
      training data, intended use, known limitations, performance metrics
      across demographic slices, and retraining cadence. Standardized
      format (Google&rsquo;s model card template is the de-facto industry
      baseline). Required artifact for AI Act conformity assessments.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">9.2</span>
      <span class="feature-title">Decision Audit Trail (every recommendation traceable to inputs)</span>
      <span class="feature-effort">4 EW</span>
    </div>
    <p class="feature-body">
      For every AI recommendation surfaced in the UI, store the full input
      context (regulation citations, entity match scores, historical
      decisions) so the recommendation can be reconstructed and explained
      months later. Builds on the existing Merkle anchoring infrastructure.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">9.3</span>
      <span class="feature-title">Human-in-the-Loop Checkpoints (already in v2.2)</span>
      <span class="feature-effort">0 EW</span>
    </div>
    <p class="feature-body">
      The <em>BooleanActionCard</em> component already implements this
      pattern across all 29 views &mdash; no additional engineering work
      required. This is a strategic messaging point: RegGuard is already
      governance-ready where competitors are scrambling to add it.
    </p>
  </div>

  <div class="feature-card">
    <div class="feature-header">
      <span class="feature-num">9.4</span>
      <span class="feature-title">Bias Detection in Screening Outcomes</span>
      <span class="feature-effort">6 EW</span>
    </div>
    <p class="feature-body">
      Statistical analysis of sanctions screening and risk scoring outcomes
      across protected attributes (where data is available), surfacing
      disparate impact patterns. Both a regulatory expectation under AI Act
      and a moral obligation. Outputs a quarterly bias audit report
      suitable for board-level review.
    </p>
  </div>

  <div class="callout callout-cyan">
    <div class="callout-label">AI ACT TIMING</div>
    <div class="callout-body">
      EU AI Act enforcement for high-risk AI systems (which includes
      financial services AML/fraud screening) phases in over the next 12-18
      months. Firms that can demonstrate conformity early will avoid both
      fines (up to 6% of global revenue) and the operational disruption of
      retroactive conformity work. <strong>This pillar is timed to that
      enforcement window.</strong>
    </div>
  </div>

  <p class="body-text">
    Total estimated effort for Pillar 9: <strong>12 engineer-weeks</strong>
    (excluding the already-shipped human-in-the-loop checkpoint). Recommended
    team: 1 ML engineer + 1 backend engineer. Realistic delivery: Q3 dev
    &rarr; Q4 GA.
  </p>
"""

MATRIX_SECTION = f"""
  <div class="chapter-header">
    <div class="chapter-tag">13 &middot; PRIORITIZATION</div>
    <h2 class="chapter-title">Impact vs Effort Prioritization Matrix</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    The matrix below plots all nine enhancement pillars by engineering
    effort (X-axis, in engineer-weeks) and business impact (Y-axis, on a
    1-10 scale). Bubble size indicates revenue potential. The four
    quadrants &mdash; Quick Wins (top-left), Strategic Bets (top-right),
    Fill-Ins (bottom-left), Defer (bottom-right) &mdash; provide the
    prioritization framework.
  </p>

  <div class="chart-container">
    <div class="chart-title">IMPACT vs EFFORT MATRIX</div>
    <div class="chart-subtitle">Bubble size = revenue potential &middot; Amber = tier-1 priority &middot; Cyan = tier-2/3</div>
    {IMPACT_EFFORT_SVG}
    <div class="chart-legend">
      <div class="chart-legend-item"><span class="chart-legend-dot" style="background: #F59E0B; opacity: 0.8;"></span>Tier 1 priority</div>
      <div class="chart-legend-item"><span class="chart-legend-dot" style="background: #06B6D4; opacity: 0.75;"></span>Tier 2/3 priority</div>
    </div>
  </div>

  <p class="body-text">
    Three observations drive the prioritization. <strong>Pillar 7 (Security
    &amp; SOC 2)</strong> sits in the Quick Wins quadrant with very high
    impact and moderate effort &mdash; ship it first because it unblocks
    every enterprise deal. <strong>Pillar 1 (AI Intelligence Layer)</strong>
    is the largest Strategic Bet &mdash; high effort but the deepest moat
    and biggest revenue uplift. <strong>Pillar 3 (Evidence Vault)</strong>
    is the sweet spot: low effort, high impact, direct revenue driver &mdash;
    ship it alongside Pillar 7 in Q3.
  </p>

  <p class="body-text">
    Pillars 4, 5, and 6 form the second wave &mdash; they expand addressable
    market and enable platform positioning but depend on the Tier 1
    foundation being in place. Pillars 2, 8, and 9 are the polish layer &mdash;
    ship them opportunistically when engineering capacity allows.
  </p>
"""

GANTT_SECTION = f"""
  <div class="chapter-header">
    <div class="chapter-tag">14 &middot; TIMELINE</div>
    <h2 class="chapter-title">Quarterly Delivery Timeline</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    The Gantt chart below sequences the nine pillars across four quarters
    (Q3 this year through Q2 next year). Bars are colored by status: amber
    for active development, cyan for beta, emerald for GA, dashed outline
    for stretch goals. The sequence prioritizes Tier 1 work in Q3-Q4 to
    unlock enterprise sales conversations, with Tier 2 and Tier 3 work
    flowing in parallel where dependencies allow.
  </p>

  <div class="chart-container">
    <div class="chart-title">DELIVERY TIMELINE &middot; Q3 &rarr; Q2 NEXT YEAR</div>
    <div class="chart-subtitle">Amber = dev &middot; Cyan = beta &middot; Emerald = GA &middot; Dashed = stretch</div>
    {GANTT_SVG}
    <div class="chart-legend">
      <div class="chart-legend-item"><span class="chart-legend-square" style="background: #F59E0B; opacity: 0.85;"></span>Active development</div>
      <div class="chart-legend-item"><span class="chart-legend-square" style="background: #06B6D4; opacity: 0.5;"></span>Beta</div>
      <div class="chart-legend-item"><span class="chart-legend-square" style="background: #10B981; opacity: 0.5;"></span>GA</div>
      <div class="chart-legend-item"><span style="display:inline-block;width:14px;height:8px;border:1px dashed #06B6D4;"></span>Stretch</div>
    </div>
  </div>

  <p class="body-text">
    Key milestones to plan marketing and sales motions around:
  </p>

  <ul class="inline-list">
    <li><strong>End of Q3:</strong> SSO GA &middot; Evidence Vault v1 &middot; UX polish GA &middot; Public API spec frozen</li>
    <li><strong>Mid Q4:</strong> Compliance Copilot v1 GA &middot; Workflow &amp; collaboration GA &middot; SOC 2 audit kickoff</li>
    <li><strong>End Q4:</strong> AI governance GA &middot; Public API beta &middot; First new jurisdictions (FCA, MAS, SFC)</li>
    <li><strong>Q1 next year:</strong> SOC 2 Type II report published &middot; Public API GA &middot; PEP screening + UBO graph GA</li>
    <li><strong>Q2 next year:</strong> Anomaly detection GA &middot; KYC/KYB OCR GA &middot; Remaining jurisdictions (FINMA, BaFin, AMF, ASIC)</li>
  </ul>
"""

RECOMMENDATIONS = """
  <div class="chapter-header">
    <div class="chapter-tag">15 &middot; RECOMMENDATIONS</div>
    <h2 class="chapter-title">Top 5 Pre-Market Recommendations</h2>
    <div class="chapter-divider"></div>
  </div>

  <p class="body-text">
    If only five of the nine pillars can be funded before formal market
    assessment, these are the five. They are ranked by combined impact on
    (a) AI moat depth, (b) enterprise sales cycle compression, (c) revenue
    uplift potential, and (d) technical feasibility within the four-quarter
    window. Each recommendation includes the expected outcome and the
    investment required.
  </p>

  <div class="rec-card">
    <div class="rec-rank">01</div>
    <h3 class="rec-title">AI Intelligence Layer (Pillar 1)</h3>
    <p class="rec-body">
      The deepest moat and biggest revenue uplift. Converts RegGuard from a
      data dashboard into a reasoning platform with grounded recommendations,
      gap analysis, and policy drafting. Without this, RegGuard is one of
      many compliance dashboards; with it, RegGuard is the category-defining
      AI-native compliance platform. <strong>Invest heaviest here.</strong>
    </p>
    <div class="rec-meta">
      <span><span class="rec-meta-label">EFFORT</span><span class="rec-meta-value">42 EW</span></span>
      <span><span class="rec-meta-label">OUTCOME</span><span class="rec-meta-value">2-3x ARR uplift</span></span>
      <span><span class="rec-meta-label">SHIP</span><span class="rec-meta-value">Q4 Copilot v1 GA</span></span>
    </div>
  </div>

  <div class="rec-card cyan">
    <div class="rec-rank">02</div>
    <h3 class="rec-title">Evidence Vault &amp; Audit Packages (Pillar 3)</h3>
    <p class="rec-body">
      Direct revenue driver, low technical risk. Most infrastructure already
      exists in v2.2. &ldquo;One-click audit package&rdquo; is the feature
      that triggers emotional recognition in sales conversations and
      shortens deal cycles by weeks. Ship alongside Pillar 7 in Q3 as the
      flagship enterprise sales demo.
    </p>
    <div class="rec-meta">
      <span><span class="rec-meta-label">EFFORT</span><span class="rec-meta-value">14 EW</span></span>
      <span><span class="rec-meta-label">OUTCOME</span><span class="rec-meta-value">Enterprise deal cycle -40%</span></span>
      <span><span class="rec-meta-label">SHIP</span><span class="rec-meta-value">Q4 GA Vault v1</span></span>
    </div>
  </div>

  <div class="rec-card emerald">
    <div class="rec-rank">03</div>
    <h3 class="rec-title">SSO + SOC 2 Type II Readiness (Pillar 7)</h3>
    <p class="rec-body">
      Unblocks enterprise procurement. SOC 2 Type II badge alone opens 80%
      of enterprise procurement gates; without it, every deal requires a
      custom security review adding 6-12 weeks to the cycle. Audit takes
      6-9 months &mdash; start the clock in Q3 this year for a Q1 next year
      report.
    </p>
    <div class="rec-meta">
      <span><span class="rec-meta-label">EFFORT</span><span class="rec-meta-value">20 EW + audit fees</span></span>
      <span><span class="rec-meta-label">OUTCOME</span><span class="rec-meta-value">Enterprise close rate +3x</span></span>
      <span><span class="rec-meta-label">SHIP</span><span class="rec-meta-value">Q1 SOC2 Type II</span></span>
    </div>
  </div>

  <div class="rec-card violet">
    <div class="rec-rank">04</div>
    <h3 class="rec-title">Public REST API + Webhooks (Pillar 6)</h3>
    <p class="rec-body">
      Enables platform play. API-first positioning transforms RegGuard from
      a single product into a platform that other tools integrate with &mdash;
      unlocking partner ecosystem distribution, usage-based monetization, and
      a defensible technical moat via integration switching costs. Ship
      beta in Q4, GA in Q1 next year.
    </p>
    <div class="rec-meta">
      <span><span class="rec-meta-label">EFFORT</span><span class="rec-meta-value">18 EW</span></span>
      <span><span class="rec-meta-label">OUTCOME</span><span class="rec-meta-value">Platform multiple on valuation</span></span>
      <span><span class="rec-meta-label">SHIP</span><span class="rec-meta-value">Q1 API GA</span></span>
    </div>
  </div>

  <div class="rec-card rose">
    <div class="rec-rank">05</div>
    <h3 class="rec-title">Broader Jurisdiction Coverage (Pillar 4)</h3>
    <p class="rec-body">
      Expands addressable market. Each new jurisdiction unlocks 5-15
      enterprise prospects in region. Start with FCA (UK), MAS (Singapore),
      and SFC (Hong Kong) in Q4 &mdash; these three cover the largest
      non-US financial services markets and align with where enterprise
      buyers already evaluate compliance platforms.
    </p>
    <div class="rec-meta">
      <span><span class="rec-meta-label">EFFORT</span><span class="rec-meta-value">30 EW</span></span>
      <span><span class="rec-meta-label">OUTCOME</span><span class="rec-meta-value">TAM +60% (UK/SG/HK)</span></span>
      <span><span class="rec-meta-label">SHIP</span><span class="rec-meta-value">Q4 FCA/MAS/SFC GA</span></span>
    </div>
  </div>

  <div class="callout">
    <div class="callout-label">DECISION REQUIRED</div>
    <div class="callout-body">
      <strong>Go-ahead requested on Q3 kickoff</strong> for Pillars 1, 3,
      7, 8 (initial tracks) with parallel Pillar 6 spec work. Total Q3
      commitment: approximately 60 engineer-weeks across four parallel
      tracks. Pillars 2, 4, 5, 9 sequence in Q4 based on Q3 learnings and
      customer feedback from initial enterprise demos.
    </div>
  </div>

  <p class="body-text">
    The combined investment across all nine pillars is approximately
    <strong>196 engineer-weeks</strong> of focused development work,
    distributed across four quarters. With a team of four engineers
    (two backend, one ML/LLM, one frontend) plus one security engineer
    added in Q4 for SOC 2 work, this is achievable in the proposed
    timeline. Total external spend is dominated by the SOC 2 Type II
    audit fees ($40-80K) and optional Polygon Amoy testnet MATIC for
    chain anchoring (free from faucet).
  </p>

  <p class="body-text">
    The strategic question for stakeholders is not whether these nine
    pillars are the right investments &mdash; the prioritization matrix
    and revenue implications make that case clearly. The question is
    sequencing: which subset can be funded in Q3 to demonstrate momentum
    ahead of formal market assessment, with the remaining pillars
    sequenced based on customer feedback from initial enterprise demos.
    The recommendation above (Pillars 1, 3, 7, 8 in Q3) is the highest-leverage
    Q3 combination because it ships the AI moat, the audit-ready evidence
    vault, the enterprise sales unlock, and the UX polish simultaneously.
  </p>

  <div class="callout callout-cyan">
    <div class="callout-label">CLOSING POSITION</div>
    <div class="callout-body">
      RegGuard AI v2.2 has proven the technical thesis. The nine enhancement
      pillars in this document convert that proof into an enterprise-grade,
      investable platform. With Q3 commitment to the recommended Tier 1
      tracks, the platform will be ready for formal market assessment by
      end of Q4 this year, with SOC 2 Type II report arriving in Q1 next
      year to unlock the full enterprise procurement gate.
    </div>
  </div>
"""

ENDING = """
</div>

<div class="ending">
  <div class="ending-grid"></div>
  <div class="ending-middle">
    <div class="ending-eyebrow">END OF ROADMAP DOCUMENT</div>
    <h2 class="ending-title">From v2.2 Baseline<br/>to Investable Platform</h2>
    <p class="ending-body">
      RegGuard AI v2.2 has demonstrated technical credibility across 29
      state-machine views, four live data feeds, real Merkle anchoring,
      and a mobile-ready force-directed graph. The nine enhancement pillars
      in this document convert that technical foundation into an
      enterprise-grade, investable compliance automation platform.
      Tier 1 investments &mdash; the AI Intelligence Layer, the Evidence
      Vault, and SOC 2 / SSO readiness &mdash; are the highest-leverage
      moves and should ship in Q3-Q4 this year.
    </p>
  </div>
  <div class="ending-bottom">
    <div class="ending-contact">
      <div class="name">RegGuard AI &mdash; Product Office</div>
      <div>Next review: end of Q3</div>
    </div>
    <div class="ending-mark">
      RG-ROADMAP-023<br/>
      v2.3 DRAFT<br/>
      INVESTOR CONFIDENTIAL
    </div>
  </div>
</div>
"""

# ──────────────────────────────────────────────────────────────
# Assemble HTML
# ──────────────────────────────────────────────────────────────

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RegGuard AI - Product Roadmap v2.3</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
""" + CSS + """
</style>
</head>
<body>
"""

# Close main-content before ending
BODY = (
    HEAD
    + COVER
    + TOC
    + EXEC_SUMMARY
    + CURRENT_STATE
    + STRATEGIC_THESIS
    + PILLAR_1
    + PILLAR_2
    + PILLAR_3
    + PILLAR_4
    + PILLAR_5
    + PILLAR_6
    + PILLAR_7
    + PILLAR_8
    + PILLAR_9
    + MATRIX_SECTION
    + GANTT_SECTION
    + RECOMMENDATIONS
    + ENDING
    + "\n</body>\n</html>\n"
)

OUT_HTML.write_text(BODY, encoding="utf-8")
print(f"Wrote {OUT_HTML} ({len(BODY):,} bytes)")
