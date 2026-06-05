import { test, expect } from '@playwright/test';

test('app loads', async ({ page }): Promise<void> => {
  // Arrange
  // (none)

  // Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle(/Radar Practice/);
});
