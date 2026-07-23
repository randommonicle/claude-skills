---
name: substantiate-outward-claims
description: Any certification, award, statistic, or third-party performance claim shown to a customer needs a primary or independent source, or explicit attribution ("the manufacturer states…") — never asserted as fact, and never trusted from an AI summary, which blends marketing with real product names. Triggers when writing customer-facing copy, marketing pages, or an assistant's knowledge base entries that assert such claims. Does not fire on internal docs citing code or history — verified-citations owns those.
---

# Substantiate outward claims

A public site nearly shipped "WoolSafe approved", a decibel figure, and a machine model
designation, none of which could be substantiated — one of them contradicted by the
manufacturer's own documentation while a search engine's AI overview confidently asserted
the opposite. The exposure on outward claims is advertising standards and reputation, which
is why this is separate from verified-citations (internal references).

## The rules

- **Every outward claim gets a primary or independent source, or explicit attribution.**
  "The manufacturer states a 76dB rating" is honest; bare "76dB" is your claim now.
- **An in-house assessment is not an independent certification.** "Safe for wool" (our
  judgement) and "WoolSafe approved" (a certification body's mark) are different claims with
  different legal weight; never upgrade one into the other.
- **Never launder a claim through an AI summary.** Search-engine AI overviews and model
  memory blend marketing copy with real product data and assert the blend confidently — in
  the evidence, confidently wrong. Chase the vendor's own documentation; in a
  vendor-dominated domain, the SEO layer repeats numbers with no methodology while the
  vendor publishes the actual behaviour.
- **A number with no traceable methodology is fabricated until shown otherwise** — the
  archetype being a "75% of CVs auto-rejected" statistic that traced to a dead company's
  2012 marketing.
- **Label evidence strength** in research that feeds customer-facing content:
  well-evidenced, weakly evidenced, or myth — and say which.

## What this skill does not do

It does not govern internal engineering citations (verified-citations) or the claims inside
generated client documents (deliverable-integrity handles claim drift in rewrites). It
governs what the outside world is told as fact.

## Why

Outward claims outlive their authors: they get quoted, cached, and screenshotted, and an
indefensible one is a legal exposure that no later correction fully retrieves. Evidence:
ICC LESSONS_LEARNED L-009 with both addenda; this repo's LESSONS_LEARNED lesson 4.
