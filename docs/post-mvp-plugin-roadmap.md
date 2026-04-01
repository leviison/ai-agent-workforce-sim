# Post-MVP Roadmap: Plugin Architecture & Scenario System

**Author:** Atlas Vale, Orchestrator  
**Date:** 2026-03-31  
**Status:** Plan — ready for sprint planning  
**Scope:** Sprints 6, 7, 8  

---

## 1. Current State Summary

| Asset | Location | Contents |
|-------|----------|----------|
| Shared types | `packages/shared-types/src/index.ts` | Scenario, Agent, Task, CoachingRule, TriggerCondition, SimulationInput/Output, Score, ScoringConfig |
| Scenario data | `packages/scenario-data/src/index.ts` | `businessLaunch` (6 tasks, 3 agents) + `businessLaunchRules` (5 coaching rules) |
| Simulation engine | `packages/simulation-engine/src/engine.ts` | `runSimulation()` — topo-sort, tick loop, skill scoring, retry logic |
| Coaching engine | `packages/coaching-engine/src/index.ts` | `generateInsights()` — evaluates rules against output |
| Facade | `packages/simulation-facade/src/index.ts` | `runSimulationFromInput()` — hardcodes `businessLaunchRules` |
| UI contracts | `packages/ui-contracts/src/index.ts` | View model types (TraceRowViewModel, ScoreSummaryViewModel, SimulationResultViewModel) |
| Mappers | `packages/simulation-facade/src/mappers.ts` | `mapOutputToViewModel()`, `mapTraceToRow()`, `mapScoreToSummary()` |

**Key coupling to break:** The facade imports `businessLaunchRules` directly and passes them to `generateInsights`. There is no scenario-level indirection.

---

## 2. Plugin Registry Architecture

### 2.1 Design Principles

- **Data-driven, not code-driven.** Scenario plugins are plain objects conforming to an interface, not classes with inheritance hierarchies.
- **Registry pattern.** A central `PluginRegistry` holds all registered plugins. The facade and UI query it by ID.
- **No dynamic `import()`.** All plugins are statically imported and registered at app boot. Dynamic loading is a future concern.
- **Extension points, not monkey-patching.** The engine exposes lifecycle hooks; mechanics plugins attach to those hooks.

### 2.2 Plugin Types

```
PluginRegistry
 ├── scenarioPlugins:  Map<string, ScenarioPlugin>
 ├── agentPlugins:     Map<string, AgentPlugin>
 ├── outputPlugins:    Map<string, OutputPlugin>
 └── mechanicsPlugins: Map<string, MechanicsPlugin>
```

### 2.3 Type Definitions (new file: `packages/shared-types/src/plugins.ts`)

```typescript
import type {
  Scenario, Agent, CoachingRule, SimulationOutput,
  Score, ScoringConfig, Trace, Task, WorkflowNode
} from './index'

// ---------------------------------------------------------------------------
// ScenarioPlugin — a self-contained scenario bundle
// ---------------------------------------------------------------------------
export type ScenarioPlugin = {
  /** Unique scenario ID (e.g. 'business-launch') */
  id: string
  /** Human-readable name for the UI dropdown */
  name: string
  /** Short description shown in scenario selector */
  description: string
  /** The scenario data: tasks, agents, metadata */
  scenario: Scenario
  /** Coaching rules specific to this scenario */
  coachingRules: CoachingRule[]
  /** Optional custom scoring weights for this scenario */
  scoringConfig?: Partial<ScoringConfig>
  /** IDs of mechanics plugins this scenario requires */
  requiredMechanics?: string[]
  /** Optional output plugin ID for custom result formatting */
  outputPluginId?: string
}

// ---------------------------------------------------------------------------
// AgentPlugin — a reusable agent template
// ---------------------------------------------------------------------------
export type AgentPlugin = {
  /** Unique agent template ID */
  id: string
  /** Agent definition */
  agent: Agent
  /** Which scenario IDs this agent is available in (empty = all) */
  scenarioScope: string[]
  /** Tags for UI filtering (e.g. 'creative', 'technical') */
  tags: string[]
}

// ---------------------------------------------------------------------------
// OutputPlugin — custom result formatting for a scenario
// ---------------------------------------------------------------------------
export type OutputFormat = 'json' | 'csv' | 'pdf'

export type OutputPlugin = {
  id: string
  name: string
  supportedFormats: OutputFormat[]
  /** Transform raw SimulationOutput into a scenario-specific export payload */
  formatOutput: (
    output: SimulationOutput,
    scenario: Scenario,
    format: OutputFormat,
  ) => string | Uint8Array
}

// ---------------------------------------------------------------------------
// MechanicsPlugin — custom simulation mechanics (hooks into engine loop)
// ---------------------------------------------------------------------------

/** Context passed to mechanics hooks during simulation */
export type MechanicsContext = {
  tick: number
  trace: Trace[]
  agents: Map<string, Agent>
  tasks: Map<string, Task>
  /** Mutable — mechanics can modify scoring config mid-run */
  scoringConfig: ScoringConfig
}

export type MechanicsPlugin = {
  id: string
  name: string
  description: string

  /**
   * Called once before the engine loop starts.
   * Use for validation (e.g. "does the workflow fit the budget?").
   * Throw to abort simulation with a user-facing error.
   */
  onBeforeSimulation?: (context: MechanicsContext) => void

  /**
   * Called after each node is processed (all attempts for that node complete).
   * Can modify context.scoringConfig or append synthetic trace entries.
   */
  onAfterNode?: (node: WorkflowNode, context: MechanicsContext) => void

  /**
   * Called after the full engine loop completes, before scoring.
   * Last chance to mutate trace or config before final score computation.
   */
  onBeforeScoring?: (context: MechanicsContext) => void
}

// ---------------------------------------------------------------------------
// PluginRegistry — central store
// ---------------------------------------------------------------------------
export type PluginRegistryState = {
  scenarios: Map<string, ScenarioPlugin>
  agents: Map<string, AgentPlugin>
  outputs: Map<string, OutputPlugin>
  mechanics: Map<string, MechanicsPlugin>
}
```

