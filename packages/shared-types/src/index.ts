// shared-types — source of truth for all data contracts

// ---------------------------------------------------------------------------
// FailureReason — enumeration of known task/agent failure causes
// ---------------------------------------------------------------------------
export enum FailureReason {
  TIMEOUT            = "TIMEOUT",
  DEPENDENCY_CYCLE   = "DEPENDENCY_CYCLE",
  AGENT_UNAVAILABLE  = "AGENT_UNAVAILABLE",
  CAPACITY_EXCEEDED  = "CAPACITY_EXCEEDED",
}

// ---------------------------------------------------------------------------
// ScoringConfig — tunable parameters for the scoring subsystem
// ---------------------------------------------------------------------------
export type ScoringConfig = {
  maxRetries: number
  bottleneckPenaltyThreshold: number
  weights: {
    quality: number
    cost_efficiency: number
    time_efficiency: number
    robustness: number
  }
}

export const defaultScoringConfig: ScoringConfig = {
  maxRetries: 3,
  bottleneckPenaltyThreshold: 0.75,
  weights: {
    quality:         0.25,
    cost_efficiency: 0.25,
    time_efficiency: 0.25,
    robustness:      0.25,
  },
}

export type FailureMode = {
  type: string
  probability: number
}

export type SkillVector = {
  accuracy: number
  speed: number
  creativity: number
  reasoning: number
}

export type Agent = {
  id: string
  role: string
  skill_vector: SkillVector
  cost: number
  reliability: number
  failure_modes: FailureMode[]
}

export type Task = {
  id: string
  type: string
  complexity: number
  required_skills: string[]
  dependencies: string[]
}

export type WorkflowNode = {
  id: string
  task_id: string
  agent_id: string
}

export type WorkflowEdge = {
  from: string
  to: string
}

export type Workflow = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type Trace = {
  node_id: string
  success: boolean
  time: number
  cost: number
  quality: number
  // sprint 2 additions
  agentId: string
  taskId: string
  startTick: number
  endTick: number
  failureReason?: FailureReason
  retryCount: number
  parentTraceId?: string
}

export type Score = {
  quality: number
  cost_efficiency: number
  time_efficiency: number
  robustness: number
}

export type Scenario = {
  id: string
  name: string
  description: string
  tasks: Task[]
  agents: Agent[]
}

export type SimulationInput = {
  workflow: Workflow
  agents: Agent[]
  scenario: Scenario
  seed: number
  scoringConfig?: ScoringConfig
}

export type SimulationOutput = {
  outputs: Record<string, unknown>
  metrics: Score
  trace: Trace[]
  insights: string[]
}

// ---------------------------------------------------------------------------
// CoachingRule — spec types for the coaching rule system (sprint 2)
// ---------------------------------------------------------------------------
export type TriggerCondition =
  | { type: 'score_below'; dimension: keyof Score; threshold: number }
  | { type: 'failure_reason_present'; reason: FailureReason }
  | { type: 'bottleneck_penalty_above'; threshold: number }
  | { type: 'agent_utilization_above'; agentId: string; threshold: number }

export type CoachingRule = {
  id: string
  trigger: TriggerCondition
  insightText: string
  severity: 'info' | 'warning' | 'critical'
}

export * from './plugins'
