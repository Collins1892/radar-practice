import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  function renderErrorState(
    overrides: Partial<ComponentProps<typeof ErrorState>> = {},
  ): ReturnType<typeof render> & { onTryAgain: ReturnType<typeof vi.fn> } {
    const { onTryAgain: overrideOnTryAgain, ...rest } = overrides;
    const onTryAgain = overrideOnTryAgain ?? vi.fn((): void => {});

    const view = render(
      <ErrorState
        title="Could not load items"
        message="Cannot reach the server."
        onTryAgain={onTryAgain}
        {...rest}
      />,
    );

    return { ...view, onTryAgain };
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

  it('calls onTryAgain when the Try again button is clicked', (): void => {
    // Arrange — defaults via renderErrorState

    // Act
    const { onTryAgain } = renderErrorState();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });
});