### 2.4 Registry Implementation (new file: `packages/plugin-registry/src/index.ts`)

```typescript
import type {
  ScenarioPlugin, AgentPlugin, OutputPlugin,
  MechanicsPlugin, PluginRegistryState
} from '@sim/shared-types/plugins'

class PluginRegistry {
  private state: PluginRegistryState = {
    scenarios: new Map(),
    agents: new Map(),
    outputs: new Map(),
    mechanics: new Map(),
  }

  registerScenario(plugin: ScenarioPlugin): void {
    if (this.state.scenarios.has(plugin.id)) {
      throw new Error(`Scenario plugin '${plugin.id}' already registered`)
    }
    this.state.scenarios.set(plugin.id, plugin)
  }

  registerAgent(plugin: AgentPlugin): void { ... }
  registerOutput(plugin: OutputPlugin): void { ... }
  registerMechanics(plugin: MechanicsPlugin): void { ... }

  getScenario(id: string): ScenarioPlugin | undefined { ... }
  getAllScenarios(): ScenarioPlugin[] { ... }
  getMechanicsForScenario(scenarioId: string): MechanicsPlugin[] { ... }
  getOutputPlugin(id: string): OutputPlugin | undefined { ... }

  /** Validates that all required mechanics for each scenario are registered */
  validate(): string[] { ... }
}

// Singleton — created at boot, populated by registerAllPlugins()
export const registry = new PluginRegistry()
```

### 2.5 Boot Sequence (new file: `packages/plugin-registry/src/bootstrap.ts`)

```typescript
import { registry } from './index'

// Scenario plugins
import { businessLaunchPlugin } from '@sim/scenario-data/businessLaunch'
import { researchPipelinePlugin } from '@sim/scenario-data/researchPipeline'
import { incidentResponsePlugin } from '@sim/scenario-data/incidentResponse'

// Output plugins
import { defaultJsonOutput } from '@sim/scenario-data/outputs/json'

export function registerAllPlugins(): void {
  registry.registerScenario(businessLaunchPlugin)
  registry.registerScenario(researchPipelinePlugin)
  registry.registerScenario(incidentResponsePlugin)

  registry.registerOutput(defaultJsonOutput)

  const errors = registry.validate()
  if (errors.length > 0) {
    console.error('Plugin validation errors:', errors)
  }
}
```

---

## 3. Two New Scenarios

### 3.1 Scenario 2: "AI Research Pipeline" (`research-pipeline`)

**Theme:** Orchestrate a team of AI agents to conduct a literature review, run experiments, analyze results, and produce a research paper.

