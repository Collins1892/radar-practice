import { test, expect } from '@playwright/test';

test('app loads', async ({ page }): Promise<void> => {
  // Arrange
  // (none)

  // Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle(/Radar Practice/);
  await expect(page.getByRole('heading', { name: 'Components' })).toBeVisible();
});

test('incidents page shows the Incidents heading', async ({
  page,
}): Promise<void> => {
  // Arrange
  // (none)

  // Act
  await page.goto('/incidents');

  // Assert
  await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
});

test('components page shows the Components heading', async ({
  page,
}): Promise<void> => {
  // Arrange
  // (none)

  // Act
  await page.goto('/components');

  // Assert
  await expect(page.getByRole('heading', { name: 'Components' })).toBeVisible();
});
