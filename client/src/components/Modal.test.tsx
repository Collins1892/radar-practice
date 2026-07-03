import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  function renderModal(
    overrides: Partial<ComponentProps<typeof Modal>> = {},
  ): ReturnType<typeof render> {
    const { children: overrideChildren, trigger, title, ...rest } = overrides;

    return render(
      <Modal
        trigger={trigger ?? <button>Open modal</button>}
        title={title ?? 'Test title'}
        {...rest}
      >
        {overrideChildren ?? <p>Modal body content</p>}
      </Modal>,
    );
  }

  it('renders trigger button', (): void => {
    // Arrange

    // Act
    renderModal();

    // Assert
    expect(
      screen.getByRole('button', { name: 'Open modal' }),
    ).toBeInTheDocument();
  });

  it('opens on trigger click', async (): Promise<void> => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    // Assert
    expect(await screen.findByText('Test title')).toBeVisible();
  });

  it('displays title and body content', async (): Promise<void> => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    // Assert
    expect(await screen.findByText('Test title')).toBeVisible();
    expect(screen.getByText('Modal body content')).toBeVisible();
  });

  it('closes on close button click', async (): Promise<void> => {
    // Arrange
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('closes on ESC key', async (): Promise<void> => {
    // Arrange
    const user = userEvent.setup();
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async (): Promise<void> => {
    // Arrange
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    // Radix overlay is portaled and has no ARIA role, so a DOM-level selector is unavoidable.
    const overlay = document.querySelector(
      'div[data-state="open"]:not([role="dialog"])',
    );
    if (overlay === null) {
      throw new Error('Expected dialog overlay to be present');
    }
    // Radix Dialog 1.1.17+ defers outside dismiss until click (deferPointerDownOutside).
    await user.click(overlay);

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('omits aria-describedby when no description is provided', async (): Promise<void> => {
    // Arrange
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act — (dialog open handled in Arrange)

    // Assert
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  it('points aria-describedby at the element containing the description text', async (): Promise<void> => {
    // Arrange
    const description = 'This is the modal description';
    renderModal({ open: true, description });
    await screen.findByRole('dialog');

    // Act
    const dialog = screen.getByRole('dialog');
    const describedById = dialog.getAttribute('aria-describedby');

    // Assert
    expect(describedById).not.toBeNull();
    if (describedById === null) {
      throw new Error('Expected aria-describedby to be present');
    }
    const describedElement = document.getElementById(describedById);
    expect(describedElement).not.toBeNull();
    expect(describedElement).toHaveTextContent(description);
  });

  it('shows the dialog when open is true without clicking the trigger', async (): Promise<void> => {
    // Arrange — defaults via renderModal

    // Act
    renderModal({ open: true });

    // Assert
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Test title')).toBeVisible();
  });

  it('does not show the dialog when open is false', (): void => {
    // Arrange — defaults via renderModal

    // Act
    renderModal({ open: false });

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('calls onOpenChange with false when the user dismisses a controlled dialog', async (): Promise<void> => {
    const user = userEvent.setup();

    // ESC dismiss
    // Arrange
    const onOpenChangeEsc = vi.fn();
    const { unmount: unmountEsc } = renderModal({
      open: true,
      onOpenChange: onOpenChangeEsc,
    });
    await screen.findByRole('dialog');

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(onOpenChangeEsc).toHaveBeenCalledTimes(1);
    expect(onOpenChangeEsc).toHaveBeenCalledWith(false);
    unmountEsc();

    // Backdrop dismiss
    // Arrange
    const onOpenChangeBackdrop = vi.fn();
    renderModal({ open: true, onOpenChange: onOpenChangeBackdrop });
    await screen.findByRole('dialog');

    // Act
    // Radix overlay is portaled and has no ARIA role, so a DOM-level selector is unavoidable.
    const overlay = document.querySelector(
      'div[data-state="open"]:not([role="dialog"])',
    );
    if (overlay === null) {
      throw new Error('Expected dialog overlay to be present');
    }
    // Radix Dialog 1.1.17+ defers outside dismiss until click (deferPointerDownOutside).
    await user.click(overlay);

    // Assert
    expect(onOpenChangeBackdrop).toHaveBeenCalledTimes(1);
    expect(onOpenChangeBackdrop).toHaveBeenCalledWith(false);
  });
});
