import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../types';
import { ItemsList } from './ItemsList';

describe('ItemsList', () => {
  function renderItemsList(
    overrides: Partial<ComponentProps<typeof ItemsList>> = {},
  ): ReturnType<typeof render> & { onRetry: ReturnType<typeof vi.fn> } {
    const { onRetry: overrideOnRetry, ...rest } = overrides;
    const onRetry = overrideOnRetry ?? vi.fn((): void => {});
    const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

    const view = render(
      <ItemsList
        items={[]}
        status="loading"
        errorMessage={null}
        onRetry={onRetry}
        formatPrice={formatPrice}
        {...rest}
      />,
    );

    return { ...view, onRetry };
  }

  it('shows loading state while items are being fetched', (): void => {
    // Arrange — defaults via renderItemsList

    // Act
    renderItemsList({ status: 'loading' });

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading items…')).toBeInTheDocument();
  });

  it('shows error state with retry action when loading fails', (): void => {
    // Arrange
    const errorMessage = 'Cannot reach the server.';

    // Act
    const { onRetry } = renderItemsList({
      status: 'error',
      errorMessage,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Could not load items')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when there are no items', (): void => {
    // Arrange — defaults via renderItemsList

    // Act
    renderItemsList({ status: 'empty' });

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent(
      'No items yet. Add one above to get started.',
    );
  });

  it('shows populated list when items are ready', (): void => {
    // Arrange
    const items: Item[] = [
      { id: 1, name: 'Sprocket', price: 12.5 },
      { id: 2, name: 'Widget', price: 3.99 },
    ];

    // Act
    renderItemsList({ status: 'ready', items });

    // Assert
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Sprocket')).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
    expect(screen.getByText('$3.99')).toBeInTheDocument();
  });

  it('shows empty list when status is error but errorMessage is null', (): void => {
    // Arrange — defaults via renderItemsList

    // Act
    renderItemsList({
      status: 'error',
      errorMessage: null,
    });

    // Assert
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No items yet. Add one above to get started.'),
    ).not.toBeInTheDocument();
  });
});
