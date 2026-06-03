import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  function renderEmptyState(
    overrides: Partial<ComponentProps<typeof EmptyState>> = {},
  ): ReturnType<typeof render> {
    return render(
      <EmptyState
        title="No items yet"
        message="Add an item to get started."
        {...overrides}
      />,
    );
  }

  it('displays the empty state message text', (): void => {
    // Arrange
    const message = 'Add an item to get started.';

    // Act
    renderEmptyState({ message });

    // Assert
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('announces the empty state to screen readers with a status region', (): void => {
    // Arrange — defaults via renderEmptyState

    // Act
    renderEmptyState();

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
