# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KeCarajoComer is a holistic food management system built with Next.js 15.0.0, featuring AI-powered meal planning, recipe management, pantry tracking, and shopping optimization. The application uses a glassmorphism design with iOS26 styling and comprehensive TypeScript support.

## Tech Stack & Architecture

- **Framework**: Next.js 15.0.0 with App Router
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS + Framer Motion + Radix UI
- **AI Integration**: Google Gemini + Anthropic Claude
- **State Management**: Zustand + React Query
- **Testing**: Jest + Playwright + Testing Library
- **Language**: TypeScript with strict configuration

### Core Architecture Patterns

The application follows a **feature-based architecture** with domain-driven design:

```
src/
├── features/           # Feature-based modules (meal-planning, pantry, recipes, etc.)
├── services/           # Business logic layer (HolisticSystem, AI services, etc.)
├── components/         # Shared UI components
├── app/               # Next.js App Router pages and API routes
├── lib/               # Third-party integrations (Supabase, AI clients)
├── hooks/             # Shared React hooks
└── types/             # TypeScript definitions
```

**Central Orchestrator**: The `HolisticFoodSystem` (`src/services/core/HolisticSystem.ts`) acts as the main orchestrator connecting all subsystems: Scanner → Pantry → Meal Planner → Shopping Optimizer.

## Development Commands

### Core Development
```bash
# Development server (port 3010)
npm run dev

# Development with HTTPS
npm run dev:https

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing Commands
```bash
# Run all tests
npm test

# Watch mode for general tests
npm run test:watch

# E2E tests with Playwright
npm run test:e2e

# Specific E2E test suites
npm run test:e2e:planner
npm run test:e2e:meal-planning
npm run test:e2e:recipes

# Mobile E2E testing
npm run test:e2e:mobile

# Meal planning specific tests
npm run test:meal-planning
npm run test:meal-planning:coverage
npm run test:meal-planning:e2e

# Single test file execution
jest <filename>
playwright test <test-file>
```

### Database & Data Management
```bash
# Generate TypeScript types from Supabase schema
npm run db:generate

# Database reset
npm run db:reset

# Run migrations
npm run db:migrate

# Seed database with mock data
npm run seed:database
npm run generate:recipes
npm run setup:data  # Run both generate and seed
```

### Development Tools
```bash
# Storybook for component development
npm run storybook

# Build Storybook
npm run build-storybook

