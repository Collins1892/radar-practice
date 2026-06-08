import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { componentRegistry } from '../componentRegistry';
import { Toaster } from '@/components/ui/sonner';

const SUCCESS_MESSAGE = 'Incident saved successfully.';
const ERROR_MESSAGE = 'Could not save incident. Please try again.';

function getToastPreview(): ReactElement {
  const toastEntry = componentRegistry.find((entry) => entry.name === 'Toast');
  if (!toastEntry) {
    throw new Error('Toast registry entry not found');
  }
  return toastEntry.preview;
}

function renderToastPreview(): ReturnType<typeof render> {
  return render(
    <>
      <Toaster position="bottom-right" duration={3000} closeButton />
      {getToastPreview()}
    </>,
  );
}

function getLiveRegionForMessage(message: string): HTMLElement {
  const messageEl = screen.getByText(message);
  const liveRegion = messageEl.closest('[aria-live]');
  if (!(liveRegion instanceof HTMLElement)) {
    throw new Error('Live region not found');
  }
  return liveRegion;
}

describe('ToastPreview', () => {
  beforeEach((): void => {
    vi.useFakeTimers();
  });

  afterEach((): void => {
    toast.dismiss();
    vi.useRealTimers();
  });

  it('shows a success toast that auto-dismisses after 3 seconds', async (): Promise<void> => {
    // Arrange
    renderToastPreview();

    // Act
    await act(async (): Promise<void> => {
      fireEvent.click(screen.getByRole('button', { name: 'Success' }));
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — toast visible with success message
    expect(screen.getByText(SUCCESS_MESSAGE)).toBeInTheDocument();

    // Act — advance auto-dismiss duration (Sonner schedules unmount 200ms after)
    await act(async (): Promise<void> => {
      vi.advanceTimersByTime(3000);
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — toast removed from the DOM after auto-dismiss
    expect(screen.queryByText(SUCCESS_MESSAGE)).not.toBeInTheDocument();
  });

  it('dismisses an error toast when the close button is clicked', async (): Promise<void> => {
    // Arrange
    renderToastPreview();

    // Act — show error toast
    await act(async (): Promise<void> => {
      fireEvent.click(screen.getByRole('button', { name: 'Error' }));
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — error toast visible
    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument();

    // Act — manual dismiss via close button
    await act(async (): Promise<void> => {
      fireEvent.click(screen.getByRole('button', { name: 'Close toast' }));
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — toast removed before auto-dismiss
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it('exposes success toasts in an aria-live polite region', async (): Promise<void> => {
    // Arrange
    renderToastPreview();

    // Act
    await act(async (): Promise<void> => {
      fireEvent.click(screen.getByRole('button', { name: 'Success' }));
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — Sonner announces via the outer section live region
    expect(getLiveRegionForMessage(SUCCESS_MESSAGE)).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('exposes error toasts in the notifications live region', async (): Promise<void> => {
    // Arrange
    renderToastPreview();

    // Act
    await act(async (): Promise<void> => {
      fireEvent.click(screen.getByRole('button', { name: 'Error' }));
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert — Sonner uses aria-live="polite" on the section (not assertive or role="alert")
    expect(getLiveRegionForMessage(ERROR_MESSAGE)).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });
});
