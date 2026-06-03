import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  function renderBadge(
    overrides: Partial<ComponentProps<typeof Badge>> = {},
  ): ReturnType<typeof render> {
    const { children = 'Status', ...rest } = overrides;

    return render(<Badge {...rest}>{children}</Badge>);
  }

  it('displays the badge label text', (): void => {
    // Arrange
    const label = 'In progress';

    // Act
    renderBadge({ children: label });

    // Assert
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('displays the label when variant is danger', (): void => {
    // Arrange
    const label = 'Critical';

    // Act
    renderBadge({ variant: 'danger', children: label });

    // Assert
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('marks the badge icon as decorative for screen readers', (): void => {
    // Arrange — defaults via renderBadge

    // Act
    const { container } = renderBadge({ children: 'Active' });

    // Assert
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
