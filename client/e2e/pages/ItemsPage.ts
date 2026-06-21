import type { Locator, Page } from '@playwright/test';

export class ItemsPage {
  readonly pageHeading: Locator;
  readonly addItemHeading: Locator;
  readonly nameInput: Locator;
  readonly priceInput: Locator;
  readonly addButton: Locator;
  readonly allItemsHeading: Locator;
  readonly refreshButton: Locator;
  readonly loadingState: Locator;

  constructor(private readonly page: Page) {
    this.pageHeading = page.getByRole('heading', { name: 'Items' });
    this.addItemHeading = page.getByRole('heading', { name: 'Add item' });
    this.nameInput = page.getByLabel('Name');
    this.priceInput = page.getByLabel('Price');
    this.addButton = page.getByRole('button', { name: 'Add item' });
    this.allItemsHeading = page.getByRole('heading', { name: 'All items' });
    this.refreshButton = page.getByRole('button', { name: 'Refresh' });
    this.loadingState = page.getByText('Loading items…');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async waitForListLoaded(): Promise<void> {
    await this.loadingState.waitFor({ state: 'hidden' });
  }

  async fillItem(name: string, price: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.priceInput.fill(price);
  }

  async submit(): Promise<void> {
    await this.addButton.click();
  }
}
