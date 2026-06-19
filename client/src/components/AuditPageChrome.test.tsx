import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AUDIT_DETAIL_HEADING } from '@/components/auditPageCopy';
import { AuditPageChrome } from './AuditPageChrome';

describe('AuditPageChrome', () => {
  function renderAuditPageChrome(
    overrides: Partial<ComponentProps<typeof AuditPageChrome>> = {},
  ): ReturnType<typeof render> {
    return render(
      <MemoryRouter>
        <AuditPageChrome heading={AUDIT_DETAIL_HEADING} {...overrides} />
      </MemoryRouter>,
    );
  }

  it('renders the heading and back link', (): void => {
    // Arrange
    const heading = AUDIT_DETAIL_HEADING;

    // Act
    renderAuditPageChrome({ heading });

    // Assert
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
  });

  it('does not render a subtitle paragraph when subtitle is not provided', (): void => {
    // Arrange — defaults via renderAuditPageChrome; no subtitle prop

    // Act
    renderAuditPageChrome();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_DETAIL_HEADING })
        .nextElementSibling,
    ).toBeNull();
  });
});
