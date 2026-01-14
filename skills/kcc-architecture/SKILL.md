---
name: kcc-architecture
description: Use for system architecture, module boundaries, and where code should live in KeCarajoComer (routes, features, services, shared libs).
---

# KeCarajoComer Architecture Guide

## Quick start
- Read PROJECT_CONTEXT.md for current status and core flow.
- Read docs/SYSTEM_ARCHITECTURE.md for the full system map.
- Read docs/COMPONENT_ARCHITECTURE.md for UI layering.
- Read docs/DEVELOPMENT_GUIDELINES.md for structure and conventions.

## Folder map (short)
- src/app: Next.js routes and layouts
- src/features: feature modules (components, hooks, services, types)
- src/services: domain services (planner, pantry, shopping, profile, scanner)
- src/lib: shared integrations (ai, supabase, utils)
- src/components: shared UI

## Workflow
1. Identify the feature area (planner, pantry, shopping, profile, recipes, scanner).
2. Prefer feature module edits; only touch shared layers if needed.
3. Keep data flow consistent with documented system flow (scanner -> pantry -> planner -> shopping -> profile).
4. Update shared types in src/types or feature types.

## When touching navigation or layout
- Read docs/NAVIGATION_SYSTEM.md.

## When adding a new feature
- Read docs/FEATURES_SPECIFICATION.md and docs/FEATURES_DOCUMENTATION.md.