| Field | Value |
|-------|-------|
| ID | `research-pipeline` |
| Tasks | 5: `literature-review`, `hypothesis-formulation`, `experiment-design`, `data-analysis`, `paper-drafting` |
| Agents | 3: `agent-researcher` (accuracy 0.92, reasoning 0.88), `agent-experimentalist` (speed 0.85, accuracy 0.8), `agent-writer` (creativity 0.9, speed 0.75) |
| DAG shape | Diamond — `literature-review` feeds both `hypothesis-formulation` and `experiment-design`; both feed `data-analysis`; `data-analysis` feeds `paper-drafting` |
| Coaching rules | 5 rules: quality gate on literature-review, cost warning on experimentalist overuse, failure-reason rules for timeout and cycle, utilization cap on agent-researcher |
| Unique mechanic | **Time limit** — simulation must complete within 80 ticks or remaining tasks auto-fail |

**Teaching objective:** Parallel DAG branching. Players learn that the diamond shape allows concurrent execution but creates a merge bottleneck at `data-analysis`.

### 3.2 Scenario 3: "Incident Response" (`incident-response`)

**Theme:** An AI ops team must triage, diagnose, fix, verify, and document a production outage under budget and time pressure.

| Field | Value |
|-------|-------|
| ID | `incident-response` |
| Tasks | 5: `triage`, `root-cause-analysis`, `hotfix-development`, `verification`, `postmortem` |
| Agents | 4: `agent-oncall` (speed 0.9, reasoning 0.7), `agent-sre` (accuracy 0.85, reasoning 0.9), `agent-developer` (creativity 0.8, speed 0.7), `agent-tech-writer` (accuracy 0.88, creativity 0.75) |
| DAG shape | Linear with optional skip — `triage` -> `root-cause-analysis` -> `hotfix-development` -> `verification` -> `postmortem`. `triage` also feeds `postmortem` directly (parallel path) |
| Coaching rules | 5 rules: speed warning if triage takes >5 ticks, cost cap coaching, failure-reason rules, SRE overload warning, quality gate on verification |
| Unique mechanic | **Budget constraint** — total agent cost must not exceed 8.0; engine aborts with a budget-exceeded failure if the running total crosses the cap |

**Teaching objective:** Cost-constrained speed optimization. Players learn that throwing the most expensive agent at every task blows the budget, but cheap agents fail the quality gates.

---

## 4. Sprint Breakdown

### Sprint 6: Plugin Infrastructure + Scenario Refactor (1 week)

**Goal:** Extract the plugin type system, build the registry, refactor `businessLaunch` into a ScenarioPlugin, update the facade to use the registry.

| # | Task | Package(s) affected | Deliverable |
|---|------|---------------------|-------------|
| 6.1 | Create `packages/shared-types/src/plugins.ts` with all plugin interfaces | `shared-types` | New file; re-export from `index.ts` |
| 6.2 | Create `packages/plugin-registry` package | new package | `src/index.ts` (PluginRegistry class), `src/bootstrap.ts` |
| 6.3 | Refactor `businessLaunch` into `ScenarioPlugin` shape | `scenario-data` | `src/scenarios/businessLaunch.ts` exports `businessLaunchPlugin: ScenarioPlugin` |
| 6.4 | Update facade: replace hardcoded `businessLaunchRules` with registry lookup | `simulation-facade` | `runSimulationFromInput` accepts `scenarioId`, pulls rules from registry |
| 6.5 | Add `onBeforeSimulation` / `onAfterNode` / `onBeforeScoring` hook calls to engine | `simulation-engine` | Engine accepts optional `MechanicsPlugin[]` param |
| 6.6 | Add `ScenarioSelectorViewModel` to `ui-contracts` | `ui-contracts` | New type: `{ scenarios: { id, name, description }[] }` |
| 6.7 | Tests: registry CRUD, facade with registry, engine with empty hooks | all above | Vitest coverage |

**Files created:**
- `packages/shared-types/src/plugins.ts`
- `packages/plugin-registry/src/index.ts`
- `packages/plugin-registry/src/bootstrap.ts`
- `packages/plugin-registry/package.json`
- `packages/plugin-registry/tsconfig.json`
- `packages/scenario-data/src/scenarios/businessLaunch.ts` (refactored from current `index.ts`)

**Files modified:**
- `packages/shared-types/src/index.ts` — add `export * from './plugins'`
- `packages/scenario-data/src/index.ts` — re-export from `scenarios/` subdirectory
- `packages/simulation-engine/src/engine.ts` — add hooks parameter + call sites
- `packages/simulation-facade/src/index.ts` — use registry instead of direct import
- `packages/ui-contracts/src/index.ts` — add `ScenarioSelectorViewModel`
- `package.json` (root) — workspace already covers `packages/*`, no change needed

