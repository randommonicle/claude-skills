---
name: constant-time-secret-compare
description: Compare bearer tokens, API secrets, signatures, and password-equivalents with a constant-time comparison (hash both sides, then crypto.timingSafeEqual) — never == or short-circuiting string equality. Triggers when writing any code that checks a secret against a stored or expected value. Does not fire on comparing non-secret identifiers.
---

# Constant-time secret compare

String equality short-circuits on the first differing byte, so `token == expected` leaks how
many leading bytes matched through response timing — an oracle an attacker can walk.

## The rule

Hash both sides to fixed length, then compare constant-time:

```js
import { createHash, timingSafeEqual } from 'node:crypto';
const h = (s) => createHash('sha256').update(s).digest();
const ok = timingSafeEqual(h(provided), h(expected));
```

Hashing first makes the buffers equal-length (timingSafeEqual throws on length mismatch —
itself a leak) and keeps the comparison constant-time regardless of input size. Apply to
bearer tokens, admin tokens, webhook signatures, and any password-equivalent. HMAC
verification uses the same pattern on the computed and received MACs.

## Why

It costs two lines and removes a whole attack class; equality comparison on secrets is the
kind of defect that passes every functional test forever. Evidence: ICC CLAUDE.md
known-issues (admin token compare, shipped fix).
