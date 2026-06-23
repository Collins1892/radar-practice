import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { INCIDENT_DETAIL_HEADING } from '@/components/incidentPageCopy';
import { IncidentPageChrome } from './IncidentPageChrome';

describe('IncidentPageChrome', () => {
  function renderIncidentPageChrome(
    overrides: Partial<ComponentProps<typeof IncidentPageChrome>> = {},
  ): ReturnType<typeof render> {
    return render(
      <MemoryRouter>
        <IncidentPageChrome heading={INCIDENT_DETAIL_HEADING} {...overrides} />
      </MemoryRouter>,
    );
  }

  it('renders the heading and back link', (): void => {
    // Arrange
    const heading = INCIDENT_DETAIL_HEADING;

    // Act
    renderIncidentPageChrome({ heading });

    // Assert
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
  });

  it('does not render a subtitle paragraph when subtitle is not provided', (): void => {
    // Arrange — defaults via renderIncidentPageChrome; no subtitle prop

    // Act
    renderIncidentPageChrome();

    // Assert
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders subtitle when subtitle prop is provided', (): void => {
    // Arrange
    const subtitle = 'Test subtitle text';

    // Act
    renderIncidentPageChrome({ subtitle });

    // Assert
    // getByRole('paragraph') is unreliable across Testing Library/jsdom versions (ARIA 1.2 support inconsistent) — getByText is the robust choice here
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });
});
