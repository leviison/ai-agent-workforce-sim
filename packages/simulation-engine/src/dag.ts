// Topological sort for workflow DAG (Kahn's algorithm)

import type { Workflow, WorkflowNode } from '@sim/shared-types'

export function topoSort(workflow: Workflow): WorkflowNode[] {
  const inDegree = new Map<string, number>()
  const adjList = new Map<string, string[]>()

  for (const node of workflow.nodes) {
    inDegree.set(node.id, 0)
    adjList.set(node.id, [])
  }

  for (const edge of workflow.edges) {
    adjList.get(edge.from)!.push(edge.to)
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1)
  }

  const queue = workflow.nodes.filter(n => inDegree.get(n.id) === 0)
  const sorted: WorkflowNode[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    sorted.push(node)
    for (const neighborId of adjList.get(node.id) ?? []) {
      const deg = (inDegree.get(neighborId) ?? 0) - 1
      inDegree.set(neighborId, deg)
      if (deg === 0) {
        queue.push(workflow.nodes.find(n => n.id === neighborId)!)
      }
    }
  }

  if (sorted.length !== workflow.nodes.length) {
    throw new Error('Workflow contains a cycle')
  }

  return sorted
}
