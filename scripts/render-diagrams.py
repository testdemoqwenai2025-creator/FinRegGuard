"""Render FinRegGPT.Bot workflow diagrams from HTML to PNG via Playwright.
Outputs 4 PNGs at 2x device scale for crisp PDF embedding.
"""
import asyncio
import os
from playwright.async_api import async_playwright

DIAGRAMS_DIR = '/home/z/my-project/scripts/finreg-diagrams'
OUTPUT_DIR = '/home/z/my-project/download/finreg-diagrams'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# (html_filename, output_png_filename, viewport_width)
DIAGRAMS = [
    ('01-architecture.html', '01-system-architecture.png', 1280),
    ('02-compliance-workflow.html', '02-compliance-workflow.png', 1100),
    ('03-aml-flow.html', '03-aml-kyx-flow.png', 1280),
    ('04-user-journey.html', '04-user-journey.png', 1280),
]


async def render_one(html_name: str, png_name: str, width: int) -> None:
    html_path = os.path.join(DIAGRAMS_DIR, html_name)
    out_path = os.path.join(OUTPUT_DIR, png_name)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={'width': width, 'height': 900},
            device_scale_factor=2,
        )
        await page.goto(f'file://{html_path}', wait_until='networkidle')
        await page.wait_for_timeout(400)
        # Resize viewport to fit #root
        el = page.locator('#root')
        bbox = await el.bounding_box()
        if bbox:
            fit_w = max(width, int(bbox['width'] + 80))
            fit_h = int(bbox['height'] + 80)
            await page.set_viewport_size({'width': fit_w, 'height': fit_h})
            await page.wait_for_timeout(200)
        await el.screenshot(path=out_path)
        await browser.close()
        size_kb = os.path.getsize(out_path) / 1024
        print(f'  ✓ {png_name} ({size_kb:.0f}KB)')


async def main() -> None:
    print(f'Rendering {len(DIAGRAMS)} diagrams to {OUTPUT_DIR}/')
    for html_name, png_name, width in DIAGRAMS:
        await render_one(html_name, png_name, width)
    print('Done.')


if __name__ == '__main__':
    asyncio.run(main())
