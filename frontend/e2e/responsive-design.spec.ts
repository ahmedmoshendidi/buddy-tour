import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Tours should stack vertically on mobile
    const tourCards = page.locator('[data-testid="tour-card"]');
    const firstCard = tourCards.first();
    const secondCard = tourCards.nth(1);

    if (await tourCards.count() >= 2) {
      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();
      
      // Cards should be stacked vertically (second card should be below first)
      expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height / 2);
    }
  });

  test('should handle tablet layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Navigation should be visible on tablet
    await expect(page.locator('nav')).toBeVisible();
    
    // Tours grid should adapt to tablet size
    await expect(page.locator('[data-testid="tours-grid"]')).toBeVisible();
  });

  test('should handle desktop layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Full navigation should be visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Tours should be in grid layout
    await expect(page.locator('[data-testid="tours-grid"]')).toBeVisible();
    
    // Sidebar elements should be visible
    await expect(page.locator('[data-testid="currency-selector"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // First tab should focus on skip link or first interactive element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'SELECT'].includes(focusedElement || '')).toBeTruthy();

    // Continue tabbing to ensure logical tab order
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate focused elements with Enter/Space
    await page.keyboard.press('Enter');
    
    // Page should respond to keyboard interaction
    await expect(page).not.toHaveURL('/'); // Should have navigated or opened something
  });

  test('should meet basic accessibility requirements', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy(); // Should have alt text
    }

    // Check for proper button/link text
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim()).toBeTruthy(); // Buttons should have readable text
    }

    // Check for form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });
});