### Sprint 7: Two New Scenarios + Mechanics Plugins (1 week)

**Goal:** Build both new scenarios as ScenarioPlugins. Implement the two mechanics plugins (time-limit, budget-constraint). Wire scenario selector in the UI.

| # | Task | Package(s) affected | Deliverable |
|---|------|---------------------|-------------|
| 7.1 | Build `researchPipelinePlugin` scenario data | `scenario-data` | `src/scenarios/researchPipeline.ts` — 5 tasks, 3 agents, 5 rules, diamond DAG |
| 7.2 | Build `incidentResponsePlugin` scenario data | `scenario-data` | `src/scenarios/incidentResponse.ts` — 5 tasks, 4 agents, 5 rules |
| 7.3 | Implement `timeLimitMechanic` | `scenario-data` | `src/mechanics/timeLimit.ts` — MechanicsPlugin that fails remaining tasks after tick cap |
| 7.4 | Implement `budgetConstraintMechanic` | `scenario-data` | `src/mechanics/budgetConstraint.ts` — MechanicsPlugin that aborts on cost overrun |
| 7.5 | Register new scenarios + mechanics in bootstrap | `plugin-registry` | Update `bootstrap.ts` |
| 7.6 | Add scenario selector dropdown to UI | `apps/web` | Dropdown bound to `ScenarioSelectorViewModel`, triggers scenario load |
| 7.7 | Tests: both scenarios simulate end-to-end, mechanics trigger correctly | all above | Vitest coverage |

**Files created:**
- `packages/scenario-data/src/scenarios/researchPipeline.ts`
- `packages/scenario-data/src/scenarios/incidentResponse.ts`
- `packages/scenario-data/src/mechanics/timeLimit.ts`
- `packages/scenario-data/src/mechanics/budgetConstraint.ts`

**Files modified:**
- `packages/scenario-data/src/index.ts` — export new scenarios
- `packages/plugin-registry/src/bootstrap.ts` — register new plugins
- `apps/web` — scenario selector UI component

### Sprint 8: Output Plugins + Polish + Documentation (1 week)

**Goal:** Implement output plugin system. Add CSV export. Harden edge cases. Write developer docs for creating plugins.

| # | Task | Package(s) affected | Deliverable |
|---|------|---------------------|-------------|
| 8.1 | Implement `defaultJsonOutput` plugin | `scenario-data` | `src/outputs/json.ts` — serializes SimulationOutput to formatted JSON |
| 8.2 | Implement `csvOutput` plugin | `scenario-data` | `src/outputs/csv.ts` — trace rows as CSV, score summary as header |
| 8.3 | Add export button to UI (JSON / CSV toggle) | `apps/web` | Uses output plugin via facade |
| 8.4 | Facade: add `exportSimulationResult()` function | `simulation-facade` | Accepts `scenarioId`, `format`, delegates to OutputPlugin |
| 8.5 | Add `AgentPlugin` support to registry + scenario agent override UI | `plugin-registry`, `apps/web` | Users can swap agents from a broader pool |
| 8.6 | Edge case hardening: missing mechanics, invalid scenario IDs, empty workflows | all packages | Error handling + tests |
| 8.7 | Developer guide: "How to create a scenario plugin" | `docs/` | Step-by-step with type stubs |

**Files created:**
- `packages/scenario-data/src/outputs/json.ts`
- `packages/scenario-data/src/outputs/csv.ts`
- `docs/plugin-developer-guide.md` (only if explicitly requested at sprint time)

**Files modified:**
- `packages/simulation-facade/src/index.ts` — add `exportSimulationResult()`
- `packages/plugin-registry/src/bootstrap.ts` — register output plugins
- `apps/web` — export UI

---

## 5. Detailed Package Change Map

