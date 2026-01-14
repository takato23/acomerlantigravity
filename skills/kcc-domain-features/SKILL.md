---
name: kcc-domain-features
description: Use for implementing meal planner, pantry, shopping lists, recipes, profile, or scanner flows and their service contracts.
---

# Domain Features Guide

## Quick start
- Meal planner: docs/MEAL_PLANNER_IMPLEMENTATION_GUIDE.md and docs/MEAL_PLANNER_QUICK_REFERENCE.md
- Shopping list: docs/SHOPPING_LIST_SYSTEM.md
- Profile system: docs/PROFILE_SYSTEM.md
- AI prompts: docs/AI_INTEGRATION.md

## Where code lives
- src/services/meal-planning
- src/services/pantry
- src/services/shopping
- src/services/profile
- src/services/scanner
- src/services/recipes
- src/features/* for UI and feature logic

## Flow checklist
- Pantry items feed meal planning
- Meal plan feeds shopping list
- Profile restrictions and budget apply to planner and shopping
- Scanner updates pantry items

## If updating UI
- Check design tokens in src/design-system
- Check feature components in src/features

## If adding new data fields
- Confirm types in src/types or feature types and update API docs (docs/API_DOCUMENTATION.md)
