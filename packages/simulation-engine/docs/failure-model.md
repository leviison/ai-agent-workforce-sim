# Failure Model

This document describes the two failure reasons used by the simulation engine, their trigger conditions, and the retry flow.

---

## Failure Reasons

### TIMEOUT

**Enum value:** `FailureReason.TIMEOUT`

**Trigger condition:** A task attempt is marked with `TIMEOUT` when the computed `time` for that attempt exceeds `task.complexity * 15`. This represents a scenario where the agent took far longer than the task's complexity budget allows — e.g. because the agent's speed is low or the RNG produced an unfavourable time multiplier.

```
failureReason = TIMEOUT  when  time > task.complexity * 15
```

### AGENT_UNAVAILABLE

**Enum value:** `FailureReason.AGENT_UNAVAILABLE`

**Trigger condition:** A task attempt is marked with `AGENT_UNAVAILABLE` when the attempt fails (either the reliability roll failed, or a failure mode was triggered) but the `time` did not exceed the timeout threshold. This represents a general agent-side failure — the agent was present but could not complete the task successfully within normal time bounds.

```
failureReason = AGENT_UNAVAILABLE  when  attempt failed  AND  time <= task.complexity * 15
```

Note: `failureReason` is only set on failed attempts. Successful attempts carry no `failureReason`.

---

## Retry Flow

When a task attempt fails, the engine retries up to `scoringConfig.maxRetries` times (default: `3` from `defaultScoringConfig`).

### Attempt numbering and trace IDs

| Attempt | `node_id`               | `retryCount` | `parentTraceId`         |
|---------|-------------------------|--------------|-------------------------|
| 0 (first) | `<nodeId>-attempt-0`  | `0`          | _(not set)_             |
| 1       | `<nodeId>-attempt-1`    | `1`          | `<nodeId>-attempt-0`    |
| 2       | `<nodeId>-attempt-2`    | `2`          | `<nodeId>-attempt-0`    |
| 3       | `<nodeId>-attempt-3`    | `3`          | `<nodeId>-attempt-0`    |

- Every attempt (including the first) emits its own `Trace` entry.
- `parentTraceId` on retry entries always points to the **first** attempt's `node_id` (`<nodeId>-attempt-0`), not the immediately preceding attempt.
- The retry loop stops as soon as an attempt succeeds — it does not continue to the full `maxRetries` limit if the task passes early.
- If all attempts (attempt 0 through `maxRetries`) fail, the final attempt's trace is the last entry for that node; no further retries occur.

### Tick accounting

Each attempt consumes `Math.ceil(task.complexity * 10)` ticks, regardless of outcome. The global `tick` counter starts at `0` and increments by this amount after every attempt, so `startTick` and `endTick` on each trace entry reflect real elapsed simulation time including time spent on failed attempts.

### Determinism

The PRNG state advances on every attempt — both successful and failed — so the same seed always produces the same retry outcomes. Adding retries does not break determinism; it only means more RNG draws are consumed per node when failures occur.
