import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIncident } from '@/api/incidents';
import type { Incident } from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { IncidentCreateView } from './IncidentCreateView';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Note: this helper uses react-day-picker v10 internal class names
// (.rdp-button_next, [data-day]). These are version-specific and
// will need updating if react-day-picker is upgraded. See CLAUDE.md
// version discipline.
function clickCalendarDay(year: number, month: number, day: number): void {
  if (!document.querySelector('[data-slot="calendar"]')) {
    fireEvent.click(screen.getByLabelText(/^Reported date/));
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

vi.mock('@/api/incidents', () => ({
  createIncident: vi.fn(),
}));

function renderIncidentCreateView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/create']}>
      <IncidentCreateView />
    </MemoryRouter>,
  );
}

describe('IncidentCreateView', () => {
  beforeEach((): void => {
    vi.mocked(createIncident).mockReset();
    navigateMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  async function fillValidIncidentForm(): Promise<void> {
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: 'Spill in corridor B' },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: 'Water on floor' },
    });
    fireEvent.change(screen.getByLabelText(/^Location/), {
      target: { value: 'Building 2, level 1' },
    });
    fireEvent.click(screen.getByLabelText(/^Severity/));
    fireEvent.click(await screen.findByRole('option', { name: 'Medium' }));
    fireEvent.click(screen.getByLabelText(/^Status/));
    fireEvent.click(await screen.findByRole('option', { name: 'Open' }));
    clickCalendarDay(2026, 5, 4);
  }

  it('renders all form fields on the create form', (): void => {
    // Arrange — defaults via renderIncidentCreateView

    // Act
    renderIncidentCreateView();

    // Assert — label text (required * is aria-hidden, so use getByText not exact getByLabelText)
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Reported date')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create incident' }),
    ).toBeInTheDocument();
  });

  it('shows validation errors for each required field when submitting empty', (): void => {
    // Arrange
    renderIncidentCreateView();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Invalid severity value.')).toBeInTheDocument();
    expect(screen.getByText('Invalid status value.')).toBeInTheDocument();
    expect(screen.getByText('Reported date is required.')).toBeInTheDocument();
    expect(createIncident).not.toHaveBeenCalled();
  });

  it('shows title length validation error when title exceeds 50 characters', (): void => {
    // Arrange
    const longTitle = 'x'.repeat(51);
    renderIncidentCreateView();

    // Act
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: longTitle },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    expect(
      screen.getByText('Title must be 50 characters or fewer.'),
    ).toBeInTheDocument();
    expect(createIncident).not.toHaveBeenCalled();
  });

  it('calls createIncident with correct data when submitting a valid form', async (): Promise<void> => {
    // Arrange
    const reportedDateLocal = new Date(2026, 5, 4);
    const expectedReportedDate = format(reportedDateLocal, 'yyyy-MM-dd');
    const createdIncident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2, level 1',
      severity: 'Medium',
      status: 'Open',
      reportedDate: `${expectedReportedDate}T00:00:00.000Z`,
    };
    vi.mocked(createIncident).mockResolvedValue(createdIncident);
    renderIncidentCreateView();

    // Act
    await fillValidIncidentForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    await waitFor(() => {
      expect(createIncident).toHaveBeenCalledWith({
        title: 'Spill in corridor B',
        description: 'Water on floor',
        location: 'Building 2, level 1',
        severity: 'Medium',
        status: 'Open',
        reportedDate: expectedReportedDate,
      });
    });
  });

  it('navigates to /incidents after successful form submission', async (): Promise<void> => {
    // Arrange
    const createdIncident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2, level 1',
      severity: 'Medium',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    vi.mocked(createIncident).mockResolvedValue(createdIncident);
    renderIncidentCreateView();

    // Act
    await fillValidIncidentForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/incidents');
    });
  });

  it('shows network error alert and preserves form values when createIncident rejects', async (): Promise<void> => {
    // Arrange
    const networkMessage =
      'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';
    vi.mocked(createIncident).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );
    renderIncidentCreateView();

    // Act
    await fillValidIncidentForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(networkMessage);
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Spill in corridor B');
    expect(createIncident).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows server error message when createIncident rejects with http error', async (): Promise<void> => {
    // Arrange
    const errorMessage = 'Title must be 50 characters or fewer.';
    vi.mocked(createIncident).mockRejectedValue(
      new ApiClientError(errorMessage, 'http', 400),
    );
    renderIncidentCreateView();

    // Act
    await fillValidIncidentForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Spill in corridor B');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows future reported date validation error when tomorrow is selected', async (): Promise<void> => {
    // Arrange
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    renderIncidentCreateView();

    // Act
    fireEvent.change(screen.getByLabelText(/^Title/), {
      target: { value: 'Spill in corridor B' },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: 'Water on floor' },
    });
    fireEvent.change(screen.getByLabelText(/^Location/), {
      target: { value: 'Building 2, level 1' },
    });
    fireEvent.click(screen.getByLabelText(/^Severity/));
    fireEvent.click(await screen.findByRole('option', { name: 'Medium' }));
    fireEvent.click(screen.getByLabelText(/^Status/));
    fireEvent.click(await screen.findByRole('option', { name: 'Open' }));
    clickCalendarDay(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    expect(
      screen.getByText('Reported date must not be in the future.'),
    ).toBeInTheDocument();
    expect(createIncident).not.toHaveBeenCalled();
  });
});
