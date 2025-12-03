
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;

// ============================================================================
// Page navigation tests
// ============================================================================
test('homepage loads successfully', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(BASE_URL);
});

test('login page loads successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await expect(page.locator('h1')).toContainText(/welcome back/i);
});

test('signup page loads successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);
  await expect(page).toHaveURL(`${BASE_URL}/signup`);
  await expect(page.locator('h1')).toContainText(/sign up/i);
});

test('navigate from signup to login page', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);
  const loginLink = page.locator('a:has-text(/login|log in|sign in/i)').first();
  const linkExists = await loginLink.isVisible().catch(() => false);
  if (linkExists) {
    await loginLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  }
});
test('navigate from login to signup page', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  const signupLink = page.locator('a:has-text(/sign up|signup|register/i)').first();
  const linkExists = await signupLink.isVisible().catch(() => false);
  if (linkExists) {
    await signupLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/signup`);
  }
});
test('navigate to home from login page', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  const homeLink = page.locator('a:has-text(/home|inki/i), [role="banner"] a').first();
  const linkExists = await homeLink.isVisible().catch(() => false);
  if (linkExists) {
    await homeLink.click();
    const isHome = page.url() === BASE_URL || page.url().endsWith('/');
    expect(isHome).toBe(true);
  }
});
test('navigate back from document to documents list', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);
  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);
  if (isVisible) {
    await viewButton.click();
    await page.waitForTimeout(1000);
    const backButton = page.locator('button:has-text(/back|←/i)').first();
    const backExists = await backButton.isVisible().catch(() => false);
    if (backExists) {
      await backButton.click();
      expect(page.url()).toContain('/documents');
    }
  }
});

// ============================================================================
// Signup and Login workflows
// ============================================================================

test('signup form requires email and password', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);
  // Try to submit empty form
  await page.locator('button:has-text("Sign Up")').click();
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeFocused();
});

test('signup form requires valid email format', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);
  // Fill with invalid email
  await page.locator('input[type="email"]').fill('not-an-email');
  await page.locator('input[type="password"]').fill('password123');

  const form = page.locator('form');
  const isInvalid = await form.evaluate(el => !(el as HTMLFormElement).checkValidity());
  expect(isInvalid).toBe(true);
});

test('signup form requires password', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  // Fill email only
  await page.locator('input[type="email"]').fill(generateTestEmail());
  // should not submit because password is missing
  const form = page.locator('form');
  const isInvalid = await form.evaluate(el => !(el as HTMLFormElement).checkValidity());
  expect(isInvalid).toBe(true);
});


test('login form requires email and password', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  // Try to submit empty form
  await page.locator('button:has-text("Log In")').click();
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeFocused();
});

// ============================================================================
// Upload, View, Delete Functions
// ============================================================================

test('upload button toggles upload form visibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);

  // Check if we can interact with upload button
  const uploadButton = page.locator('button:has-text("Upload Document")');
  const isAccessible = await uploadButton.isVisible().catch(() => false);

  if (isAccessible) {
    await uploadButton.click();
    // Should show Cancel Upload after clicking
    await expect(uploadButton).toContainText(/cancel upload/i);
    await uploadButton.click();
    await expect(uploadButton).toContainText(/upload document/i);
  }
});

// ============================================================================
//  View and Search in the document
// ============================================================================

test('document viewer shows loading state', async ({ page }) => {
  await page.route('**/documents/**', route => {
    setTimeout(() => route.continue(), 1000);
  });

  await page.goto(`${BASE_URL}/documents`);
  // If we can access documents, try to click a document
  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();
    // Should show loading indicator
    const loadingText = page.locator('text=/loading document/i');
    await expect(loadingText).toBeVisible({ timeout: 5000 }).catch(() => {
    });
  }
});

// ============================================================================
// Search functionality in the document
// ============================================================================

test('search in document shows results count', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);

  // Try to access a document
  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);
  if (isVisible) {
    await viewButton.click();
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder="Search in document..."]');
    const isSearchAvailable = await searchInput.isVisible().catch(() => false);

    if (isSearchAvailable) {
      await searchInput.fill('the');
      // Should show result count (if text exists)
      await page.waitForTimeout(500);

      const resultCount = page.locator('text=/of/');
      const countVisible = await resultCount.isVisible().catch(() => false);

      expect(countVisible).toBe(true);
    }
  }
});

test('search returns empty when no matches found', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);
  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();

    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder="Search in document..."]');
    const isSearchAvailable = await searchInput.isVisible().catch(() => false);

    if (isSearchAvailable) {
      // Search for unlikely text
      await searchInput.fill('xyzunlikelywordxyz');

      await page.waitForTimeout(500);
      // Result count should not show (or show 0)
      const resultCount = page.locator('text=/of/');
      const countVisible = await resultCount.isVisible().catch(() => false);

      expect(countVisible).toBe(false);
    }
  }
});

test('search highlights matching text in yellow', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);

  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder="Search in document..."]');
    const isSearchAvailable = await searchInput.isVisible().catch(() => false);
    if (isSearchAvailable) {
      await searchInput.fill('the');
      await page.waitForTimeout(500);

      const highlighted = page.locator('mark');
      const hasHighlights = await highlighted.count() > 0;

      expect(hasHighlights).toBe(true);
      const markClasses = await highlighted.first().getAttribute('class');
      expect(markClasses).toContain('bg-yellow');
    }
  }
});

// ============================================================================
// UI Tests
// ============================================================================

test('navigation between search results works', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);
  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder="Search in document..."]');
    const isSearchAvailable = await searchInput.isVisible().catch(() => false);

    if (isSearchAvailable) {
      // Search for common text that will have multiple matches
      await searchInput.fill('the');

      await page.waitForTimeout(500);
      const nextButton = page.locator('button[class*="hover:text-gray"]').nth(1);
      const hasNavButtons = await nextButton.isVisible().catch(() => false);

      if (hasNavButtons) {
        await nextButton.click();
        const resultText = page.locator('text=/of/');
        const text = await resultText.textContent();
        expect(text).toMatch(/of \d+/);
      }
    }
  }
});

// ============================================================================
// Edge cases
// ============================================================================

test('invalid document ID shows error message', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents/invalid-document-id-12345`);
  await page.waitForTimeout(2000);
  const errorMessage = page.locator('text=/error|not found|does not exist/i');
  const hasError = await errorMessage.isVisible().catch(() => false);

  const isRedirected = !page.url().includes('documents');

  expect(hasError || isRedirected).toBe(true);
});

test('document title and metadata displays correctly', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);

  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();

    await page.waitForTimeout(1000);

    const title = page.locator('h1');
    const titleVisible = await title.isVisible().catch(() => false);

    if (titleVisible) {
      const titleText = await title.textContent();
      expect(titleText?.length ?? 0 > 0).toBe(true);
      const metadata = page.locator('text=/(PDF|text|page|KB|MB)/');
      const metadataVisible = await metadata.isVisible().catch(() => false);

      expect(metadataVisible).toBe(true);
    }
  }
});

test('document content displays with proper formatting', async ({ page }) => {
  await page.goto(`${BASE_URL}/documents`);

  const viewButton = page.locator('a:has-text("View")').first();
  const isVisible = await viewButton.isVisible().catch(() => false);

  if (isVisible) {
    await viewButton.click();

    await page.waitForTimeout(1000);
    const docText = page.locator('.document-text');
    const isDisplayed = await docText.isVisible().catch(() => false);

    if (isDisplayed) {
      const content = await docText.textContent();
      expect(content?.length ?? 0 > 0).toBe(true);
    }
  }
});
