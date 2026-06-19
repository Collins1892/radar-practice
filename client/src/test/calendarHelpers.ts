import { fireEvent, screen } from '@testing-library/react';

// Forward-only: navigates via "next month" and cannot reach dates before the calendar's initial month.
export function clickCalendarDay(
  dateFieldLabel: RegExp | string,
  year: number,
  month: number,
  day: number,
): void {
  if (!document.querySelector('[data-slot="calendar"]')) {
    fireEvent.click(screen.getByLabelText(dateFieldLabel));
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
