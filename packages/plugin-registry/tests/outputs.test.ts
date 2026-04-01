import { describe, it, expect } from 'vitest'
import type { SimulationOutput, Scenario } from '@sim/shared-types'
import { defaultJsonOutput } from '../src/outputs/jsonOutput'
import { csvOutput } from '../src/outputs/csvOutput'

const mockScenario: Scenario = {
  id: 'test-scenario',
  name: 'Test Scenario',
  description: 'A test scenario',
  tasks: [],
  agents: [],
}

const mockOutput: SimulationOutput = {
  outputs: { result: 'ok' },
  metrics: { quality: 0.9, cost_efficiency: 0.8, time_efficiency: 0.7, robustness: 0.85 },
  trace: [
    {
      node_id: 'node-1',
      agentId: 'agent-1',
      taskId: 'task-1',
      success: true,
      startTick: 0,
      endTick: 3,
      time: 3,
      cost: 1.2,
      quality: 0.9,
      retryCount: 0,
    },
    {
      node_id: 'node-2',
      agentId: 'agent-2',
      taskId: 'task-2',
      success: false,
      startTick: 3,
      endTick: 7,
      time: 4,
      cost: 2.0,
      quality: 0.4,
      retryCount: 1,
      failureReason: 'missed_insight',
    },
  ],
  insights: ['Good delegation', 'Consider retry strategy'],
}

const emptyOutput: SimulationOutput = {
  outputs: {},
  metrics: { quality: 0, cost_efficiency: 0, time_efficiency: 0, robustness: 0 },
  trace: [],
  insights: [],
}

describe('defaultJsonOutput', () => {
  it('has correct id and name', () => {
    expect(defaultJsonOutput.id).toBe('default-json-output')
    expect(defaultJsonOutput.name).toBe('JSON Export')
  })

  it('formats valid JSON that parses back to matching object', () => {
    const result = defaultJsonOutput.formatOutput(mockOutput, mockScenario, 'json') as string
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(mockOutput)
  })

  it('handles empty traces array gracefully', () => {
    const result = defaultJsonOutput.formatOutput(emptyOutput, mockScenario, 'json') as string
    const parsed = JSON.parse(result)
    expect(parsed.trace).toEqual([])
    expect(parsed.metrics).toEqual(emptyOutput.metrics)
  })
})

describe('csvOutput', () => {
  it('has correct id and name', () => {
    expect(csvOutput.id).toBe('csv-output')
    expect(csvOutput.name).toBe('CSV Export')
  })

  it('produces header row with correct columns', () => {
    const result = csvOutput.formatOutput(mockOutput, mockScenario, 'csv') as string
    const lines = result.split('\n')
    const headerLine = lines.find((l) => l.startsWith('node_id,'))
    expect(headerLine).toBe(
      'node_id,agentId,taskId,success,startTick,endTick,time,cost,quality,retryCount,failureReason'
    )
  })

  it('produces correct number of data rows (one per trace entry)', () => {
    const result = csvOutput.formatOutput(mockOutput, mockScenario, 'csv') as string
    const lines = result.split('\n')
    const headerIndex = lines.findIndex((l) => l.startsWith('node_id,'))
    const dataRows = lines.slice(headerIndex + 1).filter((l) => l.length > 0)
    expect(dataRows).toHaveLength(2)
  })

  it('escapes commas and quotes in field values', () => {
    const tricky: SimulationOutput = {
      ...mockOutput,
      trace: [
        {
          node_id: 'node,with,commas',
          agentId: 'agent"quotes"',
          taskId: 'task-1',
          success: true,
          startTick: 0,
          endTick: 1,
          time: 1,
          cost: 1,
          quality: 1,
          retryCount: 0,
        },
      ],
    }
    const result = csvOutput.formatOutput(tricky, mockScenario, 'csv') as string
    const lines = result.split('\n')
    const dataLine = lines[lines.length - 1]
    expect(dataLine).toContain('"node,with,commas"')
    expect(dataLine).toContain('"agent""quotes"""')
  })

  it('handles empty traces array gracefully', () => {
    const result = csvOutput.formatOutput(emptyOutput, mockScenario, 'csv') as string
    const lines = result.split('\n')
    const headerIndex = lines.findIndex((l) => l.startsWith('node_id,'))
    expect(headerIndex).toBeGreaterThanOrEqual(0)
    const dataRows = lines.slice(headerIndex + 1).filter((l) => l.length > 0)
    expect(dataRows).toHaveLength(0)
  })
})
