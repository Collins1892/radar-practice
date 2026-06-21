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

  async filterByStatus(displayLabel: string): Promise<void> {
    await this.page.getByLabel('Status', { exact: true }).click();
    await this.page.getByRole('option', { name: displayLabel }).click();
    await this.waitForListLoaded();
  }

  async sortByTitleDescending(): Promise<void> {
    const titleSort = this.dataTable.getByRole('button', { name: /^Title/ });
    await titleSort.click();
    await this.waitForListLoaded();
    await titleSort.click();
    await this.waitForListLoaded();
  }

  // href-by-id for stable identity when title text could collide (reused-DB robustness).
  auditLink(id: number): Locator {
    return this.page.locator(`a[href="/audits/${id}"]`);
  }

  listAuditLink(id: number): Locator {
    return this.dataTable.locator(`a[href="/audits/${id}"]`);
  }

  async gotoAudit(id: number): Promise<void> {
    await this.page.goto(`/audits/${id}`);
  }
}
