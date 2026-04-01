# ADR 003 — Simulation Boundary: Facade vs Local API

**Status:** Accepted  
**Date:** 2026-03-31  
**Author:** Soren Pike, Architect

---

## Decision

**Option A (in-browser facade)** is adopted.

A new workspace package `@sim/simulation-facade` sits between `apps/web` and the engine layer. The facade is the only package that imports `@sim/simulation-engine` and `@sim/scenario-data`. It re-exports a single stable entry point that accepts a `SimulationInput` and returns a `SimulationResultViewModel` drawn from `@sim/ui-contracts`.

---

## Deciding Factors

### 1. Complexity

Option A adds one npm workspace package following the exact same pattern already in use (`shared-types`, `ui-contracts`, `simulation-engine`, `scenario-data`). No extra process, no Vite proxy entry, no startup-order dependency between a Node server and the dev server. Option B requires a `sim-server` process, a Vite proxy rule, process lifecycle management in dev and CI, and JSON serialisation of every engine type crossing the HTTP boundary — all scaffolding that has no payoff at MVP scale.

### 2. Testability

The facade exposes a pure TypeScript function: given a fixed `SimulationInput` (including a deterministic `seed`) it returns a `SimulationResultViewModel`. Unit tests call it directly with `vitest` — no network, no ports, no async process startup. Option B requires an HTTP server to be running, introduces async fetch, and couples test reliability to port availability and process teardown.

### 3. Boundary Enforcement

The facade pattern enforces the boundary at the TypeScript module-graph level. `apps/web`'s `package.json` lists only `@sim/simulation-facade` and `@sim/ui-contracts` as dependencies; `@sim/simulation-engine` is absent, so any accidental direct import from `apps/web` is a compile-time error. Option B enforces the boundary only at runtime (the engine lives in a separate process), but nothing in the TypeScript project prevents a developer from later adding a direct engine import to `apps/web` — the fence is invisible.

---

## Import Boundary Rule

> `apps/web` MUST NOT import from `@sim/simulation-engine`, `@sim/scenario-data`, or `@sim/shared-types` directly.  
> All simulation logic MUST be accessed exclusively through `@sim/simulation-facade`.  
> View-model types MUST be imported from `@sim/ui-contracts` only.

Concretely: the only `@sim/*` packages permitted in `apps/web/package.json#dependencies` are `@sim/simulation-facade` and `@sim/ui-contracts`.

---

## Rejected Alternative

**Option B (local API / `packages/sim-server`)** was rejected. The HTTP indirection buys nothing at MVP scale — the engine is pure and deterministic, there is no shared state requiring process isolation, and the extra moving parts (server process, proxy, serialisation round-trips) increase surface area for bugs without improving the architectural boundary guarantee.
