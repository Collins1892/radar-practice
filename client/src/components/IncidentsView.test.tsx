import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const populatedPagedResult: PagedIncidentsResult = {
  items: [sampleIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

const staleIncident: Incident = {
  id: 2,
  title: 'Stale incident',
  description: 'Result of an outdated request',
  location: 'Building 3, level 2',
  severity: 'High',
  status: 'Open',
  reportedDate: '2026-02-01T00:00:00.000Z',
};

const stalePagedResult: PagedIncidentsResult = {
  items: [staleIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

const latestIncident: Incident = {
  id: 3,
  title: 'Latest incident',
  description: 'Result of the most recent request',
  location: 'Building 4, level 3',
  severity: 'Medium',
  status: 'Open',
  reportedDate: '2026-02-02T00:00:00.000Z',
};

const latestPagedResult: PagedIncidentsResult = {
  items: [latestIncident],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function getRequestSignal(callIndex: number): AbortSignal {
  const args = vi.mocked(fetchIncidents).mock.calls[callIndex] as
    | unknown[]
    | undefined;
  if (args === undefined) {
    throw new Error(`fetchIncidents was not called ${callIndex + 1} time(s)`);
  }
  for (const arg of args) {
    if (arg instanceof AbortSignal) {
      return arg;
    }
    if (typeof arg === 'object' && arg !== null && 'signal' in arg) {
      const { signal } = arg as { signal: unknown };
      if (signal instanceof AbortSignal) {
        return signal;
      }
    }
  }
  throw new Error('fetchIncidents was not called with an AbortSignal');
}

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
    expect(vi.mocked(fetchIncidents).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        severity: undefined,
        status: undefined,
        sortBy: 'reportedDate',
        sortDirection: 'desc',
        page: 1,
        pageSize: 25,
      }),
    );
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
      expect(vi.mocked(fetchIncidents).mock.lastCall?.[0]).toEqual(
        expect.objectContaining({
          severity: 'High',
          status: undefined,
          sortBy: 'reportedDate',
          sortDirection: 'desc',
          page: 1,
          pageSize: 25,
        }),
      );
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

  it('shows the latest result and never renders a stale earlier response', async (): Promise<void> => {
    // Arrange
    const staleRequest = createDeferred<PagedIncidentsResult>();
    const latestRequest = createDeferred<PagedIncidentsResult>();
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(latestRequest.promise);

    // Act
    renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));
    await waitFor(() => {
      expect(fetchIncidents).toHaveBeenCalledTimes(2);
    });
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(
      await screen.findByRole('option', { name: 'All severities' }),
    );
    await waitFor(() => {
      expect(fetchIncidents).toHaveBeenCalledTimes(3);
    });
    await act(async () => {
      latestRequest.resolve(latestPagedResult);
      await latestRequest.promise;
    });
    await screen.findByText('Latest incident');
    await act(async () => {
      staleRequest.resolve(stalePagedResult);
      await staleRequest.promise;
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Latest incident')).toBeInTheDocument();
    });
    expect(screen.queryByText('Stale incident')).not.toBeInTheDocument();
  });

  it('aborts the in-flight request signal when the query changes and when the component unmounts', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockImplementation(() => new Promise(() => {}));

    // Act
    const { unmount } = renderIncidentsView();
    await screen.findByRole('region', { name: 'Incidents list, scrollable' });
    const firstSignal = getRequestSignal(0);
    fireEvent.click(screen.getByLabelText('Severity'));
    fireEvent.click(await screen.findByRole('option', { name: 'High' }));
    await waitFor(() => {
      expect(fetchIncidents).toHaveBeenCalledTimes(2);
    });

    // Assert
    expect(firstSignal).toBeInstanceOf(AbortSignal);
    await waitFor(() => {
      expect(firstSignal.aborted).toBe(true);
    });
    const secondSignal = getRequestSignal(1);
    expect(secondSignal).toBeInstanceOf(AbortSignal);
    expect(secondSignal.aborted).toBe(false);
    unmount();
    await waitFor(() => {
      expect(secondSignal.aborted).toBe(true);
    });
  });

  it('does not render an error state when the request is aborted', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchIncidents).mockRejectedValue(
      new DOMException('Aborted', 'AbortError'),
    );

    // Act
    renderIncidentsView();
    await waitFor(() => {
      expect(fetchIncidents).toHaveBeenCalledTimes(1);
    });

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(
      screen.queryByText('Could not load incidents'),
    ).not.toBeInTheDocument();
  });
});
