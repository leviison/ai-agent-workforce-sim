import type { SimulationInput, SimulationOutput, Trace, Agent, Task, ScoringConfig } from '@sim/shared-types'
import { FailureReason, defaultScoringConfig } from '@sim/shared-types'
import { createRng } from './rng'
import { topoSort } from './dag'
import { computeScore } from './scorer'

export function runSimulation(input: SimulationInput): SimulationOutput {
  const { workflow, agents, scenario, seed } = input
  const scoringConfig: ScoringConfig = input.scoringConfig ?? defaultScoringConfig
  const rng = createRng(seed)

  const agentMap = new Map<string, Agent>(agents.map(a => [a.id, a]))
  const taskMap = new Map<string, Task>(scenario.tasks.map(t => [t.id, t]))

  const sorted = topoSort(workflow)
  const trace: Trace[] = []

  // tick advances by Math.ceil(task.complexity * 10) per task execution (each attempt)
  let tick = 0

  for (const node of sorted) {
    const agent = agentMap.get(node.agent_id)
    const task = taskMap.get(node.task_id)

    if (!agent || !task) {
      throw new Error(`Missing agent (${node.agent_id}) or task (${node.task_id}) for node ${node.id}`)
    }

    const tickDelta = Math.ceil(task.complexity * 10)
    const firstAttemptNodeId = `${node.id}-attempt-0`

    for (let attempt = 0; attempt <= scoringConfig.maxRetries; attempt++) {
      const startTick = tick
      const endTick = tick + tickDelta
      tick = endTick

      const skillScore = computeSkillScore(agent, task)
      const roll = rng()

      // Success if roll < (reliability × skill match)
      const successThreshold = agent.reliability * skillScore
      const success = roll < successThreshold

      // Check failure modes
      const failureTriggered = !success && agent.failure_modes.some(fm => rng() < fm.probability)
      const attemptSuccess = success && !failureTriggered

      const quality = success
        ? parseFloat((skillScore * (0.7 + rng() * 0.3)).toFixed(4))
        : parseFloat((skillScore * rng() * 0.4).toFixed(4))

      const baseCost = agent.cost * task.complexity
      const cost = parseFloat((baseCost * (0.8 + rng() * 0.4)).toFixed(4))

      const baseTime = task.complexity * (1 / agent.skill_vector.speed)
      const time = parseFloat((baseTime * (0.8 + rng() * 0.4)).toFixed(4))

      // Determine failure reason for failed attempts
      let failureReason: FailureReason | undefined
      if (!attemptSuccess) {
        // TIMEOUT when time exceeds complexity * 15, otherwise AGENT_UNAVAILABLE
        failureReason = time > task.complexity * 15
          ? FailureReason.TIMEOUT
          : FailureReason.AGENT_UNAVAILABLE
      }

      const traceEntry: Trace = {
        node_id: attempt === 0 ? firstAttemptNodeId : `${node.id}-attempt-${attempt}`,
        agentId: agent.id,
        taskId: task.id,
        startTick,
        endTick,
        success: attemptSuccess,
        time,
        cost,
        quality,
        retryCount: attempt,
        ...(failureReason !== undefined && { failureReason }),
        ...(attempt > 0 && { parentTraceId: firstAttemptNodeId }),
      }

      trace.push(traceEntry)

      // Stop retrying once a task succeeds
      if (attemptSuccess) break
    }
  }

  const metrics = computeScore(trace, scoringConfig, scenario.tasks)

  return {
    outputs: buildOutputs(trace),
    metrics,
    trace,
    insights: [],
  }
}

function computeSkillScore(agent: Agent, task: Task): number {
  const sv = agent.skill_vector
  const skillMap: Record<string, number> = {
    accuracy: sv.accuracy,
    speed: sv.speed,
    creativity: sv.creativity,
    reasoning: sv.reasoning,
  }

  if (task.required_skills.length === 0) return 1

  const total = task.required_skills.reduce((sum, skill) => {
    return sum + (skillMap[skill] ?? 0.5)
  }, 0)

  return Math.min(1, total / task.required_skills.length)
}

function buildOutputs(trace: Trace[]): Record<string, unknown> {
  return Object.fromEntries(trace.map(t => [t.node_id, { success: t.success, quality: t.quality }]))
}
