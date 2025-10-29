
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('homepage loads successfully', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(BASE_URL);
});

test('login page loads successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await expect(page.locator('h1')).toContainText(/login/i);
});

test('signup page loads successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);
  await expect(page).toHaveURL(`${BASE_URL}/signup`);
  await expect(page.locator('h1')).toContainText(/sign up/i);
});
