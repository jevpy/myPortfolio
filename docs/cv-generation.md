# Update the public CVs

The CV is a hand-designed one-page A4 layout. `cv/en.html`, `cv/es.html` and the shared `cv/style.css` are the only sources; `public/resume.pdf` and `public/resume_es.pdf` are rendered from them with headless Chrome. `cv/backup/` keeps the old two-page PDFs for reference and is not part of the flow.

## Quick path

1. Edit `cv/en.html` and `cv/es.html` together (keep the facts in sync) and `cv/style.css` if needed.
2. Render: `python -B scripts/render-cv.py`
3. Verify: `python -B scripts/render-cv.py --check` and `python -m unittest tests.cv_pdf_test`
4. Open both PDFs and look at them before publishing.

## Requirements

- Python 3.12 with `pypdf`.
- Google Chrome. The script finds it on the usual install paths or `PATH`; override with `CHROME_PATH=/path/to/chrome`. Chrome-dependent tests are skipped (not failed) when Chrome is missing.

## What the checks enforce

| Check | Contract |
| --- | --- |
| Pages | Each PDF has exactly one A4 page (595.28 × 841.89 pt). |
| Clipping | `.page` uses `overflow: hidden`, so page count alone cannot prove nothing was cut. A probe copy of each HTML is loaded in Chrome and fails if any text or element extends past `.page`. Column padding may be consumed; `--check` prints the remaining bottom slack in CSS px. |
| Freshness | `--check` renders to a temp dir and compares the extracted text with the committed PDFs (Chrome output is not byte-deterministic). It never writes to `public/`. |
| Facts | The test asserts key facts in both locales, e.g. name, Startup Perú 2025, Meta Tech Provider, Huracorp, languages and section titles. |

`render-cv.py` without `--check` runs the clipping probe first and refuses to write the PDFs if content overflows. Visual quality, readability and links still need a human review.
