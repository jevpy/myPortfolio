#!/usr/bin/env python3
"""Render the hand-designed one-page CVs (cv/*.html) to public PDFs with headless Chrome.

Usage:
  python -B scripts/render-cv.py           # render cv/en.html, cv/es.html -> public/resume*.pdf
  python -B scripts/render-cv.py --check   # render to a temp dir and verify the contract

Chrome is located via the CHROME_PATH environment variable or common install paths.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CV_DIR = ROOT / 'cv'
OUTPUTS = {
    'en': (CV_DIR / 'en.html', ROOT / 'public/resume.pdf'),
    'es': (CV_DIR / 'es.html', ROOT / 'public/resume_es.pdf'),
}
A4 = (595.28, 841.89)
A4_TOLERANCE = 1.0
CHROME_CANDIDATES = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
]
TIMEOUT = 120

# Injected into a temp copy of the CV. Fails when any text or element inside .page extends past
# the .page box, which `overflow: hidden` would otherwise clip silently. Column padding may be
# consumed (the grid track grows); only real content counts. `slack` is the content's distance
# to the page bottom in CSS px, for information.
OVERFLOW_PROBE = """<script>
window.addEventListener('load', () => {
  const result = { ok: true, problems: [], slack: {} };
  const fail = (msg) => { result.ok = false; if (result.problems.length < 10) result.problems.push(msg); };
  const page = document.querySelector('.page');
  if (!page) fail('missing .page');
  else {
    const pr = page.getBoundingClientRect();
    const tol = 0.5;
    for (const sel of ['aside', 'main']) {
      const col = page.querySelector(sel);
      if (!col) { fail(`missing ${sel}`); continue; }
      let bottom = -Infinity;
      const rects = [];
      const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) rects.push([r, node.textContent.trim().slice(0, 40)]);
      }
      for (const el of col.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height) rects.push([r, `<${el.tagName.toLowerCase()}>`]);
      }
      for (const [r, label] of rects) {
        bottom = Math.max(bottom, r.bottom);
        if (r.bottom > pr.bottom + tol) fail(`${sel}: "${label}" bottom ${r.bottom.toFixed(1)} > page ${pr.bottom.toFixed(1)}`);
        if (r.right > pr.right + tol) fail(`${sel}: "${label}" right ${r.right.toFixed(1)} > page ${pr.right.toFixed(1)}`);
        if (r.top < pr.top - tol || r.left < pr.left - tol) fail(`${sel}: "${label}" starts outside page`);
      }
      result.slack[sel] = Math.round((pr.bottom - bottom) * 10) / 10;
    }
  }
  const out = document.createElement('pre');
  out.id = 'cv-overflow-result';
  out.textContent = JSON.stringify(result);
  document.body.appendChild(out);
});
</script>"""


class CvError(Exception):
    pass


def find_chrome():
    """Return the Chrome executable path or None."""
    env = os.environ.get('CHROME_PATH')
    if env:
        return env if Path(env).is_file() else None
    for name in ('chrome', 'google-chrome', 'chromium', 'chromium-browser'):
        found = shutil.which(name)
        if found:
            return found
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).is_file():
            return candidate
    return None


def require_chrome():
    chrome = find_chrome()
    if chrome:
        return chrome
    env = os.environ.get('CHROME_PATH')
    if env:
        raise CvError(f'CHROME_PATH points to a missing file: {env}')
    raise CvError('Chrome not found. Install Google Chrome or set CHROME_PATH to the chrome executable.')


def file_url(path):
    # Forward-slash absolute paths; backslash paths break Chrome's file handling on Windows.
    return Path(path).resolve().as_uri()


def run_chrome(chrome, args, profile_dir):
    cmd = [chrome, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
           f'--user-data-dir={Path(profile_dir).resolve().as_posix()}', *args]
    try:
        return subprocess.run(cmd, capture_output=True, timeout=TIMEOUT, check=False)
    except subprocess.TimeoutExpired as exc:
        raise CvError(f'Chrome timed out after {TIMEOUT}s: {" ".join(args)}') from exc


def render_pdf(chrome, html, pdf, profile_dir):
    pdf = Path(pdf).resolve()
    pdf.parent.mkdir(parents=True, exist_ok=True)
    if pdf.exists():
        pdf.unlink()
    result = run_chrome(chrome, ['--no-pdf-header-footer', f'--print-to-pdf={pdf.as_posix()}', file_url(html)],
                        profile_dir)
    if not pdf.is_file() or pdf.stat().st_size == 0:
        raise CvError(f'Chrome did not produce {pdf} (exit {result.returncode}): '
                      f'{result.stderr.decode(errors="replace").strip()[-500:]}')
    return pdf


def probe_layout(chrome, html, work_dir, profile_dir, base_dir=None):
    """Load a probe copy of `html` in Chrome; return {'ok', 'problems', 'slack'} from OVERFLOW_PROBE.

    Relative assets (style.css) resolve against `base_dir`, defaulting to the HTML's own folder.
    """
    html = Path(html).resolve()
    source = html.read_text(encoding='utf-8')
    base = f'<base href="{file_url(base_dir or html.parent)}/">'
    probe = re.sub(r'<head>', lambda _: '<head>' + base, source, count=1, flags=re.I)
    probe = re.sub(r'</body>', lambda _: OVERFLOW_PROBE + '</body>', probe, count=1, flags=re.I)
    if OVERFLOW_PROBE not in probe or base not in probe:
        raise CvError(f'{html.name}: could not inject overflow probe (missing <head> or </body>)')
    probe_path = Path(work_dir) / f'probe-{html.name}'
    probe_path.write_text(probe, encoding='utf-8')
    result = run_chrome(chrome, ['--window-size=1200,1800', '--virtual-time-budget=5000', '--dump-dom',
                                 file_url(probe_path)], profile_dir)
    match = re.search(r'<pre id="cv-overflow-result">(.*?)</pre>', result.stdout.decode('utf-8', errors='replace'))
    if not match:
        raise CvError(f'{html.name}: overflow probe produced no result (exit {result.returncode})')
    return json.loads(unescape(match.group(1)))


def check_overflow(chrome, html, work_dir, profile_dir, base_dir=None):
    """Return a list of content-clipping problems for `html` (empty when everything fits .page)."""
    data = probe_layout(chrome, html, work_dir, profile_dir, base_dir)
    return [] if data.get('ok') else data.get('problems') or ['overflow']


def pdf_text(pdf):
    from pypdf import PdfReader
    return '\n'.join(page.extract_text() or '' for page in PdfReader(str(pdf)).pages)


def normalize_text(text):
    return re.sub(r'\s+', ' ', text).strip()


def pdf_contract_problems(pdf):
    from pypdf import PdfReader
    reader = PdfReader(str(pdf))
    problems = []
    if len(reader.pages) != 1:
        problems.append(f'{pdf.name}: expected 1 page, got {len(reader.pages)}')
    for i, page in enumerate(reader.pages, 1):
        box = page.mediabox
        size = (float(box.width), float(box.height))
        if abs(size[0] - A4[0]) > A4_TOLERANCE or abs(size[1] - A4[1]) > A4_TOLERANCE:
            problems.append(f'{pdf.name}: page {i} is {size[0]:.2f}x{size[1]:.2f}, expected A4 {A4[0]}x{A4[1]}')
    return problems


def render_all(out_dir=None, chrome=None):
    """Render both locales. Returns {locale: pdf_path}. Writes public/ only when out_dir is None."""
    chrome = chrome or require_chrome()
    with tempfile.TemporaryDirectory(prefix='cv-chrome-', ignore_cleanup_errors=True) as profile:
        paths = {}
        for locale, (html, public_pdf) in OUTPUTS.items():
            target = public_pdf if out_dir is None else Path(out_dir) / public_pdf.name
            paths[locale] = render_pdf(chrome, html, target, profile)
        return paths


def check(chrome=None):
    """Render to a temp dir and verify the contract. Returns (problems, slack per HTML file)."""
    chrome = chrome or require_chrome()
    problems, slack = [], {}
    with tempfile.TemporaryDirectory(prefix='cv-check-', ignore_cleanup_errors=True) as work, \
            tempfile.TemporaryDirectory(prefix='cv-chrome-', ignore_cleanup_errors=True) as profile:
        for html, public_pdf in OUTPUTS.values():
            fresh = render_pdf(chrome, html, Path(work) / public_pdf.name, profile)
            problems += pdf_contract_problems(fresh)
            layout = probe_layout(chrome, html, work, profile)
            slack[html.name] = layout.get('slack', {})
            if not layout.get('ok'):
                problems += [f'{html.name}: {p}' for p in layout.get('problems') or ['overflow']]
            if not public_pdf.is_file():
                problems.append(f'{public_pdf.relative_to(ROOT).as_posix()} is missing')
            elif normalize_text(pdf_text(fresh)) != normalize_text(pdf_text(public_pdf)):
                problems.append(f'{public_pdf.relative_to(ROOT).as_posix()} is stale vs {html.relative_to(ROOT).as_posix()}; '
                                'run python -B scripts/render-cv.py')
    return problems, slack


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true',
                        help='render to a temp dir and verify page count, A4 size, overflow and freshness')
    args = parser.parse_args(argv)
    try:
        if args.check:
            problems, slack = check()
            for name, columns in slack.items():
                print(f'{name}: bottom slack (CSS px) ' + ', '.join(f'{k}={v}' for k, v in columns.items()))
            if problems:
                print('CV check failed:', *problems, sep='\n  - ', file=sys.stderr)
                return 1
            print('CV check passed: 1-page A4 PDFs, no overflow, public PDFs up to date.')
            return 0
        chrome = require_chrome()
        for html, _ in OUTPUTS.values():
            with tempfile.TemporaryDirectory(prefix='cv-check-', ignore_cleanup_errors=True) as work, \
                    tempfile.TemporaryDirectory(prefix='cv-chrome-', ignore_cleanup_errors=True) as profile:
                problems = check_overflow(chrome, html, work, profile)
            if problems:
                print(f'{html.name} overflows .page; not rendering:', *problems, sep='\n  - ', file=sys.stderr)
                return 1
        for locale, pdf in render_all(chrome=chrome).items():
            problems = pdf_contract_problems(pdf)
            if problems:
                print(*problems, sep='\n', file=sys.stderr)
                return 1
            print(f'{locale}: {pdf.relative_to(ROOT).as_posix()}')
        return 0
    except CvError as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
