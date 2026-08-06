# Picking a real reference when the user cannot name one

[choosing-a-look.md](choosing-a-look.md) says it plainly: get a real reference from the
user and match it, and everything else is what to do when you cannot. This file removes
most of the "cannot". It points at a public collection of design guides captured from
real, named websites, so "no reference from the user" stops meaning "no reference".

## The collection

[fudge-design-md](https://github.com/scroobius-pip/fudge-design-md) (MIT) holds ~290
DESIGN.md guides, each reverse-engineered from captured pages of one real site by the
Fudge tool. A guide summarizes the site's visual direction and, in most cases, carries
captured tokens: hex palettes, type tables with sizes, weights, and letter-spacing,
spacing measurements, component descriptions, responsive behavior, and a recommended
build order. Guides separate captured fact from interpretation, and each closes with a
scope note stating what the evidence does not establish.

[design-reference-index.md](design-reference-index.md) is a one-line-per-site index of
the collection, committed here so you can shortlist without fetching the upstream
README. Its header records the upstream commit it was generated from; when it drifts,
regenerate with `scripts/build_reference_index.py` against a fresh clone.

## How to pick

1. Read the index and shortlist two or three sites whose product genre and register
   match the project: marketing site, editorial, docs, dashboard, dev tool, consumer
   app. Genre match beats taste match — a dashboard should not borrow its density from
   a poetry magazine unless that contrast is the point.
2. If the user is present, offer the shortlist by name with one line each on why, and
   let them pick. Building unattended, pick one and say which and why.
3. Use ONE guide. Never blend two or three sites into a composite — averaging
   references reproduces exactly the regression to the median this skill exists to
   stop. If nothing in the collection fits, fall back to choosing-a-look.md's method
   rather than forcing a bad match.

## How to use the guide

Fetch the full guide:

    https://raw.githubusercontent.com/scroobius-pip/fudge-design-md/main/design-md/<domain>.md

Then:

- **The scope note is binding.** Where a guide says hover, error, disabled, or motion
  states were not captured, design those yourself in the guide's spirit; never present
  invented values as captured fact.
- **Take direction, not identity.** Anchor palette discipline, type scale, density, and
  structure to the guide; do not reproduce the source site's brand, logo, name, or
  distinctive trade dress. A reference is how the work stops being median, not a
  license to imitate a company.
- **Adapt to the product.** Upstream's own instruction: use the guide as design
  direction, "then adapt the result to your product rather than copying the source
  website."
- **Tokens are anchors, not gospel.** Captured hex and type values are a starting
  palette; extend them deliberately and say so, exactly as the SKILL.md brief requires.

## Quirks of the collection (checked against commit 48602c5, August 2026)

- 110 of 287 guides end twice: a raw captured-token dump ("## Colors", "## Typography
  captured from …") appears after the closing scope note. It is extra captured data,
  not corruption; read past the odd structure.
- 24 guides carry no hex values at all (stripe.com and linear.app among them) — they
  give direction and structure only, and their scope notes say so.
- The thinnest guides run ~90 lines with stub sections; when two candidates are close,
  prefer the fuller one.
- Screenshot links point at remote hosts and will not render offline. The prose is
  self-contained; you never need the images.
