import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudit } from '@/api/audits';
import type { Audit } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { AUDIT_CREATE_SUBMIT_LABEL } from '@/components/auditPageCopy';
import { fillValidAuditForm } from '@/test/auditFormTestUtils';
import { AuditCreateView } from './AuditCreateView';

const navigateMock = vi.hoisted(() => vi.fn());

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
  };
});

function renderAuditCreateView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/create']}>
      <AuditCreateView />
    </MemoryRouter>,
  );
}

describe('AuditCreateView', () => {
  beforeEach((): void => {
    vi.mocked(createAudit).mockReset();
    navigateMock.mockReset();
  });

  it('renders all form fields on the create form', (): void => {
    // Arrange — defaults via renderAuditCreateView

    // Act
    renderAuditCreateView();

    // Assert
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Audit date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    ).toBeInTheDocument();
  });

  it('shows validation errors for required fields when submitting empty', (): void => {
    // Arrange
    renderAuditCreateView();

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Created by is required.')).toBeInTheDocument();
    expect(createAudit).not.toHaveBeenCalled();
  });

  it('shows title length validation error when title exceeds 200 characters', (): void => {
    // Arrange
    const longTitle = 'x'.repeat(201);
    renderAuditCreateView();

    // Act
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: longTitle },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    expect(
      screen.getByText('Title must not exceed 200 characters.'),
    ).toBeInTheDocument();
    expect(createAudit).not.toHaveBeenCalled();
  });

  it('calls createAudit with correct data when submitting a valid form', async (): Promise<void> => {
    // Arrange
    const auditDateLocal = new Date(2026, 5, 4);
    const expectedAuditDate = format(auditDateLocal, 'yyyy-MM-dd');
    const createdAudit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: `${expectedAuditDate}T00:00:00.000Z`,
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
    vi.mocked(createAudit).mockResolvedValue(createdAudit);
    renderAuditCreateView();

    // Act
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    await waitFor(() => {
      expect(createAudit).toHaveBeenCalledWith({
        title: 'Hand hygiene compliance',
        description: 'Quarterly ward review',
        auditDate: expectedAuditDate,
        status: 'Scheduled',
        createdBy: 'Quality team',
      });
    });
  });

  it('navigates to /audits after successful form submission', async (): Promise<void> => {
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
    renderAuditCreateView();

    // Act
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/audits');
    });
  });

  it('shows network error alert and preserves form values when createAudit rejects', async (): Promise<void> => {
    // Arrange
    const networkMessage =
      'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.';
    vi.mocked(createAudit).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );
    renderAuditCreateView();

    // Act
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(networkMessage);
    expect(screen.getByLabelText(/^Title/)).toHaveValue(
      'Hand hygiene compliance',
    );
    expect(createAudit).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows server error message when createAudit rejects with http error', async (): Promise<void> => {
    // Arrange
    const errorMessage = 'Title must not exceed 200 characters.';
    vi.mocked(createAudit).mockRejectedValue(
      new ApiClientError(errorMessage, 'http', 400),
    );
    renderAuditCreateView();

    // Act
    await fillValidAuditForm();
    fireEvent.click(
      screen.getByRole('button', { name: AUDIT_CREATE_SUBMIT_LABEL }),
    );

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(screen.getByLabelText(/^Title/)).toHaveValue(
      'Hand hygiene compliance',
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
