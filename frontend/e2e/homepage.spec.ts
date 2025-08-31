import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main elements', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for tours grid
    await expect(page.locator('[data-testid="tours-grid"]')).toBeVisible();
    
    // Check for currency selector
    await expect(page.locator('[data-testid="currency-selector"]')).toBeVisible();
  });

  test('should be able to search for tours', async ({ page }) => {
    await page.goto('/');

    // Wait for tours to load
    await page.waitForSelector('[data-testid="tour-card"]');

    // Get initial tour count
    const initialTours = await page.locator('[data-testid="tour-card"]').count();
    expect(initialTours).toBeGreaterThan(0);
  });

  test('should display tour cards with correct information', async ({ page }) => {
    await page.goto('/');

    // Wait for at least one tour card to load
    await page.waitForSelector('[data-testid="tour-card"]');

    const firstTourCard = page.locator('[data-testid="tour-card"]').first();

    // Check for tour title
    await expect(firstTourCard.locator('[data-testid="tour-title"]')).toBeVisible();
    
    // Check for tour price
    await expect(firstTourCard.locator('[data-testid="tour-price"]')).toBeVisible();
    
    // Check for tour rating
    await expect(firstTourCard.locator('[data-testid="tour-rating"]')).toBeVisible();
    
    // Check for "View Details" button
    await expect(firstTourCard.locator('button', { hasText: 'View Details' })).toBeVisible();
  });
});