---
description: How to troubleshoot and fix common runtime errors in the application
---

# Troubleshooting Guide

## 1. React Child Error (Objects are not valid as a React child)

**Symptoms:**
- Error message: `Error: Objects are not valid as a React child (found: object with keys {type, title, message, ...})`
- App crashes when triggering a notification/toast.

**Cause:**
- Passing an object as the first argument to `notificationService.notify()` or `toast()`.
- The signature is `notify(title: string, options: NotificationOptions)`.

**Fix:**
- Ensure the first argument is a STRING `title`.
- strictly follow: `notificationService.notify('Title', { ...options })`.

## 2. AI Service / Gemini Not Initialized

**Symptoms:**
- Error: `Gemini client not initialized`
- Logs showing `Using MOCK mode` but calls fail.

**Cause:**
- Missing API keys in environment variables.
- `GeminiProvider` not correctly handling `useProxy` or mock mode check inside usage methods.

**Fix:**
- Ensure `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` is set in `.env.local`.
- If using mock mode, ensure `isMockMode` is exported and checked before making API calls.
- In components (like `RecipeCategoryGrid`), check for mock mode and use placeholders if keys are missing.

## 3. RecipeDetail Crashes (Cannot read property of undefined)

**Symptoms:**
- `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` in `RecipeDetail.tsx` or similar.

**Cause:**
- Pantry item lookup fails or ingredient name is undefined/null.
- Data inconsistency between recipe ingredients and pantry items.

**Fix:**
- Add null checks: `if (!item.ingredient_name) return ...`
- specific check: `item.ingredient_name && item.ingredient_name.toLowerCase() === ...`

## 4. Test Syntax Errors

**Cause:**
- Using JSX in `.ts` files instead of `.tsx`.
- Missing braces in `jest.mock` factories or JSON objects.

**Fix:**
- Rename `test.ts` to `test.tsx` if using JSX.
- Carefully check brace matching in `integration.test.ts`.
