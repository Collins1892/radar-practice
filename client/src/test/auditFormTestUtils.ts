import { fireEvent, screen } from '@testing-library/react';
import { clickCalendarDay } from '@/test/calendarHelpers';

export async function fillValidAuditForm(): Promise<void> {
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
