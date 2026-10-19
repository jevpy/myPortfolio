"""Contract for the one-page CV PDFs rendered from cv/*.html by scripts/render-cv.py.

Run: python -m unittest tests.cv_pdf_test
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('render_cv', ROOT / 'scripts/render-cv.py')
assert _spec is not None and _spec.loader is not None, 'scripts/render-cv.py not found'
render_cv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(render_cv)

PDFS = {'en': ROOT / 'public/resume.pdf', 'es': ROOT / 'public/resume_es.pdf'}
SHARED_FACTS = [
    'Jean Pierre André Ayala Viera', 'Startup Perú 2025', 'Meta Tech Provider', 'Huracorp', 'k-means',
    'Haversine', 'OAuth', 'RENIEC', 'Hortifruit', 'IBM', 'onecodesite.vercel.app',
]
LOCALE_FACTS = {
    'en': ['Full-Stack Developer & AI Engineer', 'English — Advanced', 'Experience',
           'Full-Stack Software Developer', '2024 – Present', 'Personal AI Projects'],
    'es': ['Inglés — Avanzado', 'Experiencia', 'responsable de punta a punta', '2024 – Actualidad',
           'Proyectos personales de IA'],
}
CHROME = render_cv.find_chrome()
NO_CHROME = 'Chrome not found; install Google Chrome or set CHROME_PATH to run render checks'


def text_of(pdf):
    return render_cv.normalize_text(render_cv.pdf_text(pdf))


class PublicPdfContractTest(unittest.TestCase):
    def test_one_a4_page_each(self):
        for locale, pdf in PDFS.items():
            with self.subTest(locale=locale):
                reader = PdfReader(str(pdf))
                self.assertEqual(len(reader.pages), 1)
                box = reader.pages[0].mediabox
                self.assertAlmostEqual(float(box.width), 595.28, delta=1.0)
                self.assertAlmostEqual(float(box.height), 841.89, delta=1.0)

    def test_key_facts_extractable(self):
        for locale, pdf in PDFS.items():
            # Headings use CSS text-transform: uppercase, so the PDF text is matched case-insensitively.
            text = text_of(pdf).casefold()
            for fact in SHARED_FACTS + LOCALE_FACTS[locale]:
                with self.subTest(locale=locale, fact=fact):
                    self.assertIn(fact.casefold(), text)


@unittest.skipUnless(CHROME, NO_CHROME)
class RenderContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._work = tempfile.TemporaryDirectory(prefix='cv-test-', ignore_cleanup_errors=True)
        cls._profile = tempfile.TemporaryDirectory(prefix='cv-chrome-', ignore_cleanup_errors=True)
        cls.work, cls.profile = Path(cls._work.name), cls._profile.name

    @classmethod
    def tearDownClass(cls):
        cls._work.cleanup()
        cls._profile.cleanup()

    def test_public_pdfs_match_fresh_render(self):
        for locale, (html, public_pdf) in render_cv.OUTPUTS.items():
            with self.subTest(locale=locale):
                fresh = render_cv.render_pdf(CHROME, html, self.work / public_pdf.name, self.profile)
                self.assertEqual(render_cv.pdf_contract_problems(fresh), [])
                self.assertEqual(text_of(fresh), text_of(public_pdf),
                                 f'{public_pdf.name} is stale; run python -B scripts/render-cv.py')

    def test_no_content_clipped_by_page(self):
        for locale, (html, _) in render_cv.OUTPUTS.items():
            with self.subTest(locale=locale):
                self.assertEqual(render_cv.check_overflow(CHROME, html, self.work, self.profile), [])

    def test_overflow_guard_detects_clipped_content(self):
        source = render_cv.OUTPUTS['en'][0]
        extra = '<p>Overflow filler line.</p>' * 40
        bloated = self.work / 'bloated.html'
        bloated.write_text(source.read_text(encoding='utf-8').replace('</main>', extra + '</main>', 1),
                           encoding='utf-8')
        problems = render_cv.check_overflow(CHROME, bloated, self.work, self.profile, base_dir=source.parent)
        self.assertTrue(problems, 'overflow guard missed content pushed past .page')


if __name__ == '__main__':
    unittest.main()
