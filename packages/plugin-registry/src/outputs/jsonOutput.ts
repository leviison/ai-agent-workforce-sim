import type { OutputPlugin } from '@sim/shared-types'

export const defaultJsonOutput: OutputPlugin = {
  id: 'default-json-output',
  name: 'JSON Export',
  supportedFormats: ['json'],
  formatOutput: (output, _scenario, _format) => {
    return JSON.stringify(output, null, 2)
  },
}
