import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createItem, fetchItems } from './api';
import { ApiClientError } from './errors';
import type { Item } from './types';

vi.mock('./api', () => ({
  fetchItems: vi.fn(),
  createItem: vi.fn(),
}));

const renderApp = (initialEntries: string[] = ['/']): void => {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  );
};

describe('App', () => {
  beforeEach((): void => {
    document.title = 'Radar Practice';
    vi.mocked(fetchItems).mockReset();
    vi.mocked(createItem).mockReset();
  });

  it('renders skip link targeting main content as first focusable element', (): void => {
    // Arrange
    vi.mocked(fetchItems).mockResolvedValue([]);

    // Act
    renderApp();

    // Assert
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('sets document title to Items | Radar Practice at /', (): void => {
    // Arrange
    vi.mocked(fetchItems).mockResolvedValue([]);

    // Act
    renderApp();

    // Assert
    expect(document.title).toBe('Items | Radar Practice');
  });

  it('sets document title to Create incident | Radar Practice at /incidents/create', (): void => {
    // Arrange
    // (none)

    // Act
    renderApp(['/incidents/create']);

    // Assert
    expect(document.title).toBe('Create incident | Radar Practice');
  });

  it('loads and displays items after mount', async (): Promise<void> => {
    // Arrange
    const items: Item[] = [{ id: 1, name: 'Sprocket', price: 12.5 }];
    vi.mocked(fetchItems).mockResolvedValue(items);

    // Act
    renderApp();

    // Assert
    await screen.findByRole('list');
    expect(screen.getByText('Sprocket')).toBeInTheDocument();
  });

  it('shows load failure alert when fetchItems rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchItems).mockRejectedValue(
      new ApiClientError('Network request failed', 'network'),
    );

    // Act
    renderApp();

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot reach the server. Start the API with dotnet run in ItemsApi, then try again.',
    );
  });

  it('shows empty catalogue message when fetchItems returns no items', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchItems).mockResolvedValue([]);

    // Act
    renderApp();

    // Assert
    await screen.findByText('No items yet. Add one above to get started.');
  });

  it('calls fetchItems twice when Refresh is clicked after mount', async (): Promise<void> => {
    // Arrange
    const items: Item[] = [{ id: 1, name: 'Sprocket', price: 12.5 }];
    vi.mocked(fetchItems).mockResolvedValue(items);

    // Act
    renderApp();
    await screen.findByRole('list');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    // Assert
    expect(fetchItems).toHaveBeenCalledTimes(2);
  });

  it('shows name required alert when submitting with empty name', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchItems).mockResolvedValue([]);

    // Act
    renderApp();
    await screen.findByText('No items yet. Add one above to get started.');
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    // Assert
    await screen.findByText('Name is required.');
  });

  it('shows invalid price alert when submitting with non-numeric price', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchItems).mockResolvedValue([]);

    // Act
    renderApp();
    await screen.findByText('No items yet. Add one above to get started.');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Sprocket' },
    });
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    // Assert
    await screen.findByText('Enter a valid price.');
  });

  it('adds item and refreshes list after successful submit', async (): Promise<void> => {
    // Arrange
    const newItem: Item = { id: 1, name: 'Widget', price: 9.99 };
    vi.mocked(fetchItems)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newItem]);
    vi.mocked(createItem).mockResolvedValue(newItem);

    // Act
    renderApp();
    await screen.findByText('No items yet. Add one above to get started.');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Widget' },
    });
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: '9.99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    // Assert
    expect(createItem).toHaveBeenCalledWith({ name: 'Widget', price: 9.99 });
    expect(await screen.findByLabelText('Name')).toHaveValue('');
    expect(await screen.findByLabelText('Price')).toHaveValue(null);
    await screen.findByText('Widget');
  });

  it('shows create failure alert and keeps name when createItem rejects', async (): Promise<void> => {
    // Arrange
    const errorMessage = 'Could not save item';
    vi.mocked(fetchItems).mockResolvedValue([]);
    vi.mocked(createItem).mockRejectedValue(
      new ApiClientError(errorMessage, 'http', 400),
    );

    // Act
    renderApp();
    await screen.findByText('No items yet. Add one above to get started.');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Widget' },
    });
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: '9.99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(screen.getByLabelText('Name')).toHaveValue('Widget');
  });
});
