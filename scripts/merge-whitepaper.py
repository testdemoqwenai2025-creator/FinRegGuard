"""Merge the cover PDF (HTML→PDF via Playwright) with the body PDF (ReportLab).
Crops the cover page to exact A4 dimensions to match the body, then concatenates.
Output: /home/z/my-project/download/FinRegGPT.Bot-Whitepaper.pdf
"""
import os
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject

COVER = '/home/z/my-project/download/finreg-diagrams/cover.pdf'
BODY = '/home/z/my-project/download/finreg-diagrams/body.pdf'
OUT = '/home/z/my-project/download/FinRegGPT.Bot-Whitepaper.pdf'

# Exact A4 in points (1pt = 1/72 inch; A4 = 210mm × 297mm)
A4_W = 595.27559  # 210mm
A4_H = 841.88976  # 297mm


def main() -> None:
    writer = PdfWriter()

    # Cover: scale & crop to exact A4
    cover = PdfReader(COVER)
    cover_page = cover.pages[0]
    src_w = float(cover_page.mediabox.width)
    src_h = float(cover_page.mediabox.height)
    # Scale to fit A4 exactly (uniform scale, preserve aspect)
    scale = min(A4_W / src_w, A4_H / src_h)
    cover_page.scale_by(scale)
    # After scaling, set the mediabox/cropbox to exact A4
    cover_page.mediabox = RectangleObject([0, 0, A4_W, A4_H])
    cover_page.cropbox = RectangleObject([0, 0, A4_W, A4_H])
    writer.add_page(cover_page)

    # Body pages: already A4
    body = PdfReader(BODY)
    for page in body.pages:
        writer.add_page(page)

    # Set metadata
    writer.add_metadata({
        '/Title': 'FinRegGPT.Bot Whitepaper — AI Regulatory Compliance Automator',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': 'Whitepaper v1.0 — August 2026 — for investors, engineers, and compliance officers',
        '/Keywords': 'regtech, compliance, AML, KYC, MiFID II, Basel III, HIPAA, GDPR, AI Act, FinRegGPT',
    })

    with open(OUT, 'wb') as f:
        writer.write(f)

    size_kb = os.path.getsize(OUT) / 1024
    pages = len(writer.pages)
    print(f'✓ Merged PDF: {OUT}')
    print(f'  Size: {size_kb:.0f} KB')
    print(f'  Pages: {pages}')


if __name__ == '__main__':
    main()