```
packages/
├── shared-types/
│   └── src/
│       ├── index.ts          [MODIFY] add re-export of plugins.ts
│       └── plugins.ts        [NEW]    all plugin interfaces
│
├── plugin-registry/          [NEW PACKAGE]
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          PluginRegistry class + singleton
│       └── bootstrap.ts      registerAllPlugins()
│
├── scenario-data/
│   └── src/
│       ├── index.ts          [MODIFY] re-export from scenarios/*
│       ├── coaching-rules.ts [KEEP]   backward compat, imported by scenario plugins
│       ├── scenarios/        [NEW DIRECTORY]
│       │   ├── businessLaunch.ts      refactored from current index.ts
│       │   ├── researchPipeline.ts    new scenario
│       │   └── incidentResponse.ts    new scenario
│       ├── mechanics/        [NEW DIRECTORY]
│       │   ├── timeLimit.ts           MechanicsPlugin
│       │   └── budgetConstraint.ts    MechanicsPlugin
│       └── outputs/          [NEW DIRECTORY]
│           ├── json.ts                OutputPlugin
│           └── csv.ts                 OutputPlugin
│
├── simulation-engine/
│   └── src/
│       └── engine.ts         [MODIFY] accept MechanicsPlugin[], call hooks
│
├── simulation-facade/
│   └── src/
│       ├── index.ts          [MODIFY] use registry, add exportSimulationResult
│       └── mappers.ts        [NO CHANGE]
│
├── coaching-engine/
│   └── src/
│       └── index.ts          [NO CHANGE] already generic over CoachingRule[]
│
└── ui-contracts/
    └── src/
        └── index.ts          [MODIFY] add ScenarioSelectorViewModel
```

---

## 6. Facade API After Plugin Architecture

The facade signature changes from implicit scenario binding to explicit scenario selection:

```typescript
// BEFORE (MVP — hardcoded)
export function runSimulationFromInput(input: SimulationInput): SimulationResultViewModel

// AFTER (post-MVP — registry-driven)
export function runSimulationFromInput(input: SimulationInput): SimulationResultViewModel
// Internally: looks up scenarioPlugin by input.scenario.id, gets coachingRules
// and mechanics from registry instead of hardcoded import

export function getAvailableScenarios(): ScenarioSelectorViewModel
// Returns { scenarios: [{ id, name, description }] } from registry

export function exportSimulationResult(
  output: SimulationOutput,
  scenarioId: string,
  format: OutputFormat,
): string | Uint8Array
// Delegates to the scenario's OutputPlugin (falls back to default JSON)
```

The `SimulationInput` type does NOT change. The `input.scenario` field already carries the full scenario. The registry lookup is for coaching rules and mechanics, not for replacing the scenario in the input.

---

## 7. Engine Hook Integration

The engine signature changes to accept optional hooks:

```typescript
// packages/simulation-engine/src/engine.ts

import type { MechanicsPlugin } from '@sim/shared-types/plugins'

export function runSimulation(
  input: SimulationInput,
  mechanics?: MechanicsPlugin[],
): SimulationOutput {
  const context: MechanicsContext = { tick: 0, trace: [], agents: agentMap, tasks: taskMap, scoringConfig }

  // NEW: call onBeforeSimulation hooks
  for (const m of mechanics ?? []) {
    m.onBeforeSimulation?.(context)
  }

  for (const node of sorted) {
    // ... existing attempt loop ...

    // NEW: call onAfterNode hooks
    for (const m of mechanics ?? []) {
      m.onAfterNode?.(node, context)
    }
  }

  // NEW: call onBeforeScoring hooks
  for (const m of mechanics ?? []) {
    m.onBeforeScoring?.(context)
  }

  const metrics = computeScore(context.trace, context.scoringConfig, scenario.tasks)
  // ...
}
```

This is a backward-compatible change. When `mechanics` is `undefined`, behavior is identical to MVP.

---

## 8. UI Contract Addition

```typescript
// packages/ui-contracts/src/index.ts — new type

export type ScenarioSelectorViewModel = {
  scenarios: {
    id: string
    name: string
    description: string
    taskCount: number
    agentCount: number
  }[]
}
```

---

## 9. Risk & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Mechanics hooks introduce non-determinism | Medium | Hooks receive `MechanicsContext` with the seeded RNG; no independent randomness allowed |
| Plugin validation gaps at boot | Low | `registry.validate()` runs at startup, logs errors, and the facade throws on missing scenario |
| Backward compatibility break for `apps/web` | Medium | Facade maintains same `runSimulationFromInput` signature; registry lookup is internal |
| Sprint 7 scope creep from scenario design | Medium | Scenarios are capped at 5 tasks, 3-4 agents, 5 coaching rules each — same scale as MVP |

---

## 10. Definition of Done (per sprint)

- All new types compile with `npm run typecheck`
- All new logic has Vitest tests with >80% branch coverage
- `npm run test` passes across all packages
- Facade API remains backward compatible (existing tests do not break)
- New scenarios produce valid `SimulationResultViewModel` when run end-to-end
