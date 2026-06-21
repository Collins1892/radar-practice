import type { Locator, Page } from '@playwright/test';

export class IncidentsPage {
  readonly pageHeading: Locator;
  readonly subtitle: Locator;
  readonly createLink: Locator;
  readonly dataTable: Locator;
  readonly loadingState: Locator;

  constructor(private readonly page: Page) {
    this.pageHeading = page.getByRole('heading', { name: 'Incidents' });
    this.subtitle = page.getByText('Incident reports from the Incidents API');
    this.createLink = page.getByRole('link', { name: 'Create incident' });
    this.dataTable = page.getByRole('region', {
      name: 'Incidents list, scrollable',
    });
    this.loadingState = page.getByText('Loading incidents…');
  }

  async goto(): Promise<void> {
    await this.page.goto('/incidents');
  }

  async waitForListLoaded(): Promise<void> {
    await this.loadingState.waitFor({ state: 'hidden' });
  }

  async filterByStatus(displayLabel: string): Promise<void> {
    await this.page.getByLabel('Status', { exact: true }).click();
    await this.page.getByRole('option', { name: displayLabel }).click();
    await this.waitForListLoaded();
  }

  async filterBySeverity(severity: string): Promise<void> {
    await this.page.getByLabel('Severity', { exact: true }).click();
    await this.page.getByRole('option', { name: severity }).click();
    await this.waitForListLoaded();
  }

  async sortByTitleDescending(): Promise<void> {
    const titleSort = this.dataTable.getByRole('button', { name: /^Title/ });
    await titleSort.click();
    await this.waitForListLoaded();
    await titleSort.click();
    await this.waitForListLoaded();
  }

  listIncidentLink(id: number): Locator {
    return this.dataTable.locator(`a[href="/incidents/${id}"]`);
  }

  async gotoIncident(id: number): Promise<void> {
    await this.page.goto(`/incidents/${id}`);
  }
}
