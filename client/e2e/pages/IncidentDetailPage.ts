import type { Locator, Page } from '@playwright/test';

export class IncidentDetailPage {
  readonly editLink: Locator;
  readonly backLink: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(private readonly page: Page) {
    this.editLink = page.getByRole('link', { name: 'Edit incident' });
    this.backLink = page.getByRole('link', { name: 'Back to incidents' });
    this.deleteButton = page.getByRole('button', { name: 'Delete incident' });
    this.confirmDeleteButton = page.getByRole('button', {
      name: 'Confirm delete',
    });
  }

  async clickEdit(): Promise<void> {
    await this.editLink.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
  }
}
