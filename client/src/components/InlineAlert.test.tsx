import { render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { InlineAlert } from './InlineAlert';

describe('InlineAlert', () => {
  function renderInlineAlert(
    overrides: Partial<ComponentProps<typeof InlineAlert>> = {},
  ): ReturnType<typeof render> {
    return render(
      <InlineAlert variant="info" message="Alert message" {...overrides} />,
    );
  }

  it('renders message', (): void => {
    // Arrange
    const message = 'Something needs your attention.';

    // Act
    renderInlineAlert({ message });

    // Assert
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders title when provided', (): void => {
    // Arrange
    const title = 'Heads up';

    // Act
    renderInlineAlert({ title });

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('does not render title when omitted', (): void => {
    // Arrange

    // Act
    renderInlineAlert();

    // Assert
    expect(screen.getAllByRole('paragraph')).toHaveLength(1);
  });

  it('uses role alert for error variant and role status for other variants', (): void => {
    // Arrange / Act
    const { container: errorContainer } = renderInlineAlert({
      variant: 'error',
    });
    const { container: successContainer } = renderInlineAlert({
      variant: 'success',
    });
    const { container: warningContainer } = renderInlineAlert({
      variant: 'warning',
    });
    const { container: infoContainer } = renderInlineAlert({ variant: 'info' });

    // Assert
    expect(within(errorContainer).getByRole('alert')).toBeInTheDocument();
    expect(within(successContainer).getByRole('status')).toBeInTheDocument();
    expect(within(warningContainer).getByRole('status')).toBeInTheDocument();
    expect(within(infoContainer).getByRole('status')).toBeInTheDocument();
  });

  it('uses polite aria-live on the status region for non-error variants', (): void => {
    // Arrange — defaults via renderInlineAlert (info variant)

    // Act
    renderInlineAlert({ variant: 'info' });

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('icon has aria-hidden set to true', (): void => {
    // Arrange

    // Act
    const { container } = renderInlineAlert();

    // Assert
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
