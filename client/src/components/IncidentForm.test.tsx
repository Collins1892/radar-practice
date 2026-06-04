import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIncident, updateIncident, type Incident } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { IncidentForm } from './IncidentForm';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/incidents', () => ({
  createIncident: vi.fn(),
  getIncident: vi.fn(),
  updateIncident: vi.fn(),
}));

function renderIncidentFormEdit(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/1/edit']}>
      <IncidentForm mode="edit" incidentId={1} />
    </MemoryRouter>,
  );
}

describe('IncidentForm', () => {
  beforeEach((): void => {
    vi.mocked(getIncident).mockReset();
    vi.mocked(updateIncident).mockReset();
    navigateMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows loading state while fetching the incident', (): void => {
    // Arrange
    vi.mocked(getIncident).mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentFormEdit();

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when getIncident rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(getIncident).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderIncidentFormEdit();

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('pre-populates fields with the fetched incident data', async (): Promise<void> => {
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
    vi.mocked(getIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');

    // Assert
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Spill in corridor B');
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Water on floor');
    expect(screen.getByLabelText(/^Location/)).toHaveValue('Building 2');
  });

  it('calls updateIncident with correct data on submit', async (): Promise<void> => {
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
    const expectedReportedDate = format(
      parseISO(incident.reportedDate.slice(0, 10)),
      'yyyy-MM-dd',
    );
    vi.mocked(getIncident).mockResolvedValue(incident);
    vi.mocked(updateIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(updateIncident).toHaveBeenCalledTimes(1);
      expect(updateIncident).toHaveBeenCalledWith(1, {
        title: 'Spill in corridor B',
        description: 'Water on floor',
        location: 'Building 2',
        severity: 'High',
        status: 'Open',
        reportedDate: expectedReportedDate,
      });
    });
  });

  it('navigates to /incidents after successful submit', async (): Promise<void> => {
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
    vi.mocked(getIncident).mockResolvedValue(incident);
    vi.mocked(updateIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/incidents');
    });
  });
});
