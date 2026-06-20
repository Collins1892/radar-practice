import type { Locator, Page } from '@playwright/test';

export class IncidentFormPage {
  readonly titleInput: Locator;
  readonly submitCreateButton: Locator;
  readonly submitEditButton: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.locator('#incident-title');
    this.submitCreateButton = page.getByRole('button', {
      name: 'Create incident',
    });
    this.submitEditButton = page.getByRole('button', { name: 'Save changes' });
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto('/incidents/create');
  }

  async submitCreate(): Promise<void> {
    await this.submitCreateButton.click();
  }

  async selectStatus(displayLabel: string): Promise<void> {
    await this.page.getByLabel(/^Status/).click();
    await this.page.getByRole('option', { name: displayLabel }).click();
  }

  async submitEdit(): Promise<void> {
    await this.submitEditButton.click();
  }
}
