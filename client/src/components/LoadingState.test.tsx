import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  function renderLoadingState(
    overrides: Partial<ComponentProps<typeof LoadingState>> = {},
  ): ReturnType<typeof render> {
    return render(<LoadingState {...overrides} />);
  }

  it('exposes a status region with a visible loading message', (): void => {
    // Arrange — defaults via renderLoadingState

    // Act
    renderLoadingState();

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('uses polite aria-live on the status region', (): void => {
    // Arrange — defaults via renderLoadingState

    // Act
    renderLoadingState();

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('exposes overlay variant as a polite status region', (): void => {
    // Arrange — defaults via renderLoadingState

    // Act
    renderLoadingState({ variant: 'overlay', message: 'Updating incidents…' });

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Updating incidents…')).toBeInTheDocument();
  });
});
