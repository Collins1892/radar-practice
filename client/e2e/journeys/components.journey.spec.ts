import { test, expect } from '@playwright/test';
import { ComponentsPage } from '../pages/ComponentsPage';

test.describe('components: registry', () => {
  test('shows heading and renders registered component previews', async ({
    page,
  }): Promise<void> => {
    // Arrange
    const componentsPage = new ComponentsPage(page);
    await componentsPage.goto();

    // Assert — page shell
    await expect(componentsPage.pageHeading).toBeVisible();
    await expect(componentsPage.subtitle).toBeVisible();

    // Assert — Pagination (default selection)
    await expect(componentsPage.selectedHeading('Pagination')).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Pagination' }),
    ).toBeVisible();

    // Act + Assert — Badge
    await componentsPage.selectComponent('Badge');
    await expect(componentsPage.selectedHeading('Badge')).toBeVisible();
    await expect(page.getByText('Default')).toBeVisible();

    // Act + Assert — DataTable
    await componentsPage.selectComponent('DataTable');
    await expect(componentsPage.selectedHeading('DataTable')).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Data table, scrollable' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Title' }),
    ).toBeVisible();

    // Act + Assert — FormField
    await componentsPage.selectComponent('FormField');
    await expect(componentsPage.selectedHeading('FormField')).toBeVisible();
    await expect(page.getByLabel('Item name')).toBeVisible();
  });
});