# AI-powered development tools
npm run ai:plan      # Generate improvement plans
npm run ai:apply     # Apply AI suggestions
npm run ai:daemon    # Run autonomous AI agent
```

## Key Configuration Files

### TypeScript Configuration
- **Path Aliases**: `@/*` maps to `src/*` with specific aliases for `@/components/*`, `@/features/*`, `@/lib/*`, etc.
- **Strict Mode**: Enabled with comprehensive type checking
- **Target**: ES2017 for optimal Next.js 15.0.0 compatibility

### Next.js Configuration
- **Standalone Output**: Optimized for Docker deployment
- **Performance**: Advanced optimizations for AI libraries (TensorFlow.js, etc.)
- **Image Optimization**: WebP/AVIF support with multiple device sizes
- **Security Headers**: CSP, XSS protection, and frame options configured

### Environment Variables
Essential environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GEMINI_API_KEY` (multiple variants for different services)
- `ANTHROPIC_API_KEY` for Claude integration
- `NEXTAUTH_SECRET` for authentication

## Feature Modules

### Meal Planning (`src/features/meal-planning/`)
- **Core**: AI-powered weekly meal planning with Gemini integration
- **Components**: Interactive calendar, recipe selection, nutritional analysis
- **Testing**: Comprehensive Jest + Playwright test suite

### Pantry Management (`src/features/pantry/`)
- **Core**: Inventory tracking with expiration monitoring
- **Features**: Receipt scanning, OCR processing, smart suggestions
- **Integration**: TensorFlow.js for image recognition

### Recipe Management (`src/features/recipes/`)
- **Core**: Recipe search, categorization, and adaptation
- **AI Features**: Smart recipe suggestions based on available ingredients
- **Testing**: E2E tests for recipe discovery and management

### Shopping Optimization (`src/features/shopping/`)
- **Core**: Intelligent shopping list generation
- **Features**: Price tracking, store optimization, sharing capabilities
- **Integration**: WhatsApp sharing, budget tracking

### Authentication (`src/features/auth/`)
- **Core**: Supabase Auth with NextAuth.js integration
- **Features**: Social login (Google, GitHub), profile management
- **Flow**: Onboarding with pantry setup and preferences

## AI Integration Architecture

### Primary AI Services
1. **Google Gemini**: Cost-effective solution for meal planning, recipe adaptation
2. **Anthropic Claude**: Advanced reasoning for complex food recommendations
3. **TensorFlow.js**: Client-side image recognition for receipt scanning

### AI Service Pattern
```typescript
// Located in src/services/ai/
UnifiedAIService -> {
  GeminiProvider,    // Primary for cost efficiency
  OpenAIProvider,    // Fallback for complex tasks
  MockAIProvider     // Development/testing
}
```

### Key AI Features
- **Smart Meal Planning**: Generate weekly plans based on preferences, dietary restrictions, and available ingredients
- **Receipt OCR**: Tesseract.js + AI parsing for automatic pantry updates
- **Recipe Adaptation**: Modify recipes based on dietary needs and available ingredients
- **Shopping Optimization**: AI-powered shopping list generation with price optimization

## Testing Strategy

### Unit Testing (Jest)
- **Location**: `__tests__/` directories within feature modules
- **Config**: `jest.config.js` (symlinked to `.config/jest.config.js`)
- **Special Configs**: `jest.config.meal-planning.js` for meal planning module
- **Coverage**: Aim for >80% coverage on core business logic

### E2E Testing (Playwright)
- **Location**: `e2e/` directory with feature-based organization
- **Config**: `playwright.config.ts` (symlinked to `.config/playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Patterns**: Page Object Model for maintainability

### Testing Commands by Feature
```bash
# Meal planning tests
npm run test:meal-planning:unit          # Unit tests only
npm run test:meal-planning:e2e           # E2E tests only
npm run test:meal-planning:coverage      # With coverage report

# Recipe tests
npm run test:e2e:recipes                 # All recipe E2E tests
npm run test:e2e:recipes:basic          # Basic functionality only

# Planner tests
npm run test:planner                     # Planner-specific unit tests
npm run test:e2e:planner                # Planner E2E tests
```

## Database Schema & Patterns

### Supabase Integration
- **Client**: `src/lib/supabase/client.ts` - Unified client with mock fallback
- **Types**: Auto-generated in `src/lib/supabase/database.types.ts`
- **RLS**: Row Level Security policies for multi-tenant architecture
- **Real-time**: Subscription patterns for live updates

### Key Tables
- **profiles**: User preferences, dietary restrictions, budgets
- **pantry_items**: Inventory with expiration tracking
- **recipes**: Recipe database with categorization
- **meal_plans**: Weekly meal planning data
- **shopping_lists**: Generated shopping lists with optimization

### Data Access Patterns
```typescript
// Service-based data access
PantryManager.ts -> Database operations + business logic
ProfileManager.ts -> User preferences + restrictions
ShoppingOptimizer.ts -> List generation + optimization
```

## UI/UX Patterns

### Design System
- **Theme**: Glassmorphism with iOS26 design language
- **Components**: Radix UI primitives with custom styling
- **Animation**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first design with desktop enhancements

### Component Architecture
```typescript
// Shared components in src/components/
ui/           # Base UI primitives (buttons, forms, etc.)
feature/      # Feature-specific shared components
layout/       # Layout components (headers, navigation)
```

### State Management
- **Global State**: Zustand for cross-feature state
- **Server State**: React Query for data fetching and caching
- **Form State**: React Hook Form with Zod validation
- **UI State**: Local component state with Context API where needed

## Development Workflow

### File Naming Conventions
- **Components**: PascalCase (e.g., `MealPlannerGrid.tsx`)
- **Services**: PascalCase (e.g., `GeminiService.ts`)
- **Utilities**: camelCase (e.g., `dateHelpers.ts`)
- **Types**: camelCase with `.types.ts` suffix
- **Tests**: `<name>.test.tsx` or `<name>.spec.ts`

### Import Patterns
```typescript
// Prefer absolute imports with path aliases
import { Button } from '@/components/ui/button'
import { useMealPlanner } from '@/features/meal-planning/hooks'
import { HolisticSystem } from '@/services/core/HolisticSystem'
```

### Error Handling
- **API Routes**: Consistent error responses with status codes
- **Client**: Error boundaries for component-level error handling
- **Services**: Try/catch with proper logging via `@/services/logger`
- **AI Services**: Graceful fallbacks when AI services are unavailable

## Performance Considerations

### Bundle Optimization
- **Code Splitting**: Dynamic imports for feature modules
- **AI Libraries**: Client-side only loading for TensorFlow.js
- **Image Optimization**: WebP/AVIF with responsive loading
- **Caching**: Service Worker for offline functionality

### Database Optimization
- **Query Patterns**: Efficient Supabase queries with proper indexing
- **Real-time**: Selective subscriptions to minimize bandwidth
- **Caching**: React Query for client-side caching with stale-while-revalidate

## Common Development Patterns

### Feature Development
1. Create feature directory in `src/features/`
2. Implement service layer with business logic
3. Create UI components with proper TypeScript types
4. Add comprehensive tests (unit + E2E)
5. Update navigation and routing as needed

### AI Integration
1. Use `UnifiedAIService` for consistent AI interactions
2. Implement graceful fallbacks for AI service failures
3. Add proper error handling and user feedback
4. Test with mock AI providers during development

### Database Changes
1. Create migration files in `supabase/migrations/`
2. Update TypeScript types with `npm run db:generate`
3. Update service layer to handle new schema
4. Add tests for new functionality

## Deployment

The application is optimized for deployment with:
- **Docker**: `Dockerfile` with multi-stage builds
- **Vercel**: `vercel.json` with proper redirects and headers
- **Standalone**: Next.js standalone output for containerization
- **Environment**: Proper environment variable validation and fallbacks

Use `npm run build` to create an optimized production build with all performance optimizations enabled.