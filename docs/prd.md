# AI Agent Workforce Simulator — PRD

## Vision
Train users to design, deploy, and optimize AI agent workforces while producing real-world business outputs.

## Core Principles
- Systems > tasks
- Real tradeoffs (speed, cost, quality)
- Visible failure → learning
- Outputs usable outside the system
- Simple UI, deep mechanics

## Core Loop
Brief → Team → Workflow (DAG) → Simulate → Analyze → Iterate → Export

## Core Models
### Agent
- role, skill_vector (accuracy, speed, creativity, reasoning)
- cost, reliability, failure_modes

### Task
- type, complexity, required_skills, dependencies

### Workflow
- DAG of nodes (agent+task) and edges (data mapping)

### Simulation
- deterministic (seeded), produces outputs, time, cost, trace

### Scoring
- quality, cost_efficiency, time_efficiency, robustness

## UX Screens
- Scenario Brief
- Team Builder
- Workflow Editor
- Simulation Viewer
- Results Dashboard
- Export

## MVP Scope
- 3 agents, 5 tasks, 3 scenarios
- Workflow builder (basic)
- Simulation + results + export

## Insight & Coaching
- Bottlenecks, inefficiencies, structural issues
- Leverage score (output/cost, output/agent, decision efficiency)
- Explanation mode per node

## Killer Scenarios (Summary)
1. Launch a $1M Business
2. Fix a Broken Workflow
3. Build a Marketing Engine

## Definition of Done
- Build workflow → run simulation → see metrics & insights → export usable artifact

## Tech Stack
- React + TS (Vite), Zustand, React Flow
- Node.js engine
- JSON configs for data

## API
POST /simulate → { outputs, metrics, trace }


Plugin Architecture (Extensibility Layer)

To support scalable content, enterprise use cases, and user-generated scenarios, the system adopts a modular plugin architecture.

Design Principles
All variability is data-driven, not hardcoded
Core engine remains stable; plugins extend behavior
Plugins must conform to shared type schemas
1. Scenario Plugin (MVP Required)
ScenarioPlugin {
  id: string
  name: string
  objective: string

  constraints: Constraint[]
  tasks: Task[]
  success_criteria: object

  outputs: OutputTemplate[]

  scoring_overrides?: object
  coaching_overrides?: object
}

Purpose:

Defines a complete playable scenario
Primary extension point for the system
2. Agent Plugin (MVP Optional)
AgentPlugin {
  role: string
  skill_profile: object
  failure_modes: FailureMode[]
}

Purpose:

Introduce new agent types dynamically
Enables domain-specific agents (finance, legal, growth, etc.)
3. Output Plugin (MVP Required)
OutputPlugin {
  type: string
  template: object
}

Purpose:

Standardizes exportable artifacts
Ensures outputs are usable outside the system
4. Mechanics Plugin (Post-MVP)
MechanicPlugin {
  modifies: "scoring" | "failure" | "workflow_rules"
  logic: Function
}

Purpose:

Extend simulation behavior
Add complexity (market shocks, uncertainty, org dynamics)
5. Plugin Registry
PluginRegistry {
  scenarios: ScenarioPlugin[]
  agents: AgentPlugin[]
  outputs: OutputPlugin[]
  mechanics: MechanicPlugin[]
}

Responsibilities:

Validate plugin schemas
Register plugins
Inject into simulation engine
6. MVP Plugin Scope

Required:

Scenario plugins
Output templates

Optional:

Agent plugins

Deferred:

Mechanics plugins
7. Why This Matters

This turns your product into:

A platform, not a fixed game
A content engine, not a bottleneck
A training system adaptable to any domain
