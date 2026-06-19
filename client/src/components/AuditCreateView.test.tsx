import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudit } from '@/api/audits';
import type { Audit } from '@/api/audits';
import { ApiClientError } from '@/errors';
import { AUDIT_CREATE_HEADING } from '@/components/auditPageCopy';
import { AuditCreateView } from './AuditCreateView';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function clickCalendarDay(year: number, month: number, day: number): void {
  if (!document.querySelector('[data-slot="calendar"]')) {
    fireEvent.click(screen.getByLabelText(/^Audit date/));
  }

  const monthName = new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
  });

  for (let i = 0; i < 24; i++) {
    const caption = document.querySelector(
      '[data-slot="calendar"] .rdp-month_caption',
    );
    const captionText = caption?.textContent ?? '';
    if (captionText.includes(monthName) && captionText.includes(String(year))) {
      break;
    }
    const nextBtn = document.querySelector(
      '[data-slot="calendar"] .rdp-button_next',
    );
    if (!(nextBtn instanceof HTMLButtonElement)) {
      throw new Error('Calendar next month button not found');
    }
    fireEvent.click(nextBtn);
  }

  const buttons = document.querySelectorAll(
    '[data-slot="calendar"] button[data-day]',
  );
  for (const btn of buttons) {
    if (!(btn instanceof HTMLButtonElement)) continue;
    if (btn.textContent?.trim() !== String(day)) continue;
    if (
      btn.hasAttribute('disabled') ||
      btn.getAttribute('aria-disabled') === 'true'
    ) {
      continue;
    }
    if (btn.getAttribute('data-outside') === 'true') continue;
    fireEvent.click(btn);
    return;
  }

  throw new Error(`Could not select ${day}/${month + 1}/${year} in calendar`);
}

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

  async function fillValidAuditForm(): Promise<void> {
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: 'Hand hygiene compliance' },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: 'Quarterly ward review' },
    });
    clickCalendarDay(2026, 5, 4);
    fireEvent.change(screen.getByLabelText(/^Created by/), {
      target: { value: 'Quality team' },
    });
  }

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
      screen.getByRole('button', { name: AUDIT_CREATE_HEADING }),
    ).toBeInTheDocument();
  });

  it('shows validation errors for required fields when submitting empty', (): void => {
    // Arrange
    renderAuditCreateView();

    // Act
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

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
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

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
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

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
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

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
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

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
    fireEvent.click(screen.getByRole('button', { name: AUDIT_CREATE_HEADING }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(screen.getByLabelText(/^Title/)).toHaveValue(
      'Hand hygiene compliance',
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
