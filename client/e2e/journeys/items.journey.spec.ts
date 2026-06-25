import { test, expect } from '@playwright/test';
import { ItemsPage } from '../pages/ItemsPage';

test.describe('items: add item', () => {
  test('adds item and displays it in the list', async ({
    page,
  }): Promise<void> => {
    // Arrange
    const itemsPage = new ItemsPage(page);
    await itemsPage.goto();
    await itemsPage.waitForListLoaded();

    const itemName = `E2E Widget ${Date.now()}`;

    // Act
    await itemsPage.fillItem(itemName, '9.99');
    await itemsPage.submit();

    // Assert
    await expect(page.getByText(itemName)).toBeVisible();
    await expect(itemsPage.nameInput).toHaveValue('');
  });
});
