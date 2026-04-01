# Setup Guide — Clean Environment

## Stack
- Node 20+
- TypeScript, React (Vite)
- Zustand, React Flow
- Vitest, ESLint, Prettier

## Initialize
```bash
mkdir ai-agent-workforce-sim && cd $_
git init
npm init -y
```

## Structure
```text
apps/web
packages/{shared-types,simulation-engine,scenario-data,coaching-engine,ui-contracts}
docs/{prd,scenarios,architecture,orchestration}
```

## Create Folders
```bash
mkdir -p apps/web
mkdir -p packages/{shared-types,simulation-engine,scenario-data,coaching-engine,ui-contracts}
mkdir -p docs/{prd,scenarios,architecture,orchestration}
```

## Frontend
```bash
npm create vite@latest apps/web -- --template react-ts
npm install
npm install zustand reactflow
npm install -D vitest eslint prettier @types/node
```

## Workspaces (root package.json)
```json
{
  "private": true,
  "workspaces": ["apps/*","packages/*"],
  "scripts": {
    "dev": "npm run dev -w apps/web",
    "build": "npm run build -w apps/web",
    "test": "vitest run",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Packages Ownership
- shared-types: schemas
- simulation-engine: core loop, scoring, trace
- scenario-data: scenarios, templates
- coaching-engine: insights, leverage
- ui-contracts: DTOs/view models

## First Build Order
1. shared-types
2. simulation-engine
3. scenario-data
4. coaching-engine
5. frontend shell

## Dev Rules
- deterministic engine (seeded)
- engine independent of UI
- no ad-hoc types outside shared-types

## First Target
- one scenario
- one engine loop
- one trace
- one results view

## Kickoff Prompt (for Codex/Claude)
```
Initialize a monorepo with apps/web and packages for shared-types, simulation-engine, scenario-data, coaching-engine, ui-contracts. Add workspace config, basic scripts, and placeholder exports. No business logic yet. Output the folder tree and created files.
```

