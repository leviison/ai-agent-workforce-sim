# BUILD DOCUMENTS PACK

This document contains four critical build-control documents:
- ARCHITECTURE.md
- SHARED_TYPES_SPEC.md
- SPRINT_1.md
- ROLE_CHARTERS.md

---

# ARCHITECTURE.md

## System Overview

Monorepo with modular packages:

- apps/web (frontend)
- packages/shared-types
- packages/simulation-engine
- packages/scenario-data
- packages/coaching-engine
- packages/ui-contracts

## Core Principle

- Engine is independent of UI
- All data contracts originate in shared-types
- Plugins (scenarios) are data-driven

## Data Flow

UI → API → Simulation Engine → Trace + Outputs → Coaching Engine → UI

## Module Boundaries

### shared-types
- owns all schemas

### simulation-engine
- pure logic
- no UI dependencies

### scenario-data
- static scenario plugins

### coaching-engine
- derives insights from trace + score

### ui-contracts
- transforms engine output → UI models

## API Boundary

POST /simulate
Input:
- workflow
- agents
- scenario
- seed

Output:
- outputs
- metrics
- trace
- insights

---

# SHARED_TYPES_SPEC.md

## Core Types

### Agent
```ts
Agent {
  id: string
  role: string
  skill_vector: {
    accuracy: number
    speed: number
    creativity: number
    reasoning: number
  }
  cost: number
  reliability: number
  failure_modes: FailureMode[]
}
```

### Task
```ts
Task {
  id: string
  type: string
  complexity: number
  required_skills: string[]
  dependencies: string[]
}
```

### Workflow
```ts
Workflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}
```

### Trace
```ts
Trace {
  node_id: string
  success: boolean
  time: number
  cost: number
  quality: number
}
```

### Score
```ts
Score {
  quality: number
  cost_efficiency: number
  time_efficiency: number
  robustness: number
}
```

---

# SPRINT_1.md

## Objective
Establish deterministic simulation foundation.

## Deliverables
- Shared types
- Simulation engine core loop
- One scenario wired
- Basic trace output

## Tasks

### 1. Shared Types
Owner: Priya Sen
- define all schemas
- export types package

### 2. Engine Core
Owner: Owen Mercer
- implement runSimulation()
- add seeded randomness
- produce trace output

### 3. Architecture Setup
Owner: Soren Pike
- repo structure
- module boundaries

### 4. QA Gate
Owner: Naomi Vale
- define determinism test
- define merge checklist

## Acceptance Criteria
- same seed → same output
- workflow executes end-to-end
- trace visible per node

---

# ROLE_CHARTERS.md

## Atlas Vale — Orchestrator
- decomposes work
- assigns owners
- enforces interfaces

## Mara Quinn — HR
- defines roles
- assigns specialists

## Elena Cross — Product
- defines MVP scope
- prioritizes features

## Priya Sen — Systems
- defines simulation logic
- owns scoring + failure model

## Soren Pike — Architecture
- defines modules + boundaries
- ensures scalability

## Owen Mercer — Backend
- builds simulation engine
- ensures determinism

## Luca Hart — Design
- defines UX constraints

## Naomi Vale — QA
- defines tests + merge gates

## Gabriel Snow — Coaching
- defines insight logic

---

## Usage

These documents must be used BEFORE major code generation.

They reduce ambiguity and enforce:
- clean architecture
- deterministic behavior
- coordinated execution

---

## End of Document

