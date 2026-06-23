import { expect, type Locator, type Page } from '@playwright/test';

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
    const titleHeader = this.dataTable.getByRole('columnheader', {
      name: /^Title/,
    });

    await titleHeader.getByRole('button').click();
    // Settle signal (not a test assertion): wait for sort UI state before second click.
    await expect(titleHeader).toHaveAttribute('aria-sort', 'ascending');
    await this.waitForListLoaded();

    await titleHeader.getByRole('button').click();
    // Settle signal (not a test assertion): confirm descending sort before list refetch settles.
    await expect(titleHeader).toHaveAttribute('aria-sort', 'descending');
    await this.waitForListLoaded();
  }

  listAuditLink(id: number): Locator {
    return this.dataTable.locator(`a[href="/audits/${id}"]`);
  }

  async gotoAudit(id: number): Promise<void> {
    await this.page.goto(`/audits/${id}`);
  }
}
