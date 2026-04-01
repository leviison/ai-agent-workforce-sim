# ui-contracts

Data boundary between the simulation engine and the web UI.

---

## What the engine produces

`packages/simulation-engine` runs a scenario and emits a `SimulationOutput` value
that contains raw domain objects: `AgentNode`, `TaskRecord`, tick-indexed event
logs, and a `ScoreReport` with per-dimension floats. These types reference
internal domain concepts (graph topology, policy configurations, etc.) that the
UI has no business knowing about.

---

## What the UI consumes

All UI components import **only** from `@ai-training-game/ui-contracts`. Two view
models cover every screen:

### `SimulationResultViewModel`

Used by the trace table and the insight panel.

| Field          | Type                   | Notes                              |
| -------------- | ---------------------- | ---------------------------------- |
| `scenarioId`   | `string`               | Stable identifier for the scenario |
| `scenarioName` | `string`               | Human-readable display name        |
| `seed`         | `number`               | RNG seed used for the run          |
| `traces`       | `TraceRowViewModel[]`  | One row per agent task execution   |
| `insights`     | `string[]`             | Plain-text observations            |

Each `TraceRowViewModel` carries: `nodeId`, `agentId`, `taskId`, `success`,
`startTick`, `endTick`, `cost`, `quality`, `retryCount`, and an optional
`failureReason`.

### `ScoreSummaryViewModel`

Used by the score-card panel.

| Field            | Type      | Range  | Notes                                    |
| ---------------- | --------- | ------ | ---------------------------------------- |
| `overallScore`   | `number`  | 0–1    | Mean of the four score dimensions        |
| `quality`        | `number`  | 0–1    |                                          |
| `costEfficiency` | `number`  | 0–1    |                                          |
| `timeEfficiency` | `number`  | 0–1    |                                          |
| `robustness`     | `number`  | 0–1    |                                          |
| `hasBottleneck`  | `boolean` |        | True if any agent handled >40% of tasks  |
| `agentCount`     | `number`  | int    |                                          |
| `taskCount`      | `number`  | int    |                                          |
| `durationTicks`  | `number`  | int    |                                          |

---

## The boundary rule

> **No file inside `apps/web` may import from `packages/simulation-engine`
> directly.**

All data produced by the engine must be mapped to the view models above before
it reaches the UI layer. The mapping lives in a dedicated adapter
(`packages/simulation-engine/src/toViewModels.ts` or equivalent) that is the
only file permitted to import from both packages. `apps/web` sees only
`ui-contracts` types.

This keeps the UI decoupled from engine internals, makes the view models
trivially serialisable (no class instances, no circular refs), and gives a
single place to enforce display invariants (score clamping, missing-field
defaults, etc.).
