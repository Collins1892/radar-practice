import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchIncidents } from '@/api/incidents';
import type { Incident, PagedIncidentsResult } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { IncidentsView } from './IncidentsView';

vi.mock('@/api/incidents', () => ({
  fetchIncidents: vi.fn(),
}));

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

const populatedPagedResult: PagedIncidentsResult = {
  items: [sampleIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function renderIncidentsView(): ReturnType<typeof render> {
  return render(<IncidentsView />);
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
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
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
      screen.queryByRole('region', { name: 'Data table' }),
    ).not.toBeInTheDocument();
  });

  it('shows the DataTable when incidents are returned', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockResolvedValue(populatedPagedResult);

    // Act
    renderIncidentsView();

    // Assert
    await screen.findByRole('region', { name: 'Data table' });
    expect(screen.getByText('Spill in corridor B')).toBeInTheDocument();
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
});
