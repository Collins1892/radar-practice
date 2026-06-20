import type { Locator, Page } from '@playwright/test';

export class AuditsPage {
  readonly pageHeading: Locator;
  readonly subtitle: Locator;
  readonly createLink: Locator;
  readonly dataTable: Locator;
  readonly loadingState: Locator;

  constructor(private readonly page: Page) {
    this.pageHeading = page.getByRole('heading', { name: 'Audits' });
    this.subtitle = page.getByText(
      'Clinical quality audits from the Audits API',
    );
    this.createLink = page.getByRole('link', { name: 'Create audit' });
    this.dataTable = page.getByRole('region', {
      name: 'Audits list, scrollable',
    });
    this.loadingState = page.getByText('Loading audits…');
  }

  async goto(): Promise<void> {
    await this.page.goto('/audits');
  }

  async waitForListLoaded(): Promise<void> {
    await this.loadingState.waitFor({ state: 'hidden' });
  }

  auditLink(id: number): Locator {
    return this.page.locator(`a[href="/audits/${id}"]`);
  }

  async openAudit(id: number): Promise<void> {
    await this.auditLink(id).click();
  }
}
