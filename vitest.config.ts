import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@sim/shared-types': resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@sim/simulation-engine': resolve(__dirname, 'packages/simulation-engine/src/index.ts'),
      '@sim/scenario-data': resolve(__dirname, 'packages/scenario-data/src/index.ts'),
      '@sim/coaching-engine': resolve(__dirname, 'packages/coaching-engine/src/index.ts'),
      '@sim/ui-contracts': resolve(__dirname, 'packages/ui-contracts/src/index.ts'),
      '@sim/simulation-facade': resolve(__dirname, 'packages/simulation-facade/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/*/tests/**/*.test.ts',
      'apps/*/src/**/*.test.ts',
    ],
  },
})
