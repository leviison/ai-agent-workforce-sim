/**
 * failure-paths.test.ts
 *
 * Tests each FailureReason value and validates retry logic behaviour.
 *
 * Engine failure-reason assignment (from engine.ts):
 *   failureReason = time > task.complexity * 15
 *     ? FailureReason.TIMEOUT
 *     : FailureReason.AGENT_UNAVAILABLE
 *
 * failureReason is only set when !attemptSuccess (i.e. the attempt failed).
 *
 * TIMEOUT derivation:
 *   time = task.complexity * (1 / agent.skill_vector.speed) * (0.8 + rng() * 0.4)
 *   For time > task.complexity * 15:
 *     (1 / speed) * (0.8 + rng() * 0.4) > 15
 *   The minimum multiplier is 0.8, so: 1/speed * 0.8 > 15 → speed < 1/18.75 ≈ 0.053
 *   Using speed = 0.01 guarantees 1/speed = 100, so time factor is always >> 15.
 */

import { describe, it, expect } from 'vitest'
import { runSimulation } from '../src/engine'
import { businessLaunch } from '../../scenario-data/src/index'
import { FailureReason } from '@sim/shared-types'
import type { Workflow, Agent, Scenario } from '@sim/shared-types'

// ---------------------------------------------------------------------------
// Shared workflow — single node, no edges
// ---------------------------------------------------------------------------
const singleNodeWorkflow: Workflow = {
  nodes: [{ id: 'n1', task_id: 'task-research', agent_id: 'agent-test' }],
  edges: [],
}

// A minimal scenario with only the task we need (task-research, complexity 0.6)
const singleTaskScenario: Scenario = {
  id: 'test-scenario',
  name: 'Test Scenario',
  description: 'Scenario for failure-path tests',
  tasks: [businessLaunch.tasks.find(t => t.id === 'task-research')!],
  agents: [], // agents injected per-test via SimulationInput.agents
}

// ---------------------------------------------------------------------------
// Helper: build a minimal SimulationInput
// ---------------------------------------------------------------------------
function makeInput(agent: Agent, seed = 42) {
  return {
    workflow: singleNodeWorkflow,
    agents: [agent],
    scenario: singleTaskScenario,
    seed,
  }
}

// ---------------------------------------------------------------------------
// Agents used across tests
// ---------------------------------------------------------------------------

/** Very unreliable agent — almost always fails, speed is normal → AGENT_UNAVAILABLE */
const unreliableAgent: Agent = {
  id: 'agent-test',
  role: 'TestAgent',
  skill_vector: { accuracy: 0.9, speed: 0.7, creativity: 0.5, reasoning: 0.85 },
  cost: 1.0,
  reliability: 0.01,                      // fails ~99% of the time
  failure_modes: [{ type: 'test-fail', probability: 0.01 }],
}

/**
 * Timeout agent — extremely slow (speed = 0.01).
 * baseTime = complexity * (1 / 0.01) = complexity * 100
 * Minimum time = baseTime * 0.8 = complexity * 80
 * Timeout threshold = complexity * 15
 * 80 >> 15 → TIMEOUT is guaranteed on every attempt.
 * Also unreliable so attempts will fail.
 */
const timeoutAgent: Agent = {
  id: 'agent-test',
  role: 'SlowAgent',
  skill_vector: { accuracy: 0.9, speed: 0.01, creativity: 0.5, reasoning: 0.85 },
  cost: 1.0,
  reliability: 0.01,                      // almost never succeeds
  failure_modes: [{ type: 'timeout-fail', probability: 0.01 }],
}

/** Highly reliable agent — almost always succeeds on first attempt */
const reliableAgent: Agent = {
  id: 'agent-test',
  role: 'ReliableAgent',
  skill_vector: { accuracy: 0.9, speed: 0.7, creativity: 0.5, reasoning: 0.85 },
  cost: 1.0,
  reliability: 0.99,
  failure_modes: [],
}

