import { test, expect } from '@playwright/test';
import { setupFirebaseEmulators, clearFirebaseEmulators, waitForFirebaseReady } from './test-utils.js';

test.describe('Firebase Emulator Integration', () => {
  test.beforeEach(async ({ page, request }) => {
    // Clear emulator data before each test for isolation
    await clearFirebaseEmulators(request);
    
    // Setup emulator mode BEFORE navigating to the page
    await setupFirebaseEmulators(page);
  });

  test('should connect to Firebase emulators', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for Firebase to be ready
    await waitForFirebaseReady(page);
    
    // Check that we're in emulator mode
    const emulatorMode = await page.evaluate(() => {
      return sessionStorage.getItem('firebase-emulator-mode');
    });
    
    expect(emulatorMode).toBe('true');
    
    // Verify the page loads correctly
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should create and join game using emulators', async ({ page, browser }) => {
    // Create a game
    await setupFirebaseEmulators(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click create game (correct button text)
    await page.getByRole('button', { name: 'Create game' }).click();
    
    // Wait for game creation and get the game code
    await page.waitForURL(/\/[A-Z0-9]+/, { timeout: 15000 });
    const gameUrl = page.url();
    const gameCode = gameUrl.split('/').pop();
    
    expect(gameCode).toMatch(/^[A-Z0-9]+$/);
    
    // Create a new browser context for the second player (different anonymous auth)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await setupFirebaseEmulators(page2);
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');
    
    // Join the game
    await page2.getByRole('button', { name: 'Join game' }).click();
    await page2.fill('#gameCode', gameCode);
    await page2.fill('#join-display-name', 'Test Player 2');
    await page2.getByRole('button', { name: 'Join game' }).click();
    
    // Wait for navigation to game lobby
    await page2.waitForURL(/\/[A-Z0-9]+/, { timeout: 15000 });
    
    // Verify both players are in the lobby
    // Look for "Test Player 2" specifically since player 1 has a generated name
    await expect(page.getByText('Test Player 2')).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText('Test Player 2')).toBeVisible({ timeout: 10000 });
    
    // Verify the lobby shows we have multiple players
    await expect(page.locator('text=/Players.*2/').first()).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/Players.*2/').first()).toBeVisible({ timeout: 5000 });
    
    // Clean up the second context
    await context2.close();
  });
});
