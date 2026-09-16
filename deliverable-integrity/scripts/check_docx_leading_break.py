# -*- coding: utf-8 -*-
"""Assert that a .docx does not open with a blank page.

    python check_docx_leading_break.py FILE.docx [FILE.docx ...]

Exit 0 when every file opens on content, 1 when any opens on a page break.
Prints what it found either way, and names WHICH cause, because the two causes
need different fixes in the generator.

Contributed from a live matter where every generated document opened with a
blank page. The original contributed version tested only for `w:type="page"`
and was therefore silent on `<w:pageBreakBefore/>`, which is what a paragraph
style with "page break before" sets and is at least as common a cause. Measured
2026-09-16 against five fixtures: it passed a document that opens blank. A check
that cannot go red for a common cause of the bug it exists to catch is not a
check, so both causes are tested here and `tests/` pins each one.

What this does NOT tell you: why your generator emitted the break. It reports
the symptom in the artefact. The fix is upstream, in whatever writes the first
paragraph, and usually in a template's first paragraph style.
"""
import os
import re
import sys
import zipfile

PARAGRAPH = re.compile(r"<w:p[ >].*?</w:p>", re.S)
TEXT = re.compile(r"<w:t[^>]*>(.*?)</w:t>", re.S)
# <w:pageBreakBefore/> and <w:pageBreakBefore w:val="true"/> both mean on.
# w:val="0" / "false" / "off" explicitly mean off, so they are not a hit.
BREAK_BEFORE = re.compile(r'<w:pageBreakBefore(?:\s+w:val="(?!0|false|off)[^"]*")?\s*/?>')
BREAK_RUN = re.compile(r'<w:br[^>]*w:type="page"')


def leading_break(path):
    """Return (cause, first_text). cause is None when the document opens on content."""
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf8")
    except (zipfile.BadZipFile, KeyError, OSError) as exc:
        return ("unreadable: %s" % exc.__class__.__name__), ""

    parts = xml.split("<w:body>", 1)
    if len(parts) < 2:
        return "no <w:body>", ""

    for para in PARAGRAPH.findall(parts[1]):
        text = "".join(TEXT.findall(para)).strip()
        if BREAK_RUN.search(para):
            return "page-break run", text
        if BREAK_BEFORE.search(para):
            return "pageBreakBefore", text
        if text:
            return None, text
    return None, "(no content)"


def main(paths):
    if not paths:
        print(__doc__.strip().splitlines()[2].strip())
        return 2
    bad = 0
    for path in paths:
        cause, first = leading_break(path)
        bad += cause is not None
        print("  %-16s %-50s first text: %s"
              % (cause or "ok", os.path.basename(path)[:50], (first or "")[:40]))
    print("\n%d of %d open with a blank page" % (bad, len(paths)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
