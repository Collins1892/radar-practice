import type { Locator, Page } from '@playwright/test';

export class ComponentsPage {
  readonly pageHeading: Locator;
  readonly subtitle: Locator;
  readonly componentNav: Locator;
  readonly previewPanel: Locator;

  constructor(private readonly page: Page) {
    this.pageHeading = page.getByRole('heading', { name: 'Components' });
    this.subtitle = page.getByText('Reusable component library');
    this.componentNav = page.getByRole('navigation', { name: 'Components' });
    this.previewPanel = page.locator('section.flex-1');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components');
  }

  async selectComponent(name: string): Promise<void> {
    await this.componentNav.getByRole('button', { name, exact: true }).click();
  }

  selectedHeading(name: string): Locator {
    return this.page.getByRole('heading', { name, level: 2 });
  }
}
