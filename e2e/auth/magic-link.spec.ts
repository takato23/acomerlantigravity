import { test, expect } from '@playwright/test';

test.describe('Magic Link Authentication', () => {
    test('should display login form on /login page', async ({ page }) => {
        // Visit login page
        await page.goto('/login');

        // Should see email input
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // Should see submit button
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show success message after submitting email', async ({ page }) => {
        // Visit login page
        await page.goto('/login');

        // Enter email
        await page.fill('input[type="email"]', 'test@example.com');

        // Click send magic link button
        await page.click('button[type="submit"]');

        // Wait for success message (may take a moment)
        await expect(page.locator('text=Link enviado')).toBeVisible({ timeout: 10000 });
    });

    test('should protect /planificador route', async ({ page }) => {
        // Visit protected route without auth
        await page.goto('/planificador');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);

        // Should have redirect parameter
        await expect(page).toHaveURL(/redirect=%2Fplanificador/);
    });

    test('should protect /dashboard route', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
        await expect(page).toHaveURL(/redirect=%2Fdashboard/);
    });

    test('should allow public access to /recetas', async ({ page }) => {
        // Visit public route without auth
        await page.goto('/recetas');

        // Should NOT redirect
        await expect(page).toHaveURL(/\/recetas/);
    });

    test('should allow public access to shared plans', async ({ page }) => {
        // Visit shared plan route without auth
        await page.goto('/shared/test-token');

        // Should NOT redirect to login
        await expect(page).not.toHaveURL(/\/login/);
    });

    test('should allow public access to root page', async ({ page }) => {
        await page.goto('/');
        await expect(page).not.toHaveURL(/\/login/);
    });
});
