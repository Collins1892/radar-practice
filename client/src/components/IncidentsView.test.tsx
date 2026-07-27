import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchIncidents } from '@/api/incidents';
import type { Incident, PagedIncidentsResult } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { IncidentsView } from './IncidentsView';

vi.mock('@/api/incidents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/incidents')>();
  return {
    ...actual,
    fetchIncidents: vi.fn(),
  };
});

const emptyPagedResult: PagedIncidentsResult = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
};

const sampleIncident: Incident = {
  id: 1,
  title: 'Spill in corridor B',
  description: 'Water on floor near supplies',
  location: 'Building 2, level 1',
  severity: 'Medium',
  status: 'Open',
  reportedDate: '2026-01-15T00:00:00.000Z',
};

const refreshedIncident: Incident = {
  id: 2,
  title: 'Leak in corridor C',
  description: 'Ceiling leak near stairwell',
  location: 'Building 3, level 2',
  severity: 'High',
  status: 'Open',
  reportedDate: '2026-01-16T00:00:00.000Z',
};

const populatedPagedResult: PagedIncidentsResult = {
  items: [sampleIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

const refreshedPagedResult: PagedIncidentsResult = {
  items: [refreshedIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function renderIncidentsView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents']}>
      <IncidentsView />
    </MemoryRouter>,
  );
}

describe('IncidentsView', () => {
  beforeEach((): void => {
    vi.mocked(fetchIncidents).mockReset();
  });

  it('shows loading state while incidents are being fetched', (): void => {
    // Arrange
    vi.mocked(fetchIncidents).mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentsView();

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading incidents…')).toBeInTheDocument();
  });

  it('shows error state when fetchIncidents rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockRejectedValue(
      new ApiClientError('Network request failed', 'network'),
    );

    // Act
    renderIncidentsView();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load incidents');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when fetchIncidents returns zero items', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockResolvedValue(emptyPagedResult);

    // Act
    renderIncidentsView();

    // Assert
    await screen.findByText('No incidents found');
    expect(
      screen.getByText('No incidents have been reported yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Incidents list, scrollable' }),
    ).not.toBeInTheDocument();
  });

  it('shows the DataTable when incidents are returned', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockResolvedValue(populatedPagedResult);

    // Act
    renderIncidentsView();

    // Assert
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    expect(screen.getByText('Spill in corridor B')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Spill in corridor B' }),
    ).toHaveAttribute('href', '/incidents/1');
    expect(
      screen.getByText('Water on floor near supplies'),
    ).toBeInTheDocument();
    expect(screen.getByText('Building 2, level 1')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
    expect(fetchIncidents).toHaveBeenCalledWith({
      severity: undefined,
      status: undefined,
      sortBy: 'reportedDate',
      sortDirection: 'desc',
      page: 1,
      pageSize: 25,
    });
    expect(screen.queryByText('Loading incidents…')).not.toBeInTheDocument();
    expect(screen.queryByText('No incidents found')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps DataTable mounted and announces refetch status when severity filter changes', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    expect(
      screen.getByRole('region', { name: 'Incidents list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Updating incidents…');
    expect(screen.queryByText('Loading incidents…')).not.toBeInTheDocument();
  });

  it('keeps DataTable mounted and shows inline error alert when refetch rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      );

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    expect(
      screen.getByRole('region', { name: 'Incidents list, scrollable' }),
    ).toBeInTheDocument();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.',
    );
    expect(alert).not.toHaveTextContent('Could not load incidents');
  });

  it('shows a Try again button inside the inline error alert while previous rows stay visible', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      );

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Incidents list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Spill in corridor B')).toBeInTheDocument();
  });

  it('refetches incidents and clears the inline error alert when Try again is clicked', async (): Promise<void> => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      )
      .mockResolvedValueOnce(refreshedPagedResult);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));
    const alert = await screen.findByRole('alert');
    const callCountBeforeRetry = vi.mocked(fetchIncidents).mock.calls.length;
    await user.click(within(alert).getByRole('button', { name: /try again/i }));

    // Assert
    await waitFor(() => {
      expect(vi.mocked(fetchIncidents).mock.calls.length).toBeGreaterThan(
        callCountBeforeRetry,
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Leak in corridor C')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Incidents list, scrollable' }),
    ).toBeInTheDocument();
  });

  it('shows inline error alert instead of EmptyState when refetch rejects after an empty page result', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(emptyPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      );

    // Act
    renderIncidentsView();
    await screen.findByText('No incidents found');
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.',
    );
    expect(screen.queryByText('No incidents found')).not.toBeInTheDocument();
  });

  it('clears inline error alert and keeps DataTable when refetch succeeds after a refetch error', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      )
      .mockResolvedValueOnce(populatedPagedResult);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(
      await screen.findByRole('option', { name: 'All severities' }),
    );

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('region', { name: 'Incidents list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Spill in corridor B')).toBeInTheDocument();
  });

  it('calls fetchIncidents with severity High and page 1 when severity filter is selected', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockResolvedValue(populatedPagedResult);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    await waitFor(() => {
      expect(fetchIncidents).toHaveBeenLastCalledWith({
        severity: 'High',
        status: undefined,
        sortBy: 'reportedDate',
        sortDirection: 'desc',
        page: 1,
        pageSize: 25,
      });
    });
  });

  it('renders Pagination when totalPages is greater than 1', async (): Promise<void> => {
    // Arrange
    const multiPageResult: PagedIncidentsResult = {
      items: [sampleIncident],
      page: 1,
      pageSize: 25,
      totalCount: 75,
      totalPages: 3,
    };
    vi.mocked(fetchIncidents).mockResolvedValue(multiPageResult);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });

    // Assert
    expect(
      screen.getByRole('navigation', { name: 'Pagination' }),
    ).toBeInTheDocument();
  });

  it('shows filtered empty message when severity filter is active and no incidents match', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockResolvedValueOnce(emptyPagedResult);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));

    // Assert
    expect(
      await screen.findByText(
        'Try adjusting your filters to see more results.',
      ),
    ).toBeInTheDocument();
  });

  it('shows error state with http error message when fetchIncidents rejects with ApiClientError', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockRejectedValue(
      new ApiClientError('Invalid sort field.', 'http', 400),
    );

    // Act
    renderIncidentsView();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load incidents');
    expect(alert).toHaveTextContent('Invalid sort field.');
  });
});
