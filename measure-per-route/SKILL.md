---
name: measure-per-route
description: A platform fact measured on one access path, build, timing or machine is a fact about that route only. Record every measured platform property with the route, build, timing and machine it was measured on; measure again before relying on it elsewhere; compare routes over a whole range, not a sample; know when a platform emits the output a gate reads; list what the measuring environment added to a reading; and prove a stop or restart by its effect, not its success message. Triggers when relying on a fetch boundary, a flag, a diagnostic line, a performance figure or a service address measured earlier, when reusing a measurement on another request shape, build, device, timing or machine, after a restart of a terminal, stack or dev server, and when registering a comparison or gate on platform output. Does not fire on reading current state before building (live-state-first) or on test runtimes that differ from the deploy runtime (fixtures-from-reality).
---

# Measure per route

A platform rarely documents the edges its users rely on: whether a range's end is inclusive
on every request shape, whether a flag is stable between two fetch times, when a diagnostic
line is printed, which build a restart lands on, what the measuring machine injects. One
measurement answers for the route it was taken on, and it reads as a general fact once
written down. The next route then fails closed in a gate, or silently in the data.

## The rules

1. **Record the route with the fact.** Write each measured platform property with what it
   was measured on: the request shape, the build or version, the time of day or fetch timing,
   the machine and its tools. A fact without its route is a guess about other routes.
2. **Measure again on the new route.** Before relying on the property on a different request
   shape, build, timing, device or machine, measure it there. One clean rehearsal on one day
   is one route.
3. **Compare whole ranges.** Compare two routes item by item over a whole range (every tick,
   every row, every page), because an edge that fails one item in a hundred passes any
   sample.
4. **Know when the platform speaks.** Before a gate reads a platform's diagnostic output,
   measure when that output is emitted (a cache reused between runs may suppress it), so a
   correct run is not failed for a missing line.
5. **Name the build under the run.** Before any restart of a tool that updates itself, check
   for a pending update, and record the build each step ran on; a comparison across a build
   change says so.
6. **Subtract the environment.** Before a local reading is recorded as the system's, list the
   origins, processes and services it saw and exclude what the system does not serve (an
   antivirus's injected script, a gateway holding a peer's old address).
7. **A stop is proven by its effect.** After stopping or restarting a server through a
   wrapper, check the port is closed and the child processes are gone, not that the wrapper
   said it stopped.

## Provenance

passive income L-057 (a restart applied a downloaded update under a registered run), L-062
(a fetch boundary measured on one route dropped 8 of 692 boundary ticks on another), L-066
(the tester names generated-tick dates only when it prepares ticks), L-088 (an identity check
rested on a flag bit whose stability across two fetch timings was never measured); ICC L-071
(the local gateway kept the Auth container's old address after a reset), L-087 (a Lighthouse
reading included the machine's antivirus script); AI domain L-119 (stopping a backgrounded
dev server left its child process holding the port). `docs/SKILL_PROPOSALS_2026-10-22.md`,
Tier 1 item 5.
