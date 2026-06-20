import type { Locator, Page } from '@playwright/test';

export class AuditDetailPage {
  readonly editLink: Locator;
  readonly backLink: Locator;

  constructor(private readonly page: Page) {
    this.editLink = page.getByRole('link', { name: 'Edit audit' });
    this.backLink = page.getByRole('link', { name: 'Back to audits' });
  }

  async clickEdit(): Promise<void> {
    await this.editLink.click();
  }
}
