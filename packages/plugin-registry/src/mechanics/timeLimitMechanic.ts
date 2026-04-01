import { FailureReason } from '@sim/shared-types'
import type { MechanicsPlugin } from '@sim/shared-types'

export const timeLimitMechanic: MechanicsPlugin = {
  id: 'time-limit',
  name: 'Time Limit',
  description: 'Fails remaining tasks after 80-tick cap',
  onAfterNode: (_node, context) => {
    if (context.tick > 80) {
      for (const t of context.trace) {
        if (t.startTick >= 80 && t.success) {
          t.success = false
          t.failureReason = FailureReason.TIMEOUT
          t.quality = 0
        }
      }
    }
  },
}
