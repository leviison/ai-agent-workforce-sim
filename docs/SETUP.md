# Setup Guide — Clean Environment

Follow steps to initialize monorepo and begin build.

See original spec for full details.

## Quick Start
```bash
mkdir ai-agent-workforce-sim && cd $_
git init
npm init -y
```

## Structure
- apps/web
- packages/{shared-types,simulation-engine,scenario-data,coaching-engine,ui-contracts}
- docs/

## First Build Order
1. shared-types
2. simulation-engine
3. scenario-data
4. coaching-engine
5. frontend shell

## Kickoff Prompt
Initialize monorepo with apps/web and packages, workspace config, and placeholder exports.
