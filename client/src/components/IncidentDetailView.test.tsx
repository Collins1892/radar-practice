import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteIncident, getIncident, type Incident } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { INCIDENT_DETAIL_HEADING } from '@/components/incidentPageCopy';
import { toast } from 'sonner';
import { IncidentDetailView } from './IncidentDetailView';

const navigateMock = vi.hoisted(() => vi.fn());

const INCIDENTS_NETWORK_MESSAGE =
  'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';

const INCIDENT_DELETE_SUCCESS_MESSAGE = 'Incident deleted successfully.';

const incident: Incident = {
  id: 1,
  title: 'Spill in corridor B',
  description: 'Water on floor',
  location: 'Building 2',
  severity: 'High',
  status: 'Open',
  reportedDate: '2026-06-04T00:00:00.000Z',
};

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/incidents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/incidents')>();
  return {
    ...actual,
    getIncident: vi.fn(),
    deleteIncident: vi.fn(),
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

async function renderLoadedIncidentDetailView(): Promise<void> {
  vi.mocked(getIncident).mockResolvedValue(incident);
  renderIncidentDetailView();
  await screen.findByRole('heading', { name: incident.title });
}

describe('IncidentDetailView', () => {
  beforeEach((): void => {
    vi.mocked(getIncident).mockReset();
    vi.mocked(deleteIncident).mockReset();
    vi.mocked(toast.success).mockReset();
    navigateMock.mockReset();
  });

  it('shows the incident data when getIncident resolves successfully', async (): Promise<void> => {
    // Arrange
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
    expect(
      screen.getByRole('link', { name: 'Edit incident' }),
    ).toBeInTheDocument();
  });

  it('shows loading state while fetching the incident', (): void => {
    // Arrange
    vi.mocked(getIncident).mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: INCIDENT_DETAIL_HEADING }),
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
      screen.getByRole('heading', { name: INCIDENT_DETAIL_HEADING }),
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
      screen.getByRole('heading', { name: INCIDENT_DETAIL_HEADING }),
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
      screen.getByRole('heading', { name: INCIDENT_DETAIL_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(getIncident).not.toHaveBeenCalled();
  });

  it('shows a Delete incident button when the incident is loaded', async (): Promise<void> => {
    // Arrange
    await renderLoadedIncidentDetailView();

    // Act — (loaded view rendered in Arrange)

    // Assert
    expect(
      screen.getByRole('button', { name: 'Delete incident' }),
    ).toBeInTheDocument();
  });

  it('opens the confirmation dialog when Delete incident is clicked', async (): Promise<void> => {
    // Arrange
    await renderLoadedIncidentDetailView();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Delete incident' }));

    // Assert
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete incident?')).toBeVisible();
  });

  it('closes the dialog without calling deleteIncident when Cancel is clicked', async (): Promise<void> => {
    // Arrange
    await renderLoadedIncidentDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete incident' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteIncident).not.toHaveBeenCalled();
  });

  it('cannot dismiss the modal while a delete is in flight', async (): Promise<void> => {
    // Arrange
    vi.mocked(deleteIncident).mockImplementation(() => new Promise(() => {}));
    await renderLoadedIncidentDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete incident' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls deleteIncident and navigates to the incidents list on confirm success', async (): Promise<void> => {
    // Arrange
    vi.mocked(deleteIncident).mockResolvedValue(undefined);
    await renderLoadedIncidentDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete incident' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    // Assert
    await waitFor(() => {
      expect(deleteIncident).toHaveBeenCalledTimes(1);
      expect(deleteIncident).toHaveBeenCalledWith(1);
      expect(navigateMock).toHaveBeenCalledWith('/incidents');
      expect(toast.success).toHaveBeenCalledWith(
        INCIDENT_DELETE_SUCCESS_MESSAGE,
      );
    });
  });

  it('shows an inline error alert when deleteIncident rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(deleteIncident).mockRejectedValue(
      new ApiClientError('Network request failed', 'network'),
    );
    await renderLoadedIncidentDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete incident' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        INCIDENTS_NETWORK_MESSAGE,
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
