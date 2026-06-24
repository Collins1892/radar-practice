import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAudit, getAudit, type Audit } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { AUDIT_DETAIL_HEADING } from '@/components/auditPageCopy';
import { toast } from 'sonner';
import { AuditDetailView } from './AuditDetailView';

const navigateMock = vi.hoisted(() => vi.fn());

const AUDITS_NETWORK_MESSAGE =
  'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.';

const AUDIT_DELETE_SUCCESS_MESSAGE = 'Audit deleted successfully.';

const audit: Audit = {
  id: 1,
  title: 'Hand hygiene compliance',
  description: 'Quarterly ward review',
  auditDate: '2026-06-04T00:00:00.000Z',
  status: 'Scheduled',
  createdBy: 'Quality team',
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

vi.mock('@/api/audits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/audits')>();
  return {
    ...actual,
    getAudit: vi.fn(),
    deleteAudit: vi.fn(),
  };
});

function renderAuditDetailView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/1']}>
      <Routes>
        <Route path="/audits/:id" element={<AuditDetailView />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderAuditDetailViewWithInvalidId(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/abc']}>
      <Routes>
        <Route path="/audits/:id" element={<AuditDetailView />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function renderLoadedAuditDetailView(): Promise<void> {
  vi.mocked(getAudit).mockResolvedValue(audit);
  renderAuditDetailView();
  await screen.findByRole('heading', { name: audit.title });
}

describe('AuditDetailView', () => {
  beforeEach((): void => {
    vi.mocked(getAudit).mockReset();
    vi.mocked(deleteAudit).mockReset();
    vi.mocked(toast.success).mockReset();
    navigateMock.mockReset();
  });

  it('shows the audit data when getAudit resolves successfully', async (): Promise<void> => {
    // Arrange
    const formattedAuditDate = format(
      parseISO(audit.auditDate.slice(0, 10)),
      'dd MMM yyyy',
    );
    vi.mocked(getAudit).mockResolvedValue(audit);

    // Act
    renderAuditDetailView();
    await screen.findByRole('heading', { name: 'Hand hygiene compliance' });

    // Assert
    expect(
      screen.getByRole('heading', { name: 'Hand hygiene compliance' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText(formattedAuditDate)).toBeInTheDocument();
    expect(screen.getByText('Quality team')).toBeInTheDocument();
  });

  it('shows loading state while fetching the audit', (): void => {
    // Arrange
    vi.mocked(getAudit).mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_DETAIL_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when getAudit rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(getAudit).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderAuditDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_DETAIL_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows chrome and error state when getAudit resolves with null', async (): Promise<void> => {
    // Arrange
    vi.mocked(getAudit).mockResolvedValue(null as unknown as Audit);

    // Act
    renderAuditDetailView();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_DETAIL_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows error state when the id param is not a valid number', (): void => {
    // Arrange — invalid id via renderAuditDetailViewWithInvalidId

    // Act
    renderAuditDetailViewWithInvalidId();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_DETAIL_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(getAudit).not.toHaveBeenCalled();
  });

  it('shows a Delete audit button when the audit is loaded', async (): Promise<void> => {
    // Arrange
    await renderLoadedAuditDetailView();

    // Act — (loaded view rendered in Arrange)

    // Assert
    expect(
      screen.getByRole('button', { name: 'Delete audit' }),
    ).toBeInTheDocument();
  });

  it('opens the confirmation dialog when Delete audit is clicked', async (): Promise<void> => {
    // Arrange
    await renderLoadedAuditDetailView();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Delete audit' }));

    // Assert
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete audit?')).toBeVisible();
  });

  it('closes the dialog without calling deleteAudit when Cancel is clicked', async (): Promise<void> => {
    // Arrange
    await renderLoadedAuditDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete audit' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteAudit).not.toHaveBeenCalled();
  });

  it('calls deleteAudit and navigates to the audits list on confirm success', async (): Promise<void> => {
    // Arrange
    vi.mocked(deleteAudit).mockResolvedValue(undefined);
    await renderLoadedAuditDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete audit' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    // Assert
    await waitFor(() => {
      expect(deleteAudit).toHaveBeenCalledTimes(1);
      expect(deleteAudit).toHaveBeenCalledWith(1);
      expect(navigateMock).toHaveBeenCalledWith('/audits');
      expect(toast.success).toHaveBeenCalledWith(AUDIT_DELETE_SUCCESS_MESSAGE);
    });
  });

  it('shows an inline error alert when deleteAudit rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(deleteAudit).mockRejectedValue(
      new ApiClientError('Network request failed', 'network'),
    );
    await renderLoadedAuditDetailView();
    fireEvent.click(screen.getByRole('button', { name: 'Delete audit' }));
    await screen.findByRole('dialog');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        AUDITS_NETWORK_MESSAGE,
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
