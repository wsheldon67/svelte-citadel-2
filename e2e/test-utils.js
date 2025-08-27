/**
 * Test utilities for Playwright tests with Firebase emulators
 */

/**
 * Sets up the page to use Firebase emulators
 * Call this before navigating to any page in your tests
 */
export async function setupFirebaseEmulators(page) {
  // Set emulator mode flag before ANY navigation occurs
  await page.addInitScript(() => {
    sessionStorage.setItem('firebase-emulator-mode', 'true');
    // Also set it on window for immediate access
    window.FIREBASE_EMULATOR_MODE = true;
  });
}

/**
 * Clears Firebase emulator data between tests
 * This helps ensure test isolation
 */
export async function clearFirebaseEmulators(request) {
  try {
    // Clear Firestore data
    await request.delete('http://localhost:8080/emulator/v1/projects/citadel-bc67c/databases/(default)/documents');
    
    // Clear Auth data  
    await request.delete('http://localhost:9099/emulator/v1/projects/citadel-bc67c/accounts');
    
    console.log('Firebase emulator data cleared');
  } catch (error) {
    console.warn('Failed to clear emulator data:', error.message);
  }
}

/**
 * Wait for Firebase to be ready on the page
 */
export async function waitForFirebaseReady(page) {
  await page.waitForFunction(() => {
    return window.firebase !== undefined || 
           document.readyState === 'complete';
  }, { timeout: 10000 });
}
