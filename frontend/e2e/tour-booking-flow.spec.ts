import { test, expect } from '@playwright/test';

test.describe('Tour Booking Flow', () => {
  test('should complete full booking flow', async ({ page }) => {
    await page.goto('/');

    // Wait for tours to load and click on first tour
    await page.waitForSelector('[data-testid="tour-card"]');
    const firstTour = page.locator('[data-testid="tour-card"]').first();
    await firstTour.locator('button', { hasText: 'View Details' }).click();

    // Should be on tour details page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Book This Tour Now' })).toBeVisible();

    // Click book now
    await page.locator('button', { hasText: 'Book This Tour Now' }).click();

    // Should be on tickets quantity page
    await expect(page.locator('h1')).toContainText('Choose your preferred');
    
    // Select a date (click on first available date)
    await page.waitForSelector('[data-testid="calendar-day"]:not([disabled])');
    await page.locator('[data-testid="calendar-day"]:not([disabled])').first().click();

    // Select a time
    await page.waitForSelector('[data-testid="time-slot"]');
    await page.locator('[data-testid="time-slot"]').first().click();

    // Add tickets
    const addAdultButton = page.locator('[data-testid="add-adult"]');
    await addAdultButton.click();
    await addAdultButton.click(); // Add 2 adults

    // Proceed to checkout
    await expect(page.locator('button', { hasText: 'Proceed to Checkout' })).toBeEnabled();
    await page.locator('button', { hasText: 'Proceed to Checkout' }).click();

    // Should be on checkout page
    await expect(page.locator('h1')).toContainText('Contact Information');
    
    // Fill contact form
    await page.locator('[data-testid="first-name"]').fill('John');
    await page.locator('[data-testid="last-name"]').fill('Doe');
    await page.locator('[data-testid="email"]').fill('john.doe@example.com');
    await page.locator('[data-testid="phone"]').fill('+1234567890');

    // Proceed to payment
    await page.locator('button', { hasText: 'Next' }).click();

    // Should be on payment method step
    await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();
    
    // Select payment method
    await page.locator('[data-testid="payment-card"]').click();

    // Complete payment (this will redirect or show confirmation)
    await page.locator('button', { hasText: 'Complete Payment' }).click();

    // Should see confirmation or redirect to payment gateway
    // Note: In real tests, you might mock the payment gateway
    await expect(page).toHaveURL(/checkout|payment|success/);
  });

  test('should validate required fields in checkout', async ({ page }) => {
    // Navigate directly to checkout (assuming booking data is in localStorage)
    await page.goto('/');
    
    // Add booking data to localStorage to simulate coming from booking flow
    await page.addInitScript(() => {
      localStorage.setItem('bookingData', JSON.stringify({
        tour_id: 1,
        date: '2025-12-01',
        time: '10:00',
        adults: 2,
        children: 0,
        total_amount: 100,
        price_per_person: 50
      }));
    });

    // Now navigate to checkout
    await page.evaluate(() => {
      window.location.hash = '#checkout';
    });

    // Wait for checkout form
    await page.waitForSelector('[data-testid="checkout-form"]');

    // Try to proceed without filling required fields
    await page.locator('button', { hasText: 'Next' }).click();

    // Should see validation errors
    await expect(page.locator('[data-testid="error-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible();
  });

  test('should handle favorites functionality', async ({ page }) => {
    await page.goto('/');

    // Wait for tours to load
    await page.waitForSelector('[data-testid="tour-card"]');

    // Click favorite on first tour
    const firstTour = page.locator('[data-testid="tour-card"]').first();
    await firstTour.locator('[data-testid="favorite-button"]').click();

    // Check if favorites counter updated
    await expect(page.locator('[data-testid="favorites-count"]')).toContainText('1');

    // Open favorites cart
    await page.locator('[data-testid="favorites-cart"]').click();

    // Should see favorited tour in cart
    await expect(page.locator('[data-testid="favorites-item"]')).toHaveCount(1);

    // Remove from favorites
    await page.locator('[data-testid="remove-favorite"]').first().click();

    // Favorites count should be 0
    await expect(page.locator('[data-testid="favorites-count"]')).toContainText('0');
  });
});