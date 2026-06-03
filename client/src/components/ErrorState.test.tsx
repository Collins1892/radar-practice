import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  function renderErrorState(
    overrides: Partial<ComponentProps<typeof ErrorState>> = {},
  ): ReturnType<typeof render> & { onRetry: ReturnType<typeof vi.fn> } {
    const { onRetry: overrideOnRetry, ...rest } = overrides;
    const onRetry = overrideOnRetry ?? vi.fn((): void => {});

    const view = render(
      <ErrorState
        title="Could not load items"
        message="Cannot reach the server."
        onRetry={onRetry}
        {...rest}
      />,
    );

    return { ...view, onRetry };
  }

  it('displays the error message in an alert region', (): void => {
    // Arrange
    const message = 'Cannot reach the server.';

    // Act
    renderErrorState({ message });

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', (): void => {
    // Arrange — defaults via renderErrorState

    // Act
    const { onRetry } = renderErrorState();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Assert
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
