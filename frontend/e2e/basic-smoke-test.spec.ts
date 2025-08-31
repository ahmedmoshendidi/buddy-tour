import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads and has basic content
    await expect(page).toHaveTitle(/BuddyTour/);
    
    // Should have some heading
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // Should not have any console errors (basic check)
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);
    
    // Allow some expected errors but not critical ones
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.toLowerCase().includes('network')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Should still be functional on desktop
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle basic navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for any clickable buttons or links
    const buttons = page.locator('button:visible').first();
    const links = page.locator('a:visible').first();
    
    // At least one interactive element should be present
    const buttonExists = await buttons.count() > 0;
    const linkExists = await links.count() > 0;
    
    expect(buttonExists || linkExists).toBeTruthy();
  });
});