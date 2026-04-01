# Merge Gate — simulation-engine

This document defines the minimum quality bar required before any pull request
touching `packages/simulation-engine` (or any package it depends on) may be
merged.

---

## Minimum Passing Tests Required Before Merge

| Test file | Status | Blocks merge? |
|-----------|--------|---------------|
| `packages/simulation-engine/tests/engine.test.ts` | Must pass (all tests) | Blocking |
| `packages/simulation-engine/tests/determinism.test.ts` | Must pass (all tests) | **Always blocking** |
| `packages/simulation-engine/tests/failure-paths.test.ts` | Must pass (all tests) | Blocking |
| `packages/simulation-engine/tests/component-smoke.test.ts` | Must pass | Advisory for engine PRs; **blocking for UI PRs** |

### Rule: Any test file with "determinism" in its name is always blocking

If CI detects a file matching `**/tests/**/*determinism*.test.ts`, every test
in that file must be green before the merge gate opens — regardless of whether
the PR touches the engine, the UI, or shared types.

---

## Determinism Test

**Status: Required (blocking)**

`determinism.test.ts` runs `runSimulation()` with the `businessLaunch` scenario:

- 100 consecutive runs using seed 42 — every `SimulationOutput` must be
  deep-equal to the first result.
- 10 consecutive runs each for seeds 1, 99, and 12345 — same deep-equality
  assertion.

A determinism failure indicates that `createRng`, `engine.ts`, or a dependency
introduces non-deterministic state (e.g. `Math.random()`, `Date.now()`, or
mutable module-level singletons).  Such failures must be treated as P0 bugs.

---

## Component Smoke Tests

**Status: Advisory for engine merges; blocking for UI merges**

`component-smoke.test.ts` verifies:

1. The fixture data in `apps/web/src/fixtures/businessLaunchResult.ts`
   satisfies the `SimulationResultViewModel` and `ScoreSummaryViewModel`
   TypeScript contracts (compile-time).
2. `mockScoreSummary.overallScore` is in [0, 1].
3. `mockSimulationResult.traces` has exactly 6 entries.
4. At least one trace entry has a `failureReason` defined.
5. `mockScoreSummary.hasBottleneck` is `true`.

These tests do not render DOM elements and do not require
`@testing-library/react`.

---

## Merge Checklist

Before approving any PR that touches `packages/simulation-engine`,
`packages/shared-types`, or `apps/web`:

- [ ] Determinism test passes (`determinism.test.ts` — all seeds, all runs)
- [ ] All `FailureReason` enum values are tested in `failure-paths.test.ts`
  (`AGENT_UNAVAILABLE`, `TIMEOUT`, `DEPENDENCY_CYCLE`, `CAPACITY_EXCEEDED` —
  the latter two are structural/enum-completeness checks)
- [ ] No direct `simulation-engine` imports exist in `apps/web` — the UI must
  consume only `@sim/ui-contracts` types; run
  `grep -r "@sim/simulation-engine" apps/web/src` and confirm zero results
- [ ] Scorer weights sum to a positive non-zero value — verified by inspecting
  `defaultScoringConfig.weights` in `packages/shared-types/src/index.ts`:
  `quality + cost_efficiency + time_efficiency + robustness > 0`
  (currently 0.25 + 0.25 + 0.25 + 0.25 = 1.0)

---

## Notes

- `engine.ts` and `scorer.ts` must **not** be modified to make tests pass.
  Tests must be written to work with the engine as shipped.
- The `component-smoke.test.ts` file is placed under
  `packages/simulation-engine/tests/` so it is picked up by the root
  `vitest.config.ts` glob (`packages/*/tests/**/*.test.ts`) and runs as part
  of the engine test suite.  It is advisory for engine-only PRs.
- When adding new `FailureReason` enum values, a corresponding test case in
  `failure-paths.test.ts` becomes a merge requirement.
