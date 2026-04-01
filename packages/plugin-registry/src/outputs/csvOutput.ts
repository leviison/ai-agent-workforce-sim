import type { OutputPlugin } from '@sim/shared-types'

export const csvOutput: OutputPlugin = {
  id: 'csv-output',
  name: 'CSV Export',
  supportedFormats: ['csv'],
  formatOutput: (output, scenario, _format) => {
    // Header: scenario metadata
    // Then trace rows as CSV: node_id, agentId, taskId, success, startTick, endTick, time, cost, quality, retryCount, failureReason
    // Then score summary row
    const escCsv = (val: unknown) => {
      const s = String(val ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }

    const lines: string[] = []
    lines.push(`# Scenario: ${scenario.name} (${scenario.id})`)
    lines.push(`# Score: quality=${output.metrics.quality}, cost_efficiency=${output.metrics.cost_efficiency}, time_efficiency=${output.metrics.time_efficiency}, robustness=${output.metrics.robustness}`)
    lines.push('')
    lines.push('node_id,agentId,taskId,success,startTick,endTick,time,cost,quality,retryCount,failureReason')

    for (const t of output.trace) {
      lines.push([
        escCsv(t.node_id), escCsv(t.agentId), escCsv(t.taskId),
        t.success, t.startTick, t.endTick, t.time, t.cost, t.quality,
        t.retryCount, escCsv(t.failureReason ?? '')
      ].join(','))
    }

    return lines.join('\n')
  },
}
