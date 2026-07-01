import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAudits } from '@/api/audits';
import type { Audit, PagedAuditsResult } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { AuditsView } from './AuditsView';

vi.mock('@/api/audits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/audits')>();
  return {
    ...actual,
    fetchAudits: vi.fn(),
  };
});

const emptyPagedResult: PagedAuditsResult = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
};

const sampleAudit: Audit = {
  id: 1,
  title: 'Hand hygiene compliance',
  description: 'Quarterly ward review',
  auditDate: '2026-01-15T00:00:00.000Z',
  status: 'Scheduled',
  createdBy: 'Quality team',
};

const populatedPagedResult: PagedAuditsResult = {
  items: [sampleAudit],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function renderAuditsView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits']}>
      <AuditsView />
    </MemoryRouter>,
  );
}

describe('AuditsView', () => {
  beforeEach((): void => {
    vi.mocked(fetchAudits).mockReset();
  });

  it('shows loading state while audits are being fetched', (): void => {
    // Arrange
    vi.mocked(fetchAudits).mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditsView();

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading audits…')).toBeInTheDocument();
  });

  it('shows error state when fetchAudits rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits).mockRejectedValue(
      new ApiClientError('Network request failed', 'network'),
    );

    // Act
    renderAuditsView();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load audits');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when fetchAudits returns zero items', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits).mockResolvedValue(emptyPagedResult);

    // Act
    renderAuditsView();

    // Assert
    await screen.findByText('No audits found');
    expect(
      screen.getByText('No audits have been created yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Audits list, scrollable' }),
    ).not.toBeInTheDocument();
  });

  it('shows the DataTable when audits are returned', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits).mockResolvedValue(populatedPagedResult);

    // Act
    renderAuditsView();

    // Assert
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    expect(screen.getByText('Hand hygiene compliance')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Hand hygiene compliance' }),
    ).toHaveAttribute('href', '/audits/1');
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Quality team')).toBeInTheDocument();
    expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
    expect(fetchAudits).toHaveBeenCalledWith({
      status: undefined,
      sortBy: 'auditDate',
      sortDirection: 'desc',
      page: 1,
      pageSize: 25,
    });
    expect(screen.queryByText('Loading audits…')).not.toBeInTheDocument();
    expect(screen.queryByText('No audits found')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps DataTable mounted and announces refetch status when status filter changes', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));

    // Assert
    expect(
      screen.getByRole('region', { name: 'Audits list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Updating audits…');
    expect(screen.queryByText('Loading audits…')).not.toBeInTheDocument();
  });

  it('keeps DataTable mounted and shows inline error alert when refetch rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      );

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));

    // Assert
    expect(
      screen.getByRole('region', { name: 'Audits list, scrollable' }),
    ).toBeInTheDocument();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.',
    );
    expect(alert).not.toHaveTextContent('Could not load audits');
  });

  it('shows inline error alert instead of EmptyState when refetch rejects after an empty page result', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(emptyPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      );

    // Act
    renderAuditsView();
    await screen.findByText('No audits found');
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.',
    );
    expect(screen.queryByText('No audits found')).not.toBeInTheDocument();
  });

  it('clears inline error alert and keeps DataTable when refetch succeeds after a refetch error', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockRejectedValueOnce(
        new ApiClientError('Network request failed', 'network'),
      )
      .mockResolvedValueOnce(populatedPagedResult);

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(
      await screen.findByRole('option', { name: 'All statuses' }),
    );

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('region', { name: 'Audits list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Hand hygiene compliance')).toBeInTheDocument();
  });

  it('calls fetchAudits with status Completed and page 1 when status filter is selected', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockResolvedValue(populatedPagedResult);

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));

    // Assert
    await waitFor(() => {
      expect(fetchAudits).toHaveBeenLastCalledWith({
        status: 'Completed',
        sortBy: 'auditDate',
        sortDirection: 'desc',
        page: 1,
        pageSize: 25,
      });
    });
  });

  it('renders Pagination when totalPages is greater than 1', async (): Promise<void> => {
    // Arrange
    const multiPageResult: PagedAuditsResult = {
      items: [sampleAudit],
      page: 1,
      pageSize: 25,
      totalCount: 75,
      totalPages: 3,
    };
    vi.mocked(fetchAudits).mockResolvedValue(multiPageResult);

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });

    // Assert
    expect(
      screen.getByRole('navigation', { name: 'Pagination' }),
    ).toBeInTheDocument();
  });

  it('shows filtered empty message when status filter is active and no audits match', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockResolvedValueOnce(emptyPagedResult);

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    fireEvent.click(screen.getByLabelText('Status'));
    fireEvent.click(await screen.findByRole('option', { name: 'Completed' }));

    // Assert
    expect(
      await screen.findByText(
        'Try adjusting your filters to see more results.',
      ),
    ).toBeInTheDocument();
  });

  it('shows error state with http error message when fetchAudits rejects with ApiClientError', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits).mockRejectedValue(
      new ApiClientError('Invalid sort field.', 'http', 400),
    );

    // Act
    renderAuditsView();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load audits');
    expect(alert).toHaveTextContent('Invalid sort field.');
  });

  it('keeps table region mounted and shows refetch overlay when a sort column header is clicked', async (): Promise<void> => {
    // Arrange
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(populatedPagedResult)
      .mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    const sortButton = screen.getByRole('button', { name: /audit date/i });
    fireEvent.click(sortButton);

    // Assert
    expect(
      screen.getByRole('region', { name: 'Audits list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Updating audits…');
    expect(screen.queryByText('Loading audits…')).not.toBeInTheDocument();
  });

  it('keeps table region mounted and shows refetch overlay when a pagination button is clicked', async (): Promise<void> => {
    // Arrange
    const multiPageResult: PagedAuditsResult = {
      items: [sampleAudit],
      page: 1,
      pageSize: 25,
      totalCount: 75,
      totalPages: 3,
    };
    vi.mocked(fetchAudits)
      .mockResolvedValueOnce(multiPageResult)
      .mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditsView();
    await screen.findByRole('region', { name: 'Audits list, scrollable' });
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Assert
    expect(
      screen.getByRole('region', { name: 'Audits list, scrollable' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Updating audits…');
    expect(screen.queryByText('Loading audits…')).not.toBeInTheDocument();
  });
});
