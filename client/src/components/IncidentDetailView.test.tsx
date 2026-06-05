import { render, screen } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIncident, type Incident } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { IncidentDetailView } from './IncidentDetailView';

vi.mock('@/api/incidents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/incidents')>();
  return {
    ...actual,
    getIncident: vi.fn(),
  };
});

function renderIncidentDetailView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/1']}>
      <Routes>
        <Route path="/incidents/:id" element={<IncidentDetailView />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderIncidentDetailViewWithInvalidId(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/abc']}>
      <Routes>
        <Route path="/incidents/:id" element={<IncidentDetailView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('IncidentDetailView', () => {
  beforeEach((): void => {
    vi.mocked(getIncident).mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the incident data when getIncident resolves successfully', async (): Promise<void> => {
    // Arrange
    const incident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2',
      severity: 'High',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    const formattedReportedDate = format(
      parseISO(incident.reportedDate.slice(0, 10)),
      'dd MMM yyyy',
    );
    vi.mocked(getIncident).mockResolvedValue(incident);

    // Act
    renderIncidentDetailView();
    await screen.findByRole('heading', { name: 'Spill in corridor B' });

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Spill in corridor B' }),
    ).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(formattedReportedDate)).toBeInTheDocument();
  });

  it('shows loading state while fetching the incident', (): void => {
    // Arrange
    vi.mocked(getIncident).mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Incident detail' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when getIncident rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(getIncident).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderIncidentDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Incident detail' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows chrome and error state when getIncident resolves with null', async (): Promise<void> => {
    // Arrange
    vi.mocked(getIncident).mockResolvedValue(null as unknown as Incident);

    // Act
    renderIncidentDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Incident detail' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows error state when the id param is not a valid number', (): void => {
    // Arrange — invalid id via renderIncidentDetailViewWithInvalidId

    // Act
    renderIncidentDetailViewWithInvalidId();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Incident detail' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(getIncident).not.toHaveBeenCalled();
  });
});
