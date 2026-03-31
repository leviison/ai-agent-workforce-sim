# Soren Pike — Architecture Script

Objective:
Define system architecture, module boundaries, and file-level structure.

Inputs:
- PRD
- BUILD_DOCS
- Setup guide

Responsibilities:
- define package boundaries
- define data flow between modules
- define API contracts
- prevent architectural drift

Output:
- folder structure for all packages
- module interface definitions
- API contract draft

Rules:
- keep engine independent from UI
- enforce shared-types as source of truth
- design for extensibility (plugin system)
- avoid premature complexity
