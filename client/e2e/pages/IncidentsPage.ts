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

  incidentLink(id: number): Locator {
    return this.page.locator(`a[href="/incidents/${id}"]`);
  }

  async openIncident(id: number): Promise<void> {
    await this.incidentLink(id).click();
  }
}
