import { render, screen } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAudit, type Audit } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { AUDIT_DETAIL_HEADING } from '@/components/auditPageCopy';
import { AuditDetailView } from './AuditDetailView';

vi.mock('@/api/audits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/audits')>();
  return {
    ...actual,
    getAudit: vi.fn(),
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

describe('AuditDetailView', () => {
  beforeEach((): void => {
    vi.mocked(getAudit).mockReset();
  });

  it('shows the audit data when getAudit resolves successfully', async (): Promise<void> => {
    // Arrange
    const audit: Audit = {
      id: 1,
      title: 'Hand hygiene compliance',
      description: 'Quarterly ward review',
      auditDate: '2026-06-04T00:00:00.000Z',
      status: 'Scheduled',
      createdBy: 'Quality team',
    };
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
});
