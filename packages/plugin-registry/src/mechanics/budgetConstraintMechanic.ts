import { FailureReason } from '@sim/shared-types'
import type { MechanicsPlugin } from '@sim/shared-types'

export const budgetConstraintMechanic: MechanicsPlugin = {
  id: 'budget-constraint',
  name: 'Budget Constraint',
  description: 'Fails tasks that push total cost over $8.00',
  onAfterNode: (_node, context) => {
    const totalCost = context.trace.reduce((sum, t) => sum + t.cost, 0)
    if (totalCost > 8.0) {
      let runningCost = 0
      for (const t of context.trace) {
        runningCost += t.cost
        if (runningCost > 8.0 && t.success) {
          t.success = false
          t.failureReason = FailureReason.CAPACITY_EXCEEDED
          t.quality = 0
        }
      }
    }
  },
}
