/**
 * Badge contrast intent (WCAG 2.2 SC 1.4.3 — text vs fill, minimum 4.5:1).
 *
 * The default variant was changed from `text-muted-foreground` (4.35:1, fail) to
 * `text-foreground` on `bg-muted` to meet AA. Re-check these ratios if theme
 * tokens or variant colour classes change.
 *
 * | Variant | Light | Dark  |
 * |---------|-------|-------|
 * | default | 18.16 | 14.50 |
 * | success |  6.78 |  9.94 |
 * | warning |  6.37 | 10.39 |
 * | danger  |  6.80 |  8.51 |
 * | info    |  7.15 |  8.15 |
 *
 * Ratios computed from `index.css` OKLCH tokens (default) and Tailwind palette
 * classes (semantic variants). Not asserted here — document for review only.
 */
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
    const { container } = renderBadge({ variant: 'danger', children: label });

    // Assert
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="badge"]')).toHaveAttribute(
      'data-variant',
      'danger',
    );
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
