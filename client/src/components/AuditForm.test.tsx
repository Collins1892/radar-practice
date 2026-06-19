import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudit, getAudit, updateAudit, type Audit } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { toast } from 'sonner';
import { clickCalendarDay } from '@/test/calendarHelpers';
import { AuditForm } from './AuditForm';
import {
  AUDIT_CREATE_SUBMIT_LABEL,
  AUDIT_CREATE_SUCCESS_MESSAGE,
  AUDIT_EDIT_HEADING,
  AUDIT_EDIT_SUCCESS_MESSAGE,
} from './auditPageCopy';

const navigateMock = vi.hoisted(() => vi.fn());

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
    createAudit: vi.fn(),
    getAudit: vi.fn(),
    updateAudit: vi.fn(),
  };
});

function renderAuditFormCreate(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/create']}>
      <AuditForm mode="create" />
    </MemoryRouter>,
  );
}

function renderAuditFormEdit(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/1/edit']}>
      <AuditForm mode="edit" auditId={1} />
    </MemoryRouter>,
  );
}

describe('AuditForm', () => {
  beforeEach((): void => {
    vi.mocked(createAudit).mockReset();
    vi.mocked(getAudit).mockReset();
    vi.mocked(updateAudit).mockReset();
    vi.mocked(toast.success).mockReset();
    navigateMock.mockReset();
  });

  async function fillValidAuditForm(): Promise<void> {
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: 'Hand hygiene compliance' },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: 'Quarterly ward review' },
    });
    clickCalendarDay(/^Audit date/, 2026, 5, 4);
    fireEvent.change(screen.getByLabelText(/^Created by/), {
      target: { value: 'Quality team' },
    });
  }

  it('shows loading state while fetching the audit', (): void => {
    // Arrange
    vi.mocked(getAudit).mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditFormEdit();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_EDIT_HEADING }),
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
    renderAuditFormEdit();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_EDIT_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('pre-populates fields with the fetched audit data', async (): Promise<void> => {
    // Arrange
    const audit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    vi.mocked(getAudit).mockResolvedValue(audit);

    // Act
    renderAuditFormEdit();
    await screen.findByDisplayValue('Hand hygiene compliance');

    // Assert
    expect(screen.getByLabelText(/^Title/)).toHaveValue(
      'Hand hygiene compliance',
    );
    expect(screen.getByLabelText(/^Description/)).toHaveValue(
      'Quarterly ward review',
    );
    expect(screen.getByLabelText(/^Created by/)).toHaveValue('Quality team');
  });

  it('calls updateAudit with correct data on submit', async (): Promise<void> => {
    // Arrange
    const audit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    const expectedAuditDate = format(
      parseISO(audit.auditDate.slice(0, 10)),
      'yyyy-MM-dd',
    );
    vi.mocked(getAudit).mockResolvedValue(audit);
    vi.mocked(updateAudit).mockResolvedValue(audit);

    // Act
    renderAuditFormEdit();
    await screen.findByDisplayValue('Hand hygiene compliance');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(updateAudit).toHaveBeenCalledTimes(1);
      expect(updateAudit).toHaveBeenCalledWith(1, {
        id: 1,
        title: 'Hand hygiene compliance',
        description: 'Quarterly ward review',
        auditDate: expectedAuditDate,
        status: 'Scheduled',
        createdBy: 'Quality team',
      });
    });
  });

  it('navigates to /audits after successful submit', async (): Promise<void> => {
    // Arrange
    const audit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    vi.mocked(getAudit).mockResolvedValue(audit);
    vi.mocked(updateAudit).mockResolvedValue(audit);

    // Act
    renderAuditFormEdit();
    await screen.findByDisplayValue('Hand hygiene compliance');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/audits');
      expect(toast.success).toHaveBeenCalledWith(AUDIT_EDIT_SUCCESS_MESSAGE);
    });
  });

  it('shows an inline error alert and does not navigate when updateAudit rejects with a network error', async (): Promise<void> => {
    // Arrange
    const audit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    vi.mocked(getAudit).mockResolvedValue(audit);
    vi.mocked(updateAudit).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderAuditFormEdit();
    await screen.findByDisplayValue('Hand hygiene compliance');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('moves focus to the first invalid field when submit validation fails', (): void => {
    // Arrange
    renderAuditFormCreate();

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    expect(screen.getByLabelText(/^Title/)).toHaveFocus();
  });

  it('calls createAudit on valid submit', async (): Promise<void> => {
    // Arrange
    const createdAudit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    vi.mocked(createAudit).mockResolvedValue(createdAudit);

    // Act
    renderAuditFormCreate();
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    await waitFor(() => {
      expect(createAudit).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(AUDIT_CREATE_SUCCESS_MESSAGE);
    });
  });

  it('disables all fields while createAudit is pending', async (): Promise<void> => {
    // Arrange
    vi.mocked(createAudit).mockImplementation(() => new Promise(() => {}));

    // Act
    renderAuditFormCreate();
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/^Title/)).toBeDisabled();
      expect(screen.getByLabelText(/^Description/)).toBeDisabled();
      expect(screen.getByLabelText(/^Audit date/)).toBeDisabled();
      expect(screen.getByLabelText(/^Status/)).toBeDisabled();
      expect(screen.getByLabelText(/^Created by/)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });
});
