import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIncident,
  getIncident,
  updateIncident,
  type Incident,
} from '@/api/incidents';
import { ApiClientError } from '@/errors';
import { toast } from 'sonner';
import {
  INCIDENT_CREATE_SUCCESS_MESSAGE,
  INCIDENT_EDIT_HEADING,
  INCIDENT_EDIT_SUCCESS_MESSAGE,
  IncidentForm,
} from './IncidentForm';

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

vi.mock('@/api/incidents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/incidents')>();
  return {
    ...actual,
    createIncident: vi.fn(),
    getIncident: vi.fn(),
    updateIncident: vi.fn(),
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

function renderIncidentFormCreate(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/create']}>
      <IncidentForm mode="create" />
    </MemoryRouter>,
  );
}

function renderIncidentFormEdit(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/1/edit']}>
      <IncidentForm mode="edit" incidentId={1} />
    </MemoryRouter>,
  );
}

describe('IncidentForm', () => {
  beforeEach((): void => {
    vi.mocked(createIncident).mockReset();
    vi.mocked(getIncident).mockReset();
    vi.mocked(updateIncident).mockReset();
    vi.mocked(toast.success).mockReset();
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

  it('shows loading state while fetching the incident', (): void => {
    // Arrange
    vi.mocked(getIncident).mockImplementation(() => new Promise(() => {}));

    // Act
    renderIncidentFormEdit();

    // Assert
    expect(
      screen.getByRole('heading', { name: INCIDENT_EDIT_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when getIncident rejects', async (): Promise<void> => {
    // Arrange
    vi.mocked(getIncident).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderIncidentFormEdit();

    // Assert
    expect(
      screen.getByRole('heading', { name: INCIDENT_EDIT_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to incidents' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('pre-populates fields with the fetched incident data', async (): Promise<void> => {
    // Arrange
    const incident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2',
      severity: 'High',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    vi.mocked(getIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');

    // Assert
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Spill in corridor B');
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Water on floor');
    expect(screen.getByLabelText(/^Location/)).toHaveValue('Building 2');
  });

  it('calls updateIncident with correct data on submit', async (): Promise<void> => {
    // Arrange
    const incident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2',
      severity: 'High',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    const expectedReportedDate = format(
      parseISO(incident.reportedDate.slice(0, 10)),
      'yyyy-MM-dd',
    );
    vi.mocked(getIncident).mockResolvedValue(incident);
    vi.mocked(updateIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(updateIncident).toHaveBeenCalledTimes(1);
      expect(updateIncident).toHaveBeenCalledWith(1, {
        title: 'Spill in corridor B',
        description: 'Water on floor',
        location: 'Building 2',
        severity: 'High',
        status: 'Open',
        reportedDate: expectedReportedDate,
      });
    });
  });

  it('navigates to /incidents after successful submit', async (): Promise<void> => {
    // Arrange
    const incident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2',
      severity: 'High',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    vi.mocked(getIncident).mockResolvedValue(incident);
    vi.mocked(updateIncident).mockResolvedValue(incident);

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/incidents');
      expect(toast.success).toHaveBeenCalledWith(INCIDENT_EDIT_SUCCESS_MESSAGE);
    });
  });

  it('shows an inline error alert and does not navigate when updateIncident rejects with a network error', async (): Promise<void> => {
    // Arrange
    const incident: Incident = {
      id: 1,
      title: 'Spill in corridor B',
      description: 'Water on floor',
      location: 'Building 2',
      severity: 'High',
      status: 'Open',
      reportedDate: '2026-06-04T00:00:00.000Z',
    };
    vi.mocked(getIncident).mockResolvedValue(incident);
    vi.mocked(updateIncident).mockRejectedValue(
      new ApiClientError('Network error', 'network'),
    );

    // Act
    renderIncidentFormEdit();
    await screen.findByDisplayValue('Spill in corridor B');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('moves focus to the first invalid field when submit validation fails', (): void => {
    // Arrange
    renderIncidentFormCreate();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    expect(screen.getByLabelText(/^Title/)).toHaveFocus();
  });

  it('calls createIncident on valid submit', async (): Promise<void> => {
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

    // Act
    renderIncidentFormCreate();
    await fillValidIncidentForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create incident' }));

    // Assert
    await waitFor(() => {
      expect(createIncident).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        INCIDENT_CREATE_SUCCESS_MESSAGE,
      );
    });
  });
});
