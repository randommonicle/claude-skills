# -*- coding: utf-8 -*-
"""Test for check_docx_leading_break.py.

    python check_docx_leading_break_test.py

Builds a minimal .docx per case, runs the real checker, and asserts both the
verdict and the named cause. The two break cases are the ones that must be able
to go red: the contributed version of this checker passed `pageBreakBefore`,
so that case is the regression pin.
"""
import os
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_docx_leading_break import leading_break  # noqa: E402

DOC = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
       '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
       '<w:body>%s</w:body></w:document>')

CONTENT = '<w:p><w:r><w:t>Service charge report</w:t></w:r></w:p>'

CASES = [
    ("content first, no break",
     CONTENT, None),
    ("page-break run before any text",
     '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + CONTENT, "page-break run"),
    ("pageBreakBefore on the first paragraph (the contributed version missed this)",
     '<w:p><w:pPr><w:pageBreakBefore/></w:pPr><w:r><w:t>Report</w:t></w:r></w:p>',
     "pageBreakBefore"),
    ("pageBreakBefore with w:val=true",
     '<w:p><w:pPr><w:pageBreakBefore w:val="true"/></w:pPr><w:r><w:t>R</w:t></w:r></w:p>',
     "pageBreakBefore"),
    ("pageBreakBefore explicitly switched off is not a hit",
     '<w:p><w:pPr><w:pageBreakBefore w:val="0"/></w:pPr><w:r><w:t>R</w:t></w:r></w:p>',
     None),
    ("a self-closing empty paragraph does not hide a later break",
     '<w:p/><w:p><w:r><w:br w:type="page"/></w:r></w:p>' + CONTENT, "page-break run"),
    ("empty paragraphs before content are not a page break",
     '<w:p><w:r><w:t></w:t></w:r></w:p>' * 3 + CONTENT, None),
    ("a break AFTER the first content is fine, that is a normal document",
     CONTENT + '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + CONTENT, None),
    ("no content at all",
     '', None),
]

failed = 0
tmp = tempfile.mkdtemp()

for name, body, expected in CASES:
    path = os.path.join(tmp, "case.docx")
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("word/document.xml", DOC % body)
    cause, _ = leading_break(path)
    if cause == expected:
        print("PASS  %s" % name)
    else:
        failed += 1
        print("FAIL  %s" % name)
        print("        expected %r, got %r" % (expected, cause))

# A file that is not a docx must report, not raise: this runs over whatever the
# user globbed and a traceback in the middle of a batch loses the other results.
junk = os.path.join(tmp, "notazip.docx")
with open(junk, "wb") as fh:
    fh.write(b"this is not a zip")
cause, _ = leading_break(junk)
if cause and cause.startswith("unreadable"):
    print("PASS  a non-docx reports unreadable instead of raising")
else:
    failed += 1
    print("FAIL  a non-docx reports unreadable instead of raising")
    print("        got %r" % cause)

if failed:
    print("\n%d case%s failed" % (failed, "" if failed == 1 else "s"))
    sys.exit(1)
print("\nall cases passed")
