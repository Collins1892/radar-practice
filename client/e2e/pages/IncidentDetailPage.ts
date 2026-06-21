import type { Locator, Page } from '@playwright/test';

export class IncidentDetailPage {
  readonly editLink: Locator;
  readonly backLink: Locator;

  constructor(private readonly page: Page) {
    this.editLink = page.getByRole('link', { name: 'Edit incident' });
    this.backLink = page.getByRole('link', { name: 'Back to incidents' });
  }

  async clickEdit(): Promise<void> {
    await this.editLink.click();
  }
}
