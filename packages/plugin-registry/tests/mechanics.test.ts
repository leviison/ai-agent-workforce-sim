import { describe, it, expect } from 'vitest'
import { FailureReason } from '@sim/shared-types'
import type { MechanicsContext, Trace, WorkflowNode, ScoringConfig } from '@sim/shared-types'
import { timeLimitMechanic } from '../src/mechanics/timeLimitMechanic'
import { budgetConstraintMechanic } from '../src/mechanics/budgetConstraintMechanic'

const dummyNode: WorkflowNode = { id: 'n1', task_id: 't1', agent_id: 'a1' }

const defaultScoringConfig: ScoringConfig = {
  maxRetries: 3,
  bottleneckPenaltyThreshold: 0.75,
  weights: { quality: 0.25, cost_efficiency: 0.25, time_efficiency: 0.25, robustness: 0.25 },
}

function makeTrace(overrides: Partial<Trace> = {}): Trace {
  return {
    node_id: overrides.node_id ?? 'n1-attempt-0',
    agentId: overrides.agentId ?? 'a1',
    taskId: overrides.taskId ?? 't1',
    startTick: overrides.startTick ?? 0,
    endTick: overrides.endTick ?? 10,
    success: overrides.success ?? true,
    time: overrides.time ?? 1,
    cost: overrides.cost ?? 1,
    quality: overrides.quality ?? 0.9,
    retryCount: overrides.retryCount ?? 0,
    ...('failureReason' in overrides ? { failureReason: overrides.failureReason } : {}),
  }
}

function makeContext(overrides: Partial<MechanicsContext> = {}): MechanicsContext {
  return {
    tick: overrides.tick ?? 0,
    trace: overrides.trace ?? [],
    agents: overrides.agents ?? new Map(),
    tasks: overrides.tasks ?? new Map(),
    scoringConfig: overrides.scoringConfig ?? defaultScoringConfig,
  }
}

describe('timeLimitMechanic', () => {
  it('has correct metadata', () => {
    expect(timeLimitMechanic.id).toBe('time-limit')
    expect(timeLimitMechanic.name).toBe('Time Limit')
    expect(timeLimitMechanic.description).toBe('Fails remaining tasks after 80-tick cap')
  })

  it('marks traces as failed with TIMEOUT when tick > 80 and startTick >= 80', () => {
    const trace = makeTrace({ startTick: 82, endTick: 90, success: true, quality: 0.8 })
    const context = makeContext({ tick: 85, trace: [trace] })

    timeLimitMechanic.onAfterNode!(dummyNode, context)

    expect(trace.success).toBe(false)
    expect(trace.failureReason).toBe(FailureReason.TIMEOUT)
    expect(trace.quality).toBe(0)
  })

  it('does not modify traces when tick <= 80', () => {
    const trace = makeTrace({ startTick: 40, endTick: 50, success: true, quality: 0.8 })
    const context = makeContext({ tick: 50, trace: [trace] })

    timeLimitMechanic.onAfterNode!(dummyNode, context)

    expect(trace.success).toBe(true)
    expect(trace.failureReason).toBeUndefined()
    expect(trace.quality).toBe(0.8)
  })

  it('does not modify traces with startTick < 80 even when tick > 80', () => {
    const earlyTrace = makeTrace({ startTick: 70, endTick: 78, success: true, quality: 0.9 })
    const lateTrace = makeTrace({ node_id: 'n2-attempt-0', startTick: 82, endTick: 90, success: true, quality: 0.7 })
    const context = makeContext({ tick: 85, trace: [earlyTrace, lateTrace] })

    timeLimitMechanic.onAfterNode!(dummyNode, context)

    expect(earlyTrace.success).toBe(true)
    expect(earlyTrace.quality).toBe(0.9)
    expect(lateTrace.success).toBe(false)
    expect(lateTrace.failureReason).toBe(FailureReason.TIMEOUT)
  })
})

describe('budgetConstraintMechanic', () => {
  it('has correct metadata', () => {
    expect(budgetConstraintMechanic.id).toBe('budget-constraint')
    expect(budgetConstraintMechanic.name).toBe('Budget Constraint')
    expect(budgetConstraintMechanic.description).toBe('Fails tasks that push total cost over $8.00')
  })

  it('marks traces over budget as failed with CAPACITY_EXCEEDED', () => {
    const trace1 = makeTrace({ node_id: 'n1-attempt-0', cost: 5.0, success: true, quality: 0.8 })
    const trace2 = makeTrace({ node_id: 'n2-attempt-0', cost: 4.0, success: true, quality: 0.7 })
    const context = makeContext({ trace: [trace1, trace2] })

    budgetConstraintMechanic.onAfterNode!(dummyNode, context)

    // trace1 cost=5.0, running=5.0 (under budget)
    expect(trace1.success).toBe(true)
    expect(trace1.quality).toBe(0.8)

    // trace2 cost=4.0, running=9.0 (over budget)
    expect(trace2.success).toBe(false)
    expect(trace2.failureReason).toBe(FailureReason.CAPACITY_EXCEEDED)
    expect(trace2.quality).toBe(0)
  })

  it('does not modify traces when total cost is within budget', () => {
    const trace1 = makeTrace({ node_id: 'n1-attempt-0', cost: 3.0, success: true, quality: 0.9 })
    const trace2 = makeTrace({ node_id: 'n2-attempt-0', cost: 2.0, success: true, quality: 0.8 })
    const context = makeContext({ trace: [trace1, trace2] })

    budgetConstraintMechanic.onAfterNode!(dummyNode, context)

    expect(trace1.success).toBe(true)
    expect(trace1.quality).toBe(0.9)
    expect(trace2.success).toBe(true)
    expect(trace2.quality).toBe(0.8)
  })
})