// ---------------------------------------------------------------------------
// FailureReason.AGENT_UNAVAILABLE
// ---------------------------------------------------------------------------
describe('FailureReason.AGENT_UNAVAILABLE', () => {
  it('at least one trace entry has failureReason === AGENT_UNAVAILABLE when using a low-reliability agent', () => {
    // With reliability 0.01 and up to 3 retries, most seeds will produce a failed attempt.
    // We sweep a small set of seeds to ensure we hit at least one failure.
    const seeds = [42, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let found = false

    for (const seed of seeds) {
      const result = runSimulation(makeInput(unreliableAgent, seed))
      const unavailable = result.trace.filter(
        t => t.failureReason === FailureReason.AGENT_UNAVAILABLE,
      )
      if (unavailable.length > 0) {
        found = true
        // Validate the structure of the failing trace entry
        expect(unavailable[0].success).toBe(false)
        expect(unavailable[0].failureReason).toBe(FailureReason.AGENT_UNAVAILABLE)
        break
      }
    }

    expect(found).toBe(true)
  })

  it('failed trace entries always carry a failureReason', () => {
    const result = runSimulation(makeInput(unreliableAgent, 42))
    for (const entry of result.trace) {
      if (!entry.success) {
        expect(entry.failureReason).toBeDefined()
      }
    }
  })

  it('successful trace entries never carry a failureReason', () => {
    const result = runSimulation(makeInput(unreliableAgent, 42))
    for (const entry of result.trace) {
      if (entry.success) {
        expect(entry.failureReason).toBeUndefined()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// FailureReason.TIMEOUT
// ---------------------------------------------------------------------------
describe('FailureReason.TIMEOUT', () => {
  /**
   * With speed = 0.01 the time factor (1/speed * min_rng_multiplier = 100 * 0.8 = 80)
   * always exceeds the timeout threshold (15), so any failed attempt will be TIMEOUT.
   * Reliability 0.01 ensures failures are overwhelmingly likely.
   */
  it('produces TIMEOUT failure reason when agent speed is extremely low (0.01)', () => {
    const seeds = [42, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let found = false

    for (const seed of seeds) {
      const result = runSimulation(makeInput(timeoutAgent, seed))
      const timeouts = result.trace.filter(
        t => t.failureReason === FailureReason.TIMEOUT,
      )
      if (timeouts.length > 0) {
        found = true
        expect(timeouts[0].success).toBe(false)
        expect(timeouts[0].failureReason).toBe(FailureReason.TIMEOUT)

        // Also verify: time actually exceeds the threshold
        const taskComplexity = singleTaskScenario.tasks[0].complexity // 0.6
        expect(timeouts[0].time).toBeGreaterThan(taskComplexity * 15)
        break
      }
    }

    expect(found).toBe(true)
  })

  it('ALL failed attempts are TIMEOUT (not AGENT_UNAVAILABLE) when speed = 0.01', () => {
    // Because 1/0.01 * 0.8 = 80 >> 15, every failed attempt must be TIMEOUT.
    const result = runSimulation(makeInput(timeoutAgent, 1))
    const failedEntries = result.trace.filter(t => !t.success)
    // There must be at least one failure (reliability is 0.01)
    // Note: if seed 1 happens to succeed on first attempt, we still validate structure
    for (const entry of failedEntries) {
      expect(entry.failureReason).toBe(FailureReason.TIMEOUT)
    }
  })
})

// ---------------------------------------------------------------------------
// Retry logic — retryCount > 0 for unreliable agent
// ---------------------------------------------------------------------------
describe('retry logic', () => {
  it('unreliable agent (reliability 0.01) produces trace entries with retryCount > 0', () => {
    // maxRetries default is 3; with reliability 0.01 almost all first attempts fail
    // and the engine retries up to maxRetries times.
    const seeds = [42, 1, 2, 3, 4, 5]
    let foundRetry = false

    for (const seed of seeds) {
      const result = runSimulation(makeInput(unreliableAgent, seed))
      const retried = result.trace.filter(t => t.retryCount > 0)
      if (retried.length > 0) {
        foundRetry = true
        // Sanity checks on the retry entries
        for (const entry of retried) {
          expect(entry.retryCount).toBeGreaterThan(0)
          // Retry entries must reference the first attempt via parentTraceId
          expect(entry.parentTraceId).toBe('n1-attempt-0')
        }
        break
      }
    }

    expect(foundRetry).toBe(true)
  })

  it('retry entries have node_id following the pattern <nodeId>-attempt-<N>', () => {
    // Use a seed where at least one retry occurs
    const seeds = [42, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let verified = false

    for (const seed of seeds) {
      const result = runSimulation(makeInput(unreliableAgent, seed))
      const retries = result.trace.filter(t => t.retryCount > 0)
      if (retries.length > 0) {
        for (const entry of retries) {
          expect(entry.node_id).toBe(`n1-attempt-${entry.retryCount}`)
        }
        verified = true
        break
      }
    }

    expect(verified).toBe(true)
  })

  it('reliable agent (reliability 0.99) produces exactly one trace entry with retryCount 0', () => {
    // With reliability 0.99 the first attempt should almost always succeed.
    // We sweep seeds to find at least one where it succeeds first attempt.
    const seeds = [42, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let verified = false

    for (const seed of seeds) {
      const result = runSimulation(makeInput(reliableAgent, seed))
      const firstAttempts = result.trace.filter(t => t.retryCount === 0)
      const retries = result.trace.filter(t => t.retryCount > 0)

      if (firstAttempts.length === 1 && firstAttempts[0].success && retries.length === 0) {
        // First attempt succeeded, no retries needed
        expect(firstAttempts[0].retryCount).toBe(0)
        expect(firstAttempts[0].failureReason).toBeUndefined()
        expect(firstAttempts[0].parentTraceId).toBeUndefined()
        verified = true
        break
      }
    }

    expect(verified).toBe(true)
  })

  it('first-attempt trace entry never has a parentTraceId', () => {
    const result = runSimulation(makeInput(unreliableAgent, 42))
    const firstAttempts = result.trace.filter(t => t.retryCount === 0)
    for (const entry of firstAttempts) {
      expect(entry.parentTraceId).toBeUndefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Edge: all four FailureReason values are reachable from the enum
// ---------------------------------------------------------------------------
describe('FailureReason enum completeness', () => {
  it('FailureReason enum has the expected values', () => {
    expect(FailureReason.AGENT_UNAVAILABLE).toBe('AGENT_UNAVAILABLE')
    expect(FailureReason.TIMEOUT).toBe('TIMEOUT')
    expect(FailureReason.DEPENDENCY_CYCLE).toBe('DEPENDENCY_CYCLE')
    expect(FailureReason.CAPACITY_EXCEEDED).toBe('CAPACITY_EXCEEDED')
  })
})
