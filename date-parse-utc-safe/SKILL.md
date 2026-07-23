---
name: date-parse-utc-safe
description: In a UTC server or serverless runtime, new Date("YYYY-MM-DD") is UTC midnight and renders as the previous day in western timezones. Parse date-only strings into explicit local components (new Date(y, m-1, d)) anywhere a date becomes a display string or a day-of-week. Triggers when parsing a date-only string server-side or computing a printed day from one. Does not fire on full ISO timestamps carrying explicit timezones.
---

# Date parsing, UTC-safe

One rule, endlessly rediscovered: `new Date("YYYY-MM-DD")` parses as UTC midnight. In a UTC
runtime (serverless platforms run UTC) rendered through a western timezone, that is the
previous day — bookings display on the wrong date, day-of-week computes wrong, and the bug
never reproduces on a developer machine in the same timezone as the users.

## The rule

Never construct a Date from a bare `YYYY-MM-DD` string for display or day-of-week.
Decompose to explicit local components:

```js
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d); // local midnight, not UTC midnight
```

Test the boundary: a date rendered at local midnight in the runtime's timezone is where the
off-by-one appears.

## Why

The failure only exists in the deployed runtime's timezone, so it survives local testing by
construction. Evidence: ICC LESSONS_LEARNED L-005.
